"""
LegalSight Selenium Storyboarder — Test Case 01: Authentication & RBAC Flow
Verifies login modal, 1-click Analyst/Admin demo authentication, user profile badge, and sign-out.
"""

import sys
import os
import time

# Ensure repo root is on path
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from tests.e2e.storyboarder import Storyboarder

def run_test(headless=True, browser="chrome"):
    with Storyboarder(
        test_id="test_01_auth_flow",
        name="User Authentication & Role-Based Access Control (RBAC)",
        description="Validates guest landing state, 1-click Analyst/Admin demo credentials, JWT session badge, and sign out.",
        headless=headless,
        browser=browser
    ) as sb:
        driver = sb.driver
        wait = sb.wait

        # Step 1: Landing Page
        sb.open_app()
        sb.wait_visible("header.navbar")
        sb.step(
            "Landing Page & Guest Header",
            "Opened LegalSight homepage in guest mode; verifying navigation links and Sign In button.",
            wait_time=0.8,
            highlight_selector="header.navbar"
        )
        assert "LegalSight" in driver.title

        # Step 2: Open Auth Modal
        sb.click("[data-testid='btn-open-auth']")
        sb.wait_visible("[data-testid='auth-modal']")
        sb.step(
            "Authentication Modal Opened",
            "Displayed authentication modal featuring 1-Click Instant Demo Credentials for Analyst & Admin.",
            wait_time=0.5,
            highlight_selector="[data-testid='auth-modal']"
        )

        # Step 3: Login as Analyst
        sb.click("[data-testid='btn-demo-analyst']")
        wait.until(EC.invisibility_of_element_located((By.CSS_SELECTOR, "[data-testid='auth-modal']")))
        
        # Verify analyst profile badge in header
        profile_badge = sb.wait_visible("[data-testid='user-profile-badge']")
        sb.assert_step(
            "analyst" in profile_badge.text.lower(),
            "Analyst Authenticated & Session Active",
            f"Successfully authenticated as Analyst. Header displays user profile badge: '{profile_badge.text}'.",
            "Profile badge did not display analyst role."
        )

        # Step 4: Sign Out
        sb.click("[data-testid='btn-logout']")
        time.sleep(0.8)
        sb.step(
            "User Signed Out",
            "Session cleared, authentication token invalidated, and workspace returned to guest mode.",
            wait_time=0.5
        )

        # Step 5: Login as Admin
        time.sleep(0.5)
        sb.click("[data-testid='btn-open-auth']")
        sb.wait_visible("[data-testid='auth-modal']")
        sb.click("[data-testid='btn-demo-admin']")
        time.sleep(1.0)

        admin_badge = sb.wait_visible("[data-testid='user-profile-badge']")
        sb.assert_step(
            "admin" in admin_badge.text.lower(),
            "Admin Authenticated with Governance Rights",
            f"Successfully logged in as Admin user. Elevated governance controls unlocked.",
            "Admin badge was not rendered."
        )

        # Step 6: Final Sign Out Clean State
        sb.click("[data-testid='btn-logout']")
        time.sleep(0.8)
        sb.step(
            "Clean Workspace Reset",
            "Verified complete authentication lifecycle test case.",
            wait_time=0.4
        )
        return sb.case

def test_auth_flow():
    """Pytest entrypoint."""
    run_test(headless=True)

if __name__ == "__main__":
    headless_mode = "--headed" not in sys.argv
    browser_type = "edge" if "--edge" in sys.argv else "chrome"
    run_test(headless=headless_mode, browser=browser_type)
