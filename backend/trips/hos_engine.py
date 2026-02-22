"""
Hours of Service (HOS) Calculation Engine.

Implements FMCSA property-carrying driver rules:
  - 11-hour driving limit per shift
  - 14-hour on-duty window per shift
  - Mandatory 30-minute break after 8 cumulative driving hours
  - 70-hour / 8-day rolling cycle limit
  - Mandatory 34-hour restart when cycle is exhausted
  - Fuel stop every 1,600 km (~1,000 miles)
  - 1-hour pickup / 1-hour dropoff (On Duty Not Driving)

Assumptions:
  - Average speed: 60 km/h
  - No adverse conditions
  - No sleeper berth split
  - No short haul exception
"""
from datetime import date, timedelta
from typing import Any

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
MAX_DRIVING_PER_SHIFT = 11.0       # hours
MAX_ON_DUTY_WINDOW = 14.0          # hours
BREAK_AFTER_DRIVING = 8.0          # hours of cumulative driving before mandatory break
MANDATORY_BREAK_DURATION = 0.5     # hours (30 min)
CYCLE_LIMIT = 70.0                 # rolling 70-hour / 8-day cycle
RESTART_DURATION = 34.0            # hours for mandatory restart
FUEL_INTERVAL_KM = 1600.0          # refuel every ~1,000 miles
AVERAGE_SPEED_KMH = 60.0           # assumed average speed
PICKUP_DURATION = 1.0              # hours (On Duty Not Driving)
DROPOFF_DURATION = 1.0             # hours (On Duty Not Driving)
SHIFT_START_HOUR = 6               # drivers start at 06:00 each day
FUEL_STOP_DURATION = 0.5           # hours to refuel


def _fmt(hours_from_midnight: float) -> str:
    """Format a decimal hour value into HH:MM string."""
    h = int(hours_from_midnight) % 24
    m = int(round((hours_from_midnight - int(hours_from_midnight)) * 60))
    if m == 60:
        h += 1
        m = 0
    return f"{h:02d}:{m:02d}"


def calculate_hos(
    total_distance_km: float,
    pickup_distance_km: float,
    cycle_used: float,
    start_date: date | None = None,
) -> dict[str, Any]:
    """
    Calculate Hours of Service schedule for a trip.

    Args:
        total_distance_km: Total route distance in kilometres.
        pickup_distance_km: Distance from current location to pickup in km.
        cycle_used: Hours already consumed in the 70-hour/8-day cycle.
        start_date: Trip start date (defaults to today).

    Returns:
        {
            "days": [
                {
                    "date": "YYYY-MM-DD",
                    "events": [
                        {"type": "driving"|"break"|"on_duty"|"off_duty"|"fuel",
                         "start": "HH:MM", "end": "HH:MM",
                         "description": "..."}
                    ],
                    "total_driving_hours": float,
                    "total_on_duty_hours": float,
                    "cycle_hours_remaining": float
                }
            ],
            "fuel_stops_km": [float, ...],
            "summary": { ... }
        }
    """
    if start_date is None:
        start_date = date.today()

    # Total driving hours needed (at average speed)
    total_driving_hours_needed = total_distance_km / AVERAGE_SPEED_KMH
    pickup_driving_hours = pickup_distance_km / AVERAGE_SPEED_KMH

    # Pre-calculate fuel stop positions (by distance from trip start)
    fuel_stops_km = []
    d = FUEL_INTERVAL_KM
    while d < total_distance_km:
        fuel_stops_km.append(d)
        d += FUEL_INTERVAL_KM

    # Convert fuel stops to driving-hours from start
    fuel_stop_hours = [km / AVERAGE_SPEED_KMH for km in fuel_stops_km]

    # State tracking
    days = []
    current_date = start_date
    remaining_driving = total_driving_hours_needed
    cycle_remaining = CYCLE_LIMIT - cycle_used
    cumulative_driving_from_start = 0.0  # tracks distance for pickup/fuel events

    pickup_done = False
    dropoff_done = False
    needs_pickup = True  # we need to drive to pickup first, then do pickup event
    pickup_hours_remaining = pickup_driving_hours

    # Track which fuel stops have been triggered
    fuel_stops_triggered = [False] * len(fuel_stop_hours)

    while remaining_driving > 0 or (not dropoff_done):
        events = []
        clock = float(SHIFT_START_HOUR)  # current time of day in decimal hours
        shift_driving = 0.0              # driving this shift
        shift_on_duty = 0.0              # total on-duty this shift (includes driving)
        cumulative_driving_since_break = 0.0  # for 30-min break rule
        day_driving = 0.0
        day_on_duty = 0.0

        # Check cycle — do we need a 34-hour restart?
        if cycle_remaining <= 0:
            # Full restart day(s)
            restart_hours_left = RESTART_DURATION
            while restart_hours_left > 0:
                hours_today = min(restart_hours_left, 24.0)
                events.append({
                    "type": "off_duty",
                    "start": _fmt(0),
                    "end": _fmt(hours_today),
                    "description": "34-hour restart (mandatory)",
                })
                # Fill remaining day as off_duty if less than 24h
                if hours_today < 24.0:
                    events.append({
                        "type": "off_duty",
                        "start": _fmt(hours_today),
                        "end": "24:00",
                        "description": "Off duty",
                    })
                days.append({
                    "date": current_date.isoformat(),
                    "events": events,
                    "total_driving_hours": 0,
                    "total_on_duty_hours": 0,
                    "cycle_hours_remaining": 0,
                })
                restart_hours_left -= hours_today
                current_date += timedelta(days=1)
                events = []

            cycle_remaining = CYCLE_LIMIT
            continue  # Start a new day loop

        # Pre-duty off-duty period (midnight to shift start)
        if SHIFT_START_HOUR > 0:
            events.append({
                "type": "off_duty",
                "start": "00:00",
                "end": _fmt(SHIFT_START_HOUR),
                "description": "Off duty (rest)",
            })

        # Main driving loop for this day
        while remaining_driving > 0 and shift_driving < MAX_DRIVING_PER_SHIFT and shift_on_duty < MAX_ON_DUTY_WINDOW and cycle_remaining > 0:
            # --- Pickup event ---
            if needs_pickup and pickup_hours_remaining <= 0 and not pickup_done:
                if shift_on_duty + PICKUP_DURATION <= MAX_ON_DUTY_WINDOW and cycle_remaining >= PICKUP_DURATION:
                    events.append({
                        "type": "on_duty",
                        "start": _fmt(clock),
                        "end": _fmt(clock + PICKUP_DURATION),
                        "description": "Pickup — loading (On Duty Not Driving)",
                    })
                    clock += PICKUP_DURATION
                    shift_on_duty += PICKUP_DURATION
                    day_on_duty += PICKUP_DURATION
                    cycle_remaining -= PICKUP_DURATION
                    pickup_done = True
                    needs_pickup = False
                else:
                    break  # Not enough window; end day

            # --- Check 30-min break rule ---
            if cumulative_driving_since_break >= BREAK_AFTER_DRIVING:
                if shift_on_duty + MANDATORY_BREAK_DURATION <= MAX_ON_DUTY_WINDOW:
                    events.append({
                        "type": "break",
                        "start": _fmt(clock),
                        "end": _fmt(clock + MANDATORY_BREAK_DURATION),
                        "description": "Mandatory 30-min break (8h driving rule)",
                    })
                    clock += MANDATORY_BREAK_DURATION
                    shift_on_duty += MANDATORY_BREAK_DURATION
                    day_on_duty += MANDATORY_BREAK_DURATION
                    cumulative_driving_since_break = 0.0
                else:
                    break  # End day

            # --- How much can we drive in this segment ---
            max_drive_this_segment = min(
                remaining_driving,
                MAX_DRIVING_PER_SHIFT - shift_driving,
                MAX_ON_DUTY_WINDOW - shift_on_duty,
                cycle_remaining,
                BREAK_AFTER_DRIVING - cumulative_driving_since_break,
            )

            if max_drive_this_segment <= 0:
                break

            # --- Check if a fuel stop falls within this segment ---
            fuel_stop_in_segment = False
            for idx, fh in enumerate(fuel_stop_hours):
                if not fuel_stops_triggered[idx]:
                    driving_until_fuel = fh - cumulative_driving_from_start
                    if 0 < driving_until_fuel <= max_drive_this_segment:
                        # Drive to fuel stop first
                        if driving_until_fuel > 0.01:
                            events.append({
                                "type": "driving",
                                "start": _fmt(clock),
                                "end": _fmt(clock + driving_until_fuel),
                                "description": "Driving",
                            })
                            clock += driving_until_fuel
                            shift_driving += driving_until_fuel
                            shift_on_duty += driving_until_fuel
                            day_driving += driving_until_fuel
                            day_on_duty += driving_until_fuel
                            remaining_driving -= driving_until_fuel
                            cycle_remaining -= driving_until_fuel
                            cumulative_driving_since_break += driving_until_fuel
                            cumulative_driving_from_start += driving_until_fuel

                            if needs_pickup:
                                pickup_hours_remaining -= driving_until_fuel

                        # Fuel stop event
                        if shift_on_duty + FUEL_STOP_DURATION <= MAX_ON_DUTY_WINDOW:
                            events.append({
                                "type": "fuel",
                                "start": _fmt(clock),
                                "end": _fmt(clock + FUEL_STOP_DURATION),
                                "description": f"Fuel stop at {fuel_stops_km[idx]:.0f} km",
                            })
                            clock += FUEL_STOP_DURATION
                            shift_on_duty += FUEL_STOP_DURATION
                            day_on_duty += FUEL_STOP_DURATION
                            cycle_remaining -= FUEL_STOP_DURATION

                        fuel_stops_triggered[idx] = True
                        fuel_stop_in_segment = True
                        break  # Re-enter loop to recalculate

            if fuel_stop_in_segment:
                continue

            # --- Check if pickup falls within this segment ---
            if needs_pickup and not pickup_done:
                if 0 < pickup_hours_remaining <= max_drive_this_segment:
                    # Drive to pickup
                    drive_to_pickup = pickup_hours_remaining
                    if drive_to_pickup > 0.01:
                        events.append({
                            "type": "driving",
                            "start": _fmt(clock),
                            "end": _fmt(clock + drive_to_pickup),
                            "description": "Driving to pickup",
                        })
                        clock += drive_to_pickup
                        shift_driving += drive_to_pickup
                        shift_on_duty += drive_to_pickup
                        day_driving += drive_to_pickup
                        day_on_duty += drive_to_pickup
                        remaining_driving -= drive_to_pickup
                        cycle_remaining -= drive_to_pickup
                        cumulative_driving_since_break += drive_to_pickup
                        cumulative_driving_from_start += drive_to_pickup
                        pickup_hours_remaining = 0
                    continue  # Re-enter to trigger pickup event

            # --- Normal driving segment ---
            events.append({
                "type": "driving",
                "start": _fmt(clock),
                "end": _fmt(clock + max_drive_this_segment),
                "description": "Driving",
            })
            clock += max_drive_this_segment
            shift_driving += max_drive_this_segment
            shift_on_duty += max_drive_this_segment
            day_driving += max_drive_this_segment
            day_on_duty += max_drive_this_segment
            remaining_driving -= max_drive_this_segment
            cycle_remaining -= max_drive_this_segment
            cumulative_driving_since_break += max_drive_this_segment
            cumulative_driving_from_start += max_drive_this_segment

            if needs_pickup:
                pickup_hours_remaining -= max_drive_this_segment

        # --- Dropoff event (when driving is done) ---
        if remaining_driving <= 0 and not dropoff_done:
            if shift_on_duty + DROPOFF_DURATION <= MAX_ON_DUTY_WINDOW and cycle_remaining >= DROPOFF_DURATION:
                events.append({
                    "type": "on_duty",
                    "start": _fmt(clock),
                    "end": _fmt(clock + DROPOFF_DURATION),
                    "description": "Dropoff — unloading (On Duty Not Driving)",
                })
                clock += DROPOFF_DURATION
                shift_on_duty += DROPOFF_DURATION
                day_on_duty += DROPOFF_DURATION
                cycle_remaining -= DROPOFF_DURATION
                dropoff_done = True
            elif shift_on_duty >= MAX_ON_DUTY_WINDOW or cycle_remaining < DROPOFF_DURATION:
                # Push dropoff to next day
                pass
            else:
                dropoff_done = True  # safety

        # --- Fill remainder of 24 hours as off_duty ---
        if clock < 24:
            events.append({
                "type": "off_duty",
                "start": _fmt(clock),
                "end": "24:00",
                "description": "Off duty (rest)",
            })

        day_driving = round(day_driving, 2)
        day_on_duty = round(day_on_duty, 2)

        days.append({
            "date": current_date.isoformat(),
            "events": events,
            "total_driving_hours": day_driving,
            "total_on_duty_hours": day_on_duty + day_driving,
            "cycle_hours_remaining": round(max(cycle_remaining, 0), 2),
        })

        current_date += timedelta(days=1)

        # Safety: prevent infinite loops
        if len(days) > 30:
            break

    return {
        "days": days,
        "fuel_stops_km": fuel_stops_km,
        "summary": {
            "total_distance_km": round(total_distance_km, 1),
            "total_driving_hours": round(total_driving_hours_needed, 2),
            "total_days": len(days),
            "cycle_used_at_start": cycle_used,
        },
    }
