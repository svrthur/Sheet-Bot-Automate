import { cn } from "@/lib/utils";
import { Activity, CheckCircle2, AlertCircle, Clock } from "lucide-react";

type StatusType = "active" | "idle" | "error" | "maintenance";

interface StatusCardProps {
  status: StatusType;
  lastActive?: Date;
  uptime?: string;
  totalProcessed?: number;
}

export function StatusCard({ status, lastActive, uptime = "99.9%", totalProcessed = 0 }: StatusCardProps) {
  const statusConfig = {
    active: {
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      icon: CheckCircle2,
      label: "System Online",
      description: "Processing requests normally"
    },
    idle: {
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      icon: Clock,
      label: "Standby",
      description: "Waiting for new tasks"
    },
    error: {
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      icon: AlertCircle,
      label: "System Error",
      description: "Attention required immediately"
    },
    maintenance: {
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      icon: Activity,
      label: "Maintenance",
      description: "Scheduled updates in progress"
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/60 hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-muted-foreground text-sm font-semibold uppercase tracking-wider mb-1">Bot Status</h3>
          <div className="flex items-center gap-2">
            <span className={cn("flex items-center justify-center w-8 h-8 rounded-lg", config.bg, config.color)}>
              <Icon className="w-5 h-5" />
            </span>
            <span className="font-display font-bold text-2xl text-foreground">{config.label}</span>
          </div>
        </div>
        <div className={cn("px-3 py-1 rounded-full text-xs font-semibold border", config.bg, config.color, config.border)}>
          {status === 'active' ? 'Live' : status}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Uptime</p>
          <p className="font-mono font-medium text-foreground">{uptime}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Processed</p>
          <p className="font-mono font-medium text-foreground">{totalProcessed.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
