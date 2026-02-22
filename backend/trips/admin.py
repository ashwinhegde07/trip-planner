"""
Admin configuration for Trip Planner models.
"""
from django.contrib import admin
from .models import Trip, Stop, LogDay


class StopInline(admin.TabularInline):
    model = Stop
    extra = 0


class LogDayInline(admin.TabularInline):
    model = LogDay
    extra = 0


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ["id", "current_location", "pickup_location", "dropoff_location", "total_distance_km", "created_at"]
    inlines = [StopInline, LogDayInline]


@admin.register(Stop)
class StopAdmin(admin.ModelAdmin):
    list_display = ["id", "trip", "stop_type", "name", "latitude", "longitude"]


@admin.register(LogDay)
class LogDayAdmin(admin.ModelAdmin):
    list_display = ["id", "trip", "date", "total_driving_hours", "total_on_duty_hours", "cycle_hours_remaining"]
