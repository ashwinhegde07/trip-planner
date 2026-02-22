"""
DRF Serializers for the Trip Planner API.
"""
from rest_framework import serializers


class TripInputSerializer(serializers.Serializer):
    """Validates the incoming trip calculation request."""

    current_location = serializers.CharField(
        max_length=255,
        help_text="Starting city name (e.g. Bengaluru)",
    )
    pickup_location = serializers.CharField(
        max_length=255,
        help_text="Pickup city name (e.g. Chennai)",
    )
    dropoff_location = serializers.CharField(
        max_length=255,
        help_text="Dropoff city name (e.g. Mumbai)",
    )
    current_cycle_used = serializers.FloatField(
        min_value=0,
        max_value=70,
        help_text="Hours used in the 70-hour/8-day cycle",
    )


class StopSerializer(serializers.Serializer):
    """Serializes a stop along the route."""

    stop_type = serializers.CharField()
    name = serializers.CharField(allow_blank=True)
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    distance_from_start_km = serializers.FloatField()


class EventSerializer(serializers.Serializer):
    """Serializes a single ELD event within a log day."""

    type = serializers.CharField()
    start = serializers.CharField()
    end = serializers.CharField()
    description = serializers.CharField(allow_blank=True, required=False)


class LogDaySerializer(serializers.Serializer):
    """Serializes a single day's ELD log."""

    date = serializers.CharField()
    events = EventSerializer(many=True)
    total_driving_hours = serializers.FloatField()
    total_on_duty_hours = serializers.FloatField()
    cycle_hours_remaining = serializers.FloatField()


class TripResponseSerializer(serializers.Serializer):
    """Serializes the full trip calculation response."""

    trip_id = serializers.IntegerField()
    current_location = serializers.DictField()
    pickup_location = serializers.DictField()
    dropoff_location = serializers.DictField()
    route_geometry = serializers.ListField()
    total_distance_km = serializers.FloatField()
    total_duration_hours = serializers.FloatField()
    stops = StopSerializer(many=True)
    days = LogDaySerializer(many=True)
    fuel_stops_km = serializers.ListField(child=serializers.FloatField())
    summary = serializers.DictField()
