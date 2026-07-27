"""Generate the 400-case data-driven E2E suite -> data/test_cases.json.

The classifiers below are faithful Python ports of the client demo backend
(client/src/store/api/demoData.js). Because both sides run identical logic, the
`expected` value in every generated case equals what the mock returns AND what
the UI renders — so a green suite means the full render pipeline works.

Run:  python data/generate_cases.py
"""
import json
import re
from pathlib import Path

OUT = Path(__file__).resolve().parent / "test_cases.json"

# --------------------------------------------------------------------------- #
# Ported classifiers (keep in sync with demoData.js)
# --------------------------------------------------------------------------- #
PHISHING_KEYWORDS = [
    "login", "verify", "secure", "account", "update", "confirm", "suspend",
    "bank", "otp", "password", "signin", "wallet", "free", "win", "gift",
    "bonus", "prize", "claim", "urgent", "unlock", "reset",
]
SUSPICIOUS_TLDS = [".xyz", ".tk", ".ml", ".ga", ".cf", ".gq", ".top", ".zip", ".mom"]
SAFE_DOMAINS = [
    "google.com", "github.com", "microsoft.com", "apple.com", "amazon.com",
    "wikipedia.org", "cloudflare.com", "mozilla.org", "paypal.com", "netflix.com",
]
IPV4_HOST = re.compile(r"//(\d{1,3}\.){3}\d{1,3}")


def classify_phishing(raw):
    s = (raw or "").lower().strip()
    is_safe = any(d in s for d in SAFE_DOMAINS)
    suspicion = 0
    if IPV4_HOST.search(s):
        suspicion += 45
    if any(t in s for t in SUSPICIOUS_TLDS):
        suspicion += 35
    if "@" in s and "http" in s:
        suspicion += 25
    matched = [k for k in PHISHING_KEYWORDS if k in s]
    if matched and not is_safe:
        suspicion += 20 + len(matched) * 8
    if "xn--" in s:
        suspicion += 30
    return "PHISHING" if (suspicion >= 40 and not is_safe) else "SAFE"


COMMON_PASSWORDS = ["password", "123456", "12345678", "qwerty", "abc123", "letmein", "admin", "iloveyou", "111111", "123456789"]
STRENGTH_LABEL = {"STRONG": "Strong", "GOOD": "Good", "FAIR": "Fair", "WEAK": "Weak", "VERY_WEAK": "Very Weak"}


def charset_size(pw):
    size = 0
    if re.search(r"[a-z]", pw):
        size += 26
    if re.search(r"[A-Z]", pw):
        size += 26
    if re.search(r"[0-9]", pw):
        size += 10
    if re.search(r"[^a-zA-Z0-9]", pw):
        size += 33
    return size


def _round_half_up(x):
    # JS Math.round rounds .5 up; Python round() is banker's rounding.
    import math
    return int(math.floor(x + 0.5))


def analyze_password_label(pw):
    import math
    if not pw:
        return "None"
    has_lower = bool(re.search(r"[a-z]", pw))
    has_upper = bool(re.search(r"[A-Z]", pw))
    has_digit = bool(re.search(r"[0-9]", pw))
    has_special = bool(re.search(r"[^a-zA-Z0-9]", pw))
    unique = len(set(pw))
    score = 0
    if len(pw) >= 16:
        score += 30
    elif len(pw) >= 12:
        score += 25
    elif len(pw) >= 8:
        score += 15
    elif len(pw) >= 6:
        score += 8
    else:
        score += 3
    score += sum([has_lower, has_upper, has_digit, has_special]) * 6
    score += _round_half_up((unique / len(pw)) * 15)
    cs = charset_size(pw)
    entropy = len(pw) * math.log2(cs or 1)
    if entropy >= 60:
        score += 15
    elif entropy >= 40:
        score += 10
    elif entropy >= 28:
        score += 5
    if pw.lower() in COMMON_PASSWORDS:
        score = min(score, 10)
    score = max(0, min(100, score))
    if score >= 80:
        s = "STRONG"
    elif score >= 60:
        s = "GOOD"
    elif score >= 40:
        s = "FAIR"
    elif score >= 20:
        s = "WEAK"
    else:
        s = "VERY_WEAK"
    return STRENGTH_LABEL[s]


BREACHED_TOKENS = ["test", "demo", "admin", "john", "breach", "pwned", "hacked", "leak"]


def check_breach(raw):
    s = (raw or "").lower().strip()
    return "BREACH" if any(t in s for t in BREACHED_TOKENS) else "CLEAN"


def analyze_wifi_risk(encryption, is_public, has_password):
    score = 0
    score += {"WPA3": 40, "WPA2": 30, "WPA": 15, "WEP": 5}.get(encryption, 0)
    score += 25 if not is_public else 5
    score += 20 if has_password else 0
    if is_public or not has_password or encryption in ("Open", "WEP"):
        score = max(score - 10, 0)
    score = max(0, min(100, score))
    if score < 30:
        return "CRITICAL"
    if score < 55:
        return "HIGH"
    if score < 75:
        return "MEDIUM"
    return "LOW"


DANGEROUS_PERMS = ["SMS", "CONTACT", "MICROPHONE", "RECORD_AUDIO", "CAMERA", "LOCATION", "CALL", "BOOT"]


def analyze_app_risk(permissions):
    danger = sum(1 for p in permissions if any(d in p.upper() for d in DANGEROUS_PERMS))
    score = min(95, danger * 22 + (8 if permissions else 0))
    if score >= 80:
        return "CRITICAL"
    if score >= 60:
        return "HIGH"
    if score >= 30:
        return "MEDIUM"
    return "LOW"


# --------------------------------------------------------------------------- #
# Case builders
# --------------------------------------------------------------------------- #
cases = []


def add(cid, category, name, action, route, page, **extra):
    case = {"id": cid, "category": category, "name": name, "action": action, "route": route, "page": page}
    case.update(extra)
    cases.append(case)


PAGES = [
    ("/", "Dashboard", "Security Dashboard"),
    ("/phishing", "Phishing", "Phishing Scanner"),
    ("/malware", "Malware", "Permission Analyzer"),
    ("/breach", "Breach", "Breach Monitor"),
    ("/password", "Password", "Password Strength"),
    ("/wifi", "Wi-Fi", "Wi-Fi Scanner"),
    ("/alerts", "Alerts", "Security Alerts"),
    ("/settings", "Settings", "Settings"),
]

NAV_LABELS = [
    ("/", "Dashboard", "Security Dashboard"),
    ("/phishing", "Phishing", "Phishing Scanner"),
    ("/malware", "Malware", "Permission Analyzer"),
    ("/breach", "Breach", "Breach Monitor"),
    ("/password", "Password", "Password Strength"),
    ("/wifi", "Wi-Fi", "Wi-Fi Scanner"),
    ("/alerts", "Alerts", "Security Alerts"),
    ("/settings", "Settings", "Settings"),
]

# 1) Smoke / render — every page loads with its heading (9)
n = 1
for route, page, heading in PAGES:
    add(f"SM-{n:03d}", "smoke", f"Page loads: {page}", "render", route, page, expected=heading)
    n += 1
add(f"SM-{n:03d}", "smoke", "Navbar + logo render on load", "navbar_present", "/", "Global", expected="CyberGuard")

# 2) Navigation — click each nav link, then reverse (16)
n = 1
for route, label, heading in NAV_LABELS:
    add(f"NV-{n:03d}", "navigation", f"Nav to {label}", "nav", "/", label, target=route, label=label, expected=heading)
    n += 1
for route, label, heading in NAV_LABELS:
    add(f"NV-{n:03d}", "navigation", f"Nav from Settings to {label}", "nav", "/settings", label, target=route, label=label, expected=heading)
    n += 1

# 3) Phishing — 150 URLs / messages
benign_paths = ["", "home", "about", "docs", "blog", "help", "products", "pricing", "search", "status"]
phish_hosts = [
    "http://192.168.0.{}/login", "http://10.0.0.{}/verify", "http://172.16.0.{}/account",
    "http://secure-bank-{}.xyz/login", "http://free-gift-{}.tk/claim", "http://update-wallet-{}.ml/confirm",
    "http://verify-otp-{}.ga/signin", "http://reset-password-{}.cf/unlock", "http://win-prize-{}.top/bonus",
    "http://urgent-account-{}.gq/suspend", "http://xn--pple-43d-{}.com/login",
    "http://paypal-login-{}.tk@bad.host/verify",
]
phish_messages = [
    "Your bank account is suspended, verify now at http://secure-verify-{}.xyz",
    "Congratulations! Claim your free gift now: http://gift-{}.tk",
    "URGENT: reset your password immediately http://reset-{}.ml/login",
    "You won a prize! Confirm your wallet http://win-{}.ga",
]
pn = 1
i = 0
# safe URLs (~75)
while pn <= 75:
    domain = SAFE_DOMAINS[i % len(SAFE_DOMAINS)]
    path = benign_paths[i % len(benign_paths)]
    url = f"https://www.{domain}" + (f"/{path}" if path else "")
    add(f"PH-{pn:03d}", "phishing", f"Scan safe URL: {url}", "phishing_scan", "/phishing", "Phishing",
        input=url, expected=classify_phishing(url))
    pn += 1
    i += 1
# phishing URLs + messages (~75)
i = 0
pool = []
for tmpl in phish_hosts:
    for k in range(6):
        pool.append(tmpl.format(k + 1))
for tmpl in phish_messages:
    for k in range(4):
        pool.append(tmpl.format(k + 1))
for url in pool:
    if pn > 148:
        break
    add(f"PH-{pn:03d}", "phishing", f"Scan suspicious: {url[:48]}", "phishing_scan", "/phishing", "Phishing",
        input=url, expected=classify_phishing(url))
    pn += 1

# 4) Password — 120 passwords
weak_pool = ["1", "12", "abc", "123456", "password", "qwerty", "admin", "111111", "letmein", "iloveyou", "0000", "aaaa"]
mid_pool = ["Summer2020", "Hello123", "Welcome1", "Monday99", "Cricket7", "Rainbow12", "Dolphin8", "Guitar55"]
strong_pool = ["G7#kL9!qWz$2M", "Tr0ub4dor&3xY!", "9Xz$Kv2!Lm@8Qw#", "p@ssPhrase-Long-2024!!", "Zq7!vN2@rT9#kW4$"]
pw_all = []
# expand to 120 deterministically
base_lists = [weak_pool, mid_pool, strong_pool]
idx = 0
counter = 1
while counter <= 120:
    lst = base_lists[counter % 3]
    base = lst[idx % len(lst)]
    # vary strong/mid by appending deterministic suffix to create variety
    if lst is strong_pool:
        pw = base + str(counter % 5)
    elif lst is mid_pool:
        pw = base + ("!" if counter % 2 else "")
    else:
        pw = base
    pw_all.append(pw)
    add(f"PW-{counter:03d}", "password", f"Strength of '{pw}'", "password_check", "/password", "Password",
        input=pw, expected=analyze_password_label(pw))
    counter += 1
    idx += 1

# 5) Breach — 60 emails/phones
domains = ["gmail.com", "yahoo.com", "outlook.com", "protonmail.com"]
locals_ = ["john", "test", "admin", "alice", "bob", "demo", "user123", "secure", "breach.me", "normalperson", "hello", "contactme"]
bn = 1
for i in range(48):
    local = locals_[i % len(locals_)] + (str(i) if i % 3 == 0 else "")
    email = f"{local}@{domains[i % len(domains)]}"
    add(f"BR-{bn:03d}", "breach", f"Breach check email: {email}", "breach_check", "/breach", "Breach",
        input=email, tab="email", expected=check_breach(email))
    bn += 1
for i in range(12):
    phone = f"+9198{i:02d}56{i:04d}"
    add(f"BR-{bn:03d}", "breach", f"Breach check phone: {phone}", "breach_check", "/breach", "Breach",
        input=phone, tab="phone", expected=check_breach(phone))
    bn += 1

# 6) Wi-Fi — 40 (5 encryption x 2 public x 2 password x 2 ssids)
encryptions = ["WPA3", "WPA2", "WPA", "WEP", "Open"]
ssids = ["HomeWiFi", "CafePublic_Free"]
wn = 1
for ssid in ssids:
    for enc in encryptions:
        for is_public in (False, True):
            for has_pw in (True, False):
                if wn > 40:
                    break
                add(f"WF-{wn:03d}", "wifi", f"WiFi {enc}/{'pub' if is_public else 'priv'}/{'pw' if has_pw else 'nopw'}",
                    "wifi_analyze", "/wifi", "Wi-Fi",
                    input=ssid, encryption=enc, is_public=is_public, has_password=has_pw,
                    expected=analyze_wifi_risk(enc, is_public, has_pw))
                wn += 1

# 7) Malware — 4 sample apps
SAMPLE_APPS = {
    "WhatsApp": ["Camera", "Microphone", "Contacts", "Storage", "Internet", "Location"],
    "PhonePe": ["Camera", "Internet", "Location", "Contacts"],
    "FlashLight Ultra": ["SMS", "Contacts", "Location", "Storage", "Internet"],
    "BatteryFast Pro": ["Camera", "Microphone", "Contacts", "SMS", "Location", "Background", "Boot", "CallLogs"],
}
mn = 1
for app, perms in SAMPLE_APPS.items():
    add(f"MW-{mn:03d}", "malware", f"Analyze sample app: {app}", "malware_sample", "/malware", "Malware",
        app=app, expected=analyze_app_risk(perms))
    mn += 1

# 8) Validation / negative — empty inputs must not crash and should warn
add("VL-001", "validation", "Phishing scan with empty input shows validation", "validation_empty", "/phishing", "Phishing", expected="no_result", control="Scan Now")
add("VL-002", "validation", "Breach check with empty input shows validation", "validation_empty", "/breach", "Breach", expected="no_result", control="Check Breach")

# 9) 404 route
add("NF-001", "notfound", "Unknown route renders 404 page", "notfound", "/nope-not-real", "NotFound", expected="404")

# --------------------------------------------------------------------------- #
data = {"count": len(cases), "cases": cases}
OUT.write_text(json.dumps(data, indent=2), encoding="utf-8")
print(f"Wrote {len(cases)} cases to {OUT}")

# Category breakdown
from collections import Counter
for cat, c in sorted(Counter(x["category"] for x in cases).items()):
    print(f"  {cat:12s} {c}")
