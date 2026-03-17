import { useState } from "react";
import { useListLegalMatters, useListLegalClients, useCreateLegalMatter, getListLegalMattersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Briefcase, Plus, Search, Filter } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Link } from "wouter";

export function MatterStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: "bg-green-100 text-green-800 border-green-200",
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    closed: "bg-slate-100 text-slate-600 border-slate-200",
    on_hold: "bg-red-100 text-red-800 border-red-200",
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[status] || colors.open}`}>
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );
}

export default function Matters() {
  const queryClient = useQueryClient();
  const { data: mattersData, isLoading } = useListLegalMatters();
  const { data: clientsData } = useListLegalClients();
  
  const createMatter = useCreateLegalMatter({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLegalMattersQueryKey() });
        setIsOpen(false);
      }
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    clientId: "",
    title: "",
    type: "Litigation",
    status: "open" as "open"|"pending"|"closed"|"on_hold",
    billingType: "hourly" as "hourly"|"flat_fee"|"contingency"|"retainer"
  });

  const matters = mattersData?.matters ?? [];
  const clients = clientsData?.clients ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMatter.mutate({ 
      data: {
        ...formData,
        clientId: parseInt(formData.clientId, 10)
      } 
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Matters" 
        description="Active cases, deals, and advisory work."
        action={
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 font-medium">
                <Plus className="h-4 w-4 mr-2" /> New Matter
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">Create New Matter</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Client</label>
                  <select 
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.clientId}
                    onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                  >
                    <option value="" disabled>Select a client...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Matter Title</label>
                  <input 
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g. Smith v. Jones or Series A Financing"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Practice Area</label>
                    <input 
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    >
                      <option value="open">Open</option>
                      <option value="pending">Pending</option>
                      <option value="on_hold">On Hold</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Billing Type</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.billingType}
                    onChange={(e) => setFormData({...formData, billingType: e.target.value as any})}
                  >
                    <option value="hourly">Hourly</option>
                    <option value="flat_fee">Flat Fee</option>
                    <option value="contingency">Contingency</option>
                    <option value="retainer">Retainer</option>
                  </select>
                </div>
                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={createMatter.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                    {createMatter.isPending ? "Creating..." : "Create Matter"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter matters..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <Button variant="outline" className="bg-white border-slate-200 text-slate-700">
          <Filter className="h-4 w-4 mr-2" /> Filter
        </Button>
      </div>

      {isLoading ? (
        <div className="animate-pulse h-64 bg-slate-100 rounded-2xl"></div>
      ) : matters.length === 0 ? (
        <EmptyState 
          icon={Briefcase} 
          title="No matters yet" 
          description="Create your first matter to start tracking time, tasks, and notes." 
          action={<Button onClick={() => setIsOpen(true)} className="bg-indigo-600 hover:bg-indigo-700"><Plus className="h-4 w-4 mr-2" />New Matter</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matters.map(matter => (
            <Link key={matter.id} href={`/matters/${matter.id}`}>
              <div className="bg-card rounded-2xl p-6 shadow-sm hover:shadow-md border border-border transition-all cursor-pointer h-full flex flex-col group hover:border-indigo-200">
                <div className="flex justify-between items-start mb-4">
                  <MatterStatusBadge status={matter.status} />
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                    {matter.billingType.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="font-serif text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-1 line-clamp-2">
                  {matter.title}
                </h3>
                <p className="text-sm font-medium text-slate-600 mb-4">{matter.clientName}</p>
                <div className="mt-auto pt-4 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
                  <span>{matter.type}</span>
                  <span>Opened {formatDate(matter.openedAt || matter.createdAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
