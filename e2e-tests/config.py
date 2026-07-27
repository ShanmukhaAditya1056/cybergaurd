"""Central configuration for the CyberGuard AI live E2E suite.

Every value is overridable via environment variables so the SAME code runs
against the live GitHub Pages URL in CI and against a locally-served build
during development. Nothing here is hardcoded to localhost.
"""
import os
from pathlib import Path

# --------------------------------------------------------------------------- #
# Target under test
# --------------------------------------------------------------------------- #
# The deployed GitHub Pages URL. Overridden by the BASE_URL env var in CI.
DEFAULT_BASE_URL = "https://shanmukhaaditya1056.github.io/cybergaurd/"

BASE_URL = os.environ.get("BASE_URL", DEFAULT_BASE_URL).strip()
if not BASE_URL.endswith("/"):
    BASE_URL += "/"

# The deployed build uses HashRouter (see client/src/App.jsx) so client-side
# routes look like  <base>/#/phishing  and never 404 on GitHub Pages.
USE_HASH_ROUTER = os.environ.get("USE_HASH_ROUTER", "true").lower() == "true"

# --------------------------------------------------------------------------- #
# Browser / driver
# --------------------------------------------------------------------------- #
HEADLESS = os.environ.get("HEADLESS", "true").lower() == "true"
BROWSER = os.environ.get("BROWSER", "chrome").lower()
PAGE_LOAD_TIMEOUT = int(os.environ.get("PAGE_LOAD_TIMEOUT", "40"))
DEFAULT_WAIT = int(os.environ.get("DEFAULT_WAIT", "15"))
WINDOW_SIZE = os.environ.get("WINDOW_SIZE", "1440,900")

# --------------------------------------------------------------------------- #
# Deployment readiness
# --------------------------------------------------------------------------- #
DEPLOY_WAIT_TIMEOUT = int(os.environ.get("DEPLOY_WAIT_TIMEOUT", "300"))  # seconds
DEPLOY_POLL_INTERVAL = int(os.environ.get("DEPLOY_POLL_INTERVAL", "10"))

# --------------------------------------------------------------------------- #
# Paths
# --------------------------------------------------------------------------- #
ROOT = Path(__file__).resolve().parent
DATA_FILE = ROOT / "data" / "test_cases.json"

RESULTS_DIR = ROOT / "Test Results"
EXCEL_DIR = RESULTS_DIR / "Excel"
HTML_DIR = RESULTS_DIR / "HTML"
SCREENSHOTS_DIR = RESULTS_DIR / "Screenshots"
LOGS_DIR = RESULTS_DIR / "Logs"
SUMMARY_DIR = RESULTS_DIR / "Summary"

RESULTS_JSON = LOGS_DIR / "results.json"

for _d in (EXCEL_DIR, HTML_DIR, SCREENSHOTS_DIR, LOGS_DIR, SUMMARY_DIR):
    _d.mkdir(parents=True, exist_ok=True)


def url_for(route: str = "/", nonce: str | int = "") -> str:
    """Build a full URL for a client-side route.

    A cache-busting `nonce` query param guarantees a full page reload even when
    only the hash changes, so each test starts from clean application state.
    """
    route = route or "/"
    if not route.startswith("/"):
        route = "/" + route
    query = f"?e2e={nonce}" if nonce != "" else ""
    if USE_HASH_ROUTER:
        return f"{BASE_URL}{query}#{route}"
    # BrowserRouter fallback (local non-hash builds)
    return f"{BASE_URL.rstrip('/')}{route}{query}"
