from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv


app = Flask(__name__)
CORS(app, origins=["https://mm-v3-frontend.onrender.com"])

GOOGLE_API_KEY = os.getenv("GOOGLEAPI")
WEATHER_API_KEY = os.getenv("WEATHERAPI")

# Global variables to store the latest weather data
latest_location = None
latest_weather = None


# Get city name instead of full address
def get_location(lat, lon):
    geocode_url = f"https://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{lon}&key={GOOGLE_API_KEY}"
    response = requests.get(geocode_url).json()

    if response["status"] == "OK":
        for component in response["results"][0]["address_components"]:
            if "locality" in component["types"]:  # City Name
                return component["long_name"]
            if "administrative_area_level_1" in component["types"]:  # Province/State
                return component["long_name"]
        return response["results"][0]["formatted_address"]

    return "Unknown Location"


# Get weather data and alerts
def get_weather(lat, lon):
    weather_url = f"https://api.weatherapi.com/v1/current.json?key={WEATHER_API_KEY}&q={lat},{lon}&alerts=yes"
    response = requests.get(weather_url).json()

    if "error" in response:
        return {"error": "Weather data not available"}

    alerts = response.get("alerts", {}).get("alert", [])

    return {
        "temperature": response["current"]["temp_c"],
        "condition": response["current"]["condition"]["text"],
        "wind_speed": response["current"]["wind_kph"],
        "alerts": [
            {
                "headline": alert["headline"],
                "description": alert["desc"],
                "severity": alert["severity"],
            }
            for alert in alerts
        ],
    }