import type { ReactNode } from "react";
// The TV supplies onBack; this fallback keeps the copied website component standalone.
export function Link({ children, className }: { to: string; children: ReactNode; className?: string }) {
    return <a className={className} href={import.meta.env.BASE_URL}>{children}</a>;
}
