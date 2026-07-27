"""Orchestrator: run the live Selenium suite, then generate all reports.

Usage:
    BASE_URL=https://user.github.io/repo/ python run_tests.py
Exit code is non-zero if any test failed (so CI can flag it).
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import pytest

import config
from utils.report_generator import generate_all


def main():
    print("=" * 70)
    print(f"CyberGuard AI — Live E2E against: {config.BASE_URL}")
    print(f"Headless: {config.HEADLESS}")
    print("=" * 70)

    pytest_args = [
        "tests",
        "-v",
        "--tb=short",
        f"--html={config.HTML_DIR / 'pytest-report.html'}",
        "--self-contained-html",
    ]
    # Optional subset for quick local checks: python run_tests.py -k phishing
    pytest_args += sys.argv[1:]

    exit_code = pytest.main(pytest_args)

    failed = generate_all()

    # Fail the run if pytest failed OR any test row is a failure.
    return 1 if (exit_code != 0 or failed > 0) else 0


if __name__ == "__main__":
    sys.exit(main())
