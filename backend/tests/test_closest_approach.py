"""Tests for closest-approach engine."""

import numpy as np
import pytest

from backend.orbital_engine.keplerian import R_EARTH
from backend.risk_engine.closest_approach import find_closest_approaches


def _make_elements(a_km, e, inc, raan, argp, M0, name="Test Object"):
    return {
        "id": name.lower().replace(" ", "_"),
        "name": name,
        "a": a_km,
        "e": e,
        "inc": inc,
        "raan": raan,
        "argp": argp,
        "M0": M0,
    }


class TestClosestApproach:
    def test_identical_circular_orbits(self):
        """Two objects in identical circular orbit, same phase -> min dist ~ 0."""
        a = R_EARTH + 500
        sat = _make_elements(a, 0.0, 51.6, 0.0, 0.0, 0.0)
        deb = _make_elements(a, 0.0, 51.6, 0.0, 0.0, 0.0)

        results = find_closest_approaches(sat, [deb], 0, 3600, dt=60)
        assert len(results) == 1
        assert results[0]["min_distance_km"] < 1.0  # essentially 0

    def test_coplanar_different_altitude(self):
        """Two coplanar circular orbits at different altitudes.
        Min distance should be approximately altitude difference."""
        a1 = R_EARTH + 400
        a2 = R_EARTH + 500
        sat = _make_elements(a1, 0.0, 0.0, 0.0, 0.0, 0.0)
        deb = _make_elements(a2, 0.0, 0.0, 0.0, 0.0, 0.0)

        results = find_closest_approaches(sat, [deb], 0, 7200, dt=60)
        assert len(results) == 1
        # Min distance for coplanar circles = difference in radii
        assert abs(results[0]["min_distance_km"] - 100.0) < 50.0

    def test_perpendicular_orbits(self):
        """Two orbits 90 deg apart in RAAN.
        Min distance should be roughly r * sqrt(2) at crossing points."""
        a = R_EARTH + 500
        sat = _make_elements(a, 0.0, 51.6, 0.0, 0.0, 0.0)
        deb = _make_elements(a, 0.0, 51.6, 90.0, 0.0, 0.0)

        results = find_closest_approaches(sat, [deb], 0, 7200, dt=60)
        assert len(results) == 1
        # Should be non-zero but not huge
        assert results[0]["min_distance_km"] > 1.0
        assert results[0]["min_distance_km"] < 20000.0

    def test_multiple_debris(self):
        """Multiple debris objects should produce multiple results."""
        a = R_EARTH + 500
        sat = _make_elements(a, 0.0, 51.6, 0.0, 0.0, 0.0)
        debris = [
            _make_elements(R_EARTH + 400, 0.0, 51.6, 0.0, 0.0, 0.0),
            _make_elements(R_EARTH + 600, 0.0, 51.6, 0.0, 0.0, 0.0),
            _make_elements(R_EARTH + 500, 0.0, 90.0, 0.0, 0.0, 0.0),
        ]

        results = find_closest_approaches(sat, debris, 0, 3600, dt=60)
        assert len(results) == 3
        # Results should be sorted by distance
        for i in range(len(results) - 1):
            assert results[i]["min_distance_km"] <= results[i + 1]["min_distance_km"]

    def test_top_n(self):
        """top_n should limit results."""
        a = R_EARTH + 500
        sat = _make_elements(a, 0.0, 51.6, 0.0, 0.0, 0.0)
        debris = [
            _make_elements(R_EARTH + 400, 0.0, 51.6, i * 30, 0.0, 0.0)
            for i in range(10)
        ]

        results = find_closest_approaches(sat, debris, 0, 3600, dt=60, top_n=5)
        assert len(results) == 5

    def test_result_fields(self):
        """Results should contain all required fields."""
        a = R_EARTH + 500
        sat = _make_elements(a, 0.0, 51.6, 0.0, 0.0, 0.0)
        deb = _make_elements(a + 10, 0.0, 51.6, 0.0, 0.0, 0.0)
        deb["id"] = "test_debris"
        deb["name"] = "Test Debris"

        results = find_closest_approaches(sat, [deb], 0, 3600, dt=60)
        assert len(results) == 1

        r = results[0]
        assert "debris_id" in r
        assert "debris_name" in r
        assert "min_distance_km" in r
        assert "time_to_closest_s" in r
        assert "relative_velocity_km_s" in r
        assert "risk_score" in r
        assert "risk_level" in r
        assert r["risk_level"] in ("CRITICAL", "HIGH", "MODERATE", "LOW")

    def test_eccentric_orbit(self):
        """Objects with eccentricity should still propagate correctly."""
        a = R_EARTH + 500
        sat = _make_elements(a, 0.0, 51.6, 0.0, 0.0, 0.0)
        deb = _make_elements(a, 0.1, 51.6, 0.0, 0.0, 0.0)

        results = find_closest_approaches(sat, [deb], 0, 7200, dt=60)
        assert len(results) == 1
        assert results[0]["min_distance_km"] >= 0.0
