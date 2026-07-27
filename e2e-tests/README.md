# CyberGuard AI — Live GitHub Pages E2E (Phase 7)

Selenium **Page Object Model** suite of **400 data-driven test cases** that runs
against the **live, deployed GitHub Pages URL** — never localhost — and produces
Excel + HTML + Markdown reports plus per-case screenshots.

```
Deploy → Verify Deployment (HTTP 200) → Run Selenium → Generate Reports → Upload Artifacts → Summary
```

## Why "demo mode"?

The app is 3-tier (React client + Express/Mongo server + Python ML service), but
**GitHub Pages only serves static files** — there is no backend reachable from
`*.github.io`. So the client is built in **demo mode**
(`REACT_APP_DEMO_MODE=true`), where a deterministic in-browser mock
(`client/src/store/api/demoData.js`) returns the exact `{ success, data }`
envelopes the real controllers return. The site is fully functional as a static
deployment, and Selenium exercises the **real click → render pipeline** with
predictable outcomes. The build also uses `HashRouter`
(`REACT_APP_HASH_ROUTER=true`) so deep links never 404 on Pages.

## Folder structure

```
e2e-tests/
├── config.py                 # BASE_URL + all settings (env-overridable, no hardcoded localhost)
├── conftest.py               # driver fixture, screenshot-per-case, results.json capture
├── run_tests.py              # orchestrator: pytest → report generators
├── pytest.ini
├── requirements.txt
├── data/
│   ├── generate_cases.py     # builds the 400 cases (classifiers mirror demoData.js)
│   └── test_cases.json       # the 400 cases (regenerate with generate_cases.py)
├── pages/                    # Page Object Model
│   ├── base_page.py
│   └── app_pages.py          # Dashboard/Phishing/Password/Breach/Wifi/Malware/... + NavBar
├── tests/
│   └── test_e2e.py           # single data-driven test that dispatches by action
├── utils/
│   ├── driver_factory.py     # headless Chrome
│   ├── wait_for_deploy.py    # poll BASE_URL until HTTP 200
│   └── report_generator.py   # Excel + HTML + summary.md
└── Test Results/             # generated
    ├── Excel/Automation_Test_Report.xlsx
    ├── HTML/execution-report.html
    ├── Screenshots/
    ├── Logs/results.json
    └── Summary/summary.md
```

## The 400 test cases

| Category    | Count | What it checks |
|-------------|-------|----------------|
| smoke       | 9     | every page renders its heading; navbar+logo present |
| navigation  | 16    | every nav link routes correctly (forward + reverse) |
| phishing    | 148   | safe vs. phishing verdict for 148 URLs/messages |
| password    | 120   | strength label (Very Weak→Strong) for 120 passwords |
| breach      | 60    | breached vs. clean for 60 emails/phones |
| wifi        | 40    | risk level across encryption × public × password combos |
| malware     | 4     | risk level for the 4 sample apps |
| validation  | 2     | empty input produces a validation state, not a scan result |
| notfound    | 1     | unknown route renders the 404 page |

Each case's `expected` value is computed by the **same classifier logic** the
deployed mock runs, so a green suite proves the UI renders correctly end-to-end.

---

## Local execution

Prerequisites: **Python 3.10+**, **Google Chrome**, **Node 18+**.

```bash
# 1) Build the static demo site (from repo root)
cd client
REACT_APP_DEMO_MODE=true REACT_APP_HASH_ROUTER=true CI=false npm run build

# 2) Serve it locally (any static server)
cd build && python -m http.server 4173      # http://localhost:4173/

# 3) Install E2E deps and run against the served build
cd ../../e2e-tests
pip install -r requirements.txt
BASE_URL=http://localhost:4173/ HEADLESS=true python run_tests.py
```

> Windows PowerShell env-var form:
> `$env:BASE_URL="http://localhost:4173/"; $env:HEADLESS="true"; python run_tests.py`

Run a subset while developing:

```bash
BASE_URL=http://localhost:4173/ python run_tests.py -k "phishing or wifi"
```

Regenerate the case data after changing categories:

```bash
python data/generate_cases.py
```

Reports land in `e2e-tests/Test Results/`. Open `HTML/execution-report.html`.

### Environment variables

| Var | Default | Meaning |
|-----|---------|---------|
| `BASE_URL` | the Pages URL | site under test (must end with `/`) |
| `HEADLESS` | `true` | run Chrome headless |
| `USE_HASH_ROUTER` | `true` | build uses HashRouter (`/#/route`) |
| `DEFAULT_WAIT` | `15` | explicit-wait seconds |
| `DEPLOY_WAIT_TIMEOUT` | `300` | max seconds to wait for HTTP 200 |

---

## CI/CD execution (GitHub Actions)

Workflow: [`.github/workflows/deploy-and-test.yml`](../.github/workflows/deploy-and-test.yml).
Triggers: `push`, `pull_request`, `workflow_dispatch`.

Jobs:

1. **build** — `npm ci` + CRA build in demo mode → upload Pages artifact (+ `404.html`).
2. **deploy** — `actions/deploy-pages` → exposes the live `page_url` (skipped on PRs).
3. **e2e** — Python + Chrome → `wait_for_deploy.py` (HTTP 200) →
   `run_tests.py` against the live URL → upload `Test Results/**` (always) →
   publish `summary.md` to the job summary → fail the job if any test failed.

### Required repository settings (one-time)

1. **Settings → Pages → Build and deployment → Source = "GitHub Actions".**
2. **Settings → Actions → General → Workflow permissions → "Read and write".**
3. Nothing else: the workflow already declares
   `permissions: pages: write, id-token: write`.

---

## Two ways to deploy (pick ONE Pages Source)

This repo supports both the modern and the classic deploy methods. **GitHub Pages
has a single "Source" setting — choosing one disables the other.**

### A) GitHub Actions (recommended, fully automated)

- Pages **Source = "GitHub Actions"**.
- `git push` → the [workflow](../.github/workflows/deploy-and-test.yml) builds,
  deploys, and runs the 400-case Selenium suite against the live URL.
- No `gh-pages` branch involved.

### B) `gh-pages` package (classic manual deploy — matches the setup doc)

- Pages **Source = "Deploy from branch" → branch `gh-pages`**.
- Deploy from your machine:
  ```bash
  cd client
  npm install          # installs the gh-pages devDependency (one-time)
  npm run deploy        # predeploy builds, then pushes build/ to the gh-pages branch
  ```
- `client/.env.production` makes this build demo-mode + HashRouter automatically,
  so the manually-deployed site is fully functional.
- To still get CI Selenium runs with this method, keep the workflow but the
  `deploy` job will be a no-op unless Source is "GitHub Actions"; run
  `run_tests.py` against the live URL yourself, or set Source to "GitHub Actions".

> The React router is already `HashRouter` for production builds
> (`client/src/App.jsx`), so both methods avoid 404s on refresh/deep-links —
> e.g. `https://<user>.github.io/<repo>/#/phishing`.

> **Note on stable IDs:** the setup doc suggests adding `id=` attributes for
> Selenium. This app has no login form; the page objects here use resilient
> text/placeholder/select locators and pass 400/400. Adding `data-testid`
> attributes is an optional hardening step if the UI text changes often.

### Required secrets / variables

- **None required.** The deployed URL is taken from the deploy job output.
- Optional **repository variable** `BASE_URL` — set it if you want PRs to test a
  previously-deployed environment, or to point the suite at a custom domain.

### Artifacts produced every run (even on failure)

- `Automation_Test_Report.xlsx` (Summary / Test Results / Failures / By Category)
- `execution-report.html`
- `Screenshots/` (one PNG per case)
- `Logs/results.json`
- `summary.md`

---

## Troubleshooting

- **All scan tests fail with network errors** → the site was built without
  `REACT_APP_DEMO_MODE=true`. Rebuild in demo mode.
- **404 on deep links locally** → build without `REACT_APP_HASH_ROUTER=true`; set
  `USE_HASH_ROUTER=false` to match a BrowserRouter build.
- **Chrome/driver mismatch locally** → Selenium 4 Manager auto-resolves the
  driver; ensure Chrome is installed and on PATH.
- **First Pages deploy 404s** → GitHub Pages can take 1-2 min on first publish;
  `wait_for_deploy.py` polls up to `DEPLOY_WAIT_TIMEOUT` (300s).
