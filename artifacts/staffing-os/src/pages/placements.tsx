import { useState } from "react";
import { format } from "date-fns";
import { Plus, Award, DollarSign } from "lucide-react";
import { 
  useListPlacements, 
  useCreatePlacement, 
  getListPlacementsQueryKey,
  useListCandidates,
  useListRequisitions,
  useListClients
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader, Button, Input, Select, Badge, TableWrapper, Th, Td, Modal } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

export default function Placements() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data, isLoading } = useListPlacements();
  const placements = data?.placements || [];

  const { data: cData } = useListCandidates();
  const { data: rData } = useListRequisitions();
  const { data: clData } = useListClients();

  const { mutate: createPlacement, isPending: isCreating } = useCreatePlacement({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPlacementsQueryKey() });
        setIsAddOpen(false);
        toast({ title: "Placement recorded successfully!" });
      },
      onError: (err: any) => {
        toast({ title: "Error creating placement", description: err.message, variant: "destructive" });
      }
    }
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createPlacement({
      data: {
        candidateId: Number(fd.get("candidateId")),
        requisitionId: Number(fd.get("requisitionId")),
        clientId: Number(fd.get("clientId")),
        startDate: new Date(fd.get("startDate") as string).toISOString(),
        type: fd.get("type") as string,
        salary: Number(fd.get("salary") || 0),
        fee: Number(fd.get("fee") || 0),
        status: "active",
        notes: "",
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Placements" 
        description="Track successful placements and generated revenue."
        action={<Button onClick={() => setIsAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"><Plus className="w-4 h-4 mr-2" /> Record Placement</Button>}
      />

      {isLoading ? (
        <div className="py-20 text-center flex justify-center"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : placements.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-emerald-100 rounded-3xl bg-emerald-50/30">
          <Award className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-emerald-800">No placements recorded</h3>
          <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700" onClick={() => setIsAddOpen(true)}>Record your first placement</Button>
        </div>
      ) : (
        <TableWrapper>
          <thead>
            <tr>
              <Th>Candidate / Role</Th>
              <Th>Client</Th>
              <Th>Start Date</Th>
              <Th>Financials</Th>
              <Th className="text-right">Status</Th>
            </tr>
          </thead>
          <tbody>
            {placements.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
                <Td>
                  <p className="font-bold text-foreground">{p.candidateName || `Candidate #${p.candidateId}`}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{p.requisitionTitle || `Req #${p.requisitionId}`}</p>
                </Td>
                <Td>
                  <p className="font-semibold text-accent">{p.clientName || `Client #${p.clientId}`}</p>
                  <Badge variant="outline" className="mt-1 bg-slate-50">{p.type.replace('_', ' ')}</Badge>
                </Td>
                <Td>
                  <p className="text-sm font-medium text-slate-700">{format(new Date(p.startDate), "MMM d, yyyy")}</p>
                </Td>
                <Td>
                  <div className="flex flex-col gap-1">
                    {p.salary ? <span className="text-sm font-medium text-slate-700">Salary: {formatCurrency(p.salary)}</span> : null}
                    {p.fee ? <span className="text-sm font-bold text-emerald-600 flex items-center"><DollarSign className="w-3.5 h-3.5" />Fee: {formatCurrency(p.fee)}</span> : null}
                  </div>
                </Td>
                <Td className="text-right">
                  <Badge variant={p.status === 'active' ? 'success' : p.status === 'completed' ? 'default' : 'destructive'}>
                    {p.status}
                  </Badge>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      )}

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Record Placement">
        <form onSubmit={handleCreate} className="space-y-4">
          <Select name="candidateId" label="Candidate" required>
            <option value="">Select Candidate...</option>
            {cData?.candidates?.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
          </Select>
          
          <div className="grid grid-cols-2 gap-4">
            <Select name="clientId" label="Client" required>
              <option value="">Select Client...</option>
              {clData?.clients?.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
            </Select>
            <Select name="requisitionId" label="Requisition" required>
              <option value="">Select Role...</option>
              {rData?.requisitions?.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input name="startDate" type="date" label="Start Date" required />
            <Select name="type" label="Placement Type" defaultValue="full_time">
              <option value="full_time">Full Time</option>
              <option value="contract">Contract</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input name="salary" type="number" label="Salary / Rate" placeholder="120000" />
            <Input name="fee" type="number" label="Placement Fee" placeholder="24000" />
          </div>
          
          <div className="pt-4 flex gap-3 justify-end border-t border-slate-100 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isCreating} className="bg-emerald-600 hover:bg-emerald-700">Record Placement</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
