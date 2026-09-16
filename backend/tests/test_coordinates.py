"""Tests for ECI coordinate transforms."""

import numpy as np
import pytest

from backend.orbital_engine.coordinates import orbital_to_eci, eci_distance


class TestOrbitalToEci:
    def test_zero_rotation(self):
        """With all angles zero, orbital position maps directly to ECI."""
        pos_orb = np.array([7000.0, 0.0, 0.0])
        result = orbital_to_eci(pos_orb, 0.0, 0.0, 0.0)
        np.testing.assert_allclose(result, pos_orb, atol=1e-10)

    def test_inclination_90(self):
        """90 degree inclination rotates orbital y into ECI z."""
        pos_orb = np.array([0.0, 7000.0, 0.0])
        result = orbital_to_eci(pos_orb, 0.0, 90.0, 0.0)
        # After 90 deg rotation around x: y -> z
        np.testing.assert_allclose(result[1], 0.0, atol=1e-10)
        np.testing.assert_allclose(result[2], 7000.0, atol=1e-10)

    def test_inclination_0(self):
        """Zero inclination: y stays in equatorial plane."""
        pos_orb = np.array([0.0, 7000.0, 0.0])
        result = orbital_to_eci(pos_orb, 0.0, 0.0, 0.0)
        np.testing.assert_allclose(result[2], 0.0, atol=1e-10)

    def test_arg_perigee_rotation(self):
        """Argument of perigee rotates position within orbital plane."""
        pos_orb = np.array([7000.0, 0.0, 0.0])
        result_45 = orbital_to_eci(pos_orb, 45.0, 0.0, 0.0)
        # After 45 deg rotation around z, position should be rotated
        expected = np.array([7000 * np.cos(np.pi / 4), 7000 * np.sin(np.pi / 4), 0.0])
        np.testing.assert_allclose(result_45, expected, atol=1e-10)

    def test_raan_rotation(self):
        """RAAN rotates the ascending node around z-axis."""
        pos_orb = np.array([0.0, 7000.0, 0.0])
        result_90 = orbital_to_eci(pos_orb, 0.0, 0.0, 90.0)
        # After 90 deg RAAN rotation: y -> -x
        np.testing.assert_allclose(result_90[0], -7000.0, atol=1e-10)
        np.testing.assert_allclose(result_90[1], 0.0, atol=1e-10)


class TestEciDistance:
    def test_same_point(self):
        pos = np.array([7000.0, 0.0, 0.0])
        assert eci_distance(pos, pos) == 0.0

    def test_known_distance(self):
        a = np.array([0.0, 0.0, 0.0])
        b = np.array([3.0, 4.0, 0.0])
        assert eci_distance(a, b) == 5.0

    def test_symmetric(self):
        a = np.array([1000.0, 2000.0, 3000.0])
        b = np.array([4000.0, 5000.0, 6000.0])
        assert eci_distance(a, b) == eci_distance(b, a)
