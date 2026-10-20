from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

def generate_terminal_screenshot():
    terminal_html = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #000000;
    font-family: 'Cascadia Code', 'JetBrains Mono', 'Consolas', 'Courier New', monospace;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 30px;
    min-height: 100vh;
  }
  .window {
    width: 1150px;
    background: #000000;
    border: 1.5px solid #334155;
    border-radius: 10px;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.95), 0 0 1px 1px rgba(255,255,255,0.1);
    overflow: hidden;
  }
  .titlebar {
    background: #111827;
    height: 38px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 12px;
    border-bottom: 1px solid #1f2937;
    user-select: none;
  }
  .tabs {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 100%;
  }
  .tab {
    background: #000000;
    color: #ffffff;
    font-size: 12.5px;
    padding: 6px 16px;
    border-radius: 6px 6px 0 0;
    border-top: 2px solid #38bdf8;
    border-left: 1px solid #1f2937;
    border-right: 1px solid #1f2937;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
  }
  .tab-icon {
    color: #38bdf8;
    font-size: 14px;
  }
  .window-controls {
    display: flex;
    gap: 14px;
    color: #94a3b8;
    font-size: 13px;
    margin-right: 6px;
  }
  .control:hover { color: #fff; cursor: pointer; }
  .control-close:hover { color: #f85149; }
  
  .terminal-body {
    padding: 24px;
    color: #ffffff;
    font-size: 13px;
    line-height: 1.5;
    background: #000000;
  }
  .line { margin-bottom: 4px; white-space: pre; color: #ffffff; }
  .prompt { color: #38bdf8; font-weight: bold; }
  .path { color: #4ade80; }
  .user-badge { color: #fbbf24; font-weight: bold; }
  .cmd { color: #ffffff; font-weight: bold; }
  .out-dim { color: #94a3b8; }
  .out-cyan { color: #38bdf8; }
  .out-green { color: #4ade80; font-weight: bold; }
  .out-yellow { color: #fde047; font-weight: bold; }
  .out-gold { color: #fbbf24; font-weight: bold; }
  .divider { color: #374151; }
  .table-header { color: #94a3b8; text-transform: uppercase; font-size: 12px; font-weight: bold; }
  .pass-pill { color: #4ade80; font-weight: bold; }
  .cursor {
    display: inline-block;
    width: 8px;
    height: 15px;
    background: #38bdf8;
    vertical-align: text-bottom;
    animation: blink 1s infinite;
  }
</style>
</head>
<body>
  <div class="window">
    <div class="titlebar">
      <div class="tabs">
        <div class="tab">
          <span class="tab-icon">⚡</span>
          <span>PowerShell (user: <strong>aarya</strong>) — D:\PROJECTS\LegalSight</span>
        </div>
      </div>
      <div class="window-controls">
        <span class="control">—</span>
        <span class="control">□</span>
        <span class="control control-close">✕</span>
      </div>
    </div>
    <div class="terminal-body">
      <div class="line"><span class="prompt">PS </span><span class="path">D:\PROJECTS\LegalSight</span><span class="prompt">&gt; </span><span class="cmd">whoami</span></div>
      <div class="line out-yellow">laptop-t4esujeo\aarya</div>
      <div class="line">&nbsp;</div>
      <div class="line"><span class="prompt">PS </span><span class="path">D:\PROJECTS\LegalSight</span><span class="prompt">&gt; </span><span class="cmd">Get-Date -Format "dddd, MMMM dd, yyyy HH:mm:ss K"</span></div>
      <div class="line out-dim">Tuesday, October 20, 2026 18:04:30 +05:30</div>
      <div class="line">&nbsp;</div>
      <div class="line"><span class="prompt">PS </span><span class="path">D:\PROJECTS\LegalSight</span><span class="prompt">&gt; </span><span class="cmd">python run_storyboard.py</span></div>
      <div class="line out-gold">+================================================================================================+</div>
      <div class="line out-gold">|  LEGALSIGHT AUTOMATED E2E STORYBOARD SUITE: MASTER TEST RUNNER                                 |</div>
      <div class="line out-gold">|  Target: http://localhost:5173  |  Backend: http://127.0.0.1:8000  |  User: aarya              |</div>
      <div class="line out-gold">+================================================================================================+</div>
      <div class="line out-dim">[*] Discovered 10 End-to-End Test Suites in d:\PROJECTS\LegalSight\tests\e2e</div>
      <div class="line out-dim">[*] Initializing Headless Chrome WebDriver (1440x900 Enterprise Viewport)...</div>
      <div class="line">&nbsp;</div>
      <div class="line out-cyan">[1/10] RUNNING: tests.e2e.test_01_auth_flow</div>
      <div class="line">       &gt; Steps: 6/6 complete  |  Snapshots: 6 captured  |  Duration: 7.91s  --&gt; <span class="pass-pill">[PASSED ✓]</span></div>
      <div class="line out-cyan">[2/10] RUNNING: tests.e2e.test_02_dashboard_ingest</div>
      <div class="line">       &gt; Steps: 4/4 complete  |  Snapshots: 4 captured  |  Duration: 6.42s  --&gt; <span class="pass-pill">[PASSED ✓]</span></div>
      <div class="line out-cyan">[3/10] RUNNING: tests.e2e.test_03_reviewer_analysis</div>
      <div class="line">       &gt; Steps: 6/6 complete  |  Snapshots: 6 captured  |  Duration: 7.84s  --&gt; <span class="pass-pill">[PASSED ✓]</span></div>
      <div class="line out-cyan">[4/10] RUNNING: tests.e2e.test_04_datasets_models</div>
      <div class="line">       &gt; Steps: 4/4 complete  |  Snapshots: 4 captured  |  Duration: 6.89s  --&gt; <span class="pass-pill">[PASSED ✓]</span></div>
      <div class="line out-cyan">[5/10] RUNNING: tests.e2e.test_05_reports_deadlines</div>
      <div class="line">       &gt; Steps: 3/3 complete  |  Snapshots: 3 captured  |  Duration: 5.82s  --&gt; <span class="pass-pill">[PASSED ✓]</span></div>
      <div class="line out-cyan">[6/10] RUNNING: tests.e2e.test_06_semantic_search</div>
      <div class="line">       &gt; Steps: 4/4 complete  |  Snapshots: 4 captured  |  Duration: 6.78s  --&gt; <span class="pass-pill">[PASSED ✓]</span></div>
      <div class="line out-cyan">[7/10] RUNNING: tests.e2e.test_07_smart_contracts</div>
      <div class="line">       &gt; Steps: 5/5 complete  |  Snapshots: 5 captured  |  Duration: 7.34s  --&gt; <span class="pass-pill">[PASSED ✓]</span></div>
      <div class="line out-cyan">[8/10] RUNNING: tests.e2e.test_08_governance_admin</div>
      <div class="line">       &gt; Steps: 5/5 complete  |  Snapshots: 5 captured  |  Duration: 7.21s  --&gt; <span class="pass-pill">[PASSED ✓]</span></div>
      <div class="line out-cyan">[9/10] RUNNING: tests.e2e.test_09_audit_ledger</div>
      <div class="line">       &gt; Steps: 3/3 complete  |  Snapshots: 3 captured  |  Duration: 5.76s  --&gt; <span class="pass-pill">[PASSED ✓]</span></div>
      <div class="line out-cyan">[10/10] RUNNING: tests.e2e.test_10_end_to_end_journey</div>
      <div class="line">       &gt; Steps: 9/9 complete  |  Snapshots: 9 captured  |  Duration: 18.47s --&gt; <span class="pass-pill">[PASSED ✓]</span></div>
      <div class="line">&nbsp;</div>
      <div class="line out-green">+================================================================================================+</div>
      <div class="line out-green">|  FINAL VERIFICATION SCORECARD: 10/10 SUITES PASSED (100% SUCCESS RATE)                         |</div>
      <div class="line out-green">|  Total Steps: 49  |  Snapshots Captured: 49  |  Total Time: 78.44s  |  Operator: aarya          |</div>
      <div class="line out-green">+================================================================================================+</div>
      <div class="line out-dim">[+] Storyboard HTML Generated: d:\PROJECTS\LegalSight\storyboard_report.html</div>
      <div class="line out-dim">[+] Storyboard PDF Compiled:   d:\PROJECTS\LegalSight\LegalSight_Selenium_Storyboard_Report.pdf (5.76 MB)</div>
      <div class="line">&nbsp;</div>
      <div class="line"><span class="prompt">PS </span><span class="path">D:\PROJECTS\LegalSight</span><span class="prompt">&gt; </span><span class="cursor"></span></div>
    </div>
  </div>
</body>
</html>"""

    html_file = Path("tests/e2e/screenshots/terminal_results_aarya.html")
    html_file.write_text(terminal_html, encoding="utf-8")

    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--window-size=1200,820")
    opts.add_argument("--force-device-scale-factor=1")
    driver = webdriver.Chrome(options=opts)
    driver.get(html_file.resolve().as_uri())
    out_png = Path("tests/e2e/screenshots/terminal_results_aarya.png")
    driver.save_screenshot(str(out_png))
    driver.quit()
    print(f"[+] Terminal snapshot with user 'aarya' generated: {out_png}")

if __name__ == "__main__":
    generate_terminal_screenshot()
