"""Tests for API endpoints."""

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)

SAMPLE_DATA = json.loads(
    (Path(__file__).parent.parent / "data" / "sample_debris.json").read_text()
)


class TestHealthEndpoint:
    def test_health(self):
        response = client.get("/api/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"


class TestValidateEndpoint:
    def test_valid_object(self):
        response = client.post("/api/validate", json={
            "orbital_elements": {
                "semi_major_axis_km": 6771.0,
                "eccentricity": 0.0002,
                "inclination_deg": 51.6,
                "raan_deg": 0.0,
                "arg_perigee_deg": 0.0,
                "mean_anomaly_deg": 0.0,
            }
        })
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert len(data["errors"]) == 0

    def test_invalid_eccentricity(self):
        response = client.post("/api/validate", json={
            "orbital_elements": {
                "semi_major_axis_km": 6771.0,
                "eccentricity": 1.5,
                "inclination_deg": 51.6,
                "raan_deg": 0.0,
                "arg_perigee_deg": 0.0,
                "mean_anomaly_deg": 0.0,
            }
        })
        assert response.status_code == 422

    def test_invalid_altitude(self):
        response = client.post("/api/validate", json={
            "orbital_elements": {
                "semi_major_axis_km": 5000.0,
                "eccentricity": 0.0,
                "inclination_deg": 51.6,
                "raan_deg": 0.0,
                "arg_perigee_deg": 0.0,
                "mean_anomaly_deg": 0.0,
            }
        })
        assert response.status_code == 422


class TestObjectsEndpoint:
    def test_get_objects(self):
        response = client.get("/api/objects")
        assert response.status_code == 200
        data = response.json()
        assert data["satellite"]["id"] == "sat_001"
        assert len(data["debris"]) == 50


class TestSimulateEndpoint:
    def test_full_simulation(self):
        satellite = SAMPLE_DATA["satellite"]
        debris = SAMPLE_DATA["debris"][:5]  # Use 5 for speed

        response = client.post("/api/simulate", json={
            "satellite": satellite,
            "debris": debris,
            "time_window_hours": 1,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["debris_count"] == 5
        assert len(data["approaches"]) == 5
        assert data["time_window_hours"] == 1

        # Check approach result structure
        approach = data["approaches"][0]
        assert "debris_id" in approach
        assert "min_distance_km" in approach
        assert "risk_score" in approach
        assert "risk_level" in approach

    def test_invalid_time_window(self):
        satellite = SAMPLE_DATA["satellite"]
        debris = SAMPLE_DATA["debris"][:1]

        response = client.post("/api/simulate", json={
            "satellite": satellite,
            "debris": debris,
            "time_window_hours": 13,
        })
        assert response.status_code == 422

    def test_empty_debris_list(self):
        satellite = SAMPLE_DATA["satellite"]

        response = client.post("/api/simulate", json={
            "satellite": satellite,
            "debris": [],
            "time_window_hours": 24,
        })
        assert response.status_code == 422
