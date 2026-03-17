import { useState } from "react";
import { format } from "date-fns";
import { Plus, Briefcase, Users } from "lucide-react";
import { 
  useListRequisitions, 
  useCreateRequisition, 
  getListRequisitionsQueryKey,
  useListClients
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader, Button, Input, Select, Badge, TableWrapper, Th, Td, Modal } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

export default function Requisitions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data, isLoading } = useListRequisitions();
  const requisitions = data?.requisitions || [];

  const { data: clientsData } = useListClients();
  const clients = clientsData?.clients || [];

  const { mutate: createRequisition, isPending: isCreating } = useCreateRequisition({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRequisitionsQueryKey() });
        setIsAddOpen(false);
        toast({ title: "Requisition created successfully!" });
      },
      onError: (err: any) => {
        toast({ title: "Error creating requisition", description: err.message, variant: "destructive" });
      }
    }
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createRequisition({
      data: {
        clientId: Number(fd.get("clientId")),
        title: fd.get("title") as string,
        type: fd.get("type") as string,
        salaryMin: Number(fd.get("salaryMin") || 0),
        salaryMax: Number(fd.get("salaryMax") || 0),
        status: "open",
        priority: fd.get("priority") as string,
        department: "",
        location: "",
        description: "",
        requirements: "",
        targetDate: new Date().toISOString()
      }
    });
  };

  const statusMap: Record<string, "success" | "warning" | "destructive" | "default"> = {
    open: "success",
    on_hold: "warning",
    filled: "default",
    cancelled: "destructive"
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Job Requisitions" 
        description="Track open roles and manage candidate submissions."
        action={<Button onClick={() => setIsAddOpen(true)}><Plus className="w-4 h-4 mr-2" /> New Role</Button>}
      />

      {isLoading ? (
        <div className="py-20 text-center flex justify-center"><div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div></div>
      ) : requisitions.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-700">No requisitions found</h3>
          <Button className="mt-4" onClick={() => setIsAddOpen(true)}>Create Requisition</Button>
        </div>
      ) : (
        <TableWrapper>
          <thead>
            <tr>
              <Th>Role / Client</Th>
              <Th>Type</Th>
              <Th>Compensation</Th>
              <Th>Pipeline</Th>
              <Th>Priority & Status</Th>
              <Th className="text-right">Created</Th>
            </tr>
          </thead>
          <tbody>
            {requisitions.map((req) => (
              <tr key={req.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
                <Td>
                  <p className="font-semibold text-foreground text-base">{req.title}</p>
                  <p className="text-sm text-accent font-medium mt-0.5">{req.clientName || `Client #${req.clientId}`}</p>
                </Td>
                <Td>
                  <Badge variant="outline" className="bg-slate-50">{req.type.replace('_', ' ')}</Badge>
                </Td>
                <Td>
                  <p className="text-sm font-medium text-slate-700">
                    {req.salaryMin && req.salaryMax 
                      ? `${formatCurrency(req.salaryMin)} - ${formatCurrency(req.salaryMax)}`
                      : req.salaryMin ? `${formatCurrency(req.salaryMin)}+`
                      : "DOE"}
                  </p>
                </Td>
                <Td>
                  <div className="flex items-center gap-1.5 text-sm text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg w-max">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="font-bold text-slate-700">{req.submissionCount || 0}</span> subs
                  </div>
                </Td>
                <Td>
                  <div className="flex flex-col gap-1 items-start">
                    <Badge variant={statusMap[req.status]}>{req.status.replace('_', ' ')}</Badge>
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${req.priority === 'urgent' ? 'text-destructive' : 'text-slate-400'}`}>
                      {req.priority} PRIORITY
                    </span>
                  </div>
                </Td>
                <Td className="text-right text-sm text-slate-500">
                  {format(new Date(req.createdAt), "MMM d, yyyy")}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      )}

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create Job Requisition">
        <form onSubmit={handleCreate} className="space-y-4">
          <Select name="clientId" label="Client" required>
            <option value="">Select a client...</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
          </Select>
          
          <Input name="title" label="Job Title" required placeholder="Senior Frontend Developer" />
          
          <div className="grid grid-cols-2 gap-4">
            <Select name="type" label="Employment Type" defaultValue="full_time">
              <option value="full_time">Full Time</option>
              <option value="contract">Contract</option>
              <option value="contract_to_hire">Contract to Hire</option>
            </Select>
            <Select name="priority" label="Priority" defaultValue="medium">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input name="salaryMin" type="number" label="Min Salary/Rate" placeholder="120000" />
            <Input name="salaryMax" type="number" label="Max Salary/Rate" placeholder="150000" />
          </div>
          
          <div className="pt-4 flex gap-3 justify-end border-t border-slate-100 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isCreating}>Create Requisition</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
