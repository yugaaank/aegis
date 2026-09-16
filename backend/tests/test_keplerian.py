"""Tests for Keplerian orbit propagation."""

import numpy as np
import pytest

from backend.orbital_engine.keplerian import (
    solve_kepler,
    mean_to_true_anomaly,
    propagate,
    propagate_orbit,
    orbital_period,
    radius_at_true_anomaly,
    MU_EARTH,
    R_EARTH,
)


class TestSolveKepler:
    def test_circular_orbit(self):
        """E = M when e = 0."""
        for M in [0, np.pi / 4, np.pi / 2, np.pi, 3 * np.pi / 2]:
            E = solve_kepler(M, e=0.0)
            assert abs(E - M) < 1e-10

    def test_eccentric_orbit(self):
        """Kepler equation M = E - e*sin(E) is satisfied."""
        for e in [0.1, 0.3, 0.5, 0.7, 0.9]:
            for M in [0.0, 1.0, 2.0, np.pi, 4.0]:
                E = solve_kepler(M, e)
                residual = E - e * np.sin(E) - M
                assert abs(residual) < 1e-8, f"e={e}, M={M}: residual={residual}"

    def test_full_orbit(self):
        """E should sweep 0 to 2pi as M sweeps 0 to 2pi."""
        M_vals = np.linspace(0, 2 * np.pi, 100)
        E_vals = [solve_kepler(M, 0.5) for M in M_vals]
        # E should be monotonically increasing
        for i in range(1, len(E_vals)):
            assert E_vals[i] >= E_vals[i - 1]


class TestMeanToTrueAnomaly:
    def test_circular_orbit(self):
        """True anomaly = mean anomaly for e = 0."""
        for M_deg in [0, 45, 90, 180, 270]:
            nu = mean_to_true_anomaly(M_deg, e=0.0)
            expected = np.radians(M_deg)
            assert abs(nu - expected) < 1e-10

    def test_eccentric_at_perigee(self):
        """At M=0 (perigee), true anomaly should be 0."""
        nu = mean_to_true_anomaly(0.0, e=0.3)
        assert abs(nu) < 1e-10

    def test_eccentric_at_apogee(self):
        """At M=180 (apogee), true anomaly should be ~pi."""
        nu = mean_to_true_anomaly(180.0, e=0.3)
        assert abs(nu - np.pi) < 1e-6


class TestPropagate:
    def test_circular_orbit_closes(self):
        """After one orbital period, position should return to start."""
        a = R_EARTH + 400  # 400 km altitude
        T = orbital_period(a)

        pos_0 = propagate(a, 0.0, 51.6, 0.0, 0.0, 0.0, 0.0)
        pos_T = propagate(a, 0.0, 51.6, 0.0, 0.0, 0.0, T)

        assert np.linalg.norm(pos_T - pos_0) < 1.0  # within 1 km

    def test_radius_matches(self):
        """Position magnitude should equal orbital radius."""
        a = R_EARTH + 500
        e = 0.01
        pos = propagate(a, e, 0.0, 0.0, 0.0, 0.0, 0.0)
        r = np.linalg.norm(pos)
        expected_r = radius_at_true_anomaly(a, e, 0.0)
        assert abs(r - expected_r) < 1.0

    def test_equatorial_orbit(self):
        """Zero inclination: z-component should be ~0."""
        a = R_EARTH + 600
        pos = propagate(a, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0)
        assert abs(pos[2]) < 1.0  # z ~ 0 for equatorial orbit

    def test_polar_orbit(self):
        """90 degree inclination: orbit should pass over poles."""
        a = R_EARTH + 400
        T = orbital_period(a)
        positions = propagate_orbit(a, 0.0, 90.0, 0.0, 0.0, 0.0, 0, T, dt=T / 100)
        z_vals = positions[:, 2]
        assert np.max(z_vals) > a * 0.5  # should reach high z values


class TestOrbitalPeriod:
    def test_known_period(self):
        """ISS-like orbit (~400 km): period should be ~92 minutes."""
        a = R_EARTH + 400
        T = orbital_period(a)
        T_minutes = T / 60.0
        assert 88 < T_minutes < 96  # 92 min +/- 4 min

    def test_higher_orbit_slower(self):
        """Higher orbit should have longer period."""
        T1 = orbital_period(R_EARTH + 400)
        T2 = orbital_period(R_EARTH + 800)
        assert T2 > T1
