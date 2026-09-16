"""Closest-approach finder using vectorized NumPy propagation.

Two-pass algorithm:
  Pass 1 — Coarse grid (60s steps) over the full time window.
           Vectorized: propagate satellite once, all debris at once per step.
  Pass 2 — scipy.optimize.minimize_scalar within each candidate window
           to find precise min distance and time.
"""

from __future__ import annotations

import numpy as np
from scipy.optimize import minimize_scalar
from numpy.typing import NDArray

from ..orbital_engine.keplerian import (
    propagate,
    propagate_orbit,
    orbital_period,
    solve_kepler,
    true_anomaly_from_eccentric,
    mean_to_true_anomaly,
    radius_at_true_anomaly,
    MU_EARTH,
    DEG2RAD,
)
from ..orbital_engine.coordinates import eci_distance, orbital_to_eci_batch

from .risk_scorer import risk_score, classify_risk


def _propagate_vectorized(
    a_km: float,
    e: float,
    inc_deg: float,
    raan_deg: float,
    argp_deg: float,
    M0_deg: float,
    times: NDArray[np.float64],
) -> NDArray[np.float64]:
    """Propagate a single orbit to multiple time steps. Returns (N, 3) positions.

    Vectorized over time steps using array operations where possible.
    Still loops over steps because Kepler's equation requires per-step solve,
    but propagation of position + rotation is batched via matrix ops.
    """
    n_steps = len(times)
    n = np.sqrt(MU_EARTH / a_km**3)

    # Mean anomaly at each time step
    M = (np.radians(M0_deg) + n * times) % (2.0 * np.pi)

    # Solve Kepler equation for each step
    E = np.empty(n_steps, dtype=np.float64)
    for i in range(n_steps):
        E[i] = solve_kepler(M[i], e)

    # True anomaly
    nu = 2.0 * np.arctan2(
        np.sqrt(1.0 + e) * np.sin(E / 2.0),
        np.sqrt(1.0 - e) * np.cos(E / 2.0),
    )

    # Radius
    r = a_km * (1.0 - e**2) / (1.0 + e * np.cos(nu))

    # Orbital plane positions (N, 3)
    pos_orb = np.column_stack([r * np.cos(nu), r * np.sin(nu), np.zeros(n_steps)])

    # Apply rotation matrix once per orbit (same for all time steps)
    return orbital_to_eci_batch(pos_orb, argp_deg, inc_deg, raan_deg)


def _approx_velocity(
    a_km: float,
    e: float,
    inc_deg: float,
    raan_deg: float,
    argp_deg: float,
    M0_deg: float,
    t: float,
    eps: float = 0.5,
) -> float:
    """Approximate scalar velocity (km/s) at time t via finite difference.

    Uses central difference: v ≈ ||r(t+eps) - r(t-eps)|| / (2*eps).
    """
    pos_a = propagate(a_km, e, inc_deg, raan_deg, argp_deg, M0_deg, t - eps)
    pos_b = propagate(a_km, e, inc_deg, raan_deg, argp_deg, M0_deg, t + eps)
    return float(np.linalg.norm(pos_b - pos_a) / (2.0 * eps))


def find_closest_approaches(
    sat_elements: dict,
    debris_list: list[dict],
    t_start: float,
    t_end: float,
    dt: float = 60.0,
    top_n: int | None = None,
) -> list[dict]:
    """Find closest approaches between a satellite and debris objects.

    Parameters
    ----------
    sat_elements : dict
        Satellite orbital elements with keys: a, e, inc, raan, argp, M0 (all floats).
    debris_list : list[dict]
        Each dict has keys: id, name, plus orbital element keys.
    t_start, t_end : float
        Time window in seconds from epoch.
    dt : float
        Coarse propagation step in seconds (default 60).
    top_n : int or None
        If set, return only top N closest approaches.

    Returns
    -------
    list[dict] sorted by min_distance ascending.
    """
    times = np.arange(t_start, t_end + dt, dt)
    n_steps = len(times)

    # Pre-compute satellite positions for all time steps
    sat_pos = _propagate_vectorized(
        sat_elements["a"], sat_elements["e"], sat_elements["inc"],
        sat_elements["raan"], sat_elements["argp"], sat_elements["M0"], times,
    )

    results = []

    for debris in debris_list:
        # Pre-compute debris positions for all time steps
        deb_pos = _propagate_vectorized(
            debris["a"], debris["e"], debris["inc"],
            debris["raan"], debris["argp"], debris["M0"], times,
        )

        # Pass 1: vectorized distance computation over all time steps
        diff = sat_pos - deb_pos
        dists = np.linalg.norm(diff, axis=1)

        min_idx = int(np.argmin(dists))
        coarse_min_dist = float(dists[min_idx])
        coarse_min_time = float(times[min_idx])

        # Narrow window around coarse minimum for refinement
        window_start = max(t_start, coarse_min_time - dt)
        window_end = min(t_end, coarse_min_time + dt)

        # Pass 2: scipy refinement
        def dist_fn(t):
            p_sat = propagate(
                sat_elements["a"], sat_elements["e"], sat_elements["inc"],
                sat_elements["raan"], sat_elements["argp"], sat_elements["M0"], t,
            )
            p_deb = propagate(
                debris["a"], debris["e"], debris["inc"],
                debris["raan"], debris["argp"], debris["M0"], t,
            )
            return float(np.linalg.norm(p_sat - p_deb))

        res = minimize_scalar(dist_fn, bounds=(window_start, window_end), method="bounded")

        min_dist = res.fun
        t_closest = res.x

        # Approximate relative velocity at closest approach
        v_sat = _approx_velocity(
            sat_elements["a"], sat_elements["e"], sat_elements["inc"],
            sat_elements["raan"], sat_elements["argp"], sat_elements["M0"], t_closest,
        )
        v_deb = _approx_velocity(
            debris["a"], debris["e"], debris["inc"],
            debris["raan"], debris["argp"], debris["M0"], t_closest,
        )
        # Approximate relative speed (conservative: sum of magnitudes)
        # Better would be vector difference, but this is simpler and more conservative
        v_rel = v_sat + v_deb  # upper bound on relative speed

        score = risk_score(min_dist, v_rel, t_closest)
        level = classify_risk(score)

        results.append({
            "debris_id": debris["id"],
            "debris_name": debris["name"],
            "min_distance_km": round(min_dist, 3),
            "time_to_closest_s": round(t_closest, 2),
            "relative_velocity_km_s": round(v_rel, 3),
            "risk_score": score,
            "risk_level": level,
        })

    results.sort(key=lambda x: x["min_distance_km"])

    if top_n is not None:
        results = results[:top_n]

    return results
