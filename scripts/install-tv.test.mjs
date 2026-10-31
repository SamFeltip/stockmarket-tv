import { test } from 'node:test';
import assert from 'node:assert/strict';
import { endpoint, parseArgs, subnetHosts, localNetworks, parseDevices, parseMdns,
    mergeDevices, scanHosts, installSelected } from './install-tv.mjs';

const ok = (stdout = '') => ({ code: 0, stdout, stderr: '' });

test('accepts IPv4/IPv6 endpoints and rejects ambiguous ports/arguments', () => {
    assert.equal(endpoint('192.168.1.50'), '192.168.1.50:5555');
    assert.equal(endpoint('[fe80::1]:37123'), '[fe80::1]:37123');
    assert.equal(endpoint('::1'), '[::1]:5555');
    assert.throws(() => endpoint('192.168.1.50:99999'));
    assert.throws(() => endpoint('--help'));
    assert.equal(parseArgs(['--no-launch', '--network', '192.168.2.0/24', '192.168.2.3']).launch, false);
    assert.throws(() => parseArgs(['--apk']));
});

test('bounds scans to private subnets and excludes network/broadcast addresses', () => {
    assert.deepEqual(subnetHosts('192.168.1.40/30'), ['192.168.1.41', '192.168.1.42']);
    assert.deepEqual(subnetHosts('10.1.2.3/32'), ['10.1.2.3']);
    assert.equal(subnetHosts('172.16.1.0/22').length, 1022);
    assert.throws(() => subnetHosts('8.8.8.0/24'));
    assert.throws(() => subnetHosts('10.0.0.0/8'));
    assert.throws(() => subnetHosts('192.168.0.0/nope'));
});

test('chooses the attached local /24 on a larger LAN and skips virtual interfaces', () => {
    const address = { family: 'IPv4', internal: false, address: '192.168.7.10', cidr: '192.168.7.10/16' };
    const networks = localNetworks({ eth0: [address], eth1: [address], docker0: [address] });
    assert.equal(networks.length, 1);
    assert.equal(networks[0].hosts[0], '192.168.7.1');
    assert.equal(networks[0].hosts.length, 254);
});

test('parses connected, unauthorized, paired and pairing-only ADB discovery', () => {
    const connected = parseDevices('List of devices attached\n192.168.1.5:5555 device product:tv model:Fire_TV device:abc\n192.168.1.6:5555 unauthorized\n');
    const wireless = parseMdns('List of discovered mdns services\nadb-tv _adb-tls-connect._tcp. 192.168.1.5:5555\nadb-pair _adb-tls-pairing._tcp 192.168.1.9:33333\nbad _adb-tls-connect._tcp bad:123\n');
    assert.equal(connected[0].name, 'Fire TV');
    assert.equal(connected[1].status, 'unauthorized');
    assert.equal(wireless.length, 2);
    assert.equal(wireless[1].pairing, true);
    const merged = mergeDevices(connected, wireless);
    assert.equal(merged.length, 3);
    assert.equal(merged[0].name, 'Fire TV');
});

test('scans once per host, returns only open ADB candidates, and enforces total limit', async () => {
    const probes = [];
    const result = await scanHosts(['192.168.1.3', '192.168.1.2', '192.168.1.3'], async (host) => {
        probes.push(host); return host.endsWith('.3');
    });
    assert.equal(probes.length, 2);
    assert.deepEqual(result.map((item) => item.serial), ['192.168.1.3:5555']);
    await assert.rejects(scanHosts(Array.from({ length: 1025 }, (_, i) => String(i)), async () => false), /1024/);
});

function fakeAdb({ authorized = true, tv = true, features = '', installCode = 0, launchError = false } = {}) {
    const calls = [];
    return { calls, run: async (_adb, args, options) => {
        calls.push({ args, options });
        if (args.includes('get-state')) return authorized ? ok('device\n') : { code: 1, stdout: '', stderr: 'unauthorized' };
        if (args.includes('ro.product.model')) return ok('Test TV');
        if (args.includes('ro.build.characteristics')) return ok(tv ? 'tv' : 'phone');
        if (args.includes('features')) return ok(features);
        if (args.includes('install')) return { code: installCode, stdout: '', stderr: installCode ? 'INSTALL_FAILED_UPDATE_INCOMPATIBLE' : '' };
        if (args.includes('start') && launchError) return ok('Error: Activity not found');
        return ok();
    } };
}

test('installs and launches only the selected TV, preserving existing app data', async () => {
    const fake = fakeAdb();
    await installSelected('/adb', '192.168.1.3:5555', '/apk with spaces.apk', { run: fake.run });
    assert.deepEqual(fake.calls.find((call) => call.args.includes('install')).args,
        ['-s', '192.168.1.3:5555', 'install', '-r', '/apk with spaces.apk']);
    assert(fake.calls.some((call) => call.args.includes('com.stockmarket.tv/.MainActivity')));
    assert(fake.calls.every((call) => !call.args.includes('uninstall')));
});

test('authorization refusal and non-TV devices cannot reach install', async () => {
    for (const config of [{ authorized: false }, { tv: false }]) {
        const fake = fakeAdb(config);
        await assert.rejects(installSelected('/adb', '192.168.1.3:5555', '/apk', { run: fake.run, prompt: async () => '', pause: async () => {} }));
        assert(!fake.calls.some((call) => call.args.includes('install')));
    }
});

test('failed update never uninstalls or launches; no-launch leaves the TV undisturbed', async () => {
    const failure = fakeAdb({ installCode: 1 });
    await assert.rejects(installSelected('/adb', 'tv', '/apk', { run: failure.run }), /original key/);
    assert(!failure.calls.some((call) => call.args.includes('uninstall') || call.args.includes('am')));
    const success = fakeAdb();
    await installSelected('/adb', 'tv', '/apk', { run: success.run, launch: false });
    assert(!success.calls.some((call) => call.args.includes('am')));
});


test('recognizes Fire TV by its Amazon feature without a leanback characteristic', async () => {
    const fake = fakeAdb({ tv: false, features: 'feature:amazon.hardware.fire_tv\n' });
    await installSelected('/adb', '192.168.1.50:5555', '/fire-tv.apk', { run: fake.run });
    assert.deepEqual(fake.calls.find((call) => call.args.includes('install')).args,
        ['-s', '192.168.1.50:5555', 'install', '-r', '/fire-tv.apk']);
    assert(fake.calls.some((call) => call.args.includes('com.stockmarket.tv/.MainActivity')));
});
