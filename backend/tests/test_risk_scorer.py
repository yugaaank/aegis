"""Tests for risk scoring."""

import pytest

from backend.risk_engine.risk_scorer import risk_score, classify_risk


class TestRiskScore:
    def test零距离_最高分(self):
        """d_min=0 should produce the highest score."""
        score = risk_score(0.0, 15.0, 0.0)
        assert score > 90

    def test零距离_低速(self):
        """d_min=0 but low velocity still scores moderate."""
        score = risk_score(0.0, 1.0, 0.0)
        assert score > 30

    def test远距离_零分(self):
        """d_min >= 500 should produce score 0."""
        score = risk_score(500.0, 15.0, 0.0)
        assert score == 0.0

    def test超远距离_零分(self):
        """d_min > 500 should still be 0."""
        score = risk_score(5000.0, 15.0, 0.0)
        assert score == 0.0

    def test即时临近_最高时间因子(self):
        """t=0 should give highest time factor (imminent)."""
        score_t0 = risk_score(10.0, 10.0, 0.0)
        score_t1h = risk_score(10.0, 10.0, 3600.0)
        assert score_t0 > score_t1h

    def test高速度_更高分(self):
        """Higher relative velocity should increase score."""
        score_low = risk_score(100.0, 1.0, 1800.0)
        score_high = risk_score(100.0, 15.0, 1800.0)
        assert score_high > score_low

    def test_score_上限_100(self):
        """Score should never exceed 100."""
        score = risk_score(0.0, 15.0, 0.0)
        assert score <= 100.0

    def test_score_非负(self):
        """Score should never be negative."""
        score = risk_score(10000.0, 0.0, 100000.0)
        assert score >= 0.0


class TestClassifyRisk:
    def test_critical(self):
        assert classify_risk(85.0) == "CRITICAL"
        assert classify_risk(100.0) == "CRITICAL"

    def test_high(self):
        assert classify_risk(60.0) == "HIGH"
        assert classify_risk(84.9) == "HIGH"

    def test_moderate(self):
        assert classify_risk(30.0) == "MODERATE"
        assert classify_risk(59.9) == "MODERATE"

    def test_low(self):
        assert classify_risk(0.0) == "LOW"
        assert classify_risk(29.9) == "LOW"

    def test_boundary_critical(self):
        assert classify_risk(85.0) == "CRITICAL"
        assert classify_risk(84.99) == "HIGH"
