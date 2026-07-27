"""Selenium WebDriver factory — headless Chrome tuned for CI runners."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

import config


def create_driver():
    """Return a configured Chrome WebDriver.

    Uses Selenium Manager (bundled with Selenium 4.6+) to resolve the driver,
    which needs no network on GitHub-hosted runners where Chrome is present.
    """
    opts = Options()
    if config.HEADLESS:
        opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-gpu")
    opts.add_argument(f"--window-size={config.WINDOW_SIZE}")
    opts.add_argument("--disable-extensions")
    opts.add_argument("--disable-notifications")
    opts.add_argument("--ignore-certificate-errors")
    opts.add_argument("--lang=en-US")
    # Reduce log noise
    opts.add_experimental_option("excludeSwitches", ["enable-logging"])

    driver = None
    try:
        driver = webdriver.Chrome(options=opts)
    except Exception:
        # Fallback: webdriver-manager (useful on some local setups)
        from webdriver_manager.chrome import ChromeDriverManager
        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=opts)

    driver.set_page_load_timeout(config.PAGE_LOAD_TIMEOUT)
    w, h = config.WINDOW_SIZE.split(",")
    try:
        driver.set_window_size(int(w), int(h))
    except Exception:
        pass
    return driver
