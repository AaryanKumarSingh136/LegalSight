"""
LegalSight — Storyboarder & Selenium Automation Framework
Captures visual test steps with high-resolution screenshots, generates an interactive
HTML Storyboard Report with lightbox zoom, and prints formatted terminal status.
"""

import os
import sys
import re
import time
import base64
import shutil
from datetime import datetime
from pathlib import Path

# Fix Windows console encoding for Unicode characters
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
if hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

try:
    import colorama
    from colorama import Fore, Style, Back
    colorama.init(autoreset=True)
except ImportError:
    class Fore:
        CYAN = GREEN = YELLOW = RED = MAGENTA = WHITE = BLUE = RESET = ""
    class Style:
        BRIGHT = DIM = NORMAL = RESET_ALL = ""
    class Back:
        BLACK = GREEN = RED = ""

from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.edge.options import Options as EdgeOptions
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Root directories
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
E2E_DIR = Path(__file__).resolve().parent
SCREENSHOTS_DIR = E2E_DIR / "screenshots"
STORYBOARD_DIR = E2E_DIR / "storyboard"

DEFAULT_BASE_URL = os.environ.get("LEGALSIGHT_URL", "http://localhost:5173")


class StoryboardStep:
    def __init__(self, index, title, description, screenshot_path, status="PASS", duration=0.0, meta=None):
        self.index = index
        self.title = title
        self.description = description
        self.screenshot_path = screenshot_path
        self.status = status
        self.duration = duration
        self.timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
        self.meta = meta or {}

    def get_base64_image(self):
        if self.screenshot_path and os.path.exists(self.screenshot_path):
            with open(self.screenshot_path, "rb") as img_file:
                return base64.b64encode(img_file.read()).decode("utf-8")
        return ""


class StoryboardTestCase:
    def __init__(self, test_id, name, description):
        self.test_id = test_id
        self.name = name
        self.description = description
        self.steps = []
        self.status = "PENDING"
        self.start_time = None
        self.end_time = None
        self.error_message = None

    @property
    def duration(self):
        if self.start_time and self.end_time:
            return round((self.end_time - self.start_time).total_seconds(), 2)
        return 0.0


class Storyboarder:
    """Core visual storyboard automation and reporting engine."""
    
    _instance = None
    all_test_cases = []

    def __init__(self, test_id, name, description="", headless=True, browser="chrome"):
        self.test_id = test_id
        self.name = name
        self.description = description or name
        self.headless = headless
        self.browser_name = browser.lower()
        self.driver = None
        self.wait = None
        self.base_url = DEFAULT_BASE_URL
        self.case = StoryboardTestCase(test_id, name, description)
        
        # Ensure screenshot directory for this test case
        self.case_screenshot_dir = SCREENSHOTS_DIR / test_id
        os.makedirs(self.case_screenshot_dir, exist_ok=True)
        os.makedirs(STORYBOARD_DIR, exist_ok=True)
        
        # Register in global suite
        Storyboarder.all_test_cases.append(self.case)

    def start_browser(self):
        """Initializes WebDriver with optimized options."""
        print(f"\n{Fore.CYAN}{Style.BRIGHT}+==============================================================================+")
        print(f"{Fore.CYAN}{Style.BRIGHT}|  LEGALSIGHT STORYBOARDER: {self.test_id.upper()}")
        print(f"{Fore.CYAN}{Style.BRIGHT}|  {self.name[:70]}")
        print(f"{Fore.CYAN}{Style.BRIGHT}+==============================================================================+{Style.RESET_ALL}")
        print(f"{Fore.BLUE}  [*] Initializing {self.browser_name.upper()} browser (headless={self.headless}, viewport=1440x900)...")

        self.case.start_time = datetime.now()

        try:
            if self.browser_name == "edge":
                options = EdgeOptions()
                if self.headless:
                    options.add_argument("--headless=new")
                options.add_argument("--window-size=1440,900")
                options.add_argument("--disable-gpu")
                options.add_argument("--no-sandbox")
                self.driver = webdriver.Edge(options=options)
            else:
                options = ChromeOptions()
                if self.headless:
                    options.add_argument("--headless=new")
                options.add_argument("--window-size=1440,900")
                options.add_argument("--disable-gpu")
                options.add_argument("--no-sandbox")
                options.add_argument("--disable-dev-shm-usage")
                options.add_argument("--disable-blink-features=AutomationControlled")
                self.driver = webdriver.Chrome(options=options)

            self.driver.set_window_size(1440, 900)
            self.wait = WebDriverWait(self.driver, 10)
            print(f"{Fore.GREEN}  [+] Browser ready. Target URL: {self.base_url}")
            return self.driver
        except Exception as e:
            print(f"{Fore.RED}  [!] Failed to launch {self.browser_name}: {e}")
            raise

    def open_app(self, path=""):
        """Navigates to URL and waits for page load."""
        target = f"{self.base_url}/{path}".rstrip("/")
        self.driver.get(target)
        # Give initial render a brief tick
        time.sleep(0.8)

    def find(self, selector, timeout=10):
        """Finds element by CSS selector with explicit wait."""
        return WebDriverWait(self.driver, timeout).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, selector))
        )

    def wait_visible(self, selector, timeout=10):
        """Waits for element to be visible."""
        return WebDriverWait(self.driver, timeout).until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, selector))
        )

    def wait_clickable(self, selector, timeout=10):
        """Waits for element to be clickable."""
        return WebDriverWait(self.driver, timeout).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
        )

    def js_click(self, selector_or_element):
        """Clicks an element using JavaScript to bypass any transient overlay/toast."""
        if isinstance(selector_or_element, str):
            el = self.find(selector_or_element)
        else:
            el = selector_or_element
        self.driver.execute_script("arguments[0].click();", el)

    def click(self, selector_or_element, timeout=10):
        """Clicks element with native click first, falling back to JS click."""
        if isinstance(selector_or_element, str):
            el = self.wait_visible(selector_or_element, timeout=timeout)
        else:
            el = selector_or_element
        
        self.dismiss_toasts()
        try:
            el.click()
        except Exception:
            self.js_click(el)

    def type_text(self, selector, text, clear_first=True):
        """Types text into an input field."""
        el = self.wait_visible(selector)
        if clear_first:
            el.clear()
        el.send_keys(text)

    def dismiss_toasts(self):
        """Safely dismisses active toasts without breaking React DOM fiber."""
        try:
            self.driver.execute_script("""
                document.querySelectorAll('.toast-close-btn').forEach(btn => {
                    try { btn.click(); } catch (e) {}
                });
            """)
        except Exception:
            pass

    def step(self, title, description, wait_time=0.5, highlight_selector=None):
        """
        Records a visual storyboard step, captures screenshot, and logs to terminal.
        """
        step_idx = len(self.case.steps) + 1
        step_start = time.time()
        
        if wait_time > 0:
            time.sleep(wait_time)

        # Highlight element if selector provided
        if highlight_selector and self.driver:
            try:
                el = self.driver.find_element(By.CSS_SELECTOR, highlight_selector)
                self.driver.execute_script(
                    "arguments[0].style.outline = '3px solid #d97706';"
                    "arguments[0].style.boxShadow = '0 0 15px rgba(217,119,6,0.6)';",
                    el
                )
            except Exception:
                pass

        # Capture Screenshot
        clean_title = re.sub(r'[^a-zA-Z0-9_]', '_', title.lower()).strip('_')[:35]
        filename = f"{step_idx:02d}_{clean_title}.png"
        filepath = self.case_screenshot_dir / filename
        
        try:
            self.driver.save_screenshot(str(filepath))
        except Exception as e:
            print(f"{Fore.YELLOW}  [!] Warning: Screenshot capture failed: {e}")
            filepath = ""

        # Remove highlight
        if highlight_selector and self.driver:
            try:
                el = self.driver.find_element(By.CSS_SELECTOR, highlight_selector)
                self.driver.execute_script(
                    "arguments[0].style.outline = '';"
                    "arguments[0].style.boxShadow = '';",
                    el
                )
            except Exception:
                pass

        duration = round(time.time() - step_start, 2)
        sb_step = StoryboardStep(
            index=step_idx,
            title=title,
            description=description,
            screenshot_path=str(filepath),
            status="PASS",
            duration=duration
        )
        self.case.steps.append(sb_step)

        # Terminal output
        rel_path = filepath.relative_to(REPO_ROOT) if filepath else "none"
        print(f"{Fore.MAGENTA}  [STEP {step_idx:02d}]{Style.RESET_ALL} {Fore.WHITE}{Style.BRIGHT}{title}{Style.RESET_ALL}")
        print(f"            {Fore.YELLOW}>{Style.RESET_ALL} {description}")
        print(f"            {Fore.BLUE}* Snapshot:{Style.RESET_ALL} {rel_path} ({duration}s)")
        
        return sb_step

    def assert_step(self, condition, title, success_desc, fail_desc="Assertion check failed"):
        """Performs assertion and logs visual step."""
        if not condition:
            print(f"{Fore.RED}{Style.BRIGHT}  [FAIL] ASSERTION FAILED: {fail_desc}")
            self.step(f"FAILED: {title}", fail_desc, wait_time=0.2)
            self.case.status = "FAILED"
            self.case.error_message = fail_desc
            raise AssertionError(fail_desc)
        
        return self.step(title, success_desc, wait_time=0.3)

    def finish(self, status="PASS"):
        """Completes test case execution and cleans up driver."""
        self.case.end_time = datetime.now()
        self.case.status = status
        
        color = Fore.GREEN if status == "PASS" else Fore.RED
        symbol = "[PASSED]" if status == "PASS" else "[FAILED]"
        
        print(f"\n{color}{Style.BRIGHT}  {symbol} -- {self.test_id}: {self.name}")
        print(f"{Fore.WHITE}  Total Steps: {len(self.case.steps)}  |  Duration: {self.case.duration}s  |  Snapshots: {len(self.case.steps)}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}  ----------------------------------------------------------------------------\n")

        if self.driver:
            try:
                self.driver.quit()
            except Exception:
                pass

    def __enter__(self):
        self.start_browser()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            if self.driver:
                try:
                    err_path = self.case_screenshot_dir / "99_failure_state.png"
                    self.driver.save_screenshot(str(err_path))
                    print(f"{Fore.RED}  [!] Error screenshot captured: {err_path.relative_to(REPO_ROOT)}")
                except Exception:
                    pass
            self.finish(status="FAILED")
            return False
        self.finish(status="PASS")
        return True

    # --------------------------------------------------------------------------
    # Interactive HTML Storyboard Generator
    # --------------------------------------------------------------------------
    @classmethod
    def generate_storyboard_reports(cls, output_html=None, output_md=None):
        """Generates comprehensive HTML & Markdown Storyboards with Lightbox."""
        if not output_html:
            output_html = STORYBOARD_DIR / "storyboard_report.html"
        if not output_md:
            output_md = STORYBOARD_DIR / "STORYBOARD.md"

        all_cases = cls.all_test_cases
        total_cases = len(all_cases)
        passed_cases = sum(1 for c in all_cases if c.status == "PASS")
        failed_cases = sum(1 for c in all_cases if c.status == "FAILED")
        total_steps = sum(len(c.steps) for c in all_cases)
        total_duration = round(sum(c.duration for c in all_cases), 2)
        pass_rate = round((passed_cases / total_cases * 100), 1) if total_cases > 0 else 0

        # Build HTML content
        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LegalSight — Visual Storyboard & E2E Test Report</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {{
      --bg: #0b0f19;
      --card-bg: #121826;
      --card-border: #1e293b;
      --accent: #d97706;
      --accent-light: #fbbf24;
      --accent-glow: rgba(217, 119, 6, 0.25);
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --pass: #10b981;
      --fail: #ef4444;
      --info: #38bdf8;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      background: var(--bg);
      color: var(--text);
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      line-height: 1.5;
      padding-bottom: 5rem;
    }}
    header {{
      background: linear-gradient(180deg, #161f33 0%, var(--bg) 100%);
      border-bottom: 1px solid var(--card-border);
      padding: 2.5rem 3rem 2rem;
    }}
    .brand-row {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }}
    .brand-title {{
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }}
    .brand-logo {{
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, var(--accent) 0%, #b45309 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      box-shadow: 0 0 20px var(--accent-glow);
    }}
    h1 {{
      font-size: 1.6rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }}
    .badge {{
      display: inline-block;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }}
    .badge-pass {{ background: rgba(16, 185, 129, 0.2); color: var(--pass); border: 1px solid var(--pass); }}
    .badge-fail {{ background: rgba(239, 68, 68, 0.2); color: var(--fail); border: 1px solid var(--fail); }}
    .badge-gold {{ background: var(--accent-glow); color: var(--accent-light); border: 1px solid var(--accent); }}
    
    /* Metrics Grid */
    .metrics-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1.25rem;
    }}
    .metric-card {{
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 1.25rem;
    }}
    .metric-val {{
      font-size: 2rem;
      font-weight: 800;
      line-height: 1.1;
      margin: 0.25rem 0;
    }}
    .metric-label {{
      font-size: 0.8rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }}

    /* Container */
    .container {{
      max-width: 1440px;
      margin: 2.5rem auto 0;
      padding: 0 2rem;
    }}

    /* Test Case Section */
    .test-case-card {{
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 18px;
      margin-bottom: 2.5rem;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }}
    .test-case-header {{
      padding: 1.25rem 2rem;
      background: rgba(255,255,255,0.02);
      border-bottom: 1px solid var(--card-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }}
    .test-case-title {{
      font-size: 1.25rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }}
    .test-case-id {{
      font-family: 'JetBrains Mono', monospace;
      color: var(--accent-light);
      font-size: 0.9rem;
      background: rgba(217,119,6,0.15);
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
    }}
    .test-case-meta {{
      font-size: 0.85rem;
      color: var(--text-muted);
    }}

    /* Storyboard Step Cards */
    .steps-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 1.5rem;
      padding: 2rem;
    }}
    .step-card {{
      background: #0d121f;
      border: 1px solid var(--card-border);
      border-radius: 14px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }}
    .step-card:hover {{
      transform: translateY(-4px);
      border-color: var(--accent);
    }}
    .step-thumb-wrap {{
      position: relative;
      width: 100%;
      height: 220px;
      background: #000;
      cursor: zoom-in;
      overflow: hidden;
    }}
    .step-thumb {{
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top;
      transition: transform 0.3s ease;
    }}
    .step-card:hover .step-thumb {{
      transform: scale(1.03);
    }}
    .step-zoom-overlay {{
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s ease;
      color: #fff;
      font-weight: 600;
      font-size: 0.9rem;
      gap: 0.4rem;
    }}
    .step-thumb-wrap:hover .step-zoom-overlay {{
      opacity: 1;
    }}
    .step-body {{
      padding: 1.25rem;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }}
    .step-header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }}
    .step-num {{
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      color: var(--accent-light);
      font-weight: 700;
    }}
    .step-time {{
      font-size: 0.75rem;
      color: var(--text-muted);
    }}
    .step-title {{
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 0.35rem;
    }}
    .step-desc {{
      font-size: 0.8rem;
      color: var(--text-muted);
      line-height: 1.45;
    }}

    /* Lightbox Modal */
    #lightbox {{
      position: fixed;
      inset: 0;
      background: rgba(5, 8, 15, 0.95);
      backdrop-filter: blur(8px);
      z-index: 9999;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }}
    #lightbox.active {{
      display: flex;
    }}
    #lightbox-img {{
      max-width: 90vw;
      max-height: 82vh;
      border-radius: 12px;
      border: 1px solid var(--card-border);
      box-shadow: 0 20px 50px rgba(0,0,0,0.8);
    }}
    .lightbox-close {{
      position: absolute;
      top: 1.5rem;
      right: 2rem;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      color: #fff;
      font-size: 1.25rem;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      cursor: pointer;
    }}
    .lightbox-caption {{
      position: absolute;
      bottom: 1.5rem;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      padding: 0.65rem 1.5rem;
      border-radius: 9999px;
      font-size: 0.9rem;
      color: var(--text);
    }}
  </style>
</head>
<body>

  <header>
    <div class="brand-row">
      <div class="brand-title">
        <div class="brand-logo">⚖</div>
        <div>
          <h1>LegalSight — Visual Storyboard Suite</h1>
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
            Automated Selenium E2E Test Gallery & Audit Report
          </div>
        </div>
      </div>
      <div>
        <span class="badge badge-gold">Automated Storyboarder</span>
        <span class="badge badge-pass" style="margin-left: 0.5rem;">{passed_cases}/{total_cases} Passed ({pass_rate}%)</span>
      </div>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Total Test Cases</div>
        <div class="metric-val">{total_cases}</div>
        <div style="font-size: 0.75rem; color: var(--pass);">100% Modular Test Files</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Visual Snapshots</div>
        <div class="metric-val" style="color: var(--accent-light);">{total_steps}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">High-Res 1440x900 PNGs</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Execution Duration</div>
        <div class="metric-val" style="color: var(--info);">{total_duration}s</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">Real Browser Rendering</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Success Rate</div>
        <div class="metric-val" style="color: var(--pass);">{pass_rate}%</div>
        <div style="font-size: 0.75rem; color: var(--pass);">{passed_cases} Passed, {failed_cases} Failed</div>
      </div>
    </div>
  </header>

  <main class="container">
"""

        for case in all_cases:
            badge_class = "badge-pass" if case.status == "PASS" else "badge-fail"
            html += f"""
    <section class="test-case-card" id="{case.test_id}">
      <div class="test-case-header">
        <div>
          <div class="test-case-title">
            <span class="test-case-id">{case.test_id}</span>
            <span>{case.name}</span>
            <span class="badge {badge_class}">{case.status}</span>
          </div>
          <div class="test-case-meta" style="margin-top: 0.35rem;">
            {case.description}
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: var(--text-muted);">
            {len(case.steps)} steps | {case.duration}s
          </div>
        </div>
      </div>

      <div class="steps-grid">
"""
            for step in case.steps:
                # Relative link to screenshot
                rel_img = os.path.relpath(step.screenshot_path, os.path.dirname(output_html)).replace("\\", "/")
                html += f"""
        <div class="step-card">
          <div class="step-thumb-wrap" onclick="openLightbox('{rel_img}', 'Step {step.index}: {step.title}')">
            <img class="step-thumb" src="{rel_img}" alt="{step.title}" loading="lazy" />
            <div class="step-zoom-overlay">🔍 Click to Expand</div>
          </div>
          <div class="step-body">
            <div>
              <div class="step-header">
                <span class="step-num">STEP {step.index:02d}</span>
                <span class="step-time">{step.timestamp} ({step.duration}s)</span>
              </div>
              <div class="step-title">{step.title}</div>
              <div class="step-desc">{step.description}</div>
            </div>
          </div>
        </div>
"""

            html += """
      </div>
    </section>
"""

        html += """
  </main>

  <div id="lightbox" onclick="closeLightbox()">
    <button class="lightbox-close" onclick="closeLightbox()">✕ Close (Esc)</button>
    <img id="lightbox-img" src="" alt="Zoomed view" onclick="event.stopPropagation()" />
    <div id="lightbox-caption" class="lightbox-caption"></div>
  </div>

  <script>
    function openLightbox(src, caption) {
      document.getElementById('lightbox-img').src = src;
      document.getElementById('lightbox-caption').innerText = caption;
      document.getElementById('lightbox').classList.add('active');
    }
    function closeLightbox() {
      document.getElementById('lightbox').classList.remove('active');
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });
  </script>
</body>
</html>
"""

        with open(output_html, "w", encoding="utf-8") as f:
            f.write(html)

        # Also copy to root for instant access if desired
        root_report = REPO_ROOT / "storyboard_report.html"
        try:
            shutil.copy(output_html, root_report)
        except Exception:
            pass

        # Build Markdown report
        md = f"""# LegalSight — Automated Visual Storyboard Report

**Generated:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}  
**Test Suite:** LegalSight E2E Storyboarder  
**Total Test Cases:** {total_cases} | **Passed:** {passed_cases} | **Pass Rate:** {pass_rate}%  
**Total Screenshots Captured:** {total_steps}  
**Interactive HTML Report:** [storyboard_report.html](storyboard_report.html)

---

## Test Execution Summary

| # | Test Case ID | Test Case Name | Steps | Duration | Status |
|---|---|---|---|---|---|
"""
        for i, c in enumerate(all_cases, 1):
            status_icon = "✅ PASS" if c.status == "PASS" else "❌ FAIL"
            md += f"| {i} | `{c.test_id}` | {c.name} | {len(c.steps)} | {c.duration}s | {status_icon} |\n"

        md += "\n---\n\n## Detailed Storyboard Galleries\n\n"

        for c in all_cases:
            md += f"### {c.test_id}: {c.name}\n"
            md += f"> {c.description}  \n"
            md += f"**Status:** {c.status} | **Duration:** {c.duration}s | **Steps:** {len(c.steps)}\n\n"
            
            for s in c.steps:
                rel = os.path.relpath(s.screenshot_path, E2E_DIR).replace("\\", "/")
                md += f"#### Step {s.index:02d}: {s.title}\n"
                md += f"*{s.description}*  \n"
                md += f"- **Timestamp:** `{s.timestamp}` ({s.duration}s)\n"
                md += f"- **Screenshot:** [`{rel}`]({rel})\n\n"
                md += f"![{s.title}]({rel})\n\n"

        with open(output_md, "w", encoding="utf-8") as f:
            f.write(md)

        root_md = REPO_ROOT / "STORYBOARD.md"
        try:
            shutil.copy(output_md, root_md)
        except Exception:
            pass

        print(f"\n{Fore.GREEN}{Style.BRIGHT}================================================================================")
        print(f"{Fore.GREEN}{Style.BRIGHT}  [+] STORYBOARD REPORTS GENERATED SUCCESSFULLY!")
        print(f"{Fore.WHITE}  * HTML Storyboard : {output_html}")
        print(f"{Fore.WHITE}  * Root Report     : {root_report}")
        print(f"{Fore.GREEN}{Style.BRIGHT}================================================================================\n")
        return output_html, output_md

generate_storyboard_reports = Storyboarder.generate_storyboard_reports
