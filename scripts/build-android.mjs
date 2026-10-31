#!/usr/bin/env node
// Build a sideloadable development APK, including freshly bundled web assets.
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
if (process.argv.includes('--help')) {
    console.log('npm run android:debug\nBuilds the web UI and Android debug APK for Fire OS / Android TV sideloading.\nRequires npm ci, configured .env.local, JDK 17 and Android SDK 35.\nThen run npm run tv:install -- YOUR_TV_IP');
    process.exit(0);
}
if (process.argv.length > 2) {
    console.error('Unexpected arguments. Use npm run android:debug or --help.');
    process.exit(1);
}
function run(command, args, cwd) {
    const result = spawnSync(command, args, { cwd, stdio: 'inherit', shell: false });
    if (result.error) {
        console.error(`Could not start ${command}: ${result.error.message}`);
        process.exit(1);
    }
    if (result.status !== 0) process.exit(result.status ?? 1);
}
// npm supplies its own CLI path on every supported OS, avoiding shell quoting.
if (!process.env.npm_execpath) {
    console.error('Run this helper with npm run android:debug.');
    process.exit(1);
}
run(process.execPath, [process.env.npm_execpath, 'run', 'android:sync'], project);
if (process.platform === 'win32') {
    run(process.env.ComSpec || 'cmd.exe', ['/d', '/c', 'gradlew.bat assembleDebug lintDebug'], join(project, 'android'));
} else {
    run('./gradlew', ['assembleDebug', 'lintDebug'], join(project, 'android'));
}
const apk = join(project, 'android/app/build/outputs/apk/debug/app-debug.apk');
console.log(`\nDevelopment APK: ${apk}\nSHA-256: ${createHash('sha256').update(readFileSync(apk)).digest('hex')}\nInstall: npm run tv:install -- YOUR_TV_IP`);
