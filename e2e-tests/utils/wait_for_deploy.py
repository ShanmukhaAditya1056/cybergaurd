"""Poll BASE_URL until the deployment serves HTTP 200 (or timeout)."""
import sys
import time
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config


def wait_for_deploy(url=None, timeout=None, interval=None):
    url = url or config.BASE_URL
    timeout = timeout or config.DEPLOY_WAIT_TIMEOUT
    interval = interval or config.DEPLOY_POLL_INTERVAL
    deadline = time.time() + timeout
    last = None
    print(f"Waiting for deployment at {url} (timeout {timeout}s)...")
    while time.time() < deadline:
        try:
            resp = requests.get(url, timeout=15)
            last = resp.status_code
            if resp.status_code == 200:
                print(f"Deployment is live (HTTP 200) at {url}")
                return True
            print(f"  got HTTP {resp.status_code}, retrying in {interval}s...")
        except requests.RequestException as e:
            print(f"  not reachable yet ({e.__class__.__name__}), retrying in {interval}s...")
        time.sleep(interval)
    print(f"ERROR: deployment not ready after {timeout}s (last status: {last})")
    return False


if __name__ == "__main__":
    ok = wait_for_deploy()
    sys.exit(0 if ok else 1)
