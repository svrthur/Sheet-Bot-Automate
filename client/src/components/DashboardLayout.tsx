import React from "react";
import { LayoutDashboard, Settings, Activity, FileSpreadsheet } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}

function NavItem({ href, icon: Icon, label, active }: NavItemProps) {
  return (
    <Link href={href} className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
      active 
        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
        : "text-muted-foreground hover:bg-white hover:text-foreground hover:shadow-sm"
    )}>
      <Icon className={cn("w-5 h-5", active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 lg:w-72 bg-muted/30 border-r border-border/50 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <FileSpreadsheet className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-foreground leading-tight">SheetBot</h1>
            <p className="text-xs text-muted-foreground font-medium">Automation Panel</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          <NavItem href="/" icon={LayoutDashboard} label="Dashboard" active={location === "/"} />
          <NavItem href="/activity" icon={Activity} label="Activity Logs" active={location === "/activity"} />
          <NavItem href="/settings" icon={Settings} label="Settings" active={location === "/settings"} />
        </nav>

        <div className="mt-auto">
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <h4 className="font-semibold text-sm mb-1">Status Check</h4>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">System Operational</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
          {children}
        </div>
      </main>
    </div>
  );
}
