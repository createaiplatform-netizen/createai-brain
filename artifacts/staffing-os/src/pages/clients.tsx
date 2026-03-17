import { useState } from "react";
import { format } from "date-fns";
import { Plus, Building2, ExternalLink } from "lucide-react";
import { 
  useListClients, 
  useCreateClient, 
  getListClientsQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader, Button, Input, Select, Badge, TableWrapper, Th, Td, Modal } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";

export default function Clients() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data, isLoading } = useListClients();
  const clients = data?.clients || [];

  const { mutate: createClient, isPending: isCreating } = useCreateClient({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
        setIsAddOpen(false);
        toast({ title: "Client created successfully!" });
      },
      onError: (err: any) => {
        toast({ title: "Error creating client", description: err.message, variant: "destructive" });
      }
    }
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createClient({
      data: {
        companyName: fd.get("companyName") as string,
        industry: fd.get("industry") as string,
        contactName: fd.get("contactName") as string,
        contactEmail: fd.get("contactEmail") as string,
        contactPhone: fd.get("contactPhone") as string,
        status: fd.get("status") as string || "active",
        address: "",
        website: "",
        notes: ""
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Clients" 
        description="Manage your employer relationships and company profiles."
        action={<Button onClick={() => setIsAddOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add Client</Button>}
      />

      {isLoading ? (
        <div className="py-20 text-center flex justify-center"><div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div></div>
      ) : clients.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-700">No clients found</h3>
          <Button className="mt-4" onClick={() => setIsAddOpen(true)}>Add your first client</Button>
        </div>
      ) : (
        <TableWrapper>
          <thead>
            <tr>
              <Th>Company</Th>
              <Th>Industry</Th>
              <Th>Main Contact</Th>
              <Th>Activity</Th>
              <Th>Status</Th>
              <Th className="text-right">Action</Th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 group">
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shadow-sm">
                      {c.companyName[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{c.companyName}</p>
                      <p className="text-xs text-muted-foreground">ID: #{c.id}</p>
                    </div>
                  </div>
                </Td>
                <Td><span className="text-sm text-slate-600 font-medium bg-slate-100 px-2 py-1 rounded-md">{c.industry || "—"}</span></Td>
                <Td>
                  {c.contactName ? (
                    <div>
                      <p className="font-medium text-sm">{c.contactName}</p>
                      <p className="text-xs text-muted-foreground">{c.contactEmail}</p>
                    </div>
                  ) : <span className="text-muted-foreground text-sm">—</span>}
                </Td>
                <Td>
                  <div className="flex gap-2">
                    <div className="text-center px-2 py-1 bg-blue-50 rounded-lg">
                      <p className="text-xs font-bold text-blue-700">{c.openRequisitions || 0}</p>
                      <p className="text-[10px] text-blue-600/70 uppercase">Reqs</p>
                    </div>
                    <div className="text-center px-2 py-1 bg-emerald-50 rounded-lg">
                      <p className="text-xs font-bold text-emerald-700">{c.activePlacements || 0}</p>
                      <p className="text-[10px] text-emerald-600/70 uppercase">Placed</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <Badge variant={c.status === 'active' ? 'success' : 'default'}>{c.status}</Badge>
                </Td>
                <Td className="text-right">
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-4 h-4 text-slate-500" />
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      )}

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Client">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input name="companyName" label="Company Name" required placeholder="Acme Corp" />
          <Input name="industry" label="Industry" placeholder="Technology, Healthcare, etc." />
          
          <div className="border-t border-slate-100 pt-4 mt-2">
            <h4 className="text-sm font-semibold mb-3">Primary Contact</h4>
            <div className="space-y-4">
              <Input name="contactName" label="Full Name" placeholder="John Smith" />
              <div className="grid grid-cols-2 gap-4">
                <Input name="contactEmail" type="email" label="Email Address" placeholder="john@acme.com" />
                <Input name="contactPhone" label="Phone Number" placeholder="(555) 000-0000" />
              </div>
            </div>
          </div>

          <Select name="status" label="Status" defaultValue="active">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          
          <div className="pt-4 flex gap-3 justify-end border-t border-slate-100 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isCreating}>Create Client</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
