import { useState } from "react";
import { useListLegalClients, useCreateLegalClient, getListLegalClientsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Building2, User } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function Clients() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useListLegalClients();
  const createClient = useCreateLegalClient({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLegalClientsQueryKey() });
        setIsOpen(false);
      }
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", type: "individual" as "individual"|"company", email: "", phone: "" });

  const clients = data?.clients ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createClient.mutate({ data: formData });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Clients" 
        description="Manage your individual and corporate clients."
        action={
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 font-medium">
                <Plus className="h-4 w-4 mr-2" /> New Client
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">Add New Client</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Client Type</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                  >
                    <option value="individual">Individual</option>
                    <option value="company">Company</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <input 
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder={formData.type === 'company' ? "Acme Corp" : "Jane Doe"}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <input 
                    type="email"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <input 
                    type="tel"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={createClient.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                    {createClient.isPending ? "Saving..." : "Save Client"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="animate-pulse h-64 bg-slate-100 rounded-2xl"></div>
      ) : clients.length === 0 ? (
        <EmptyState 
          icon={Users} 
          title="No clients yet" 
          description="Add your first client to start organizing matters and time entries." 
          action={<Button onClick={() => setIsOpen(true)} className="bg-indigo-600 hover:bg-indigo-700"><Plus className="h-4 w-4 mr-2" />Add Client</Button>}
        />
      ) : (
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-border text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Matters</th>
                  <th className="px-6 py-4">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clients.map(client => (
                  <tr key={client.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          {client.type === 'company' ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{client.name}</p>
                          <p className="text-xs text-slate-500 capitalize">{client.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-900">{client.email || '—'}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{client.phone || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {client.matterCount ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {formatDate(client.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
