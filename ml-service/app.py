"""
CyberGuard AI -- ML Prediction Service (FastAPI)
Serves trained models for phishing and malware prediction with real SHAP explanations
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd
import re
import shap
import os
from collections import Counter

# ============================================================
# Load trained models
# ============================================================
MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "trained_models")

# Phishing models
phishing_model = joblib.load(os.path.join(MODELS_DIR, "phishing_model.pkl"))
phishing_features = joblib.load(os.path.join(MODELS_DIR, "phishing_features.pkl"))
phishing_tfidf_model = joblib.load(os.path.join(MODELS_DIR, "phishing_tfidf_model.pkl"))
phishing_tfidf_vectorizer = joblib.load(os.path.join(MODELS_DIR, "phishing_tfidf_vectorizer.pkl"))

# Malware models
malware_model = joblib.load(os.path.join(MODELS_DIR, "malware_model.pkl"))
malware_rf_model = joblib.load(os.path.join(MODELS_DIR, "malware_rf_model.pkl"))
malware_permissions = joblib.load(os.path.join(MODELS_DIR, "malware_permissions.pkl"))

# SHAP explainers (initialized lazily)
_malware_explainer = None
_phishing_explainer = None

print("[ML Service] All models loaded successfully!")

# ============================================================
# FastAPI App
# ============================================================
app = FastAPI(
    title="CyberGuard AI ML Service",
    version="1.0.0",
    description="Real-time ML predictions for phishing and malware detection"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# Request/Response Models
# ============================================================
class PhishingRequest(BaseModel):
    url: str

class MalwareRequest(BaseModel):
    app_name: str
    permissions: list[str]

class HealthResponse(BaseModel):
    status: str
    models_loaded: dict
    version: str

# ============================================================
# Feature Extraction (same as training)
# ============================================================
def extract_url_features(url: str) -> dict:
    url_lower = url.lower().strip()
    
    # Normalize: ensure URL has a scheme for proper parsing
    normalized = url_lower
    if not normalized.startswith('http://') and not normalized.startswith('https://'):
        normalized = 'http://' + normalized
    
    # Safely extract domain and path
    parts = normalized.split('/')
    domain = parts[2] if len(parts) > 2 else normalized
    domain_parts = domain.split('.')
    
    features = {
        'url_length': len(url),
        'num_dots': url.count('.'),
        'num_hyphens': url.count('-'),
        'num_underscores': url.count('_'),
        'num_slashes': url.count('/'),
        'num_at': url.count('@'),
        'num_question': url.count('?'),
        'num_ampersand': url.count('&'),
        'num_equals': url.count('='),
        'num_digits': sum(c.isdigit() for c in url),
        'digit_ratio': sum(c.isdigit() for c in url) / max(len(url), 1),
        'has_ip': 1 if re.search(r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', url) else 0,
        'has_https': 1 if url_lower.startswith('https') else 0,
        'has_http': 1 if url_lower.startswith('http://') else 0,
        'num_subdomains': max(0, len(domain_parts) - 2),
        'path_length': len(normalized.split('/', 3)[-1]) if len(normalized.split('/')) > 3 else 0,
    }
    
    suspicious_keywords = [
        'login', 'verify', 'update', 'secure', 'account', 'banking',
        'confirm', 'suspend', 'alert', 'urgent', 'password', 'click',
        'kyc', 'aadhaar', 'pan', 'upi', 'paytm', 'sbi', 'hdfc', 'icici',
        'otp', 'reward', 'prize', 'winner', 'claim', 'free', 'offer',
        'limited', 'expire', 'blocked', 'unauthorized', 'refund',
        'phonepe', 'gpay', 'amazon', 'flipkart', 'whatsapp', 'telegram'
    ]
    
    features['suspicious_keyword_count'] = sum(1 for kw in suspicious_keywords if kw in url_lower)
    features['has_suspicious_keyword'] = 1 if features['suspicious_keyword_count'] > 0 else 0
    
    suspicious_tlds = ['.xyz', '.top', '.club', '.work', '.tk', '.ml', '.ga', '.cf', '.gq', '.buzz', '.icu', '.cam']
    features['has_suspicious_tld'] = 1 if any(url_lower.endswith(tld) for tld in suspicious_tlds) else 0
    
    legit_tlds = ['.gov.in', '.nic.in', '.ac.in', '.edu', '.gov', '.org', '.co.in']
    features['has_legit_tld'] = 1 if any(url_lower.endswith(tld) for tld in legit_tlds) else 0
    
    brand_patterns = ['paypal', 'google', 'apple', 'microsoft', 'amazon', 'facebook',
                      'netflix', 'sbi', 'hdfc', 'icici', 'paytm', 'phonepe', 'gpay']
    
    # Safely check for brand impersonation in subdomain
    brand_in_sub = 0
    try:
        if len(domain_parts) > 2:
            subdomain = domain_parts[0].lower()
            main_domain = domain_parts[-2].lower()
            for brand in brand_patterns:
                if brand in subdomain and brand not in main_domain:
                    brand_in_sub = 1
                    break
    except Exception:
        pass
    features['brand_in_subdomain'] = brand_in_sub
    
    char_freq = Counter(url)
    url_len = max(len(url), 1)
    entropy = -sum((count/url_len) * np.log2(count/url_len) for count in char_freq.values())
    features['url_entropy'] = entropy
    
    features['num_percent'] = url.count('%')
    features['has_encoded_chars'] = 1 if '%' in url else 0
    
    return features

# ============================================================
# SHAP Explanation Helpers
# ============================================================
FEATURE_DESCRIPTIONS = {
    'url_length': 'URL character length',
    'num_dots': 'Number of dots in URL',
    'num_hyphens': 'Number of hyphens',
    'num_underscores': 'Number of underscores',
    'num_slashes': 'Number of path separators',
    'num_at': 'Contains @ symbol (credential theft indicator)',
    'num_question': 'Query parameters count',
    'num_ampersand': 'Multiple query parameters',
    'num_equals': 'Parameter assignments',
    'num_digits': 'Numeric characters count',
    'digit_ratio': 'Ratio of digits to total characters',
    'has_ip': 'Uses IP address instead of domain',
    'has_https': 'Uses HTTPS (secure protocol)',
    'has_http': 'Uses plain HTTP (insecure)',
    'num_subdomains': 'Subdomain depth',
    'path_length': 'URL path length',
    'suspicious_keyword_count': 'Phishing keyword frequency',
    'has_suspicious_keyword': 'Contains phishing keywords',
    'has_suspicious_tld': 'Uses suspicious TLD (.xyz, .tk, etc.)',
    'has_legit_tld': 'Uses trusted TLD (.gov.in, .ac.in, etc.)',
    'brand_in_subdomain': 'Brand name in subdomain (impersonation)',
    'url_entropy': 'URL randomness/entropy',
    'num_percent': 'URL-encoded characters',
    'has_encoded_chars': 'Contains encoded characters',
}

PERM_DESCRIPTIONS = {
    'INTERNET': 'Network access',
    'ACCESS_NETWORK_STATE': 'Network state monitoring',
    'ACCESS_WIFI_STATE': 'WiFi state access',
    'READ_PHONE_STATE': 'Device identity access',
    'WRITE_EXTERNAL_STORAGE': 'Write to storage',
    'READ_EXTERNAL_STORAGE': 'Read from storage',
    'CAMERA': 'Camera access',
    'RECORD_AUDIO': 'Microphone access',
    'ACCESS_FINE_LOCATION': 'Precise GPS location',
    'ACCESS_COARSE_LOCATION': 'Approximate location',
    'READ_CONTACTS': 'Read contacts',
    'WRITE_CONTACTS': 'Modify contacts',
    'READ_SMS': 'Read SMS messages',
    'SEND_SMS': 'Send SMS (premium risk)',
    'RECEIVE_SMS': 'Intercept incoming SMS',
    'READ_CALL_LOG': 'Read call history',
    'WRITE_CALL_LOG': 'Modify call history',
    'CALL_PHONE': 'Make phone calls',
    'RECEIVE_BOOT_COMPLETED': 'Auto-start on boot',
    'WAKE_LOCK': 'Prevent device sleep',
    'VIBRATE': 'Vibration control',
    'GET_ACCOUNTS': 'Access account list',
    'USE_CREDENTIALS': 'Use stored credentials',
    'MANAGE_ACCOUNTS': 'Manage user accounts',
    'READ_CALENDAR': 'Read calendar events',
    'WRITE_CALENDAR': 'Modify calendar',
    'SYSTEM_ALERT_WINDOW': 'Draw over other apps (overlay)',
    'INSTALL_PACKAGES': 'Install other apps',
    'DELETE_PACKAGES': 'Delete apps',
    'CHANGE_WIFI_STATE': 'Modify WiFi settings',
    'BLUETOOTH': 'Bluetooth access',
    'NFC': 'NFC access',
    'REQUEST_INSTALL_PACKAGES': 'Request app installation',
    'BIND_DEVICE_ADMIN': 'Device admin privileges',
    'READ_PHONE_NUMBERS': 'Read phone numbers',
    'PROCESS_OUTGOING_CALLS': 'Monitor outgoing calls',
}

def get_malware_explainer():
    global _malware_explainer
    if _malware_explainer is None:
        _malware_explainer = shap.TreeExplainer(malware_rf_model)
    return _malware_explainer


def get_phishing_explainer():
    """TreeExplainer on the GradientBoosting sub-model of the voting ensemble.
    Gives real per-prediction SHAP values for the phishing feature model."""
    global _phishing_explainer
    if _phishing_explainer is None:
        gb_model = phishing_model.named_estimators_['gb']
        _phishing_explainer = shap.TreeExplainer(gb_model)
    return _phishing_explainer

# ============================================================
# API Endpoints
# ============================================================
@app.get("/")
async def root():
    return {
        "service": "CyberGuard AI ML Service",
        "version": "1.0.0",
        "endpoints": ["/health", "/predict/phishing", "/predict/malware"]
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return {
        "status": "healthy",
        "models_loaded": {
            "phishing_feature_model": True,
            "phishing_tfidf_model": True,
            "malware_ensemble": True,
            "malware_rf_shap": True,
        },
        "version": "1.0.0"
    }


@app.post("/predict/phishing")
async def predict_phishing(req: PhishingRequest):
    url = req.url
    
    # Extract features
    features = extract_url_features(url)
    feature_df = pd.DataFrame([features])[phishing_features]
    
    # Feature-based prediction
    feature_proba = phishing_model.predict_proba(feature_df)[0]
    
    # TF-IDF prediction
    tfidf_vec = phishing_tfidf_vectorizer.transform([url])
    tfidf_proba = phishing_tfidf_model.predict_proba(tfidf_vec)[0]
    
    # Combine predictions (weighted average)
    combined_proba = 0.6 * feature_proba + 0.4 * tfidf_proba
    is_phishing = combined_proba[1] > 0.5
    confidence = round(float(max(combined_proba)) * 100, 1)
    
    # Real per-prediction SHAP explanations from the GradientBoosting sub-model.
    # SHAP value sign tells us whether each feature pushed the prediction toward
    # phishing (positive) or safe (negative) for THIS specific URL.
    feature_vals = feature_df.iloc[0]
    feature_contributions = []
    try:
        explainer = get_phishing_explainer()
        shap_values = explainer.shap_values(feature_df)
        sv = np.asarray(shap_values)
        # Binary GB returns shape (1, n_features); normalize to 1-D
        if sv.ndim == 3:          # (n_classes, n_samples, n_features)
            sv = sv[1]
        sv_raw = sv.reshape(-1)[:len(phishing_features)]

        # Normalize magnitudes to a relative 0-100 scale (GB SHAP values are
        # log-odds contributions that can exceed 1, which would peg the UI bars).
        max_abs = max((abs(float(v)) for v in sv_raw), default=0.0) or 1.0
        for i, fname in enumerate(phishing_features):
            val = float(sv_raw[i])
            if abs(val) > 1e-4:
                feature_contributions.append({
                    "feature": fname,
                    "score": round(abs(val) / max_abs * 100, 1),
                    "value": float(feature_vals.iloc[i]),
                    # positive SHAP -> pushed toward PHISHING, negative -> toward SAFE
                    "direction": "positive" if val > 0 else "negative",
                    "description": FEATURE_DESCRIPTIONS.get(fname, fname)
                })
    except Exception as e:
        print(f"[SHAP Warning] phishing: {e}")
        # Fallback: GB feature importances (not per-prediction, but never empty)
        importances = phishing_model.named_estimators_['gb'].feature_importances_
        for i, fname in enumerate(phishing_features):
            if importances[i] > 0.01:
                feature_contributions.append({
                    "feature": fname,
                    "score": round(float(importances[i] * 100), 1),
                    "value": float(feature_vals.iloc[i]),
                    "direction": "positive" if is_phishing else "negative",
                    "description": FEATURE_DESCRIPTIONS.get(fname, fname)
                })

    # Sort by contribution magnitude and take top 6
    feature_contributions.sort(key=lambda x: x['score'], reverse=True)
    shap_reasons = feature_contributions[:6]
    
    # Determine threat level
    if is_phishing:
        if confidence >= 90:
            threat_level = "CRITICAL"
        elif confidence >= 70:
            threat_level = "HIGH"
        else:
            threat_level = "MEDIUM"
    else:
        threat_level = "LOW"
    
    # Extract domain
    try:
        domain = url.split('/')[2] if len(url.split('/')) > 2 else url
    except:
        domain = url
    
    return {
        "verdict": "PHISHING" if is_phishing else "SAFE",
        "confidence": confidence,
        "threat_level": threat_level,
        "domain": domain,
        "url": url,
        "model_used": "TF-IDF + Feature Ensemble (LR + GradientBoosting)",
        "shap_reasons": shap_reasons
    }


@app.post("/predict/malware")
async def predict_malware(req: MalwareRequest):
    # Convert permissions to feature vector
    perm_vector = [1 if p in req.permissions else 0 for p in malware_permissions]
    perm_df = pd.DataFrame([perm_vector], columns=malware_permissions)

    # Model prediction
    proba = malware_model.predict_proba(perm_df)[0]
    model_score = round(float(proba[1]) * 100)

    # ----------------------------------------------------------------
    # Rule-based risk floor.
    # The model is trained on synthetic profiles where malware samples
    # carry many permissions, so it correlates permission COUNT with
    # maliciousness and can under-score a short-but-dangerous set
    # (e.g. SEND_SMS + BIND_DEVICE_ADMIN + SYSTEM_ALERT_WINDOW).
    # We floor the score on individually dangerous permissions and on
    # known dangerous combinations so those can never come back as LOW.
    # ----------------------------------------------------------------
    perms_set = set(req.permissions)
    rule_floor = 0

    # Individually high-risk permissions
    dangerous_perms = {
        'SEND_SMS': 45, 'READ_SMS': 40, 'RECEIVE_SMS': 40,
        'BIND_DEVICE_ADMIN': 55, 'SYSTEM_ALERT_WINDOW': 35,
        'INSTALL_PACKAGES': 40, 'REQUEST_INSTALL_PACKAGES': 35,
        'DELETE_PACKAGES': 40, 'PROCESS_OUTGOING_CALLS': 35,
        'READ_CALL_LOG': 25, 'USE_CREDENTIALS': 25,
    }
    for perm, floor in dangerous_perms.items():
        if perm in perms_set:
            rule_floor = max(rule_floor, floor)

    # Known dangerous permission combinations (description, risk floor).
    # Each present combo both raises the risk floor and is surfaced to the
    # client as a "GNN-style" relationship finding.
    combo_rules = [
        ({'SEND_SMS', 'READ_CONTACTS'}, 70,
         "SMS + Contacts: Can spread via SMS to all contacts"),
        ({'CAMERA', 'RECORD_AUDIO', 'INTERNET'}, 75,
         "Camera + Mic + Internet: Potential surveillance capability"),
        ({'SYSTEM_ALERT_WINDOW', 'BIND_DEVICE_ADMIN'}, 90,
         "Overlay + Admin: Ransomware pattern detected"),
        ({'READ_SMS', 'RECEIVE_SMS', 'INTERNET'}, 85,
         "SMS interception + Internet: OTP theft capability"),
        ({'RECEIVE_BOOT_COMPLETED', 'INSTALL_PACKAGES'}, 80,
         "Auto-start + Install: Self-propagation capability"),
        ({'GET_ACCOUNTS', 'USE_CREDENTIALS'}, 70,
         "Account access + Credentials: Identity theft risk"),
    ]
    dangerous_combos = []
    for required, floor, description in combo_rules:
        if required.issubset(perms_set):
            dangerous_combos.append(description)
            rule_floor = max(rule_floor, floor)

    risk_score = max(model_score, rule_floor)

    # Risk level
    if risk_score >= 80:
        risk_level = "CRITICAL"
    elif risk_score >= 60:
        risk_level = "HIGH"
    elif risk_score >= 30:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"
    
    # Real SHAP explanations
    try:
        explainer = get_malware_explainer()
        shap_values = explainer.shap_values(perm_df)
        
        # Handle different SHAP output shapes
        if isinstance(shap_values, list):
            sv_raw = np.asarray(shap_values[1]).flatten()
        else:
            sv_raw = np.asarray(shap_values).flatten()
        
        # If sv_raw is longer than permissions (e.g. 2D), take first n_permissions values
        if len(sv_raw) > len(malware_permissions):
            sv_raw = sv_raw[:len(malware_permissions)]
        
        shap_reasons = []
        for i, perm in enumerate(malware_permissions):
            if i < len(sv_raw):
                val = float(sv_raw[i])
                if abs(val) > 0.001:
                    shap_reasons.append({
                        "feature": perm,
                        "score": round(abs(val) * 100, 1),
                        "direction": "positive" if val > 0 else "negative",
                        "description": PERM_DESCRIPTIONS.get(perm, perm),
                        "present": bool(perm_vector[i])
                    })
        
        shap_reasons.sort(key=lambda x: x['score'], reverse=True)
        shap_reasons = shap_reasons[:8]
    except Exception as e:
        print(f"[SHAP Warning] {e}")
        # Fallback: use RF feature importances instead of SHAP
        importances = malware_rf_model.feature_importances_
        shap_reasons = []
        for i, perm in enumerate(malware_permissions):
            if importances[i] > 0.01 and perm_vector[i]:
                shap_reasons.append({
                    "feature": perm,
                    "score": round(float(importances[i]) * 100, 1),
                    "direction": "positive",
                    "description": PERM_DESCRIPTIONS.get(perm, perm),
                    "present": True
                })
        shap_reasons.sort(key=lambda x: x['score'], reverse=True)
        shap_reasons = shap_reasons[:8]
    
    # GNN-style analysis note (dangerous_combos detected above)
    gnn_note = None
    if dangerous_combos:
        gnn_note = "Permission relationship analysis: " + "; ".join(dangerous_combos[:3])
    elif risk_level in ["CRITICAL", "HIGH"]:
        gnn_note = f"High-risk permission cluster detected. {len(req.permissions)} permissions with {sum(perm_vector)} active."
    else:
        gnn_note = "Permission graph shows normal app behavior patterns."
    
    return {
        "app_name": req.app_name,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "model_used": "Random Forest + GradientBoosting Ensemble",
        "shap_reasons": shap_reasons,
        "gnn_note": gnn_note,
        "permission_count": len(req.permissions),
        "dangerous_combinations": dangerous_combos
    }


# ============================================================
# Run
# ============================================================
if __name__ == "__main__":
    import uvicorn
    print("\n" + "=" * 50)
    print("  CyberGuard AI ML Service")
    print("  Port: 8000")
    print("=" * 50 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)
