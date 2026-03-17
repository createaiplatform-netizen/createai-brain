import { useState } from "react";
import { useListInvoices, useListLegalClients, useCreateInvoice, getListInvoicesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Plus, Download } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function Billing() {
  const queryClient = useQueryClient();
  const { data: invoicesData, isLoading } = useListInvoices();
  const { data: clientsData } = useListLegalClients();
  
  const createInvoice = useCreateInvoice({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
        setIsOpen(false);
      }
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    clientId: "",
    dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: ""
  });

  const invoices = invoicesData?.invoices ?? [];
  const clients = clientsData?.clients ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createInvoice.mutate({
      data: {
        clientId: parseInt(formData.clientId, 10),
        dueAt: formData.dueAt,
        notes: formData.notes
      }
    });
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    const colors: Record<string, string> = {
      draft: "bg-slate-100 text-slate-800",
      sent: "bg-blue-100 text-blue-800",
      paid: "bg-green-100 text-green-800",
      overdue: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-500 line-through"
    };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${colors[s] || colors.draft}`}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Billing & Invoices" 
        description="Generate invoices from unbilled time and track payments."
        action={
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 font-medium">
                <Plus className="h-4 w-4 mr-2" /> Generate Invoice
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">Generate Invoice</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Client</label>
                  <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})}>
                    <option value="" disabled>Select client (generates for all unbilled time)...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <p className="text-xs text-slate-500">This will gather all unbilled time entries for the selected client into a draft invoice.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Due Date</label>
                  <input type="date" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" value={formData.dueAt} onChange={e => setFormData({...formData, dueAt: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes (Visible on invoice)</label>
                  <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 min-h-[80px]" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Thank you for your business." />
                </div>
                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={createInvoice.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                    {createInvoice.isPending ? "Generating..." : "Generate Draft"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="animate-pulse h-64 bg-slate-100 rounded-2xl"></div>
      ) : invoices.length === 0 ? (
        <EmptyState 
          icon={FileText} 
          title="No invoices yet" 
          description="Generate your first invoice from unbilled time entries." 
          action={<Button onClick={() => setIsOpen(true)} className="bg-indigo-600 hover:bg-indigo-700"><Plus className="h-4 w-4 mr-2" />Generate Invoice</Button>}
        />
      ) : (
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-border text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Issued</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map(invoice => (
                  <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-slate-900">{invoice.invoiceNumber}</td>
                    <td className="px-6 py-4 font-medium text-indigo-600">{invoice.clientName}</td>
                    <td className="px-6 py-4">{getStatusBadge(invoice.status)}</td>
                    <td className="px-6 py-4 text-slate-600">{formatDate(invoice.issuedAt)}</td>
                    <td className="px-6 py-4 text-slate-600">{formatDate(invoice.dueAt)}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">{formatCurrency(invoice.total)}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="text-slate-500 hover:text-indigo-600">
                        <Download className="h-4 w-4" />
                      </Button>
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
