#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { randomBytes, createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, chmodSync } from 'node:fs';
import { delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const privateDir = join(project, '.release');
const credentials = join(privateDir, 'signing.json');
const keystore = join(privateDir, 'stockmarket-tv.jks');
const windows = process.platform === 'win32';
const javaTool = name => process.env.JAVA_HOME
    ? join(process.env.JAVA_HOME, 'bin', name + (windows ? '.exe' : '')) : name;
function run(command, args, cwd = project, env = process.env) {
    const result = spawnSync(command, args, { cwd, env, stdio: 'inherit', shell: false });
    if (result.error) throw new Error(`Could not start ${command}: ${result.error.message}`);
    if (result.status !== 0) throw new Error(`${command} exited with status ${result.status}`);
}
function protect(path) { if (!windows) chmodSync(path, 0o600); }
try {
    const action = process.argv[2];
    if (process.argv.length !== 3 || !['init', 'build'].includes(action)) {
        throw new Error('Use npm run android:signing:init or npm run android:release. See PUBLISHING.md.');
    }
    if (action === 'init') {
        if (existsSync(credentials) || existsSync(keystore)) throw new Error('Signing material already exists; it will never be overwritten.');
        mkdirSync(privateDir, { recursive: true, mode: 0o700 });
        const password = randomBytes(32).toString('hex');
        const signing = { alias: 'stockmarket-tv', storePassword: password, keyPassword: password };
        // Save recovery material before key generation. Never print passwords or pass them on argv.
        writeFileSync(credentials, JSON.stringify(signing, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
        run(javaTool('keytool'), ['-genkeypair', '-noprompt', '-keystore', keystore, '-storetype', 'JKS',
            '-alias', signing.alias, '-keyalg', 'RSA', '-keysize', '4096', '-validity', '10000',
            '-dname', 'CN=Stockmarket TV', '-storepass:env', 'RELEASE_KEY_PASSWORD', '-keypass:env', 'RELEASE_KEY_PASSWORD'],
        project, { ...process.env, RELEASE_KEY_PASSWORD: password });
        protect(keystore);
        console.log('Production signing key created in .release/. Back up the keystore and signing.json together in secure storage. Never commit or upload them to a store listing.');
        process.exit(0);
    }
    if (!existsSync(credentials) || !existsSync(keystore)) throw new Error('No production key. Run npm run android:signing:init first, or restore the existing .release/ backup.');
    const signing = JSON.parse(readFileSync(credentials, 'utf8'));
    for (const field of ['alias', 'storePassword', 'keyPassword']) {
        if (typeof signing[field] !== 'string' || !signing[field]) throw new Error(`Missing signing field: ${field}`);
    }
    const viteEnv = { ...loadEnv('production', project, 'VITE_'), ...Object.fromEntries(Object.entries(process.env).filter(([key]) => key.startsWith('VITE_'))) };
    if (viteEnv.VITE_PHONE_URL !== 'https://stockmarket.samfelton.com'
        || viteEnv.VITE_CONVEX_URL !== 'https://effervescent-flamingo-244.convex.cloud') {
        throw new Error('Store builds must use the documented production phone frontend and Convex backend. Check .env.local.');
    }
    if (!process.env.npm_execpath) throw new Error('Run this helper through npm run android:release.');
    protect(credentials); protect(keystore);
    const env = { ...process.env, ...viteEnv,
        PATH: process.env.JAVA_HOME ? join(process.env.JAVA_HOME, 'bin') + delimiter + process.env.PATH : process.env.PATH,
        STOCKMARKET_KEYSTORE: keystore,
        STOCKMARKET_STORE_PASSWORD: signing.storePassword, STOCKMARKET_KEY_ALIAS: signing.alias,
        STOCKMARKET_KEY_PASSWORD: signing.keyPassword };
    run(process.execPath, [process.env.npm_execpath, 'run', 'android:sync'], project, env);
    run(windows ? (process.env.ComSpec || 'cmd.exe') : './gradlew', windows
        ? ['/d', '/c', 'gradlew.bat assembleRelease bundleRelease lintRelease']
        : ['assembleRelease', 'bundleRelease', 'lintRelease'], join(project, 'android'), env);
    const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
    if (!sdk) throw new Error('Set ANDROID_HOME to verify the signed APK with Android Build Tools 35.0.0.');
    const apk = join(project, 'android/app/build/outputs/apk/release/app-release.apk');
    const aab = join(project, 'android/app/build/outputs/bundle/release/app-release.aab');
    const apksigner = join(sdk, 'build-tools/35.0.0', windows ? 'apksigner.bat' : 'apksigner');
    if (windows) run(process.env.ComSpec || 'cmd.exe', ['/d', '/c', `"${apksigner}" verify --verbose --print-certs "${apk}"`], project, env);
    else run(apksigner, ['verify', '--verbose', '--print-certs', apk], project, env);
    run(javaTool('jarsigner'), ['-verify', aab], project, env);
    const version = JSON.parse(readFileSync(join(project, 'package.json'), 'utf8')).version;
    const output = join(privateDir, version);
    mkdirSync(output, { recursive: true });
    const sums = [];
    for (const [source, name] of [[apk, `stockmarket-tv-${version}-amazon.apk`], [aab, `stockmarket-tv-${version}-google-play.aab`]]) {
        copyFileSync(source, join(output, name));
        sums.push(`${createHash('sha256').update(readFileSync(source)).digest('hex')}  ${name}`);
    }
    writeFileSync(join(output, 'SHA256SUMS'), sums.join('\n') + '\n');
    console.log(`\nVerified store artifacts: ${output}\n${sums.join('\n')}`);
} catch (error) {
    console.error(error.message);
    process.exit(1);
}
