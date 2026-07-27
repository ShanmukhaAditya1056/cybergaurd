"""Concrete Page Objects for every CyberGuard AI page.

Selectors are intentionally resilient (headings, placeholders, button text,
select options) because the app ships no data-testid attributes.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select

from pages.base_page import BasePage


# --------------------------------------------------------------------------- #
# Shared navigation bar (present on every page)
# --------------------------------------------------------------------------- #
class NavBar(BasePage):
    LOGO = (By.XPATH, "//nav//span[contains(., 'CyberGuard')]")
    NAV_LINKS = (By.CSS_SELECTOR, "nav a")

    def go_to(self, label):
        """Click a top-nav link by its visible label."""
        xpath = f"//nav//a[.//span[normalize-space()='{label}'] or normalize-space()='{label}']"
        el = self.wait_clickable((By.XPATH, xpath))
        self.driver.execute_script("arguments[0].click();", el)
        return self

    def logo_present(self):
        return self.exists(self.LOGO)

    def link_labels(self):
        return [e.text.strip() for e in self.find_all(self.NAV_LINKS) if e.text.strip()]


# --------------------------------------------------------------------------- #
class DashboardPage(BasePage):
    route = "/"
    HEADING = "Security Dashboard"

    def loaded(self):
        return self.has_text(self.HEADING)


# --------------------------------------------------------------------------- #
class PhishingPage(BasePage):
    route = "/phishing"
    HEADING = "Phishing Scanner"
    INPUT = (By.CSS_SELECTOR, "input[placeholder*='verify-now'], input[type='text']")
    SCAN_BTN_TEXT = "Scan Now"

    def loaded(self):
        return self.has_text(self.HEADING)

    def scan(self, value):
        self.type_into(self.INPUT, value)
        self.click_button_by_text(self.SCAN_BTN_TEXT)
        # Wait until the async scan resolves (button label returns to "Scan Now"
        # and a verdict heading appears).
        self.wait_for_result()

    def wait_for_result(self):
        self.wait_text_present_any(["URL is Safe", "Phishing Detected"])

    def wait_text_present_any(self, options, timeout=None):
        import config
        from selenium.webdriver.support.ui import WebDriverWait
        WebDriverWait(self.driver, timeout or config.DEFAULT_WAIT).until(
            lambda d: any(o.lower() in d.find_element(By.TAG_NAME, "body").text.lower() for o in options)
        )

    def verdict(self):
        if self.has_text("Phishing Detected"):
            return "PHISHING"
        if self.has_text("URL is Safe"):
            return "SAFE"
        return "UNKNOWN"


# --------------------------------------------------------------------------- #
class PasswordPage(BasePage):
    route = "/password"
    HEADING = "Password Strength"
    INPUT = (By.CSS_SELECTOR, "input[placeholder*='Type a password'], input[type='password'], input[type='text']")

    LABELS = {"Strong", "Good", "Fair", "Weak", "Very Weak"}

    def loaded(self):
        return self.has_text(self.HEADING)

    def check(self, value):
        el = self.type_into(self.INPUT, value)
        # Strength updates live as you type; wait for a label + score to render.
        self.wait_text_present("/100")
        return el

    def strength_label(self):
        for lbl in ("Very Weak", "Strong", "Good", "Fair", "Weak"):
            if self.has_text(f"{lbl} Password"):
                return lbl
        return "UNKNOWN"


# --------------------------------------------------------------------------- #
class BreachPage(BasePage):
    route = "/breach"
    HEADING = "Breach Monitor"
    # The breach page shows a single input whose type switches (email/tel) with
    # the active tab, so match any input.
    INPUT = (By.CSS_SELECTOR, "input")

    def loaded(self):
        return self.has_text(self.HEADING)

    def select_tab(self, tab):
        label = "Email" if tab == "email" else "Phone"
        try:
            self.click_button_by_text(label, timeout=5)
        except Exception:
            pass

    def check(self, value, tab="email"):
        self.select_tab(tab)
        self.type_into(self.INPUT, value)
        self.click_button_by_text("Check")
        self.wait_text_present_any(["No Breaches Found", "Found in"])

    def wait_text_present_any(self, options, timeout=None):
        import config
        from selenium.webdriver.support.ui import WebDriverWait
        WebDriverWait(self.driver, timeout or config.DEFAULT_WAIT).until(
            lambda d: any(o.lower() in d.find_element(By.TAG_NAME, "body").text.lower() for o in options)
        )

    def breach_found(self):
        # Check the unambiguous "no breach" heading FIRST: the clean-state
        # subtitle contains "...not found in any breach", which would otherwise
        # false-match the "Found in" breach heading.
        if self.has_text("No Breaches Found"):
            return False
        if self.has_text("Found in"):
            return True
        return None


# --------------------------------------------------------------------------- #
class WifiPage(BasePage):
    route = "/wifi"
    HEADING = "Wi-Fi Scanner"
    SSID_INPUT = (By.CSS_SELECTOR, "input[placeholder*='HomeWiFi'], input[type='text']")
    ENCRYPTION_SELECT = (By.CSS_SELECTOR, "select")

    def loaded(self):
        return self.has_text(self.HEADING)

    def analyze(self, ssid, encryption, is_public=False, has_password=True):
        self.type_into(self.SSID_INPUT, ssid)
        Select(self.find(self.ENCRYPTION_SELECT)).select_by_value(encryption)  # exact value match
        self._set_toggle("Public Network?", is_public)
        self._set_toggle("Requires Password?", has_password)
        self.click_button_by_text("Analyze Network")
        self.wait_text_present("Trust Score")

    def _set_toggle(self, label, desired):
        xpath = f"//span[contains(normalize-space(.), \"{label}\")]/following-sibling::button[1]"
        try:
            btn = self.find((By.XPATH, xpath))
        except Exception:
            return
        # On-state is indicated by the knob's translate-x-6 class.
        inner = btn.get_attribute("innerHTML") or ""
        is_on = "translate-x-6" in inner
        if is_on != desired:
            self.driver.execute_script("arguments[0].click();", btn)

    def risk_level(self):
        # Read the RiskBadge inside the trust-score result region only, to avoid
        # matching risk words elsewhere on the page.
        try:
            region = self.find((By.XPATH, "//*[contains(text(),'Trust Score')]/ancestor::div[1]"))
            text = region.text.upper()
        except Exception:
            text = self.body_text().upper()
        for lvl in ("CRITICAL", "HIGH", "MEDIUM", "LOW"):
            if lvl in text:
                return lvl
        return "UNKNOWN"


# --------------------------------------------------------------------------- #
class MalwarePage(BasePage):
    route = "/malware"
    HEADING = "Permission Analyzer"

    def loaded(self):
        return self.has_text(self.HEADING) or self.has_text("Malware")

    def analyze_sample(self, app_name):
        # Sample app chips load a preset permission set, then Analyze runs it.
        self.click_button_by_text(app_name)
        self.click_button_by_text("Analyze")
        self.wait_text_present_any(["CRITICAL", "HIGH", "MEDIUM", "LOW"])

    def wait_text_present_any(self, options, timeout=None):
        import config
        from selenium.webdriver.support.ui import WebDriverWait
        WebDriverWait(self.driver, timeout or config.DEFAULT_WAIT).until(
            lambda d: any(o in d.find_element(By.TAG_NAME, "body").text for o in options)
        )

    def risk_level(self):
        for lvl in ("CRITICAL", "HIGH", "MEDIUM", "LOW"):
            if self.has_text(lvl):
                return lvl
        return "UNKNOWN"


# --------------------------------------------------------------------------- #
class AlertsPage(BasePage):
    route = "/alerts"
    HEADING = "Security Alerts"

    def loaded(self):
        return self.has_text(self.HEADING)


# --------------------------------------------------------------------------- #
class SettingsPage(BasePage):
    route = "/settings"
    HEADING = "Settings"

    def loaded(self):
        return self.has_text(self.HEADING)


# --------------------------------------------------------------------------- #
class NotFoundPage(BasePage):
    route = "/this-route-does-not-exist"

    def loaded(self):
        t = self.body_text().lower()
        return "404" in t or "not found" in t or "page" in t


# Route -> page-object class, used by the data-driven runner.
PAGE_BY_ROUTE = {
    "/": DashboardPage,
    "/phishing": PhishingPage,
    "/password": PasswordPage,
    "/breach": BreachPage,
    "/wifi": WifiPage,
    "/malware": MalwarePage,
    "/alerts": AlertsPage,
    "/settings": SettingsPage,
}
