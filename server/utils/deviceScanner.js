/**
 * CyberGuard AI — Real Device Scanner Engine
 * Scans the actual Windows device using system commands:
 *   - Installed programs (registry via PowerShell)
 *   - Running processes (tasklist / Get-Process)
 *   - Startup items (registry startup keys)
 *   - Open network ports (netstat)
 *   - WiFi network info (netsh)
 */
const { exec } = require('child_process');
const os = require('os');

// ============================================================
// Risk Database — known suspicious indicators
// ============================================================
const SUSPICIOUS_PROCESS_NAMES = [
  'cryptominer', 'xmrig', 'minerd', 'cgminer', 'bfgminer',
  'nicehash', 'ethminer', 'claymore', 'phoenixminer',
  'keylogger', 'spyware', 'trojan', 'malware', 'backdoor',
  'rootkit', 'ransomware', 'adware', 'hijack',
  'coinhive', 'cryptonight', 'stratum',
];

const SUSPICIOUS_PORTS = [
  { port: 4444, reason: 'Metasploit / Meterpreter default' },
  { port: 5555, reason: 'Android Debug Bridge / common backdoor' },
  { port: 31337, reason: 'Back Orifice trojan' },
  { port: 12345, reason: 'NetBus trojan' },
  { port: 27374, reason: 'SubSeven trojan' },
  { port: 6667, reason: 'IRC (often used by botnets)' },
  { port: 6668, reason: 'IRC (often used by botnets)' },
  { port: 6669, reason: 'IRC (often used by botnets)' },
  { port: 1080, reason: 'SOCKS proxy (may indicate tunneling)' },
  { port: 9050, reason: 'Tor SOCKS proxy' },
  { port: 9051, reason: 'Tor control port' },
  { port: 3389, reason: 'RDP — Remote Desktop (check if intentional)' },
  { port: 5900, reason: 'VNC — Remote access (check if intentional)' },
  { port: 5901, reason: 'VNC — Remote access' },
  { port: 8080, reason: 'HTTP proxy / alt web server' },
  { port: 1337, reason: 'Common hacker / backdoor port' },
  { port: 65535, reason: 'Unusual max port — potential backdoor' },
];

// Process names that should always be considered safe
// Also matches via prefix: if a process name starts with any of these prefixes, it's safe
const KNOWN_SAFE_PROCESSES = [
  'explorer.exe', 'svchost.exe', 'csrss.exe', 'wininit.exe',
  'services.exe', 'lsass.exe', 'smss.exe', 'winlogon.exe',
  'dwm.exe', 'taskhostw.exe', 'sihost.exe', 'fontdrvhost.exe',
  'spoolsv.exe', 'searchhost.exe', 'runtimebroker.exe',
  'applicationframehost.exe', 'shellexperiencehost.exe',
  'startmenuexperiencehost.exe', 'textinputhost.exe',
  'ctfmon.exe', 'conhost.exe', 'dllhost.exe', 'mmc.exe',
  'taskmgr.exe', 'cmd.exe', 'powershell.exe', 'pwsh.exe',
  'code.exe', 'node.exe', 'python.exe', 'java.exe', 'javaw.exe',
  'chrome.exe', 'msedge.exe', 'firefox.exe', 'brave.exe',
  'opera.exe', 'iexplore.exe', 'searchindexer.exe',
  'securityhealthservice.exe', 'securityhealthsystray.exe',
  'msmpeng.exe', 'nissrv.exe', 'mpcmdrun.exe',
  'onedrive.exe', 'teams.exe', 'outlook.exe', 'winword.exe',
  'excel.exe', 'powerpnt.exe', 'discord.exe', 'slack.exe',
  'spotify.exe', 'steam.exe', 'steamwebhelper.exe',
  'nvidia share.exe', 'nvcontainer.exe', 'nvdisplay.container.exe',
  'amdrsserv.exe', 'audiodg.exe', 'system', 'idle',
  'registry', 'memory compression', 'system interrupts',
  'wslservice.exe', 'wsl.exe', 'ubuntu.exe',
];

// Prefixes for safe processes — any process starting with these is safe
const SAFE_PROCESS_PREFIXES = [
  'armoury', 'asus', 'refreshrate', 'lightingservice',
  'gamefirst', 'myasus', 'screenxpert', 'aac', 'aura',
  'nvcontainer', 'nvdisplay', 'nvspc', 'nvidia',
  'igcc', 'inteldal', 'intelcphs',
  'realtek', 'ralink',
  'dellsupportassist', 'hpcommrecovery',
  'lenovovantage', 'msedgewebview',
  'gamebar', 'xbox', 'widgets', 'widget',
  'phoneexperiencehost', 'yourphone',
  'crashpad', 'updater',
];

const KNOWN_SAFE_PUBLISHERS = [
  'microsoft', 'google', 'apple', 'mozilla', 'adobe',
  'intel', 'amd', 'nvidia', 'realtek', 'logitech',
  'dell', 'hp', 'lenovo', 'asus', 'acer', 'samsung',
  'asustek', 'asutek',
  'oracle', 'vmware', 'citrix', 'cisco', 'symantec',
  'mcafee', 'kaspersky', 'avast', 'avg', 'bitdefender',
  'malwarebytes', 'norton', 'eset', 'trend micro',
  'zoom video', 'slack technologies', 'discord', 'valve',
  'epic games', 'riot games', 'spotify', 'whatsapp',
  'telegram', 'signal', 'brave software', 'opera',
  'python software', 'node.js', 'git', 'github',
  'jetbrains', 'visual studio', 'postman',
  'wondershare', 'ccleaner', 'piriform',
  'corsair', 'razer', 'steelseries', 'hyperx',
  'obs project', 'audacity', 'gimp', 'blender',
  'iobit', 'wisecleaner', 'glarysoft',
];

// ============================================================
// Helper: Run a command and return stdout
// ============================================================
function runCommand(cmd, timeout = 15000) {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout, maxBuffer: 1024 * 1024 * 10, encoding: 'utf-8' }, (err, stdout, stderr) => {
      if (err) {
        // Return empty on timeout or error — don't crash
        resolve('');
        return;
      }
      resolve(stdout || '');
    });
  });
}

// ============================================================
// 1. Scan Installed Programs
// ============================================================
async function scanInstalledPrograms() {
  const programs = [];

  try {
    // Use PowerShell to read registry (works on Windows 10/11, no admin needed)
    const psCmd = `powershell -NoProfile -Command "` +
      `$paths = @(` +
      `'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',` +
      `'HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',` +
      `'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*'` +
      `); ` +
      `Get-ItemProperty $paths -ErrorAction SilentlyContinue | ` +
      `Where-Object { $_.DisplayName -ne $null } | ` +
      `Select-Object DisplayName, DisplayVersion, Publisher, InstallDate, EstimatedSize, InstallLocation | ` +
      `ConvertTo-Json -Compress"`;

    const output = await runCommand(psCmd, 20000);

    if (output.trim()) {
      let parsed;
      try {
        parsed = JSON.parse(output.trim());
      } catch {
        parsed = [];
      }
      if (!Array.isArray(parsed)) parsed = [parsed];

      for (const item of parsed) {
        if (!item.DisplayName) continue;

        const name = item.DisplayName || 'Unknown';
        const version = item.DisplayVersion || '';
        const publisher = item.Publisher || 'Unknown Publisher';
        const installDate = item.InstallDate || '';
        const sizeMB = item.EstimatedSize ? Math.round(item.EstimatedSize / 1024) : null;

        // Risk analysis
        const risk = analyzeInstalledProgramRisk(name, publisher, version);

        programs.push({
          name,
          version,
          publisher,
          installDate,
          sizeMB,
          ...risk,
        });
      }
    }
  } catch (err) {
    console.error('[DeviceScanner] Installed programs scan error:', err.message);
  }

  // Sort: high risk first, then alphabetical
  programs.sort((a, b) => b.riskScore - a.riskScore || a.name.localeCompare(b.name));

  return programs;
}

function analyzeInstalledProgramRisk(name, publisher, version) {
  const nameLower = name.toLowerCase();
  const pubLower = (publisher || '').toLowerCase();
  let riskScore = 0;
  const flags = [];

  // Check suspicious name patterns
  for (const keyword of SUSPICIOUS_PROCESS_NAMES) {
    if (nameLower.includes(keyword)) {
      riskScore += 60;
      flags.push(`Name contains suspicious keyword: "${keyword}"`);
    }
  }

  // Check if publisher is known safe
  const isKnownPublisher = KNOWN_SAFE_PUBLISHERS.some(p => pubLower.includes(p));
  if (isKnownPublisher) {
    riskScore = Math.max(0, riskScore - 20);
  } else if (!publisher || publisher === 'Unknown Publisher' || publisher.trim() === '') {
    riskScore += 15;
    flags.push('No publisher information — unverified software');
  }

  // Check for very old software (potential vulnerability)
  if (version) {
    const majorVersion = parseInt(version.split('.')[0], 10);
    if (!isNaN(majorVersion) && majorVersion === 0) {
      riskScore += 5;
      flags.push('Pre-release/beta software');
    }
  }

  // Toolkits that could be misused
  const hackTools = ['nmap', 'wireshark', 'burp', 'metasploit', 'cain', 'aircrack', 'hashcat', 'john the ripper'];
  for (const tool of hackTools) {
    if (nameLower.includes(tool)) {
      riskScore += 10;
      flags.push(`Security/penetration testing tool: "${tool}" — verify if intentional`);
    }
  }

  // Remote access tools
  const ratTools = ['teamviewer', 'anydesk', 'ammyy', 'ultraviewer', 'remotepc', 'connectwise', 'splashtop'];
  for (const tool of ratTools) {
    if (nameLower.includes(tool)) {
      riskScore += 5;
      flags.push(`Remote access tool detected — verify if intentional`);
    }
  }

  riskScore = Math.min(100, Math.max(0, riskScore));

  let risk;
  if (riskScore >= 70) risk = 'CRITICAL';
  else if (riskScore >= 40) risk = 'HIGH';
  else if (riskScore >= 15) risk = 'MEDIUM';
  else risk = 'LOW';

  return { riskScore, risk, flags };
}

// ============================================================
// 2. Scan Running Processes
// ============================================================
async function scanRunningProcesses() {
  const processes = [];

  try {
    // Use PowerShell Get-Process for detailed info
    const psCmd = `powershell -NoProfile -Command "` +
      `Get-Process | Select-Object Id, ProcessName, ` +
      `@{N='MemoryMB';E={[math]::Round($_.WorkingSet64/1MB,1)}}, ` +
      `@{N='CPU';E={[math]::Round($_.CPU,1)}}, ` +
      `Path, Company | ` +
      `ConvertTo-Json -Compress"`;

    const output = await runCommand(psCmd, 15000);

    if (output.trim()) {
      let parsed;
      try {
        parsed = JSON.parse(output.trim());
      } catch {
        parsed = [];
      }
      if (!Array.isArray(parsed)) parsed = [parsed];

      for (const proc of parsed) {
        if (!proc.ProcessName) continue;

        const name = proc.ProcessName;
        const pid = proc.Id;
        const memoryMB = proc.MemoryMB || 0;
        const cpu = proc.CPU || 0;
        const path = proc.Path || '';
        const company = proc.Company || '';

        const risk = analyzeProcessRisk(name, path, memoryMB, company);

        processes.push({
          name,
          pid,
          memoryMB,
          cpu,
          path,
          company,
          ...risk,
        });
      }
    }
  } catch (err) {
    console.error('[DeviceScanner] Process scan error:', err.message);
  }

  // Sort: high risk first, then by memory usage
  processes.sort((a, b) => b.riskScore - a.riskScore || b.memoryMB - a.memoryMB);

  return processes;
}

function analyzeProcessRisk(name, path, memoryMB, company) {
  const nameLower = (name || '').toLowerCase();
  const exeName = nameLower.endsWith('.exe') ? nameLower : nameLower + '.exe';
  const pathLower = (path || '').toLowerCase();
  const companyLower = (company || '').toLowerCase();
  let riskScore = 0;
  const flags = [];

  // Check if it's a known safe system process
  if (KNOWN_SAFE_PROCESSES.includes(exeName) || KNOWN_SAFE_PROCESSES.includes(nameLower)) {
    return { riskScore: 0, risk: 'LOW', flags: ['Known safe system/application process'] };
  }

  // Check safe process prefixes (vendor software like ASUS Armoury Crate, etc.)
  const isSafePrefix = SAFE_PROCESS_PREFIXES.some(prefix => nameLower.startsWith(prefix));
  if (isSafePrefix) {
    return { riskScore: 0, risk: 'LOW', flags: ['Known vendor software'] };
  }

  // Check suspicious name
  for (const keyword of SUSPICIOUS_PROCESS_NAMES) {
    if (nameLower.includes(keyword)) {
      riskScore += 70;
      flags.push(`Process name contains suspicious keyword: "${keyword}"`);
    }
  }

  // Check if process runs from suspicious locations
  if (pathLower) {
    const suspiciousPaths = ['\\temp\\', '\\tmp\\', '\\appdata\\local\\temp', '\\downloads\\'];
    for (const sp of suspiciousPaths) {
      if (pathLower.includes(sp)) {
        riskScore += 20;
        flags.push(`Running from suspicious location: ${sp}`);
      }
    }
  } else {
    // No path info — can't verify, slight risk
    riskScore += 5;
    flags.push('Process location unknown');
  }

  // Check for extreme memory usage (possible crypto miner)
  if (memoryMB > 2000) {
    riskScore += 10;
    flags.push(`High memory usage: ${memoryMB} MB — could indicate crypto mining`);
  }

  // Check for known safe company
  if (companyLower) {
    const isKnown = KNOWN_SAFE_PUBLISHERS.some(p => companyLower.includes(p));
    if (isKnown) {
      riskScore = Math.max(0, riskScore - 15);
    }
  } else if (!KNOWN_SAFE_PROCESSES.includes(exeName)) {
    riskScore += 5;
    flags.push('No publisher/company information');
  }

  riskScore = Math.min(100, Math.max(0, riskScore));

  let risk;
  if (riskScore >= 70) risk = 'CRITICAL';
  else if (riskScore >= 40) risk = 'HIGH';
  else if (riskScore >= 15) risk = 'MEDIUM';
  else risk = 'LOW';

  return { riskScore, risk, flags };
}

// ============================================================
// 3. Scan Startup Programs
// ============================================================
async function scanStartupPrograms() {
  const startupItems = [];

  try {
    const psCmd = `powershell -NoProfile -Command "` +
      `$items = @(); ` +
      `$regPaths = @(` +
      `'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',` +
      `'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\RunOnce',` +
      `'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',` +
      `'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\RunOnce'` +
      `); ` +
      `foreach ($path in $regPaths) { ` +
      `  if (Test-Path $path) { ` +
      `    $props = Get-ItemProperty $path -ErrorAction SilentlyContinue; ` +
      `    $props.PSObject.Properties | Where-Object { $_.Name -notlike 'PS*' } | ForEach-Object { ` +
      `      $items += @{ Name = $_.Name; Command = $_.Value; Location = $path }` +
      `    }` +
      `  }` +
      `}; ` +
      `$items | ConvertTo-Json -Compress"`;

    const output = await runCommand(psCmd, 10000);

    if (output.trim()) {
      let parsed;
      try {
        parsed = JSON.parse(output.trim());
      } catch {
        parsed = [];
      }
      if (!Array.isArray(parsed)) parsed = [parsed];

      for (const item of parsed) {
        if (!item.Name) continue;

        const name = item.Name;
        const command = item.Command || '';
        const location = item.Location || '';

        const risk = analyzeStartupRisk(name, command, location);

        startupItems.push({
          name,
          command,
          location: location.replace(/HKLM:\\|HKCU:\\/g, ''),
          ...risk,
        });
      }
    }
  } catch (err) {
    console.error('[DeviceScanner] Startup scan error:', err.message);
  }

  startupItems.sort((a, b) => b.riskScore - a.riskScore || a.name.localeCompare(b.name));
  return startupItems;
}

function analyzeStartupRisk(name, command, location) {
  const nameLower = name.toLowerCase();
  const cmdLower = (command || '').toLowerCase();
  let riskScore = 0;
  const flags = [];

  // All startup items get baseline risk — persistence is a malware indicator
  riskScore += 5;
  flags.push('Auto-starts with Windows');

  // Check for suspicious names
  for (const keyword of SUSPICIOUS_PROCESS_NAMES) {
    if (nameLower.includes(keyword) || cmdLower.includes(keyword)) {
      riskScore += 65;
      flags.push(`Contains suspicious keyword: "${keyword}"`);
    }
  }

  // Check command path
  const suspiciousPaths = ['\\temp\\', '\\tmp\\', '\\appdata\\local\\temp', '\\downloads\\'];
  for (const sp of suspiciousPaths) {
    if (cmdLower.includes(sp)) {
      riskScore += 30;
      flags.push(`Runs from suspicious location: ${sp}`);
    }
  }

  // Scripts in startup
  if (cmdLower.includes('.vbs') || cmdLower.includes('.bat') || cmdLower.includes('.ps1') || cmdLower.includes('wscript') || cmdLower.includes('cscript')) {
    riskScore += 20;
    flags.push('Startup script detected — verify if legitimate');
  }

  // Known safe startup items reduce risk
  const safeStartups = ['securityhealth', 'windows defender', 'realtek', 'nvidia', 'onedrive', 'teams', 'discord', 'steam', 'spotify'];
  for (const safe of safeStartups) {
    if (nameLower.includes(safe) || cmdLower.includes(safe)) {
      riskScore = Math.max(0, riskScore - 10);
    }
  }

  riskScore = Math.min(100, Math.max(0, riskScore));

  let risk;
  if (riskScore >= 70) risk = 'CRITICAL';
  else if (riskScore >= 40) risk = 'HIGH';
  else if (riskScore >= 15) risk = 'MEDIUM';
  else risk = 'LOW';

  return { riskScore, risk, flags };
}

// ============================================================
// 4. Scan Open Network Ports
// ============================================================
async function scanOpenPorts() {
  const ports = [];

  try {
    const output = await runCommand('netstat -an', 10000);

    if (output) {
      const lines = output.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        // Match TCP/UDP listening or established connections
        const match = trimmed.match(/^\s*(TCP|UDP)\s+([\d.:]+)\s+([\d.:*]+)\s+(\w+)?/i);
        if (match) {
          const protocol = match[1].toUpperCase();
          const localAddress = match[2];
          const foreignAddress = match[3];
          const state = match[4] || '';

          // Extract local port
          const portMatch = localAddress.match(/:(\d+)$/);
          if (!portMatch) continue;
          const localPort = parseInt(portMatch[1], 10);

          // Only care about LISTENING and ESTABLISHED
          if (state !== 'LISTENING' && state !== 'ESTABLISHED' && state !== '') continue;

          const risk = analyzePortRisk(localPort, protocol, state, foreignAddress);

          ports.push({
            protocol,
            localPort,
            localAddress,
            foreignAddress,
            state: state || 'LISTENING',
            ...risk,
          });
        }
      }
    }
  } catch (err) {
    console.error('[DeviceScanner] Port scan error:', err.message);
  }

  // Deduplicate by port+protocol
  const seen = new Set();
  const unique = ports.filter(p => {
    const key = `${p.protocol}:${p.localPort}:${p.state}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  unique.sort((a, b) => b.riskScore - a.riskScore || a.localPort - b.localPort);
  return unique;
}

function analyzePortRisk(port, protocol, state, foreignAddress) {
  let riskScore = 0;
  const flags = [];

  // Check against known suspicious ports
  const knownSuspicious = SUSPICIOUS_PORTS.find(sp => sp.port === port);
  if (knownSuspicious) {
    riskScore += 50;
    flags.push(knownSuspicious.reason);
  }

  // High ports with external connections
  if (port > 49152 && state === 'ESTABLISHED' && foreignAddress && !foreignAddress.startsWith('127.') && !foreignAddress.startsWith('0.0.0.0') && !foreignAddress.includes('*')) {
    riskScore += 10;
    flags.push('High ephemeral port with external connection');
  }

  // Ports below 1024 that are LISTENING (except common ones)
  const commonPorts = [80, 443, 445, 135, 139, 53, 67, 68, 88, 389, 636, 993, 995, 587, 25, 110, 143];
  if (port < 1024 && state === 'LISTENING' && !commonPorts.includes(port)) {
    riskScore += 15;
    flags.push(`Unusual low port listening: ${port}`);
  }

  if (flags.length === 0) {
    flags.push('Normal network activity');
  }

  riskScore = Math.min(100, Math.max(0, riskScore));

  let risk;
  if (riskScore >= 50) risk = 'HIGH';
  else if (riskScore >= 15) risk = 'MEDIUM';
  else risk = 'LOW';

  return { riskScore, risk, flags };
}

// ============================================================
// 5. Scan WiFi Network (Auto-detect)
// ============================================================
async function scanWifi() {
  try {
    const output = await runCommand('netsh wlan show interfaces', 8000);

    if (!output || !output.trim()) {
      return { available: false, error: 'WiFi adapter not found or disabled' };
    }

    const info = {};
    const lines = output.split('\n');

    for (const line of lines) {
      // Use indexOf-based splitting instead of regex to handle Unicode SSIDs
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      // The key area is everything before the first colon (after trimming)
      // But we need to handle "BSSID" which has colons in the value too
      // netsh always uses " : " (space-colon-space) as separator
      const separatorIdx = line.indexOf(' : ');
      if (separatorIdx === -1) continue;

      const key = line.substring(0, separatorIdx).trim();
      const value = line.substring(separatorIdx + 3).trim();

      if (!key || !value) continue;

      switch (key) {
        case 'SSID': info.ssid = value; break;
        case 'Authentication': info.authentication = value; break;
        case 'Cipher': info.cipher = value; break;
        case 'Signal': info.signal = parseInt(value.replace('%', '').trim()); break;
        case 'Radio type': info.radioType = value; break;
        case 'Channel': info.channel = parseInt(value); break;
        case 'AP BSSID': info.bssid = value; break;
        case 'BSSID': if (!info.bssid) info.bssid = value; break;
        case 'Network type': info.networkType = value; break;
        case 'State': info.state = value; break;
        case 'Band': info.band = value; break;
      }
    }

    if (!info.ssid) {
      return { available: false, error: 'No WiFi network connected' };
    }

    // Map authentication to encryption type
    const auth = (info.authentication || '').toLowerCase();
    let encryption = 'Open';
    if (auth.includes('wpa3')) encryption = 'WPA3';
    else if (auth.includes('wpa2')) encryption = 'WPA2';
    else if (auth.includes('wpa')) encryption = 'WPA';
    else if (auth.includes('wep')) encryption = 'WEP';

    return {
      available: true,
      ssid: info.ssid,
      encryption,
      authentication: info.authentication,
      cipher: info.cipher,
      signal: info.signal,
      radioType: info.radioType,
      channel: info.channel,
      bssid: info.bssid,
      networkType: info.networkType,
      state: info.state,
      band: info.band,
      isPublic: false,
      hasPassword: encryption !== 'Open',
    };
  } catch (err) {
    return { available: false, error: err.message };
  }
}

// ============================================================
// 6. System Info
// ============================================================
function getSystemInfo() {
  // Detect Windows version correctly: build >= 22000 is Windows 11
  const release = os.release(); // e.g., "10.0.26200"
  const buildNumber = parseInt(release.split('.')[2] || '0', 10);
  let osVersion = 'Windows';
  if (buildNumber >= 22000) {
    osVersion = 'Windows 11';
  } else if (release.startsWith('10.0')) {
    osVersion = 'Windows 10';
  } else if (release.startsWith('6.3')) {
    osVersion = 'Windows 8.1';
  } else if (release.startsWith('6.1')) {
    osVersion = 'Windows 7';
  }

  return {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    release,
    osVersion,
    totalMemoryGB: Math.round(os.totalmem() / (1024 ** 3) * 10) / 10,
    freeMemoryGB: Math.round(os.freemem() / (1024 ** 3) * 10) / 10,
    cpus: os.cpus().length,
    cpuModel: os.cpus()[0]?.model || 'Unknown',
    uptime: Math.round(os.uptime() / 3600 * 10) / 10, // hours
    user: os.userInfo().username,
  };
}

// ============================================================
// 7. Full Device Scan (all categories)
// ============================================================
async function fullDeviceScan(progressCallback) {
  const results = {};
  const startTime = Date.now();

  // System info (instant)
  if (progressCallback) progressCallback('system', 'Gathering system information...');
  results.system = getSystemInfo();

  // Installed programs
  if (progressCallback) progressCallback('programs', 'Scanning installed programs...');
  results.installedPrograms = await scanInstalledPrograms();

  // Running processes
  if (progressCallback) progressCallback('processes', 'Scanning running processes...');
  results.runningProcesses = await scanRunningProcesses();

  // Startup items
  if (progressCallback) progressCallback('startup', 'Checking startup programs...');
  results.startupItems = await scanStartupPrograms();

  // Open ports
  if (progressCallback) progressCallback('ports', 'Scanning network ports...');
  results.openPorts = await scanOpenPorts();

  // WiFi
  if (progressCallback) progressCallback('wifi', 'Detecting WiFi network...');
  results.wifi = await scanWifi();

  // Generate summary
  const elapsedMs = Date.now() - startTime;
  const allItems = [
    ...results.installedPrograms,
    ...results.runningProcesses,
    ...results.startupItems,
    ...results.openPorts,
  ];

  const critical = allItems.filter(i => i.risk === 'CRITICAL').length;
  const high = allItems.filter(i => i.risk === 'HIGH').length;
  const medium = allItems.filter(i => i.risk === 'MEDIUM').length;
  const low = allItems.filter(i => i.risk === 'LOW').length;

  results.summary = {
    totalItems: allItems.length,
    installedProgramsCount: results.installedPrograms.length,
    runningProcessesCount: results.runningProcesses.length,
    startupItemsCount: results.startupItems.length,
    openPortsCount: results.openPorts.length,
    critical,
    high,
    medium,
    low,
    threatsFound: critical + high,
    scanTime: elapsedMs < 1000 ? `${elapsedMs}ms` : `${(elapsedMs / 1000).toFixed(1)}s`,
    scannedAt: new Date().toISOString(),
    overallRisk: critical > 0 ? 'CRITICAL' : high > 0 ? 'HIGH' : medium > 3 ? 'MEDIUM' : 'LOW',
  };

  return results;
}

module.exports = {
  scanInstalledPrograms,
  scanRunningProcesses,
  scanStartupPrograms,
  scanOpenPorts,
  scanWifi,
  getSystemInfo,
  fullDeviceScan,
};
