import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListHealthBilling, 
  useCreateHealthBill,
  useUpdateHealthBill,
  useListPatients,
  getListHealthBillingQueryKey,
  CreateHealthBillBody
} from "@workspace/api-client-react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Receipt, Plus, Loader2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function Billing() {
  const { data, isLoading } = useListHealthBilling();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const createBill = useCreateHealthBill({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListHealthBillingQueryKey() });
        setIsDialogOpen(false);
      }
    }
  });

  const updateBill = useUpdateHealthBill({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListHealthBillingQueryKey() })
    }
  });

  const { data: patientsData } = useListPatients();

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body: CreateHealthBillBody = {
      patientId: Number(fd.get("patientId")),
      description: fd.get("description") as string,
      amount: Number(fd.get("amount")),
      insuranceCoverage: Number(fd.get("insuranceCoverage") || 0),
      dueDate: fd.get("dueDate") ? new Date(fd.get("dueDate") as string).toISOString() : undefined,
      status: "pending",
    };
    createBill.mutate({ data: body });
  };

  const markAsPaid = (id: number) => {
    updateBill.mutate({ id, data: { status: "paid", paidDate: new Date().toISOString() } });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Billing & Invoicing" 
        description="Manage patient billing, insurance claims, and payments."
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" /> Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Patient *</label>
                  <select required name="patientId" className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none">
                    <option value="">Select Patient...</option>
                    {patientsData?.patients?.map(p => (
                      <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description *</label>
                  <input required name="description" placeholder="e.g. General Consultation" className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Total Amount ($) *</label>
                    <input required type="number" step="0.01" name="amount" className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Insurance Coverage ($)</label>
                    <input type="number" step="0.01" defaultValue="0" name="insuranceCoverage" className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Due Date</label>
                  <input type="date" name="dueDate" className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none" />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createBill.isPending} className="bg-primary text-white">
                    {createBill.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Invoice"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : !data?.bills?.length ? (
          <EmptyState 
            icon={Receipt} 
            title="No billing records" 
            description="There are no invoices matching your criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Invoice Details</th>
                  <th className="px-6 py-4 font-semibold">Patient</th>
                  <th className="px-6 py-4 font-semibold">Amount & Coverage</th>
                  <th className="px-6 py-4 font-semibold">Patient Owes</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.bills.map((bill, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={bill.id} 
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{bill.description}</div>
                      <div className="text-xs text-slate-500 mt-0.5">INV-{bill.id.toString().padStart(5, '0')} • Due: {formatDate(bill.dueDate)}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {bill.patientName}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900 font-medium">{formatCurrency(bill.amount)}</div>
                      {bill.insuranceCoverage > 0 && <div className="text-xs text-teal-600 mt-0.5">-{formatCurrency(bill.insuranceCoverage)} Ins.</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-bold text-slate-900">{formatCurrency(bill.patientOwes)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={bill.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {bill.status !== "paid" && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => markAsPaid(bill.id)}
                          disabled={updateBill.isPending}
                          className="hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1.5" /> Mark Paid
                        </Button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
