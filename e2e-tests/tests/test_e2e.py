"""Data-driven live E2E suite — 400 cases from data/test_cases.json.

Each JSON case declares an `action`; this module dispatches it against the
Page Objects and asserts the deterministic `expected` outcome. Because the
deployed site runs the same classifier logic as the generator, a passing case
proves the real click -> render pipeline works on the live GitHub Pages URL.
"""
import json
import sys
import time
from pathlib import Path

import pytest
from selenium.webdriver.common.by import By

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config
from pages.base_page import BasePage
from pages.app_pages import (
    NavBar, DashboardPage, PhishingPage, PasswordPage, BreachPage,
    WifiPage, MalwarePage, NotFoundPage, PAGE_BY_ROUTE,
)

with open(config.DATA_FILE, encoding="utf-8") as _f:
    CASES = json.load(_f)["cases"]


def _open_route(driver, route, nonce):
    page = BasePage(driver)
    page.route = route
    page.open(nonce)
    return page


@pytest.mark.parametrize("case", CASES, ids=[c["id"] for c in CASES])
def test_e2e(driver, request, case):
    # Expose the case to conftest for screenshots + result rows.
    request.node._e2e_case = case
    nonce = case["id"]
    action = case["action"]
    expected = case.get("expected")

    # ---------------- smoke / render ---------------- #
    if action == "render":
        cls = PAGE_BY_ROUTE[case["route"]]
        page = cls(driver).open(nonce)
        page.wait_text_present(expected)  # allow for framer-motion mount
        assert page.has_text(expected), f"Expected heading '{expected}' on {case['page']}"

    elif action == "navbar_present":
        DashboardPage(driver).open(nonce)
        nav = NavBar(driver)
        nav.wait_text_present("CyberGuard")
        assert nav.logo_present(), "CyberGuard logo missing from navbar"
        labels = nav.link_labels()
        assert any("Dashboard" in l for l in labels), f"Nav links look wrong: {labels}"

    # ---------------- navigation ---------------- #
    elif action == "nav":
        _open_route(driver, case["route"], nonce)
        NavBar(driver).go_to(case["label"])
        BasePage(driver).wait_text_present(expected)
        assert expected.lower() in BasePage(driver).body_text().lower()

    # ---------------- phishing ---------------- #
    elif action == "phishing_scan":
        p = PhishingPage(driver).open(nonce)
        p.scan(case["input"])
        got = p.verdict()
        assert got == expected, f"URL={case['input']!r} expected {expected} got {got}"

    # ---------------- password ---------------- #
    elif action == "password_check":
        p = PasswordPage(driver).open(nonce)
        p.check(case["input"])
        got = p.strength_label()
        assert got == expected, f"pw={case['input']!r} expected {expected} got {got}"

    # ---------------- breach ---------------- #
    elif action == "breach_check":
        b = BreachPage(driver).open(nonce)
        b.check(case["input"], case.get("tab", "email"))
        found = b.breach_found()
        assert found is not None, "No breach result rendered"
        assert found == (expected == "BREACH"), f"input={case['input']!r} expected {expected}"

    # ---------------- wifi ---------------- #
    elif action == "wifi_analyze":
        w = WifiPage(driver).open(nonce)
        w.analyze(case["input"], case["encryption"], case.get("is_public", False), case.get("has_password", True))
        got = w.risk_level()
        assert got == expected, f"{case['encryption']} expected {expected} got {got}"

    # ---------------- malware ---------------- #
    elif action == "malware_sample":
        m = MalwarePage(driver).open(nonce)
        m.analyze_sample(case["app"])
        got = m.risk_level()
        assert got == expected, f"app={case['app']} expected {expected} got {got}"

    # ---------------- validation ---------------- #
    elif action == "validation_empty":
        page = _open_route(driver, case["route"], nonce)
        try:
            page.click_button_by_text(case["control"], timeout=8)
        except Exception:
            pass
        time.sleep(1.2)  # allow any (unexpected) async result to render
        txt = page.body_text().lower()
        assert not ("phishing detected" in txt or "url is safe" in txt or "no breaches found" in txt or "found in" in txt), \
            "Empty input should not produce a scan result"

    # ---------------- 404 ---------------- #
    elif action == "notfound":
        page = NotFoundPage(driver).open(nonce)
        assert page.has_text("404") or page.has_text("not found"), "404 page did not render"

    else:
        pytest.skip(f"Unknown action: {action}")
