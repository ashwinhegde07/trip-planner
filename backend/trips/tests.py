"""
Unit tests for the HOS calculation engine.

Tests the core business logic with the demo scenario:
  Current: Bengaluru → Pickup: Chennai → Dropoff: Mumbai
  Cycle Used: 40 hours
"""
from datetime import date
from django.test import TestCase
from .hos_engine import calculate_hos


class HOSEngineTests(TestCase):
    """Tests for the HOS calculation engine."""

    def test_basic_trip_generates_days(self):
        """A moderately long trip should generate multiple days."""
        # Bengaluru → Chennai → Mumbai ≈ 1,400 km total
        result = calculate_hos(
            total_distance_km=1400,
            pickup_distance_km=350,
            cycle_used=40,
            start_date=date(2026, 2, 22),
        )
        self.assertIn("days", result)
        self.assertGreater(len(result["days"]), 1, "Should generate multiple days")

    def test_each_day_has_events(self):
        """Each day should produce at least one event."""
        result = calculate_hos(
            total_distance_km=1400,
            pickup_distance_km=350,
            cycle_used=40,
            start_date=date(2026, 2, 22),
        )
        for day in result["days"]:
            self.assertGreater(len(day["events"]), 0, f"Day {day['date']} has no events")

    def test_driving_limit_per_day(self):
        """No single day should exceed 11 hours of driving."""
        result = calculate_hos(
            total_distance_km=2000,
            pickup_distance_km=500,
            cycle_used=0,
            start_date=date(2026, 2, 22),
        )
        for day in result["days"]:
            self.assertLessEqual(
                day["total_driving_hours"],
                11.01,  # small tolerance for float rounding
                f"Day {day['date']} exceeds 11-hour driving limit",
            )

    def test_break_enforcement(self):
        """After 8 hours of cumulative driving, a 30-min break must occur."""
        result = calculate_hos(
            total_distance_km=2000,
            pickup_distance_km=500,
            cycle_used=0,
            start_date=date(2026, 2, 22),
        )
        for day in result["days"]:
            cumulative = 0
            break_found = False
            for event in day["events"]:
                if event["type"] == "driving":
                    # Parse duration
                    start_parts = event["start"].split(":")
                    end_parts = event["end"].split(":")
                    duration = (int(end_parts[0]) + int(end_parts[1]) / 60) - (
                        int(start_parts[0]) + int(start_parts[1]) / 60
                    )
                    cumulative += duration
                elif event["type"] == "break":
                    break_found = True
                    cumulative = 0  # reset after break

            # If we drove more than 8 hours total in a day, a break should exist
            if day["total_driving_hours"] > 8:
                self.assertTrue(
                    break_found,
                    f"Day {day['date']} has {day['total_driving_hours']}h driving but no break",
                )

    def test_cycle_limit_respected(self):
        """Cycle hours remaining should never go below zero."""
        result = calculate_hos(
            total_distance_km=3000,
            pickup_distance_km=300,
            cycle_used=40,
            start_date=date(2026, 2, 22),
        )
        for day in result["days"]:
            self.assertGreaterEqual(
                day["cycle_hours_remaining"],
                -0.01,
                f"Day {day['date']} has negative cycle remaining",
            )

    def test_fuel_stops_generated(self):
        """For a 3000 km trip, fuel stops should be generated at 1600 km intervals."""
        result = calculate_hos(
            total_distance_km=3000,
            pickup_distance_km=300,
            cycle_used=0,
            start_date=date(2026, 2, 22),
        )
        self.assertGreater(
            len(result["fuel_stops_km"]),
            0,
            "No fuel stops generated for a 3000 km trip",
        )
        self.assertAlmostEqual(result["fuel_stops_km"][0], 1600, places=0)

    def test_summary_included(self):
        """Result should include a summary with total distance and days."""
        result = calculate_hos(
            total_distance_km=1400,
            pickup_distance_km=350,
            cycle_used=40,
            start_date=date(2026, 2, 22),
        )
        self.assertIn("summary", result)
        self.assertEqual(result["summary"]["total_distance_km"], 1400)
        self.assertGreater(result["summary"]["total_days"], 0)
