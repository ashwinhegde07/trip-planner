#!/usr/bin/env bash
# run.sh
# This script runs migrations before starting the Django server on Render

python manage.py migrate

# Start Gunicorn server
gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
