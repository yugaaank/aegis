"""Risk scoring and classification for debris conjunction events."""

import numpy as np


def risk_score(
    d_min_km: float,
    v_rel_km_s: float,
    t_to_closest_s: float,
) -> float:
    """Compute collision risk score in [0, 100].

    Formula:
        score = 100 * dist_factor * v_factor * t_factor

    All factors are in [0, 1] so the product is always ≤ 100.

    Parameters
    ----------
    d_min_km : float
        Minimum approach distance in km.
    v_rel_km_s : float
        Relative velocity at closest approach in km/s.
    t_to_closest_s : float
        Time from epoch to closest approach in seconds.
    """
    d_ref = 500.0  # km — normalization constant

    # Distance factor: 1 at d=0, 0 at d>=d_ref. Clamped to [0, 1].
    dist_factor = max(0.0, min(1.0, 1.0 - d_min_km / d_ref))

    # Velocity factor: 0.3 at v=0, 1.0 at v>=15 km/s.
    # 15 km/s ~ typical LEO debris closing speed.
    v_factor = 0.3 + 0.7 * min(v_rel_km_s / 15.0, 1.0)

    # Time urgency: 1.0 at t=0 (imminent), 0.5 at t>=3600s (1 hour out).
    # Closer in time = higher score.
    t_factor = 1.0 - 0.5 * min(t_to_closest_s / 3600.0, 1.0)

    score = 100.0 * dist_factor * v_factor * t_factor
    return round(max(0.0, score), 1)


def classify_risk(score: float) -> str:
    """Classify a risk score into a level string."""
    if score >= 85.0:
        return "CRITICAL"
    if score >= 60.0:
        return "HIGH"
    if score >= 30.0:
        return "MODERATE"
    return "LOW"
