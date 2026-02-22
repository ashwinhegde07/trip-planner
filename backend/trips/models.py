"""
Database models for the Trip Planner application.

- Trip: Represents a complete trip with origin, pickup, and dropoff locations.
- Stop: Represents intermediate stops (fuel, rest, pickup, dropoff) along a route.
- LogDay: Represents a single day's ELD log with events.
"""
from django.db import models


class Trip(models.Model):
    """A planned trip from current location through pickup to dropoff."""

    current_location = models.CharField(max_length=255, help_text="Starting city")
    pickup_location = models.CharField(max_length=255, help_text="Pickup city")
    dropoff_location = models.CharField(max_length=255, help_text="Dropoff city")
    current_cycle_used = models.FloatField(
        default=0,
        help_text="Hours already used in the 70-hour/8-day rolling cycle",
    )

    # Computed fields
    total_distance_km = models.FloatField(null=True, blank=True, help_text="Total route distance in km")
    total_duration_hours = models.FloatField(null=True, blank=True, help_text="Total driving duration in hours")

    # Route geometry (GeoJSON-encoded polyline for the full route)
    route_geometry = models.JSONField(null=True, blank=True, help_text="Route polyline coordinates")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Trip: {self.current_location} → {self.pickup_location} → {self.dropoff_location}"


class Stop(models.Model):
    """A stop along the trip route (fuel, rest, pickup, dropoff)."""

    STOP_TYPES = [
        ("fuel", "Fuel Stop"),
        ("rest", "Rest Stop"),
        ("pickup", "Pickup"),
        ("dropoff", "Dropoff"),
        ("restart", "34-Hour Restart"),
    ]

    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="stops")
    stop_type = models.CharField(max_length=20, choices=STOP_TYPES)
    name = models.CharField(max_length=255, blank=True, default="")
    latitude = models.FloatField()
    longitude = models.FloatField()
    distance_from_start_km = models.FloatField(default=0, help_text="Distance from trip start in km")

    class Meta:
        ordering = ["distance_from_start_km"]

    def __str__(self):
        return f"{self.get_stop_type_display()} at ({self.latitude}, {self.longitude})"


class LogDay(models.Model):
    """A single day's ELD log with events."""

    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="log_days")
    date = models.DateField(help_text="Date this log covers")
    events = models.JSONField(
        default=list,
        help_text='List of events: [{"type": "driving", "start": "06:00", "end": "14:00"}, ...]',
    )
    total_driving_hours = models.FloatField(default=0)
    total_on_duty_hours = models.FloatField(default=0)
    cycle_hours_remaining = models.FloatField(default=70)

    class Meta:
        ordering = ["date"]
        unique_together = ["trip", "date"]

    def __str__(self):
        return f"Log for {self.date} — {self.total_driving_hours}h driving"
