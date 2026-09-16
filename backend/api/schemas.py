"""Pydantic models for API request/response validation."""

from pydantic import BaseModel, Field, field_validator
from typing import Optional

R_EARTH = 6371.0  # km

ALLOWED_TIME_WINDOWS = {1, 6, 12, 24, 48, 168}
MAX_DEBRIS_COUNT = 1000


class OrbitalElements(BaseModel):
    semi_major_axis_km: float = Field(..., gt=R_EARTH, description="Semi-major axis in km, must be > 6371")
    eccentricity: float = Field(..., ge=0.0, lt=1.0, description="Eccentricity, must be [0, 1)")
    inclination_deg: float = Field(..., ge=0.0, le=180.0, description="Inclination in degrees")
    raan_deg: float = Field(..., ge=0.0, lt=360.0, description="RAAN in degrees")
    arg_perigee_deg: float = Field(..., ge=0.0, lt=360.0, description="Argument of perigee in degrees")
    mean_anomaly_deg: float = Field(..., ge=0.0, lt=360.0, description="Mean anomaly at epoch in degrees")


class SpaceObject(BaseModel):
    id: str = Field(..., min_length=1, max_length=64)
    name: str = Field(..., min_length=1, max_length=128)
    type: str = Field(..., pattern=r"^(satellite|debris)$")
    orbital_elements: OrbitalElements


class SimulationRequest(BaseModel):
    satellite: SpaceObject
    debris: list[SpaceObject] = Field(..., min_length=1, max_length=MAX_DEBRIS_COUNT)
    time_window_hours: int = Field(default=24, description="Simulation window in hours")

    @field_validator("time_window_hours")
    @classmethod
    def validate_time_window(cls, v: int) -> int:
        if v not in ALLOWED_TIME_WINDOWS:
            raise ValueError(f"time_window_hours must be one of {sorted(ALLOWED_TIME_WINDOWS)}")
        return v


class ValidationRequest(BaseModel):
    orbital_elements: OrbitalElements

    @field_validator("orbital_elements")
    @classmethod
    def validate_orbital_elements(cls, v: OrbitalElements) -> OrbitalElements:
        if v.semi_major_axis_km < R_EARTH:
            raise ValueError(f"semi_major_axis_km must be > {R_EARTH}")
        if v.eccentricity >= 1.0:
            raise ValueError("Eccentricity must be < 1 for bound orbit")
        return v


class ClosestApproachResult(BaseModel):
    debris_id: str
    debris_name: str
    min_distance_km: float
    time_to_closest_s: float
    relative_velocity_km_s: float
    risk_score: float
    risk_level: str


class SimulationResponse(BaseModel):
    satellite: SpaceObject
    debris_count: int
    time_window_hours: int
    propagation_dt_s: float
    approaches: list[ClosestApproachResult]
    timestamp: str


class ValidationResult(BaseModel):
    valid: bool
    errors: list[str] = []
    warnings: list[str] = []


class ObjectListResponse(BaseModel):
    satellite: SpaceObject
    debris: list[SpaceObject]
