"""
API views for the Trip Planner application.
"""
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .serializers import TripInputSerializer
from .models import Trip, Stop, LogDay
from .route_service import geocode, get_route, interpolate_point_on_route
from .hos_engine import calculate_hos


@api_view(["POST"])
def calculate_trip(request):
    """
    POST /api/calculate-trip/

    Calculate a complete trip with HOS-compliant schedule, route, stops,
    and daily ELD log sheets.

    Request body:
        {
            "current_location": "Bengaluru",
            "pickup_location": "Chennai",
            "dropoff_location": "Mumbai",
            "current_cycle_used": 40
        }
    """
    serializer = TripInputSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {"error": "Invalid input", "details": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = serializer.validated_data

    try:
        # ---------------------------------------------------------------
        # Step 1: Geocode all locations
        # ---------------------------------------------------------------
        current_coords = geocode(data["current_location"])
        pickup_coords = geocode(data["pickup_location"])
        dropoff_coords = geocode(data["dropoff_location"])

        # ---------------------------------------------------------------
        # Step 2: Get route  (current → pickup → dropoff)
        # ---------------------------------------------------------------
        route_data = get_route([current_coords, pickup_coords, dropoff_coords])
        total_distance_km = route_data["distance_km"]
        route_geometry = route_data["geometry"]

        # Calculate distance from current to pickup (for HOS pickup event)
        leg1 = get_route([current_coords, pickup_coords])
        pickup_distance_km = leg1["distance_km"]

        # ---------------------------------------------------------------
        # Step 3: Run HOS calculation engine
        # ---------------------------------------------------------------
        hos_result = calculate_hos(
            total_distance_km=total_distance_km,
            pickup_distance_km=pickup_distance_km,
            cycle_used=data["current_cycle_used"],
        )

        # ---------------------------------------------------------------
        # Step 4: Save to database
        # ---------------------------------------------------------------
        trip = Trip.objects.create(
            current_location=data["current_location"],
            pickup_location=data["pickup_location"],
            dropoff_location=data["dropoff_location"],
            current_cycle_used=data["current_cycle_used"],
            total_distance_km=total_distance_km,
            total_duration_hours=route_data["duration_hours"],
            route_geometry=route_geometry,
        )

        # Create stops
        stops = []

        # Pickup stop
        pickup_stop = Stop.objects.create(
            trip=trip,
            stop_type="pickup",
            name=data["pickup_location"],
            latitude=pickup_coords[0],
            longitude=pickup_coords[1],
            distance_from_start_km=pickup_distance_km,
        )
        stops.append(pickup_stop)

        # Dropoff stop
        dropoff_stop = Stop.objects.create(
            trip=trip,
            stop_type="dropoff",
            name=data["dropoff_location"],
            latitude=dropoff_coords[0],
            longitude=dropoff_coords[1],
            distance_from_start_km=total_distance_km,
        )
        stops.append(dropoff_stop)

        # Fuel stops
        for fuel_km in hos_result["fuel_stops_km"]:
            lat, lng = interpolate_point_on_route(
                route_geometry, total_distance_km, fuel_km
            )
            fuel_stop = Stop.objects.create(
                trip=trip,
                stop_type="fuel",
                name=f"Fuel stop at {fuel_km:.0f} km",
                latitude=lat,
                longitude=lng,
                distance_from_start_km=fuel_km,
            )
            stops.append(fuel_stop)

        # Rest stops (at end of each driving day except last)
        cumulative_km = 0
        for i, day in enumerate(hos_result["days"]):
            day_driving_km = day["total_driving_hours"] * 60  # 60 km/h
            cumulative_km += day_driving_km
            if i < len(hos_result["days"]) - 1 and day["total_driving_hours"] > 0:
                lat, lng = interpolate_point_on_route(
                    route_geometry, total_distance_km, min(cumulative_km, total_distance_km)
                )
                rest_stop = Stop.objects.create(
                    trip=trip,
                    stop_type="rest",
                    name=f"Rest stop (Day {i + 1})",
                    latitude=lat,
                    longitude=lng,
                    distance_from_start_km=min(cumulative_km, total_distance_km),
                )
                stops.append(rest_stop)

        # Save log days
        for day_data in hos_result["days"]:
            LogDay.objects.create(
                trip=trip,
                date=day_data["date"],
                events=day_data["events"],
                total_driving_hours=day_data["total_driving_hours"],
                total_on_duty_hours=day_data["total_on_duty_hours"],
                cycle_hours_remaining=day_data["cycle_hours_remaining"],
            )

        # ---------------------------------------------------------------
        # Step 5: Build response
        # ---------------------------------------------------------------
        stops_data = [
            {
                "stop_type": s.stop_type,
                "name": s.name,
                "latitude": s.latitude,
                "longitude": s.longitude,
                "distance_from_start_km": s.distance_from_start_km,
            }
            for s in sorted(stops, key=lambda x: x.distance_from_start_km)
        ]

        response_data = {
            "trip_id": trip.id,
            "current_location": {
                "name": data["current_location"],
                "latitude": current_coords[0],
                "longitude": current_coords[1],
            },
            "pickup_location": {
                "name": data["pickup_location"],
                "latitude": pickup_coords[0],
                "longitude": pickup_coords[1],
            },
            "dropoff_location": {
                "name": data["dropoff_location"],
                "latitude": dropoff_coords[0],
                "longitude": dropoff_coords[1],
            },
            "route_geometry": route_geometry,
            "total_distance_km": total_distance_km,
            "total_duration_hours": route_data["duration_hours"],
            "stops": stops_data,
            "days": hos_result["days"],
            "fuel_stops_km": hos_result["fuel_stops_km"],
            "summary": hos_result["summary"],
        }

        return Response(response_data, status=status.HTTP_200_OK)

    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(
            {"error": f"An error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def get_trips(request):
    """List all past trips."""
    trips = Trip.objects.all().order_by("-created_at")
    data = []
    for t in trips:
        data.append({
            "id": t.id,
            "current_location": t.current_location,
            "pickup_location": t.pickup_location,
            "dropoff_location": t.dropoff_location,
            "total_distance_km": round(t.total_distance_km, 1) if t.total_distance_km else 0,
            "created_at": t.created_at.isoformat(),
        })
    return Response(data)


@api_view(["GET"])
def get_trip(request, pk):
    """Get the details, map, and logs for a specific trip."""
    try:
        trip = Trip.objects.get(pk=pk)
    except Trip.DoesNotExist:
        return Response({"error": "Trip not found"}, status=status.HTTP_404_NOT_FOUND)

    stops = trip.stops.all()
    log_days = trip.log_days.all()

    stops_data = [
        {
            "stop_type": s.stop_type,
            "name": s.name,
            "latitude": s.latitude,
            "longitude": s.longitude,
            "distance_from_start_km": s.distance_from_start_km,
        }
        for s in stops
    ]

    days_data = [
        {
            "date": d.date.isoformat(),
            "events": d.events,
            "total_driving_hours": d.total_driving_hours,
            "total_on_duty_hours": d.total_on_duty_hours,
            "cycle_hours_remaining": d.cycle_hours_remaining,
        }
        for d in log_days
    ]

    summary = {
        "total_distance_km": round(trip.total_distance_km, 1) if trip.total_distance_km else 0,
        "total_driving_hours": sum(d.total_driving_hours for d in log_days),
        "total_days": len(log_days),
        "cycle_used_at_start": trip.current_cycle_used,
    }

    route = trip.route_geometry or []
    current_coords = route[0] if route else [0, 0]

    pickup_stop = next((s for s in stops if s.stop_type == "pickup"), None)
    pickup_coords = [pickup_stop.latitude, pickup_stop.longitude] if pickup_stop else [0, 0]

    dropoff_stop = next((s for s in stops if s.stop_type == "dropoff"), None)
    dropoff_coords = [dropoff_stop.latitude, dropoff_stop.longitude] if dropoff_stop else [0, 0]

    response_data = {
        "trip_id": trip.id,
        "current_location": {
            "name": trip.current_location,
            "latitude": current_coords[0],
            "longitude": current_coords[1],
        },
        "pickup_location": {
            "name": trip.pickup_location,
            "latitude": pickup_coords[0],
            "longitude": pickup_coords[1],
        },
        "dropoff_location": {
            "name": trip.dropoff_location,
            "latitude": dropoff_coords[0],
            "longitude": dropoff_coords[1],
        },
        "route_geometry": route,
        "total_distance_km": trip.total_distance_km,
        "total_duration_hours": trip.total_duration_hours,
        "stops": stops_data,
        "days": days_data,
        "fuel_stops_km": [s.distance_from_start_km for s in stops if s.stop_type == "fuel"],
        "summary": summary,
    }

    return Response(response_data)
