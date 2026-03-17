import { useGetLegalDashboard } from "@workspace/api-client-react";
import { PageHeader } from "@/components/PageHeader";
import { formatCurrency, formatDate } from "@/lib/utils";
import { 
  Users, Briefcase, Clock, FileText, 
  ArrowRight, AlertCircle, CheckCircle2 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: dashboard, isLoading } = useGetLegalDashboard();

  if (isLoading) {
    return <div className="animate-pulse space-y-8">
      <div className="h-12 bg-slate-200 rounded w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
      </div>
    </div>;
  }

  const stats = [
    { title: "Open Matters", value: dashboard?.openMatters ?? 0, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Total Clients", value: dashboard?.totalClients ?? 0, icon: Users, color: "text-indigo-600", bg: "bg-indigo-100" },
    { title: "Unbilled Amount", value: formatCurrency(dashboard?.unbilledAmount ?? 0), icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
    { title: "Overdue Invoices", value: dashboard?.overdueInvoices ?? 0, icon: AlertCircle, color: "text-red-600", bg: "bg-red-100" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Good morning, Robert" 
        description="Here's what's happening with your practice today." 
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.title}
          >
            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-slate-500 text-sm">{stat.title}</h3>
                  <div className={`p-2 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="text-3xl font-serif font-bold text-slate-900">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-slate-200 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
            <h2 className="text-lg font-bold font-serif text-slate-900">Recent Matters</h2>
            <Link href="/matters" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex-1 p-0 overflow-hidden">
            {dashboard?.recentMatters?.length ? (
              <ul className="divide-y divide-slate-100">
                {dashboard.recentMatters.slice(0, 5).map(matter => (
                  <li key={matter.id}>
                    <Link href={`/matters/${matter.id}`} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="font-medium text-slate-900">{matter.title}</p>
                        <p className="text-sm text-slate-500 mt-0.5">{matter.clientName} · {matter.type}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          {matter.status.toUpperCase()}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-slate-500">No recent matters.</div>
            )}
          </div>
        </Card>

        <Card className="border-slate-200 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
            <h2 className="text-lg font-bold font-serif text-slate-900">Upcoming Tasks</h2>
            <Link href="/tasks" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex-1 p-0 overflow-hidden">
            {dashboard?.upcomingTasks?.length ? (
              <ul className="divide-y divide-slate-100">
                {dashboard.upcomingTasks.slice(0, 5).map(task => (
                  <li key={task.id} className="flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors">
                    <div className="mt-0.5">
                      <CheckCircle2 className={`h-5 w-5 ${task.isCompleted ? 'text-green-500' : 'text-slate-300'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${task.isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                        {task.title}
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5 truncate">{task.matterTitle}</p>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <p className="text-sm font-medium text-slate-700">{formatDate(task.dueAt)}</p>
                      {task.priority === 'urgent' && <span className="text-[10px] uppercase font-bold text-red-600">Urgent</span>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-slate-500">No upcoming tasks.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
