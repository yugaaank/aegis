"""Keplerian orbit propagation using classical orbital elements.

Input convention: the user provides mean anomaly at epoch (M0_deg).
This avoids the ambiguity of converting between anomaly types and
matches what TLE/SGP4 workflows already provide.
"""

import numpy as np
from numpy.typing import NDArray

from .coordinates import orbital_to_eci

MU_EARTH = 398600.4418  # km^3/s^2
R_EARTH = 6371.0  # km

DEG2RAD = np.pi / 180.0
RAD2DEG = 180.0 / np.pi


def solve_kepler(M: float, e: float, tol: float = 1e-10) -> float:
    """Solve Kepler's equation M = E - e*sin(E) for eccentric anomaly E.

    Uses Newton-Raphson. Works for any e < 1.
    """
    E = M if e < 0.8 else np.pi
    for _ in range(100):
        dE = (E - e * np.sin(E) - M) / (1.0 - e * np.cos(E))
        E -= dE
        if abs(dE) < tol:
            break
    return E


def true_anomaly_from_eccentric(E: float, e: float) -> float:
    """Convert eccentric anomaly E to true anomaly nu."""
    return 2.0 * np.arctan2(
        np.sqrt(1.0 + e) * np.sin(E / 2.0),
        np.sqrt(1.0 - e) * np.cos(E / 2.0),
    )


def mean_to_true_anomaly(M_deg: float, e: float) -> float:
    """Convert mean anomaly (degrees) to true anomaly (radians)."""
    M = np.radians(M_deg) % (2 * np.pi)
    E = solve_kepler(M, e)
    return true_anomaly_from_eccentric(E, e)


def radius_at_true_anomaly(a: float, e: float, nu: float) -> float:
    """Orbital radius r at true anomaly nu for semi-major axis a, eccentricity e."""
    return a * (1.0 - e**2) / (1.0 + e * np.cos(nu))


def orbital_plane_position(a: float, e: float, nu: float) -> np.ndarray:
    """Position [x, y, 0] in the orbital plane at true anomaly nu."""
    r = radius_at_true_anomaly(a, e, nu)
    return np.array([r * np.cos(nu), r * np.sin(nu), 0.0])


def propagate(
    a_km: float,
    e: float,
    inc_deg: float,
    raan_deg: float,
    argp_deg: float,
    M0_deg: float,
    t: float,
) -> np.ndarray:
    """Propagate a Keplerian orbit to time t and return ECI position [x, y, z] in km.

    Parameters
    ----------
    a_km : float
        Semi-major axis in km.
    e : float
        Eccentricity [0, 1).
    inc_deg : float
        Inclination in degrees [0, 180].
    raan_deg : float
        Right ascension of ascending node in degrees [0, 360).
    argp_deg : float
        Argument of perigee in degrees [0, 360).
    M0_deg : float
        Mean anomaly at epoch in degrees [0, 360).
    t : float
        Time since epoch in seconds.
    """
    n = np.sqrt(MU_EARTH / a_km**3)  # mean motion rad/s

    # Mean anomaly at time t
    M = (np.radians(M0_deg) + n * t) % (2 * np.pi)

    # Kepler equation -> true anomaly
    E = solve_kepler(M, e)
    nu = true_anomaly_from_eccentric(E, e)

    # Position in orbital plane
    pos_orb = orbital_plane_position(a_km, e, nu)

    # Apply rotations: arg_perigee (z) -> inclination (x) -> RAAN (z)
    return orbital_to_eci(pos_orb, argp_deg, inc_deg, raan_deg)


def propagate_orbit(
    a_km: float,
    e: float,
    inc_deg: float,
    raan_deg: float,
    argp_deg: float,
    M0_deg: float,
    t_start: float,
    t_end: float,
    dt: float = 60.0,
) -> NDArray[np.float64]:
    """Propagate an orbit over a time range, returning array of ECI positions.

    Returns shape (N, 3) where N = number of time steps.
    """
    times = np.arange(t_start, t_end + dt, dt)
    n_steps = len(times)
    positions = np.empty((n_steps, 3), dtype=np.float64)

    for i, t in enumerate(times):
        positions[i] = propagate(a_km, e, inc_deg, raan_deg, argp_deg, M0_deg, t)

    return positions


def orbital_period(a_km: float) -> float:
    """Orbital period in seconds for semi-major axis a_km."""
    return 2.0 * np.pi * np.sqrt(a_km**3 / MU_EARTH)


def mean_motion(a_km: float) -> float:
    """Mean motion in rad/s."""
    return np.sqrt(MU_EARTH / a_km**3)
