import { useGetStaffingDashboard } from "@workspace/api-client-react";
import { PageHeader, Card, Badge, TableWrapper, Th, Td } from "@/components/ui";
import { Users, Briefcase, Award, TrendingUp, Calendar, ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Link } from "wouter";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: dashboard, isLoading, error } = useGetStaffingDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse flex flex-col items-center gap-4 text-slate-400">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p>Loading dashboard metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="p-6 bg-destructive/10 text-destructive rounded-xl border border-destructive/20">
        <h3 className="font-bold">Error loading dashboard</h3>
        <p className="text-sm mt-1">Please ensure the backend is running and you are authenticated.</p>
      </div>
    );
  }

  const statCards = [
    { title: "Total Candidates", value: dashboard.totalCandidates || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Open Requisitions", value: dashboard.openRequisitions || 0, icon: Briefcase, color: "text-indigo-600", bg: "bg-indigo-100" },
    { title: "Active Placements", value: dashboard.activePlacements || 0, icon: Award, color: "text-emerald-600", bg: "bg-emerald-100" },
    { title: "Placement Revenue", value: formatCurrency(dashboard.placementRevenue || 0), icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-100" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader 
        title="Dashboard overview" 
        description="Here's what's happening with your staffing pipeline today." 
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <Card key={i} className="p-6 flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300">
            <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-7 h-7 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">{stat.title}</p>
              <p className="text-2xl font-bold text-foreground mt-1 font-display">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              <h3 className="font-bold text-lg">Recent Candidates</h3>
            </div>
            <Link href="/candidates" className="text-sm font-semibold text-accent hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-0 flex-1">
            {(!dashboard.recentCandidates || dashboard.recentCandidates.length === 0) ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No recent candidates found.</div>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {dashboard.recentCandidates.map((c) => (
                    <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                            {c.firstName[0]}{c.lastName[0]}
                          </div>
                          <div>
                            <Link href={`/candidates/${c.id}`} className="font-semibold text-foreground group-hover:text-accent transition-colors">
                              {c.firstName} {c.lastName}
                            </Link>
                            <p className="text-xs text-muted-foreground">{c.title || 'No title'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Badge variant={c.status === 'active' ? 'success' : 'default'}>{c.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        <Card className="flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-lg">Upcoming Interviews</h3>
            </div>
            <Link href="/interviews" className="text-sm font-semibold text-accent hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-0 flex-1">
            {(!dashboard.upcomingInterviews || dashboard.upcomingInterviews.length === 0) ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No upcoming interviews scheduled.</div>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {dashboard.upcomingInterviews.map((i) => (
                    <tr key={i.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-foreground">{i.candidateName || `Candidate #${i.candidateId}`}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{i.requisitionTitle || `Req #${i.requisitionId}`}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-medium text-slate-700">{format(new Date(i.scheduledAt), "MMM d, h:mm a")}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{i.type || 'Interview'}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
