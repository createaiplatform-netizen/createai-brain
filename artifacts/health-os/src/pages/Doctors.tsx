import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListDoctors, 
  useCreateDoctor,
  useListDepartments,
  getListDoctorsQueryKey,
  CreateDoctorBody
} from "@workspace/api-client-react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Stethoscope, Plus, Loader2, Mail, Phone, Hash } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function Doctors() {
  const { data, isLoading } = useListDoctors();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const createDoctor = useCreateDoctor({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDoctorsQueryKey() });
        setIsDialogOpen(false);
      }
    }
  });

  const { data: deptsData } = useListDepartments();

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body: CreateDoctorBody = {
      firstName: fd.get("firstName") as string,
      lastName: fd.get("lastName") as string,
      specialty: fd.get("specialty") as string,
      departmentId: Number(fd.get("departmentId")),
      email: fd.get("email") as string,
      phone: fd.get("phone") as string,
      licenseNumber: fd.get("licenseNumber") as string,
      status: "active",
    };
    createDoctor.mutate({ data: body });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Medical Staff" 
        description="Directory of doctors and specialists."
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" /> Add Doctor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Doctor</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">First Name *</label>
                    <input required name="firstName" className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Last Name *</label>
                    <input required name="lastName" className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Specialty *</label>
                    <input required name="specialty" placeholder="e.g. Cardiology" className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Department *</label>
                    <select required name="departmentId" className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none">
                      <option value="">Select...</option>
                      {deptsData?.departments?.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <input type="email" name="email" className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <input type="tel" name="phone" className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">License Number</label>
                  <input name="licenseNumber" className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none" />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createDoctor.isPending} className="bg-primary text-white">
                    {createDoctor.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Doctor"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : !data?.doctors?.length ? (
        <EmptyState 
          icon={Stethoscope} 
          title="No doctors found" 
          description="There are no doctors registered in the system."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {data.doctors.map((doctor, i) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              key={doctor.id} 
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border-2 border-white shadow-sm">
                    {doctor.firstName[0]}{doctor.lastName[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Dr. {doctor.firstName} {doctor.lastName}</h3>
                    <p className="text-sm font-medium text-primary">{doctor.specialty}</p>
                  </div>
                </div>
                <StatusBadge status={doctor.status} />
              </div>
              <div className="p-6 space-y-4 flex-1">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{doctor.email || "—"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{doctor.phone || "—"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Hash className="w-4 h-4 text-slate-400" />
                  <span>Lic: {doctor.licenseNumber || "—"}</span>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs font-medium text-slate-500">{doctor.departmentName}</span>
                <span className="text-xs font-bold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">{doctor.patientCount} Patients</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
