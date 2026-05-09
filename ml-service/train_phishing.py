"""
CyberGuard AI — Phishing URL Classifier Training
Model: TF-IDF + Logistic Regression
Features: URL structural analysis (length, special chars, suspicious keywords, TLD, etc.)
"""
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import GradientBoostingClassifier, VotingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.pipeline import Pipeline
import joblib
import os
import re

# ============================================================
# STEP 1: Generate training dataset
# In production, you'd use PhishTank/Kaggle datasets.
# This uses a curated list of real phishing URL patterns.
# ============================================================

def extract_url_features(url):
    """Extract structural features from a URL for classification"""
    url_lower = url.lower()
    
    # Basic features
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
        'num_subdomains': len(url.split('/')[2].split('.')) - 2 if len(url.split('/')) > 2 else 0,
        'path_length': len(url.split('/', 3)[-1]) if len(url.split('/')) > 3 else 0,
    }
    
    # Suspicious keywords (common in Indian phishing)
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
    
    # Suspicious TLDs
    suspicious_tlds = ['.xyz', '.top', '.club', '.work', '.tk', '.ml', '.ga', '.cf', '.gq', '.buzz', '.icu', '.cam']
    features['has_suspicious_tld'] = 1 if any(url_lower.endswith(tld) for tld in suspicious_tlds) else 0
    
    # Legitimate TLDs
    legit_tlds = ['.gov.in', '.nic.in', '.ac.in', '.edu', '.gov', '.org', '.co.in']
    features['has_legit_tld'] = 1 if any(url_lower.endswith(tld) for tld in legit_tlds) else 0
    
    # Brand impersonation (misspelling patterns)
    brand_patterns = [
        'paypal', 'google', 'apple', 'microsoft', 'amazon', 'facebook',
        'netflix', 'sbi', 'hdfc', 'icici', 'paytm', 'phonepe', 'gpay'
    ]
    domain = url.split('/')[2] if len(url.split('/')) > 2 else url
    features['brand_in_subdomain'] = 1 if any(brand in domain.split('.')[0].lower() for brand in brand_patterns if brand not in domain.split('.')[-2].lower()) else 0
    
    # URL entropy (randomness indicator)
    from collections import Counter
    char_freq = Counter(url)
    url_len = max(len(url), 1)
    entropy = -sum((count/url_len) * np.log2(count/url_len) for count in char_freq.values())
    features['url_entropy'] = entropy
    
    # Encoded characters
    features['num_percent'] = url.count('%')
    features['has_encoded_chars'] = 1 if '%' in url else 0
    
    return features

# Training URLs — curated dataset of real phishing patterns and legitimate URLs
phishing_urls = [
    # Indian banking phishing
    "http://sbi-online-verify.xyz/login",
    "http://hdfc-netbanking-update.tk/secure",
    "http://icici-account-verify.ml/banking",
    "http://axis-bank-kyc-update.ga/verify",
    "http://kotak-mahindra-secure.cf/update",
    "http://bobonline-banking.buzz/login.php",
    "http://pnb-netbanking-alert.top/urgent",
    "http://canara-bank-suspend.work/reactivate",
    "http://union-bank-blocked.club/unlock",
    "http://yes-bank-otp-verify.icu/confirm",
    
    # UPI/wallet phishing
    "http://paytm-kyc-update.xyz/verify-now",
    "http://phonepe-reward-claim.tk/winner",
    "http://googlepay-cashback.ml/claim-prize",
    "http://amazon-pay-refund.ga/login",
    "http://upi-verification-required.xyz/update",
    "http://bhim-upi-blocked.top/reactivate",
    "http://freecharge-offer.buzz/claim",
    "http://mobikwik-kyc-expire.work/update",
    
    # Government impersonation
    "http://aadhaar-update-online.xyz/verify",
    "http://pan-card-link-aadhaar.tk/update",
    "http://incometax-refund-claim.ml/login",
    "http://epfo-pf-withdrawal.ga/apply",
    "http://digilocker-verify.cf/login",
    
    # E-commerce phishing
    "http://flipkart-winner-prize.xyz/claim",
    "http://amazon-order-cancel.tk/verify-payment",
    "http://myntra-sale-offer.ml/login",
    "http://meesho-supplier-verify.ga/register",
    
    # Social media phishing
    "http://whatsapp-verify-number.xyz/login",
    "http://instagram-login-verify.tk/secure",
    "http://facebook-account-suspended.ml/reactivate",
    "http://telegram-premium-free.ga/claim",
    
    # Generic phishing patterns
    "http://192.168.1.1/admin/login.php?redirect=bank",
    "http://secure-login-verify.xyz/account/update",
    "http://your-account-blocked.top/reactivate-now",
    "http://click-here-urgent.buzz/password-reset",
    "http://limited-time-offer-free.icu/claim-reward",
    "http://verify-your-identity.work/upload-documents",
    "http://update-payment-info.club/billing",
    "http://confirm-transaction-otp.cam/verify",
    "http://suspend-notice-urgent.xyz/respond",
    "http://unauthorized-login-alert.tk/secure-account",
    "http://reward-points-expire.ml/redeem-now",
    "http://free-gift-card-winner.ga/claim-prize",
    "http://account-security-alert.cf/verify-identity",
    "http://urgent-action-required.buzz/update-info",
    "http://lottery-winner-congrats.top/collect-prize",
    "http://bank-statement-download.work/login",
    "http://tax-refund-pending.club/claim",
    "http://password-expired-reset.icu/change-now",
    
    # Obfuscated URLs
    "http://bit.ly/3xR4yZ5",
    "http://tinyurl.com/verify-account-now",
    "http://xn--scure-login-8bb.xyz/verify",
]

legitimate_urls = [
    # Indian banking (real domains)
    "https://onlinesbi.sbi/",
    "https://netbanking.hdfcbank.com/",
    "https://www.icicibank.com/",
    "https://www.axisbank.com/",
    "https://www.kotak.com/",
    "https://www.bobfinancial.com/",
    "https://www.pnbindia.in/",
    "https://www.canarabank.com/",
    "https://www.unionbankofindia.co.in/",
    "https://www.yesbank.in/",
    
    # UPI/wallets (real)
    "https://paytm.com/",
    "https://www.phonepe.com/",
    "https://pay.google.com/",
    "https://pay.amazon.in/",
    "https://www.bhimupi.org.in/",
    "https://www.freecharge.in/",
    "https://www.mobikwik.com/",
    
    # Government (real)
    "https://uidai.gov.in/",
    "https://www.incometax.gov.in/",
    "https://www.epfindia.gov.in/",
    "https://www.digilocker.gov.in/",
    "https://www.india.gov.in/",
    "https://www.mygov.in/",
    
    # E-commerce (real)
    "https://www.flipkart.com/",
    "https://www.amazon.in/",
    "https://www.myntra.com/",
    "https://www.meesho.com/",
    "https://www.snapdeal.com/",
    "https://www.ajio.com/",
    
    # Social media (real)
    "https://www.whatsapp.com/",
    "https://www.instagram.com/",
    "https://www.facebook.com/",
    "https://web.telegram.org/",
    "https://twitter.com/",
    "https://www.linkedin.com/",
    
    # Tech (real)
    "https://www.google.com/",
    "https://www.microsoft.com/",
    "https://www.apple.com/",
    "https://github.com/",
    "https://stackoverflow.com/",
    "https://www.wikipedia.org/",
    
    # News (real)
    "https://www.ndtv.com/",
    "https://www.thehindu.com/",
    "https://timesofindia.indiatimes.com/",
    "https://www.hindustantimes.com/",
    
    # Education (real)
    "https://www.iitb.ac.in/",
    "https://www.iitd.ac.in/",
    "https://nptel.ac.in/",
    "https://www.ugc.gov.in/",
    
    # Misc legitimate
    "https://www.zomato.com/",
    "https://www.swiggy.com/",
    "https://www.ola.com/",
    "https://www.uber.com/in/",
    "https://www.irctc.co.in/",
    "https://www.makemytrip.com/",
    "https://www.redbus.in/",
    "https://mail.google.com/",
    "https://outlook.live.com/",
    "https://www.youtube.com/",
]

print("=" * 60)
print("CYBERGUARD AI — PHISHING MODEL TRAINING")
print("=" * 60)

# Build feature dataset
print("\n[1/4] Extracting URL features...")
all_urls = phishing_urls + legitimate_urls
all_labels = [1] * len(phishing_urls) + [0] * len(legitimate_urls)

features_list = []
for url in all_urls:
    features_list.append(extract_url_features(url))

df = pd.DataFrame(features_list)
df['label'] = all_labels

print(f"  Dataset: {len(phishing_urls)} phishing + {len(legitimate_urls)} legitimate = {len(all_urls)} total")
print(f"  Features per URL: {len(df.columns) - 1}")

# Split data
X = df.drop('label', axis=1)
y = df['label']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# Train model
print("\n[2/4] Training ensemble classifier...")
lr = LogisticRegression(max_iter=1000, random_state=42, C=1.0)
gb = GradientBoostingClassifier(n_estimators=100, max_depth=4, random_state=42)

ensemble = VotingClassifier(
    estimators=[('lr', lr), ('gb', gb)],
    voting='soft'
)
ensemble.fit(X_train, y_train)

# Evaluate
print("\n[3/4] Evaluating model...")
y_pred = ensemble.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"  Accuracy: {accuracy * 100:.1f}%")
print("\n  Classification Report:")
print(classification_report(y_test, y_pred, target_names=['SAFE', 'PHISHING']))

# Save model and feature extractor
print("\n[4/4] Saving model...")
os.makedirs('trained_models', exist_ok=True)
joblib.dump(ensemble, 'trained_models/phishing_model.pkl')
joblib.dump(list(X.columns), 'trained_models/phishing_features.pkl')

# Also train TF-IDF on raw URL text for secondary analysis
tfidf = TfidfVectorizer(analyzer='char_wb', ngram_range=(3, 5), max_features=3000)
X_tfidf = tfidf.fit_transform(all_urls)
lr_tfidf = LogisticRegression(max_iter=1000, random_state=42)
lr_tfidf.fit(X_tfidf, y)
joblib.dump(lr_tfidf, 'trained_models/phishing_tfidf_model.pkl')
joblib.dump(tfidf, 'trained_models/phishing_tfidf_vectorizer.pkl')

print(f"\n[OK] Phishing model saved to trained_models/")
print(f"   - phishing_model.pkl (Feature-based ensemble)")
print(f"   - phishing_tfidf_model.pkl (TF-IDF char n-gram model)")
print(f"   - phishing_features.pkl (Feature names)")
print(f"   - phishing_tfidf_vectorizer.pkl (TF-IDF vectorizer)")
