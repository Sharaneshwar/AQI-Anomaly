import { Link, NavLink } from "react-router-dom";
import { Menu, MessageCircle, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/anomaly", label: "Anomalies" },
  { to: "/raw-data", label: "Dashboard" },
  { to: "/aqi-info", label: "AQI Info" },
];

function NavItem({ to, label, end, className, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
          isActive
            ? "bg-primary/15 text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-card/60",
          className,
        )
      }
    >
      {label}
    </NavLink>
  );
}

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
            <Wind className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-semibold tracking-tight text-foreground">AtmosIQ</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Air Quality Intelligence
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <NavItem key={l.to} {...l} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link to="/chat">
              <MessageCircle className="h-4 w-4" />
              Open Chat
            </Link>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-background border-l border-border">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-foreground">
                  <Wind className="h-4 w-4 text-primary" />
                  AtmosIQ
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1">
                {NAV_LINKS.map((l) => (
                  <NavItem key={l.to} {...l} className="block text-base py-2.5" />
                ))}
                <div className="mt-4">
                  <Button asChild className="w-full">
                    <Link to="/chat">
                      <MessageCircle className="h-4 w-4" />
                      Open Chat
                    </Link>
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
