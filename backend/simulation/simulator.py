"""Simulation orchestrator: ties orbital engine + risk engine together."""

from datetime import datetime, timezone

from ..api.schemas import (
    SimulationRequest,
    SimulationResponse,
    ClosestApproachResult,
)
from ..risk_engine.closest_approach import find_closest_approaches


def _elements_to_engine_dict(oe) -> dict:
    """Convert Pydantic OrbitalElements to dict expected by propagator."""
    return {
        "a": oe.semi_major_axis_km,
        "e": oe.eccentricity,
        "inc": oe.inclination_deg,
        "raan": oe.raan_deg,
        "argp": oe.arg_perigee_deg,
        "M0": oe.mean_anomaly_deg,
    }


def run_simulation(req: SimulationRequest) -> SimulationResponse:
    """Run full simulation: propagation + closest approach + risk scoring."""
    t_end = req.time_window_hours * 3600.0

    sat_elements = _elements_to_engine_dict(req.satellite.orbital_elements)

    debris_data = []
    for d in req.debris:
        oe = d.orbital_elements
        debris_data.append({
            "id": d.id,
            "name": d.name,
            "a": oe.semi_major_axis_km,
            "e": oe.eccentricity,
            "inc": oe.inclination_deg,
            "raan": oe.raan_deg,
            "argp": oe.arg_perigee_deg,
            "M0": oe.mean_anomaly_deg,
        })

    approaches_raw = find_closest_approaches(
        sat_elements=sat_elements,
        debris_list=debris_data,
        t_start=0.0,
        t_end=t_end,
        dt=60.0,
    )

    approaches = [
        ClosestApproachResult(**a) for a in approaches_raw
    ]

    return SimulationResponse(
        satellite=req.satellite,
        debris_count=len(req.debris),
        time_window_hours=req.time_window_hours,
        propagation_dt_s=60.0,
        approaches=approaches,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
