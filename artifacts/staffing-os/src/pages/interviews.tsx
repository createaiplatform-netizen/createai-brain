import { useState } from "react";
import { format } from "date-fns";
import { Plus, Calendar as CalendarIcon, Clock } from "lucide-react";
import { 
  useListInterviews, 
  useCreateInterview, 
  getListInterviewsQueryKey,
  useListCandidates,
  useListRequisitions
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader, Button, Input, Select, Badge, TableWrapper, Th, Td, Modal } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";

export default function Interviews() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data, isLoading } = useListInterviews();
  const interviews = data?.interviews || [];

  const { data: cData } = useListCandidates();
  const { data: rData } = useListRequisitions();

  const { mutate: createInterview, isPending: isCreating } = useCreateInterview({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListInterviewsQueryKey() });
        setIsAddOpen(false);
        toast({ title: "Interview scheduled successfully!" });
      },
      onError: (err: any) => {
        toast({ title: "Error scheduling interview", description: err.message, variant: "destructive" });
      }
    }
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createInterview({
      data: {
        candidateId: Number(fd.get("candidateId")),
        requisitionId: Number(fd.get("requisitionId")),
        submissionId: 1, // Mocking submission ID for now as we don't have a complex flow
        scheduledAt: new Date(fd.get("scheduledAt") as string).toISOString(),
        durationMinutes: Number(fd.get("durationMinutes")),
        type: fd.get("type") as string,
        status: "scheduled",
        interviewerName: fd.get("interviewerName") as string,
        location: "",
        notes: "",
        feedback: "",
        outcome: ""
      }
    });
  };

  const statusMap: Record<string, "default" | "success" | "destructive" | "warning"> = {
    scheduled: "default",
    completed: "success",
    cancelled: "destructive",
    no_show: "warning"
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Interviews" 
        description="Manage your upcoming interview schedule."
        action={<Button onClick={() => setIsAddOpen(true)}><Plus className="w-4 h-4 mr-2" /> Schedule Interview</Button>}
      />

      {isLoading ? (
        <div className="py-20 text-center flex justify-center"><div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div></div>
      ) : interviews.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-700">No interviews scheduled</h3>
          <Button className="mt-4" onClick={() => setIsAddOpen(true)}>Schedule Interview</Button>
        </div>
      ) : (
        <TableWrapper>
          <thead>
            <tr>
              <Th>Date & Time</Th>
              <Th>Candidate</Th>
              <Th>Role</Th>
              <Th>Details</Th>
              <Th className="text-right">Status</Th>
            </tr>
          </thead>
          <tbody>
            {interviews.map((interview) => (
              <tr key={interview.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
                <Td>
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex flex-col items-center justify-center border border-slate-200 shadow-sm shrink-0">
                      <span className="text-xs font-bold text-slate-500 uppercase">{format(new Date(interview.scheduledAt), "MMM")}</span>
                      <span className="text-lg font-extrabold text-slate-800 leading-none">{format(new Date(interview.scheduledAt), "dd")}</span>
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{format(new Date(interview.scheduledAt), "h:mm a")}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" /> {interview.durationMinutes} mins</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <p className="font-semibold text-foreground">{interview.candidateName || `Candidate #${interview.candidateId}`}</p>
                </Td>
                <Td>
                  <p className="text-sm font-medium text-slate-700">{interview.requisitionTitle || `Req #${interview.requisitionId}`}</p>
                </Td>
                <Td>
                  <Badge variant="outline" className="bg-white">{interview.type || 'Standard'}</Badge>
                  {interview.interviewerName && <p className="text-xs text-muted-foreground mt-1">with {interview.interviewerName}</p>}
                </Td>
                <Td className="text-right">
                  <Badge variant={statusMap[interview.status] || "default"}>{interview.status.replace('_', ' ')}</Badge>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      )}

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Schedule Interview">
        <form onSubmit={handleCreate} className="space-y-4">
          <Select name="candidateId" label="Candidate" required>
            <option value="">Select Candidate...</option>
            {cData?.candidates?.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
          </Select>
          <Select name="requisitionId" label="Requisition" required>
            <option value="">Select Role...</option>
            {rData?.requisitions?.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
          </Select>
          
          <div className="grid grid-cols-2 gap-4">
            <Input name="scheduledAt" type="datetime-local" label="Date & Time" required />
            <Input name="durationMinutes" type="number" label="Duration (mins)" defaultValue={60} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select name="type" label="Interview Type" defaultValue="technical">
              <option value="screening">Screening</option>
              <option value="technical">Technical</option>
              <option value="behavioral">Behavioral</option>
              <option value="final">Final Round</option>
            </Select>
            <Input name="interviewerName" label="Interviewer Name" placeholder="John Smith" />
          </div>
          
          <div className="pt-4 flex gap-3 justify-end border-t border-slate-100 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isCreating}>Schedule</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
