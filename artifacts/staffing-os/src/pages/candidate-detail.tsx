import { useRoute } from "wouter";
import { format } from "date-fns";
import { 
  useGetCandidate, 
  useUpdateCandidate,
  getGetCandidateQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader, Badge, Card, Button } from "@/components/ui";
import { Mail, Phone, MapPin, Briefcase, Calendar, Code, Clock, Building2, UserCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function CandidateDetail() {
  const [, params] = useRoute("/candidates/:id");
  const id = Number(params?.id);
  const queryClient = useQueryClient();

  const { data: candidate, isLoading, error } = useGetCandidate(id, {
    query: { enabled: !!id, queryKey: getGetCandidateQueryKey(id) }
  });

  if (isLoading) return <div className="p-20 text-center"><div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div></div>;
  if (error || !candidate) return <div className="p-10 text-center text-destructive">Candidate not found.</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 bg-white p-8 rounded-3xl shadow-sm border border-slate-200/60 relative overflow-hidden">
        {/* Decorative background blob */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex gap-6 relative z-10">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-accent to-blue-400 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-accent/20">
            {candidate.firstName[0]}{candidate.lastName[0]}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-foreground font-display">{candidate.firstName} {candidate.lastName}</h1>
              <Badge variant={candidate.status === 'active' ? 'success' : 'default'} className="mt-1">
                {candidate.status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-lg text-slate-600 mt-1 font-medium">{candidate.title || "No title specified"}</p>
            
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-600">
              <div className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-slate-400" /> {candidate.email}</div>
              {candidate.phone && <div className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-slate-400" /> {candidate.phone}</div>}
              {candidate.location && <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {candidate.location}</div>}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 relative z-10">
          <Button variant="outline">Edit Profile</Button>
          <Button>Create Submission</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6">
            <h3 className="font-bold text-lg border-b border-slate-100 pb-3 mb-4">Profile Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1"><Code className="w-3 h-3" /> Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.skills ? candidate.skills.split(',').map(s => (
                    <span key={s} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">{s.trim()}</span>
                  )) : <span className="text-sm text-slate-500">Not specified</span>}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Experience</p>
                <p className="text-sm font-medium">{candidate.experience ? `${candidate.experience} years` : 'Not specified'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Added On</p>
                <p className="text-sm font-medium">{format(new Date(candidate.createdAt), "MMMM d, yyyy")}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="font-bold text-lg border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-500" /> Activity History
            </h3>
            
            <div className="space-y-8">
              {/* Placements Section */}
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Placements</h4>
                {!candidate.placements?.length ? (
                  <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">No placements yet.</p>
                ) : (
                  <div className="space-y-3">
                    {candidate.placements.map(p => (
                      <div key={p.id} className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-emerald-900">{p.requisitionTitle || 'Unknown Role'} at {p.clientName || 'Unknown Client'}</p>
                          <p className="text-xs text-emerald-700/70 mt-1">Started: {format(new Date(p.startDate), "MMM d, yyyy")} • {p.type}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="success">{p.status}</Badge>
                          {p.salary && <p className="text-sm font-semibold text-emerald-800 mt-1">{formatCurrency(p.salary)}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Interviews Section */}
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Interviews</h4>
                {!candidate.interviews?.length ? (
                  <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">No interviews scheduled.</p>
                ) : (
                  <div className="space-y-3">
                    {candidate.interviews.map(i => (
                      <div key={i.id} className="p-4 rounded-xl border border-slate-200 bg-white flex justify-between items-center shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{i.requisitionTitle || 'General Interview'}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(i.scheduledAt), "MMM d, yyyy 'at' h:mm a")} • {i.durationMinutes} mins
                            </p>
                          </div>
                        </div>
                        <Badge variant={i.status === 'completed' ? 'success' : i.status === 'scheduled' ? 'default' : 'warning'}>
                          {i.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submissions Section */}
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Submissions</h4>
                {!candidate.submissions?.length ? (
                  <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">No submissions yet.</p>
                ) : (
                  <div className="space-y-3">
                    {candidate.submissions.map(s => (
                      <div key={s.id} className="p-4 rounded-xl border border-slate-200 bg-white flex justify-between items-center shadow-sm">
                        <div>
                          <p className="font-semibold text-foreground">{s.requisitionTitle || 'Unknown Role'} <span className="text-slate-400 font-normal">at {s.clientName || 'Unknown Client'}</span></p>
                          <p className="text-xs text-muted-foreground mt-1">Submitted: {format(new Date(s.submittedAt), "MMM d, yyyy")}</p>
                        </div>
                        <Badge variant="outline">{s.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
