"""
Pytest configuration and shared fixtures for LegalSight Selenium Storyboarder.
"""

import pytest
import os
import sys

# Ensure repo root and tests dir are on path
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from tests.e2e.storyboarder import Storyboarder

@pytest.fixture(scope="session", autouse=True)
def storyboard_session():
    """Runs once for the entire test session and generates HTML report at the end."""
    yield
    # Post-session generation
    Storyboarder.generate_storyboard_reports()
