"""Base Page Object — shared navigation, waiting and query helpers."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

import config


class BasePage:
    """All page objects inherit shared driver helpers from here."""

    # A route this page lives on; overridden by subclasses.
    route = "/"

    def __init__(self, driver):
        self.driver = driver

    # -- navigation ------------------------------------------------------- #
    def open(self, nonce=""):
        """Full-reload navigate to this page's route (clean app state)."""
        self.driver.get(config.url_for(self.route, nonce))
        self.wait_ready()
        return self

    def wait_ready(self):
        """Wait until the React root has rendered content."""
        self.wait_visible((By.CSS_SELECTOR, "nav"))
        return self

    # -- waiting ---------------------------------------------------------- #
    def wait_visible(self, locator, timeout=None):
        return WebDriverWait(self.driver, timeout or config.DEFAULT_WAIT).until(
            EC.visibility_of_element_located(locator)
        )

    def wait_clickable(self, locator, timeout=None):
        return WebDriverWait(self.driver, timeout or config.DEFAULT_WAIT).until(
            EC.element_to_be_clickable(locator)
        )

    def wait_text_present(self, text, timeout=None):
        return WebDriverWait(self.driver, timeout or config.DEFAULT_WAIT).until(
            lambda d: text.lower() in d.find_element(By.TAG_NAME, "body").text.lower()
        )

    # -- queries ---------------------------------------------------------- #
    def body_text(self):
        return self.driver.find_element(By.TAG_NAME, "body").text

    def has_text(self, text):
        return text.lower() in self.body_text().lower()

    def find(self, locator):
        return self.driver.find_element(*locator)

    def find_all(self, locator):
        return self.driver.find_elements(*locator)

    def exists(self, locator):
        return len(self.find_all(locator)) > 0

    def current_hash(self):
        return self.driver.execute_script("return window.location.hash;")

    # -- helpers ---------------------------------------------------------- #
    def click_button_by_text(self, text, timeout=None):
        xpath = f"//button[contains(normalize-space(.), \"{text}\")]"
        el = self.wait_clickable((By.XPATH, xpath), timeout)
        self._safe_click(el)
        return el

    def _safe_click(self, el):
        """JS click bypasses fixed-navbar / framer-motion overlay interception."""
        self.driver.execute_script("arguments[0].scrollIntoView({block:'center'});", el)
        try:
            self.driver.execute_script("arguments[0].click();", el)
        except Exception:
            el.click()

    def type_into(self, locator, value):
        el = self.wait_clickable(locator)
        self.driver.execute_script("arguments[0].scrollIntoView({block:'center'});", el)
        try:
            el.clear()
        except Exception:
            pass
        el.send_keys(value)
        return el
