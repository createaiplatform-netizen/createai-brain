import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toLowerCase();
  
  let colorClass = "bg-slate-100 text-slate-700 border-slate-200"; // default

  switch (normalized) {
    case "active":
    case "confirmed":
    case "completed":
    case "paid":
      colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
      break;
    case "pending":
    case "scheduled":
      colorClass = "bg-blue-50 text-blue-700 border-blue-200";
      break;
    case "cancelled":
    case "no_show":
    case "inactive":
    case "overdue":
      colorClass = "bg-red-50 text-red-700 border-red-200";
      break;
    case "discharged":
    case "on_leave":
    case "partial":
      colorClass = "bg-amber-50 text-amber-700 border-amber-200";
      break;
  }

  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider", colorClass, className)}>
      {status.replace("_", " ")}
    </span>
  );
}
