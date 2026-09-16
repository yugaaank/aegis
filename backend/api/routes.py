"""FastAPI route definitions."""

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from .schemas import (
    SimulationRequest,
    SimulationResponse,
    ClosestApproachResult,
    ValidationRequest,
    ValidationResult,
    ObjectListResponse,
    SpaceObject,
    OrbitalElements,
    MAX_DEBRIS_COUNT,
)
from ..simulation.simulator import run_simulation

router = APIRouter(prefix="/api")

DATA_DIR = Path(__file__).parent.parent / "data"


def _load_sample_data() -> dict:
    """Load sample debris dataset from disk."""
    path = DATA_DIR / "sample_debris.json"
    if not path.exists():
        raise HTTPException(status_code=500, detail="Sample dataset not found")
    with open(path) as f:
        return json.load(f)


@router.get("/health")
def health_check():
    return {"status": "ok"}


@router.post("/validate", response_model=ValidationResult)
def validate_object(req: ValidationRequest):
    errors = []
    warnings = []

    oe = req.orbital_elements

    if oe.semi_major_axis_km < 6371.0:
        errors.append(f"semi_major_axis_km must be > 6371 (got {oe.semi_major_axis_km})")

    if oe.eccentricity >= 1.0:
        errors.append(f"Eccentricity must be < 1 for bound orbit (got {oe.eccentricity})")

    if not (0 <= oe.inclination_deg <= 180):
        errors.append(f"Inclination must be [0, 180] (got {oe.inclination_deg})")

    if not (0 <= oe.raan_deg < 360):
        errors.append(f"RAAN must be [0, 360) (got {oe.raan_deg})")

    if not (0 <= oe.arg_perigee_deg < 360):
        errors.append(f"Arg of perigee must be [0, 360) (got {oe.arg_perigee_deg})")

    if not (0 <= oe.mean_anomaly_deg < 360):
        errors.append(f"Mean anomaly must be [0, 360) (got {oe.mean_anomaly_deg})")

    altitude = oe.semi_major_axis_km - 6371.0

    if oe.eccentricity > 0.3:
        warnings.append("High eccentricity — circular orbit visualization will be approximate")

    if altitude < 400:
        warnings.append("Low altitude (< 400 km) — atmospheric drag significant (not modeled)")

    if altitude > 36000:
        warnings.append("High altitude (> 36000 km) — GEO regime, consider specific assumptions")

    return ValidationResult(
        valid=len(errors) == 0,
        errors=errors,
        warnings=warnings,
    )


@router.post("/simulate", response_model=SimulationResponse)
def simulate(req: SimulationRequest):
    if len(req.debris) > MAX_DEBRIS_COUNT:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {MAX_DEBRIS_COUNT} debris objects allowed",
        )

    result = run_simulation(req)
    return result


@router.post("/closest-approach")
def closest_approach(req: SimulationRequest):
    if len(req.debris) > MAX_DEBRIS_COUNT:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {MAX_DEBRIS_COUNT} debris objects allowed",
        )

    result = run_simulation(req)
    return {
        "satellite": result.satellite,
        "debris_count": result.debris_count,
        "approaches": result.approaches,
    }


@router.get("/objects", response_model=ObjectListResponse)
def get_objects():
    data = _load_sample_data()

    satellite = SpaceObject(**data["satellite"])
    debris = [SpaceObject(**d) for d in data["debris"]]

    return ObjectListResponse(satellite=satellite, debris=debris)
