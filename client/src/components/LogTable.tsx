import { format } from "date-fns";
import { type Log } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, Search, Terminal } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LogTableProps {
  logs: Log[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function LogTable({ logs, isLoading, onRefresh }: LogTableProps) {
  const [filter, setFilter] = useState("");

  const filteredLogs = logs.filter(log => 
    log.message.toLowerCase().includes(filter.toLowerCase()) || 
    log.level.toLowerCase().includes(filter.toLowerCase())
  ).sort((a, b) => {
    // Sort by createdAt descending (newest first)
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  const getLevelBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-50 text-red-700 text-xs font-medium ring-1 ring-inset ring-red-600/10">Error</span>;
      case 'success':
        return <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium ring-1 ring-inset ring-emerald-600/10">Success</span>;
      case 'warning':
        return <span className="inline-flex items-center px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-medium ring-1 ring-inset ring-amber-600/10">Warning</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium ring-1 ring-inset ring-blue-700/10">Info</span>;
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Terminal className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Activity Logs</h3>
          <span className="bg-muted px-2 py-0.5 rounded-full text-xs text-muted-foreground font-medium">
            {filteredLogs.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search logs..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-full sm:w-64"
            />
          </div>
          <button 
            onClick={onRefresh}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh Logs"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-muted/40 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <div className="col-span-3">Timestamp</div>
        <div className="col-span-2">Level</div>
        <div className="col-span-7">Message</div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-0">
          <AnimatePresence initial={false}>
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors items-center text-sm group"
                >
                  <div className="col-span-3 font-mono text-muted-foreground text-xs">
                    {log.createdAt ? format(new Date(log.createdAt), "MMM dd, HH:mm:ss") : "-"}
                  </div>
                  <div className="col-span-2">
                    {getLevelBadge(log.level)}
                  </div>
                  <div className="col-span-7 text-foreground font-medium truncate group-hover:whitespace-normal group-hover:overflow-visible group-hover:bg-card group-hover:absolute group-hover:z-10 group-hover:w-[calc(100%-3rem)] group-hover:shadow-lg group-hover:rounded-md group-hover:p-3 group-hover:left-12">
                    {log.message}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <div className="bg-muted p-4 rounded-full mb-4">
                  <Search className="w-6 h-6 opacity-50" />
                </div>
                <p>No logs found matching your search</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
