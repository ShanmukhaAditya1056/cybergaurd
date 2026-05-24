/**
 * CyberGuard AI — Permission Utilities
 * Central module for reading and checking device permissions and cookie consent
 * stored in localStorage. All pages should use these helpers to enforce denials.
 */

const PERMISSIONS_KEY = 'cyberguard_device_permissions';
const COOKIE_CONSENT_KEY = 'cyberguard_cookie_consent';

/**
 * Get the current device permissions from localStorage.
 * Returns an object with boolean flags for each scan category.
 * Defaults to all-granted if no permissions have been saved yet.
 */
export function getDevicePermissions() {
  try {
    const raw = localStorage.getItem(PERMISSIONS_KEY);
    if (!raw) {
      // No permissions saved yet — default to all granted
      return {
        systemScan: true,
        networkScan: true,
        wifiScan: true,
        processScan: true,
      };
    }
    const parsed = JSON.parse(raw);
    return {
      systemScan: parsed.systemScan !== false, // Required, always true
      networkScan: parsed.networkScan !== false,
      wifiScan: parsed.wifiScan !== false,
      processScan: parsed.processScan !== false,
    };
  } catch {
    return {
      systemScan: true,
      networkScan: true,
      wifiScan: true,
      processScan: true,
    };
  }
}

/**
 * Check if a specific device permission is granted.
 * @param {'systemScan' | 'networkScan' | 'wifiScan' | 'processScan'} key
 * @returns {boolean}
 */
export function isPermissionGranted(key) {
  const perms = getDevicePermissions();
  return perms[key] !== false;
}

/**
 * Get the current cookie consent from localStorage.
 * Returns an object with boolean flags for each cookie category.
 */
export function getCookieConsent() {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) {
      return { accepted: false, essential: false, analytics: false, functional: false };
    }
    const parsed = JSON.parse(raw);
    return {
      accepted: parsed.accepted === true,
      essential: parsed.essential !== false,
      analytics: parsed.analytics === true,
      functional: parsed.functional === true,
    };
  } catch {
    return { accepted: false, essential: false, analytics: false, functional: false };
  }
}

/**
 * Save updated device permissions to localStorage and dispatch
 * a storage event so other components can react in real time.
 */
export function saveDevicePermissions(permissions) {
  const perms = {
    systemScan: true, // Always required
    networkScan: permissions.networkScan !== false,
    wifiScan: permissions.wifiScan !== false,
    processScan: permissions.processScan !== false,
    grantedAt: new Date().toISOString(),
  };
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(perms));

  // Dispatch a custom event so components can react without polling
  window.dispatchEvent(new CustomEvent('cyberguard-permissions-changed', { detail: perms }));
}

/**
 * Build the permissions payload to send to the server with scan requests.
 * The server will skip scanning denied categories.
 */
export function buildScanPermissionsPayload() {
  const perms = getDevicePermissions();
  return {
    processScan: perms.processScan,
    networkScan: perms.networkScan,
    wifiScan: perms.wifiScan,
  };
}

export { PERMISSIONS_KEY, COOKIE_CONSENT_KEY };
