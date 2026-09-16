"""ECI coordinate transforms for Keplerian orbital elements."""

import numpy as np
from numpy.typing import NDArray

DEG2RAD = np.pi / 180.0


def _rot_z(angle_rad: float) -> np.ndarray:
    """Rotation matrix about the z-axis."""
    c, s = np.cos(angle_rad), np.sin(angle_rad)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]], dtype=np.float64)


def _rot_x(angle_rad: float) -> np.ndarray:
    """Rotation matrix about the x-axis."""
    c, s = np.cos(angle_rad), np.sin(angle_rad)
    return np.array([[1, 0, 0], [0, c, -s], [0, s, c]], dtype=np.float64)


def orbital_to_eci(
    pos_orb: NDArray[np.float64],
    argp_deg: float,
    inc_deg: float,
    raan_deg: float,
) -> NDArray[np.float64]:
    """Rotate position from orbital plane to ECI frame.

    Rotation order (3-1-3 Euler angles):
    1. Rotate by argument of perigee (argp) around z-axis
    2. Rotate by inclination (inc) around x-axis
    3. Rotate by RAAN around z-axis
    """
    R_argp = _rot_z(np.radians(argp_deg))
    R_inc = _rot_x(np.radians(inc_deg))
    R_raan = _rot_z(np.radians(raan_deg))

    # Apply in order: argp -> inc -> raan
    pos = R_argp @ pos_orb
    pos = R_inc @ pos
    pos = R_raan @ pos
    return pos


def orbital_to_eci_batch(
    pos_orb: NDArray[np.float64],
    argp_deg: float,
    inc_deg: float,
    raan_deg: float,
) -> NDArray[np.float64]:
    """Batch version: rotate (N, 3) orbital positions to ECI.

    pos_orb has shape (N, 3). Returns (N, 3).
    """
    R_argp = _rot_z(np.radians(argp_deg))
    R_inc = _rot_x(np.radians(inc_deg))
    R_raan = _rot_z(np.radians(raan_deg))

    # Combined rotation matrix
    R = R_raan @ R_inc @ R_argp

    # Matrix multiply all positions at once
    return (R @ pos_orb.T).T


def eci_distance(pos_a: NDArray[np.float64], pos_b: NDArray[np.float64]) -> float:
    """Euclidean distance between two ECI positions."""
    return float(np.linalg.norm(pos_a - pos_b))


def eci_distance_batch(
    pos_a: NDArray[np.float64], pos_b: NDArray[np.float64]
) -> NDArray[np.float64]:
    """Distance between arrays of positions. Both shape (N, 3). Returns (N,)."""
    return np.linalg.norm(pos_a - pos_b, axis=1)
