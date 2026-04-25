import { Link } from "react-router-dom";
import { Mail, Wind } from "lucide-react";

const QUICK_LINKS = [
  { to: "/", label: "Home" },
  { to: "/anomaly", label: "Anomalies" },
  { to: "/raw-data", label: "Dashboard" },
  { to: "/aqi-info", label: "AQI Info" },
  { to: "/chat", label: "Chat" },
];

const RESOURCES = [
  { href: "https://www.who.int/health-topics/air-pollution", label: "WHO · Air Pollution" },
  { href: "https://cpcb.nic.in/", label: "CPCB India" },
  { href: "https://aqicn.org/", label: "AQICN" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-card/40 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-2 space-y-3">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
                <Wind className="h-5 w-5" />
              </div>
              <span className="font-semibold tracking-tight text-foreground">AtmosIQ</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              An intelligent AQI analytics platform combining anomaly detection,
              a natural language query engine, and observability — built to
              surface real, validated air-quality insights for Indian cities.
            </p>
            <div className="flex items-center gap-3 pt-1 text-muted-foreground">
              <a
                href="mailto:vanguards@walchandsangli.ac.in"
                className="inline-flex items-center gap-1.5 text-xs hover:text-foreground transition-colors"
                aria-label="Email"
              >
                <Mail className="h-3.5 w-3.5" />
                vanguards@walchandsangli.ac.in
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Explore
            </h4>
            <ul className="space-y-2">
              {QUICK_LINKS.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Resources
            </h4>
            <ul className="space-y-2">
              {RESOURCES.map((r) => (
                <li key={r.href}>
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {r.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© {year} Vanguards · Walchand College of Engineering, Sangli</span>
          <span>Anomaly Detection · Query Engine · Observability</span>
        </div>
      </div>
    </footer>
  );
}
