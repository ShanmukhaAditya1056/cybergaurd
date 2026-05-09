"""
CyberGuard AI — Master Training Script
Trains all ML models in sequence
"""
import subprocess
import sys
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

print("=" * 60)
print("  CYBERGUARD AI — TRAINING ALL ML MODELS")
print("=" * 60)
print()

scripts = [
    ("Phishing URL Classifier", "train_phishing.py"),
    ("Malware App Classifier", "train_malware.py"),
]

for name, script in scripts:
    print(f"\n{'='*60}")
    print(f"  Training: {name}")
    print(f"  Script: {script}")
    print(f"{'='*60}\n")
    
    result = subprocess.run([sys.executable, script], capture_output=False)
    
    if result.returncode != 0:
        print(f"\n[FAILED] {name}")
        sys.exit(1)
    
    print(f"\n[OK] {name} -- Complete!")

print("\n" + "=" * 60)
print("  ALL MODELS TRAINED SUCCESSFULLY!")
print("=" * 60)

# List saved models
models_dir = "trained_models"
if os.path.exists(models_dir):
    print(f"\nSaved models in {models_dir}/:")
    for f in sorted(os.listdir(models_dir)):
        size = os.path.getsize(os.path.join(models_dir, f))
        size_str = f"{size/1024:.1f} KB" if size < 1024*1024 else f"{size/(1024*1024):.1f} MB"
        print(f"  > {f} ({size_str})")

print("\n>> Ready to start ML service: python app.py")
