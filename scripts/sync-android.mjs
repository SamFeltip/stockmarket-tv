import { cp, mkdir, rm, access } from "node:fs/promises";
const source = new URL("../dist/", import.meta.url);
const target = new URL("../android/app/src/main/assets/web/", import.meta.url);
await access(new URL("index.html", source));
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });
console.log("TV interface copied into the Android project. Open android/ in Android Studio to build the APK.");
