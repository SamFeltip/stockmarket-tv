#!/usr/bin/env node
import { execFile, spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import { constants, existsSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { createConnection, isIP } from 'node:net';
import { createInterface } from 'node:readline/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const defaultApk = [join(project, 'android/app/build/outputs/apk/debug/app-debug.apk'),
    join(dirname(fileURLToPath(import.meta.url)), 'app-debug.apk'), join(project, 'app-debug.apk')].find(existsSync)
    ?? join(project, 'android/app/build/outputs/apk/debug/app-debug.apk');
const help = `Stockmarket TV — private network installer (Node.js 22+)

  node scripts/install-tv.mjs                     Scan and select a TV
  node scripts/install-tv.mjs 192.168.1.50         Connect directly (port 5555)
  node scripts/install-tv.mjs 192.168.1.50:37123   Android wireless debugging port

Options:
  --network CIDR   Scan this private IPv4 subnet (repeatable; /22 or smaller)
  --apk PATH       Install a different APK
  --adb PATH       Use this Android SDK platform-tools adb executable
  --no-launch      Install without opening the app
  --help           Show this help

Enable ADB debugging on the TV first. Android wireless debugging may require
pairing; choose P in the device menu and use the TV's pairing address/code.
No app store, Android Studio, npm install, or local web server is needed.
`;

export function parseArgs(args) {
    const result = { networks: [], apk: defaultApk, launch: true };
    for (let i = 0; i < args.length; i++) {
        const value = args[i];
        if (value === '--help' || value === '-h') result.help = true;
        else if (value === '--no-launch') result.launch = false;
        else if (['--network', '--apk', '--adb'].includes(value)) {
            const next = args[++i];
            if (!next || next.startsWith('--')) throw new Error(`Missing value for ${value}`);
            if (value === '--network') result.networks.push(next);
            else result[value.slice(2)] = next;
        } else if (value.startsWith('-') || result.address) throw new Error(`Unexpected argument: ${value}`);
        else result.address = endpoint(value);
    }
    result.apk = resolve(result.apk);
    return result;
}

export function endpoint(value) {
    const text = value.trim();
    if (isIP(text)) return isIP(text) === 6 ? `[${text}]:5555` : `${text}:5555`;
    const match = /^(?:\[([^\]]+)\]|([^:]+)):(\d+)$/.exec(text);
    if (!match || !isIP(match[1] || match[2]) || Number(match[3]) < 1 || Number(match[3]) > 65535)
        throw new Error('Enter a TV IP address, optionally with its debugging port (e.g. 192.168.1.50:5555).');
    return `${match[1] ? `[${match[1]}]` : match[2]}:${Number(match[3])}`;
}

const numberIP = (ip) => ip.split('.').reduce((sum, part) => (sum * 256 + Number(part)) >>> 0, 0);
const stringIP = (value) => [24, 16, 8, 0].map((shift) => (value >>> shift) & 255).join('.');
const privateIP = (ip) => /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)/.test(ip);

export function subnetHosts(cidr) {
    const [ip, bits, extra] = cidr.split('/');
    const prefix = Number(bits);
    if (extra !== undefined || isIP(ip) !== 4 || !privateIP(ip) || !/^\d+$/.test(bits ?? '') || prefix < 22 || prefix > 32)
        throw new Error(`Invalid scan network: ${cidr}. Use a private IPv4 subnet from /22 to /32.`);
    const size = 2 ** (32 - prefix);
    const base = Math.floor(numberIP(ip) / size) * size;
    const first = size > 2 ? 1 : 0;
    const last = size > 2 ? size - 1 : size;
    return Array.from({ length: last - first }, (_, i) => stringIP(base + first + i));
}

export function localNetworks(interfaces = networkInterfaces()) {
    const networks = [];
    for (const [name, addresses] of Object.entries(interfaces)) {
        if (/^(docker|veth|br-|virbr|tailscale|tun|tap|utun|wg)/i.test(name)) continue;
        for (const entry of addresses ?? []) {
            if (entry.internal || entry.family !== 'IPv4' || !privateIP(entry.address)) continue;
            const prefix = Number(entry.cidr?.split('/')[1] ?? 24);
            // Bound automatic discovery to the local /24 on larger networks.
            const cidr = `${entry.address}/${Math.max(24, prefix)}`;
            const hosts = subnetHosts(cidr);
            if (!networks.some((item) => item.hosts[0] === hosts[0])) networks.push({ name, cidr, hosts });
        }
    }
    return networks;
}

export function parseDevices(output) {
    return output.split(/\r?\n/).flatMap((line) => {
        const match = /^(\S+)\s+(device|unauthorized|offline)\b(.*)$/.exec(line);
        if (!match) return [];
        const model = /\bmodel:(\S+)/.exec(match[3])?.[1]?.replaceAll('_', ' ');
        return [{ serial: match[1], name: model || match[1], status: match[2], source: 'connected ADB device' }];
    });
}

export function parseMdns(output) {
    return output.split(/\r?\n/).flatMap((line) => {
        const match = /^(\S+)\s+(_adb(?:-tls-connect|-tls-pairing)?\._tcp)\.?\s+(\S+)/.exec(line.trim());
        if (!match) return [];
        try {
            return [{ serial: endpoint(match[3]), name: match[1],
                pairing: match[2].includes('pairing'), source: 'wireless debugging' }];
        } catch { return []; }
    });
}

export function mergeDevices(...lists) {
    const merged = new Map();
    for (const item of lists.flat()) {
        const key = `${item.pairing ? 'pair:' : ''}${item.serial}`;
        const existing = merged.get(key);
        merged.set(key, existing ? { ...item, ...existing } : item);
    }
    return [...merged.values()];
}

export async function portOpen(host, port = 5555, timeout = 450) {
    return new Promise((done) => {
        const socket = createConnection({ host, port });
        const finish = (open) => { socket.destroy(); done(open); };
        socket.setTimeout(timeout);
        socket.once('connect', () => finish(true));
        socket.once('timeout', () => finish(false));
        socket.once('error', () => finish(false));
    });
}

export async function scanHosts(hosts, probe = portOpen) {
    const unique = [...new Set(hosts)];
    if (unique.length > 1024) throw new Error('Scan exceeds 1024 addresses. Choose a smaller --network.');
    const found = [];
    let next = 0;
    await Promise.all(Array.from({ length: Math.min(48, unique.length) }, async () => {
        while (next < unique.length) {
            const host = unique[next++];
            if (await probe(host)) found.push({ serial: `${host}:5555`, name: host, source: 'port 5555 open; TV identity checked after selection' });
        }
    }));
    return found.sort((a, b) => a.serial.localeCompare(b.serial, undefined, { numeric: true }));
}

export function runAdb(adb, args, { timeout = 8000, interactive = false } = {}) {
    if (interactive) return new Promise((done) => {
        const child = spawn(adb, args, { stdio: 'inherit', shell: false });
        const timer = setTimeout(() => child.kill(), timeout);
        child.once('error', (error) => { clearTimeout(timer); done({ code: 1, stdout: '', stderr: error.message }); });
        child.once('close', (code, signal) => { clearTimeout(timer); done({ code: code ?? 1, stdout: '', stderr: signal ? 'Command timed out or was interrupted.' : '' }); });
    });
    return new Promise((done) => execFile(adb, args, { timeout, maxBuffer: 1024 * 1024, windowsHide: true }, (error, stdout, stderr) =>
        done({ code: error ? 1 : 0, stdout, stderr: `${stderr}${error ? `\n${error.message}` : ''}` })));
}

async function ask(question) {
    const input = createInterface({ input: process.stdin, output: process.stdout });
    try { return (await input.question(question)).trim(); }
    finally { input.close(); }
}

async function findAdb(explicit) {
    const filename = process.platform === 'win32' ? 'adb.exe' : 'adb';
    const roots = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT,
        join(project, '.toolchain/sdk'),
        process.env.HOME && join(process.env.HOME, 'Android/Sdk'),
        process.env.HOME && join(process.env.HOME, 'Library/Android/sdk'),
        process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Android/Sdk')].filter(Boolean);
    const candidates = explicit || process.env.STOCKMARKET_ADB ? [explicit || process.env.STOCKMARKET_ADB]
        : [filename, ...roots.map((root) => join(root, 'platform-tools', filename))];
    for (const candidate of candidates) {
        if ((await runAdb(candidate, ['version'])).code === 0) return candidate;
    }
    throw new Error('ADB not found. Install Android SDK Platform-Tools from https://developer.android.com/tools/releases/platform-tools and put adb on PATH, or pass --adb /path/to/adb.');
}

export async function installSelected(adb, serial, apk, { run = runAdb, prompt = ask, launch = true, pause = delay } = {}) {
    // Only the selected device is connected to, queried, installed on, or launched.
    if (serial.includes(':') && !serial.includes('._adb')) {
        const connection = await run(adb, ['connect', serial], { timeout: 12000 });
        console.log((connection.stdout + connection.stderr).trim());
    }
    let state = await run(adb, ['-s', serial, 'get-state']);
    if (state.stdout.trim() !== 'device') {
        await prompt('Approve the debugging prompt on the TV (or pair first), then press Enter… ');
        for (let attempt = 0; attempt < 10; attempt++) {
            state = await run(adb, ['-s', serial, 'get-state']);
            if (state.code === 0 && state.stdout.trim() === 'device') break;
            if (attempt < 9) await pause(1000);
        }
    }
    if (state.code !== 0 || state.stdout.trim() !== 'device')
        throw new Error(`TV is not authorized/online: ${serial}. Enable debugging, approve this computer, or choose P to pair Android wireless debugging.\n${state.stderr.trim()}`);
    const properties = await Promise.all(['ro.product.model', 'ro.build.characteristics'].map((prop) =>
        run(adb, ['-s', serial, 'shell', 'getprop', prop])));
    const features = await run(adb, ['-s', serial, 'shell', 'pm', 'list', 'features']);
    if (!/\b(tv|leanback)\b/i.test(properties[1].stdout) && !/android\.software\.(leanback|live_tv)|amazon\.hardware\.fire_tv/i.test(features.stdout))
        throw new Error('The selected device does not identify as an Android/Fire TV. Nothing was installed.');
    console.log(`\nInstalling Stockmarket TV on ${properties[0].stdout.trim() || serial} (${serial})…`);
    const install = await run(adb, ['-s', serial, 'install', '-r', apk], { interactive: true, timeout: 180000 });
    if (install.code !== 0) throw new Error(`Installation failed. ${install.stdout} ${install.stderr}\nIf the signing key differs, use an APK signed with the original key. This script never uninstalls the existing app.`);
    console.log('Installed successfully. Existing app data is preserved.');
    if (launch) {
        const start = await run(adb, ['-s', serial, 'shell', 'am', 'start', '-n', 'com.stockmarket.tv/.MainActivity']);
        if (start.code !== 0 || /Error:|Exception/i.test(start.stdout + start.stderr))
            console.log(`Installed, but could not open automatically. Launch Stockmarket TV from the TV apps list.\n${start.stdout}${start.stderr}`);
        else console.log('Stockmarket TV is now open.');
    }
    console.log('You can switch ADB debugging off now. The app only needs internet access.');
}

async function discover(adb, networks) {
    console.log(`\nScanning ${networks.map((network) => `${network.cidr} (${network.name})`).join(', ') || 'wireless debugging services'}…`);
    const [devices, mdns, scanned] = await Promise.all([
        runAdb(adb, ['devices', '-l']), runAdb(adb, ['mdns', 'services'], { timeout: 6000 }),
        scanHosts(networks.flatMap((network) => network.hosts)),
    ]);
    if (mdns.code !== 0) console.log('Wireless service discovery unavailable; use M for an address or P to pair.');
    return mergeDevices(parseDevices(devices.stdout), parseMdns(mdns.stdout), scanned);
}

export async function main(args = process.argv.slice(2)) {
    const options = parseArgs(args);
    if (options.help) { console.log(help); return; }
    try { await access(options.apk, constants.R_OK); }
    catch { throw new Error(`APK not found: ${options.apk}\nBuild/copy app-debug.apk first, or supply --apk /path/to/app-debug.apk.`); }
    const adb = await findAdb(options.adb);
    const started = await runAdb(adb, ['start-server']);
    if (started.code !== 0) throw new Error(`Could not start ADB: ${started.stderr}`);
    console.log(`\nStockmarket TV installer\nAPK: ${options.apk}\nComputer and TV must be on the same LAN. Keep the TV awake with debugging enabled.`);
    if (options.address) return installSelected(adb, options.address, options.apk, options);
    const networks = options.networks.length ? options.networks.map((cidr) => ({ cidr, name: 'specified', hosts: subnetHosts(cidr) })) : localNetworks();
    if (networks.flatMap((network) => network.hosts).length > 1024) throw new Error('Too many local addresses. Select a subnet using --network 192.168.1.0/24.');
    let devices = await discover(adb, networks);
    while (true) {
        console.log('\nAvailable debugging devices (phones may also appear):');
        if (!devices.length) console.log('  None found. Enable TV debugging; guest Wi-Fi, VPNs and client isolation can prevent discovery.');
        devices.forEach((device, i) => console.log(`  ${i + 1}. ${device.name} — ${device.serial}${device.status ? ` [${device.status}]` : ''}${device.pairing ? ' [PAIR FIRST]' : ''} (${device.source})`));
        console.log('\n  R Rescan   M Enter TV address   P Pair Android wireless debugging   Q Quit');
        const choice = (await ask('Select a device or option: ')).toLowerCase();
        if (choice === 'q') return;
        if (choice === 'r') { devices = await discover(adb, networks); continue; }
        if (choice === 'p') {
            console.log('On the TV: Wireless debugging → Pair device with pairing code. Use its pairing port, not the normal debugging port.');
            const address = endpoint(await ask('Pairing IP:port: '));
            const paired = await runAdb(adb, ['pair', address], { interactive: true, timeout: 90000 });
            if (paired.code !== 0) console.log(`Pairing failed. Check the pairing screen/code and update Platform-Tools. ${paired.stderr}`);
            devices = await discover(adb, networks); continue;
        }
        let serial;
        if (choice === 'm') serial = endpoint(await ask('TV IP (or IP:debugging-port): '));
        else {
            const selected = /^\d+$/.test(choice) ? devices[Number(choice) - 1] : undefined;
            if (!selected) { console.log('Choose a listed number or R/M/P/Q.'); continue; }
            if (selected.pairing) {
                console.log('Enter the pairing code shown on your TV when ADB asks.');
                const paired = await runAdb(adb, ['pair', selected.serial], { interactive: true, timeout: 90000 });
                if (paired.code !== 0) console.log(`Pairing failed. ${paired.stderr}`);
                devices = await discover(adb, networks); continue;
            }
            serial = selected.serial;
        }
        try { await installSelected(adb, serial, options.apk, options); return; }
        catch (error) { console.error(`\n${error.message}`); }
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    main().catch((error) => { console.error(`\n${error.message}`); process.exitCode = error.code === 'ABORT_ERR' ? 130 : 1; });
}
