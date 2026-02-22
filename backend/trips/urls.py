"""
URL patterns for the trips API.
"""
from django.urls import path
from . import views

urlpatterns = [
    path("calculate-trip/", views.calculate_trip, name="calculate-trip"),
    path("trips/", views.get_trips, name="get-trips"),
    path("trips/<int:pk>/", views.get_trip, name="get-trip"),
]
