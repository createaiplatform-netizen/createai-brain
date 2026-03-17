import { useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Plus, Search, UserCircle, Phone, Mail } from "lucide-react";
import { 
  useListCandidates, 
  useCreateCandidate, 
  getListCandidatesQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader, Button, Input, Select, Badge, TableWrapper, Th, Td, Modal } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";

export default function Candidates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data, isLoading } = useListCandidates({ search: search || undefined });
  const candidates = data?.candidates || [];

  const { mutate: createCandidate, isPending: isCreating } = useCreateCandidate({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCandidatesQueryKey() });
        setIsAddOpen(false);
        toast({ title: "Candidate created successfully!" });
      },
      onError: (err: any) => {
        toast({ title: "Error creating candidate", description: err.message, variant: "destructive" });
      }
    }
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createCandidate({
      data: {
        firstName: fd.get("firstName") as string,
        lastName: fd.get("lastName") as string,
        email: fd.get("email") as string,
        phone: fd.get("phone") as string,
        title: fd.get("title") as string,
        location: fd.get("location") as string,
        skills: fd.get("skills") as string,
        status: fd.get("status") as string || "active",
        experience: Number(fd.get("experience") || 0),
        availability: fd.get("availability") as string,
        source: "Direct",
        resumeUrl: "",
        notes: ""
      }
    });
  };

  const statusBadgeMap: Record<string, "success" | "default" | "warning" | "destructive"> = {
    active: "success",
    inactive: "default",
    placed: "warning",
    do_not_use: "destructive"
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Candidates" 
        description="Manage your talent pool and track candidate progress."
        action={<Button onClick={() => setIsAddOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add Candidate</Button>}
      />

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search candidates by name or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4"></div>
          Loading candidates...
        </div>
      ) : candidates.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          <UserCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-700">No candidates found</h3>
          <p className="text-slate-500 text-sm mt-1 mb-6">Start building your talent pool by adding your first candidate.</p>
          <Button onClick={() => setIsAddOpen(true)}>Add Candidate</Button>
        </div>
      ) : (
        <TableWrapper>
          <thead>
            <tr>
              <Th>Candidate</Th>
              <Th>Contact</Th>
              <Th>Role / Location</Th>
              <Th>Status</Th>
              <Th>Added</Th>
              <Th className="text-right">Action</Th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group border-b border-slate-100 last:border-0">
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shadow-sm">
                      {c.firstName[0]}{c.lastName[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground group-hover:text-accent transition-colors">{c.firstName} {c.lastName}</p>
                      <p className="text-xs text-muted-foreground">ID: #{c.id}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <div className="space-y-1 text-sm text-slate-600">
                    <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {c.email}</div>
                    {c.phone && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {c.phone}</div>}
                  </div>
                </Td>
                <Td>
                  <p className="font-medium text-slate-700">{c.title || "—"}</p>
                  <p className="text-xs text-muted-foreground">{c.location || "—"}</p>
                </Td>
                <Td>
                  <Badge variant={statusBadgeMap[c.status] || "default"}>
                    {c.status.replace(/_/g, ' ')}
                  </Badge>
                </Td>
                <Td>
                  <p className="text-sm text-slate-600">{format(new Date(c.createdAt), "MMM d, yyyy")}</p>
                </Td>
                <Td className="text-right">
                  <Link href={`/candidates/${c.id}`}>
                    <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      View Profile
                    </Button>
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      )}

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Candidate" description="Enter the candidate's core details below.">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input name="firstName" label="First Name" required placeholder="Jane" />
            <Input name="lastName" label="Last Name" required placeholder="Doe" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input name="email" type="email" label="Email" required placeholder="jane@example.com" />
            <Input name="phone" label="Phone" placeholder="(555) 123-4567" />
          </div>
          <Input name="title" label="Current Title" placeholder="Senior Software Engineer" />
          <div className="grid grid-cols-2 gap-4">
            <Input name="location" label="Location" placeholder="San Francisco, CA" />
            <Input name="experience" type="number" label="Years of Experience" placeholder="5" />
          </div>
          <Input name="skills" label="Key Skills (comma separated)" placeholder="React, Node.js, TypeScript" />
          <Select name="status" label="Initial Status" defaultValue="active">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <div className="pt-4 flex gap-3 justify-end border-t border-slate-100 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isCreating}>Create Candidate</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
