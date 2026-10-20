"""
LegalSight Master Storyboard Runner
Executes E2E Selenium tests, generates visual storyboard reports, and produces
high-contrast terminal output formatted for terminal screenshots.
"""
import sys
import os
import time
import argparse
from pathlib import Path
from datetime import datetime

# Configure UTF-8 on Windows terminal to avoid Unicode errors
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Ensure tests/e2e is on python path
REPO_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(REPO_ROOT / "tests" / "e2e"))

from storyboarder import Storyboarder, generate_storyboard_reports, Fore, Style

TEST_REGISTRY = [
    ("test_01_auth_flow", "tests/e2e/test_01_auth_flow.py", "User Authentication & RBAC Access Control"),
    ("test_02_dashboard_ingest", "tests/e2e/test_02_dashboard_ingest.py", "Contract Ingestion Hub & Playbook Calibration"),
    ("test_03_reviewer_analysis", "tests/e2e/test_03_reviewer_analysis.py", "Contract Reviewer, Redlines & Certified Sign-Off"),
    ("test_04_datasets_models", "tests/e2e/test_04_datasets_models.py", "Legal Datasets, Benchmark Models & Neural Evaluator"),
    ("test_05_reports_deadlines", "tests/e2e/test_05_reports_deadlines.py", "Portfolio Liability Matrix & Renewal Deadlines Hub"),
    ("test_06_semantic_search", "tests/e2e/test_06_semantic_search.py", "Semantic Legal Search & Precedent Discovery"),
    ("test_07_smart_contracts", "tests/e2e/test_07_smart_contracts.py", "Smart Contract Studio & EVM Solidity Synthesis"),
    ("test_08_governance_admin", "tests/e2e/test_08_governance_admin.py", "Enterprise Governance, RBAC & Model Diagnostics"),
    ("test_09_audit_ledger", "tests/e2e/test_09_audit_ledger.py", "Immutable Compliance Audit Ledger & Security Log"),
    ("test_10_end_to_end_journey", "tests/e2e/test_10_end_to_end_journey.py", "Complete Enterprise Legal Counsel End-to-End Lifecycle"),
]

def print_banner():
    banner = f"""
{Fore.YELLOW}{Style.BRIGHT}================================================================================
|                                                                              |
|                    LEGALSIGHT AUTOMATED STORYBOARD RUNNER                    |
|             End-to-End Visual Verification & Screenshot Generator            |
|                                                                              |
================================================================================{Style.RESET_ALL}
{Fore.WHITE}  Target Frontend:  {Fore.CYAN}http://localhost:5173
{Fore.WHITE}  Target Backend:   {Fore.CYAN}http://127.0.0.1:8000
{Fore.WHITE}  Test Suites:      {Fore.GREEN}{len(TEST_REGISTRY)} Automated E2E Scenarios
{Fore.WHITE}  Execution Time:   {Fore.YELLOW}{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
{Fore.YELLOW}--------------------------------------------------------------------------------{Style.RESET_ALL}
"""
    print(banner)

def run_suite(tests_to_run, headless=True, browser="chrome"):
    print_banner()

    start_all = time.time()
    results = []
    Storyboarder.all_test_cases.clear()

    for test_id, script_rel, name in tests_to_run:
        print(f"\n{Fore.CYAN}{Style.BRIGHT}>>> RUNNING SUITE: {test_id} ({name}){Style.RESET_ALL}")
        module_name = test_id
        try:
            mod = __import__(module_name)
            run_func = getattr(mod, "run_test")
            case = run_func(headless=headless, browser=browser)
            if not case and Storyboarder.all_test_cases:
                case = Storyboarder.all_test_cases[-1]
            results.append({
                "id": test_id,
                "name": name,
                "status": "PASS",
                "steps": len(case.steps) if case else 0,
                "duration": case.duration if case else 0,
                "error": None
            })
        except Exception as e:
            print(f"{Fore.RED}{Style.BRIGHT}  [!] Test Failed with error: {e}{Style.RESET_ALL}")
            results.append({
                "id": test_id,
                "name": name,
                "status": "FAIL",
                "steps": 0,
                "duration": 0,
                "error": str(e)
            })

    total_time = round(time.time() - start_all, 2)

    # Generate Reports
    html_report, md_report = generate_storyboard_reports()

    # Automatically render full terminal screenshot with user aarya
    try:
        from tests.e2e.render_all_terminal_screenshots import render_full_terminal_screenshot
        render_full_terminal_screenshot()
    except Exception as term_err:
        print(f"{Fore.YELLOW}  [!] Terminal screenshot notice: {term_err}{Style.RESET_ALL}")

    # Automatically generate Master Storyboard PDF Report
    pdf_report = None
    try:
        from generate_pdf_report import generate_pdf, OUTPUT_PDF
        generate_pdf()
        pdf_report = OUTPUT_PDF
    except Exception as pdf_err:
        print(f"{Fore.YELLOW}  [!] Storyboard PDF compilation notice: {pdf_err}{Style.RESET_ALL}")

    # Automatically generate Executive E2E Report PDF
    exec_pdf_report = None
    try:
        from generate_executive_pdf import generate_executive_pdf, OUTPUT_PDF as EXEC_PDF
        generate_executive_pdf()
        exec_pdf_report = EXEC_PDF
    except Exception as exec_err:
        print(f"{Fore.YELLOW}  [!] Executive PDF compilation notice: {exec_err}{Style.RESET_ALL}")

    # Print Summary Table
    print(f"\n{Fore.YELLOW}{Style.BRIGHT}================================================================================")
    print(f"|                            STORYBOARD RUN SUMMARY                            |")
    print(f"================================================================================{Style.RESET_ALL}")
    print(f"{'STATUS':<8} | {'TEST ID':<26} | {'STEPS':<6} | {'TIME':<7} | {'NAME'}")
    print(f"---------+----------------------------+--------+---------+----------------------")

    passed_count = 0
    for r in results:
        if r["status"] == "PASS":
            passed_count += 1
            status_str = f"{Fore.GREEN}[PASS]{Style.RESET_ALL}"
        else:
            status_str = f"{Fore.RED}[FAIL]{Style.RESET_ALL}"
        print(f"{status_str:<17} | {r['id']:<26} | {r['steps']:<6} | {r['duration']:>5.2f}s | {r['name']}")

    print(f"{Fore.YELLOW}--------------------------------------------------------------------------------{Style.RESET_ALL}")
    print(f"{Fore.WHITE}{Style.BRIGHT}  Final Verdict:  {Fore.GREEN if passed_count == len(results) else Fore.RED}{passed_count}/{len(results)} Suites Passed ({total_time}s)")
    print(f"{Fore.WHITE}  Executive PDF:  {Fore.CYAN}{exec_pdf_report or (REPO_ROOT / 'LegalSight_Executive_E2E_Report.pdf')}")
    print(f"{Fore.WHITE}  Storyboard PDF: {Fore.CYAN}{pdf_report or (REPO_ROOT / 'LegalSight_Selenium_Storyboard_Report.pdf')}")
    print(f"{Fore.WHITE}  HTML Report:    {Fore.CYAN}{html_report}")
    print(f"{Fore.WHITE}  Markdown Log:   {Fore.CYAN}{md_report}")
    print(f"{Fore.WHITE}  Terminal SS:    {Fore.CYAN}{REPO_ROOT / 'tests' / 'e2e' / 'screenshots' / 'terminal_results_all_testcases.png'}")
    print(f"{Fore.WHITE}  Screenshots:    {Fore.CYAN}{REPO_ROOT / 'tests' / 'e2e' / 'screenshots'}")
    print(f"{Fore.YELLOW}================================================================================{Style.RESET_ALL}\n")

    return passed_count == len(results)

def main():
    parser = argparse.ArgumentParser(description="LegalSight Selenium Storyboard Runner")
    parser.add_argument("--test", type=str, default="all", help="Specific test to run (e.g., 1, 'test_01', 'auth')")
    parser.add_argument("--headed", action="store_true", help="Run browser in visible mode (default is headless)")
    parser.add_argument("--edge", action="store_true", help="Use Edge browser instead of Chrome")
    
    args = parser.parse_args()
    browser = "edge" if args.edge else "chrome"
    headless = not args.headed

    if args.test == "all":
        selected_tests = TEST_REGISTRY
    else:
        # Match test by index (1-based) or substring
        selected_tests = []
        for idx, (tid, path, name) in enumerate(TEST_REGISTRY, 1):
            if str(idx) == args.test or args.test.lower() in tid.lower():
                selected_tests.append((tid, path, name))
        
        if not selected_tests:
            print(f"{Fore.RED}No tests found matching '{args.test}'. Available tests:{Style.RESET_ALL}")
            for idx, (tid, _, name) in enumerate(TEST_REGISTRY, 1):
                print(f"  {idx}: {tid} ({name})")
            sys.exit(1)

    success = run_suite(selected_tests, headless=headless, browser=browser)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
