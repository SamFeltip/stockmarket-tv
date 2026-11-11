import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { App, Boundary } from "./App";
import { joinUrl } from "./storage";
import "../public/static/stylesheets/closed.css";
import "./website/patch.css";
import "./style.css";
const root = createRoot(document.getElementById("root")!);
const convexUrl: unknown = import.meta.env.VITE_CONVEX_URL;
const phoneUrl: unknown = import.meta.env.VITE_PHONE_URL;
function configurationValid(convexUrl: string, phoneUrl: string) {
    try {
        joinUrl(phoneUrl, "test");
        if (import.meta.env.DEV && /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(convexUrl)) return true;
        return /^https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)?\.convex\.cloud$/.test(convexUrl);
    } catch { return false; }
}
if (typeof convexUrl === "string" && typeof phoneUrl === "string" && configurationValid(convexUrl, phoneUrl)) {
    const client = new ConvexReactClient(convexUrl);
    root.render(<StrictMode><ConvexProvider client={client}><Boundary onBack={() => location.reload()}><App phoneUrl={phoneUrl}/></Boundary></ConvexProvider></StrictMode>);
} else {
    root.render(<main className="center"><div className="brand">stockmarket<span>TV</span></div><h1>Connect your exchange</h1>
        <p>Set VITE_CONVEX_URL and VITE_PHONE_URL in .env.local.<br/>Use the same backend as the phone app, then rebuild.</p></main>);
}
