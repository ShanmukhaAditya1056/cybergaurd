"""pytest fixtures + hooks: shared driver, per-test screenshots, result capture."""
import json
import sys
import time
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))

import config
from utils.driver_factory import create_driver

# In-memory accumulator of per-test results (written to results.json at the end).
_RESULTS = []


@pytest.fixture(scope="session")
def driver():
    """One browser for the whole run (fast); each test full-reloads its page."""
    drv = create_driver()
    yield drv
    try:
        drv.quit()
    except Exception:
        pass


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Record outcome + capture a screenshot on failure/at end of each case."""
    outcome = yield
    report = outcome.get_result()
    if report.when != "call":
        return

    case = getattr(item, "_e2e_case", {}) or {}
    drv = item.funcargs.get("driver")
    shot_path = ""
    if drv is not None:
        # Screenshot every case (pass + fail) so reports always have evidence.
        safe_id = case.get("id", item.name).replace("/", "_")
        target = config.SCREENSHOTS_DIR / f"{safe_id}.png"
        try:
            drv.save_screenshot(str(target))
            shot_path = str(target.relative_to(config.RESULTS_DIR))
        except Exception:
            shot_path = ""

    status = "PASS" if report.passed else ("SKIP" if report.skipped else "FAIL")
    reason = ""
    if report.failed:
        reason = str(report.longrepr.reprcrash.message) if getattr(report, "longrepr", None) and getattr(report.longrepr, "reprcrash", None) else str(report.longrepr)
        reason = reason.splitlines()[0][:300] if reason else "Assertion failed"

    _RESULTS.append({
        "id": case.get("id", item.name),
        "name": case.get("name", item.name),
        "category": case.get("category", "general"),
        "page": case.get("page", case.get("route", "")),
        "status": status,
        "duration": round(report.duration, 3),
        "screenshot": shot_path,
        "reason": reason,
        "expected": case.get("expected", ""),
    })


def pytest_sessionfinish(session, exitstatus):
    """Persist collected results for the report generators."""
    config.RESULTS_JSON.write_text(json.dumps({
        "base_url": config.BASE_URL,
        "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "results": _RESULTS,
    }, indent=2), encoding="utf-8")
