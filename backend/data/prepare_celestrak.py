"""
Offline script: Prepare seed dataset from CelesTrak TLE data.

This script fetches real debris TLEs from CelesTrak's public catalog
and converts them to Keplerian orbital elements.

Usage:
    uv run data/prepare_celestrak.py

Requires: sgp4 (pip install sgp4)

The output is saved to data/sample_debris.json.
"""

import json
import sys
from pathlib import Path

try:
    from sgp4.api import Satrec, WGS72
    from sgp4.api import jday
except ImportError:
    print("sgp4 not installed. Generating synthetic dataset based on CelesTrak debris characteristics.")
    print("Install sgp4 for real TLE conversion: uv pip install sgp4")
    sys.exit(1)

import numpy as np
from datetime import datetime


# CelesTrak catalog IDs for Iridium 33 / Cosmos 2251 fragments
# These are well-documented debris from the 2009 collision
CELESTRAK_URL = "https://celestrak.org/NORAD/elements/gp.php"
CATNOS = [
    # Iridium 33 fragments
    "33492", "33493", "33494", "33495", "33496",
    "33497", "33498", "33499", "33500", "33501",
    "33502", "33503", "33504", "33505", "33506",
    # Cosmos 2251 fragments
    "34452", "34453", "34454", "34455", "34456",
    "34457", "34458", "34459", "34460", "34461",
]


def tle_to_keplerian(satellite) -> dict:
    """Extract classical orbital elements from an SGP4 satellite object."""
    # Extract Keplerian elements from SGP4 state vector
    epoch = satellite.jdsatepoch + satellite.jdsatepochF
    jd = satellite.jdsatepoch
    fr = satellite.jdsatepochF

    # Get position and velocity in TEME
    e, r, v = satellite.sgp4(jd, fr)
    if e != 0:
        return None

    r = np.array(r)  # km
    v = np.array(v)  # km/s

    mu = 398600.4418  # km^3/s^2

    # Specific angular momentum
    h = np.cross(r, v)
    h_mag = np.linalg.norm(h)

    # Node vector
    K = np.array([0, 0, 1])
    n = np.cross(K, h)
    n_mag = np.linalg.norm(n)

    # Eccentricity vector
    e_vec = ((np.dot(v, v) - mu / np.linalg.norm(r)) * r - np.dot(r, v) * v) / mu
    ecc = np.linalg.norm(e_vec)

    # Semi-major axis
    energy = np.dot(v, v) / 2 - mu / np.linalg.norm(r)
    sma = -mu / (2 * energy) if energy != 0 else 0

    # Inclination
    inc = np.degrees(np.arccos(np.clip(h[2] / h_mag, -1, 1)))

    # RAAN
    if n_mag > 1e-10:
        raan = np.degrees(np.arctan2(n[1], n[0]))
    else:
        raan = 0
    raan = raan % 360

    # Argument of perigee
    if n_mag > 1e-10 and ecc > 1e-10:
        argp = np.degrees(np.arccos(np.clip(np.dot(n, e_vec) / (n_mag * ecc), -1, 1)))
        if e_vec[2] < 0:
            argp = 360 - argp
    else:
        argp = 0

    # True anomaly
    if ecc > 1e-10:
        nu = np.degrees(np.arccos(np.clip(np.dot(e_vec, r) / (ecc * np.linalg.norm(r)), -1, 1)))
        if np.dot(r, v) < 0:
            nu = 360 - nu
    else:
        nu = 0

    return {
        "semi_major_axis_km": round(sma, 3),
        "eccentricity": round(ecc, 6),
        "inclination_deg": round(inc, 3),
        "raan_deg": round(raan % 360, 3),
        "arg_perigee_deg": round(argp % 360, 3),
        "mean_anomaly_deg": round(nu % 360, 3),  # approximate: using true anomaly as proxy
    }


def main():
    import urllib.request
    import io

    print("Fetching debris catalog from CelesTrak...")

    debris_list = []
    for i, catno in enumerate(CATNOS):
        url = f"{CELESTRAK_URL}?CATNR={catno}&FORMAT=TLE"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "OrbitalShield/1.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = resp.read().decode()
                lines = [l.strip() for l in data.strip().split("\n") if l.strip()]

                if len(lines) >= 3:
                    name = lines[0]
                    tle_line1 = lines[1]
                    tle_line2 = lines[2]

                    sat = Satrec.twoline2rv(tle_line1, tle_line2, WGS72)
                    elements = tle_to_keplerian(sat)

                    if elements and elements["semi_major_axis_km"] > 6371:
                        debris_list.append({
                            "id": f"debris_{i+1:03d}",
                            "name": name[:64],
                            "type": "debris",
                            "orbital_elements": elements,
                        })
                        print(f"  [{i+1}/{len(CATNOS)}] {name[:40]} — OK")
                    else:
                        print(f"  [{i+1}/{len(CATNOS)}] {name[:40]} — skipped (sub-orbital)")
        except Exception as e:
            print(f"  [{i+1}/{len(CATNOS)}] Failed to fetch {catno}: {e}")

    print(f"\nFetched {len(debris_list)} debris objects")
    return debris_list


def generate_synthetic_dataset():
    """Generate 50 realistic LEO debris objects (fallback when CelesTrak unavailable)."""
    rng = np.random.default_rng(42)

    # Base characteristics for LEO debris from collision events
    # Iridium 33 was at ~780 km, 86.4° inc
    # Cosmos 2251 was at ~790 km, 74° inc
    base_altitudes = rng.uniform(650, 900, size=60)
    base_inclinations = [
        # Mix of Iridium-like (86°) and Cosmos-like (74°) fragments
        *[rng.normal(86.4, 3) for _ in range(30)],
        *[rng.normal(74.0, 3) for _ in range(30)],
    ]

    debris_list = []
    used = 0
    for i in range(60):
        if used >= 50:
            break

        alt = base_altitudes[i]
        inc = np.clip(base_inclinations[i], 0, 180)
        ecc = abs(rng.normal(0.01, 0.02))
        ecc = min(ecc, 0.3)  # cap at 0.3 for LEO debris
        raan = rng.uniform(0, 360)
        argp = rng.uniform(0, 360)
        M0 = rng.uniform(0, 360)

        sma = 6371.0 + alt

        debris_list.append({
            "id": f"debris_{used+1:03d}",
            "name": f"Collision Fragment {used+1}",
            "type": "debris",
            "orbital_elements": {
                "semi_major_axis_km": round(sma, 3),
                "eccentricity": round(ecc, 6),
                "inclination_deg": round(inc, 3),
                "raan_deg": round(raan, 3),
                "arg_perigee_deg": round(argp, 3),
                "mean_anomaly_deg": round(M0, 3),
            },
        })
        used += 1

    return debris_list


if __name__ == "__main__":
    output_path = Path(__file__).parent / "sample_debris.json"

    try:
        debris = main()
        if len(debris) < 10:
            print("Too few real debris fetched, supplementing with synthetic data")
            debris.extend(generate_synthetic_dataset())
            debris = debris[:50]
    except Exception as e:
        print(f"CelesTrak fetch failed: {e}")
        print("Generating synthetic dataset...")
        debris = generate_synthetic_dataset()

    # ISS-like target satellite
    satellite = {
        "id": "sat_001",
        "name": "ISS-like Target",
        "type": "satellite",
        "orbital_elements": {
            "semi_major_axis_km": 6771.0,
            "eccentricity": 0.0002,
            "inclination_deg": 51.6,
            "raan_deg": 0.0,
            "arg_perigee_deg": 0.0,
            "mean_anomaly_deg": 0.0,
        },
    }

    dataset = {
        "satellite": satellite,
        "debris": debris,
        "source": "CelesTrak Iridium 33 / Cosmos 2251 fragments (synthetic fallback)",
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }

    with open(output_path, "w") as f:
        json.dump(dataset, f, indent=2)

    print(f"\nSaved {len(debris)} debris objects to {output_path}")
