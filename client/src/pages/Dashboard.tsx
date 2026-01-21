import { useLogs, useCreateLog } from "@/hooks/use-logs";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusCard } from "@/components/StatusCard";
import { LogTable } from "@/components/LogTable";
import { Bot, PlayCircle, StopCircle, RefreshCcw, Activity } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { data: logs = [], isLoading, refetch } = useLogs();
  const createLog = useCreateLog();
  const { toast } = useToast();
  
  // Simulated bot state since we don't have a real bot API endpoint in the schema yet
  const [botStatus, setBotStatus] = useState<"active" | "idle" | "error">("active");

  const handleSimulateAction = async () => {
    try {
      await createLog.mutateAsync({
        level: "info",
        message: "Manual trigger: Processing batch job started via dashboard",
        details: { triggeredBy: "admin" }
      });
      toast({ title: "Action Triggered", description: "Batch processing started" });
      
      // Simulate success after 1s
      setTimeout(() => {
        createLog.mutate({
          level: "success",
          message: "Batch job completed successfully. 45 records updated.",
          details: { count: 45 }
        });
      }, 1500);
    } catch (e) {
      toast({ title: "Error", description: "Failed to trigger action", variant: "destructive" });
    }
  };

  const handleToggleBot = () => {
    const newStatus = botStatus === "active" ? "idle" : "active";
    setBotStatus(newStatus);
    createLog.mutate({
      level: "warning",
      message: `Bot status changed to ${newStatus.toUpperCase()}`,
      details: { status: newStatus }
    });
  };

  const stats = {
    total: logs.length,
    errors: logs.filter(l => l.level === 'error').length,
    success: logs.filter(l => l.level === 'success').length,
  };

  const successRate = stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 100;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Dashboard Overview</h1>
            <p className="text-muted-foreground mt-1">Monitor your Google Sheets automation bot in real-time.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleToggleBot}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm ${
                botStatus === 'active' 
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200' 
                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200'
              }`}
            >
              {botStatus === 'active' ? <StopCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
              {botStatus === 'active' ? 'Stop Bot' : 'Start Bot'}
            </button>
            
            <button 
              onClick={handleSimulateAction}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              <Bot className="w-4 h-4" />
              Test Trigger
            </button>
          </div>
        </div>

        {/* Status Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatusCard 
            status={botStatus} 
            totalProcessed={stats.total} 
          />
          
          {/* Mini Stat Cards */}
          <div className="bg-card p-6 rounded-2xl border border-border/60 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Success Rate</p>
                <h3 className="text-2xl font-display font-bold mt-1 text-foreground">{successRate}%</h3>
              </div>
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="w-full bg-muted/50 h-2 rounded-full mt-4 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${successRate}%` }} />
            </div>
          </div>

          <div className="bg-card p-6 rounded-2xl border border-border/60 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Errors (24h)</p>
                <h3 className="text-2xl font-display font-bold mt-1 text-foreground">{stats.errors}</h3>
              </div>
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                <Bot className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              {stats.errors === 0 ? "No errors reported recently." : "Check logs for details."}
            </p>
          </div>

          <div className="bg-card p-6 rounded-2xl border border-border/60 shadow-sm flex flex-col justify-between group cursor-pointer hover:border-primary/50 transition-colors" onClick={() => refetch()}>
             <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Sync</p>
                <h3 className="text-lg font-display font-bold mt-1 text-foreground">Just now</h3>
              </div>
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:rotate-180 transition-transform duration-500">
                <RefreshCcw className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Auto-refreshing every 5s
            </p>
          </div>
        </div>

        {/* Main Logs Table */}
        <LogTable logs={logs} isLoading={isLoading} onRefresh={refetch} />
        
      </div>
    </DashboardLayout>
  );
}
