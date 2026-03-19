import React, { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListPatients, 
  useCreatePatient,
  useListDoctors,
  useListDepartments,
  getListPatientsQueryKey,
  CreatePatientBody,
  CreatePatientBodyGender
} from "@workspace/api-client-react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { formatDate } from "@/lib/utils";
import { Users, Plus, Loader2, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function Patients() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const { data, isLoading } = useListPatients({ search: search || undefined, status: status || undefined });
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const createPatient = useCreatePatient({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
        setIsDialogOpen(false);
      }
    }
  });

  const { data: doctorsData } = useListDoctors();
  const { data: deptsData } = useListDepartments();

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body: CreatePatientBody = {
      firstName: fd.get("firstName") as string,
      lastName: fd.get("lastName") as string,
      gender: fd.get("gender") as CreatePatientBodyGender,
      dateOfBirth: fd.get("dateOfBirth") ? new Date(fd.get("dateOfBirth") as string).toISOString() : undefined,
      email: fd.get("email") as string || undefined,
      phone: fd.get("phone") as string || undefined,
      address: fd.get("address") as string || undefined,
      bloodType: fd.get("bloodType") as string || undefined,
      allergies: fd.get("allergies") as string || undefined,
      status: fd.get("status") as string || "active",
      primaryDoctorId: fd.get("primaryDoctorId") ? Number(fd.get("primaryDoctorId")) : undefined,
      departmentId: fd.get("departmentId") ? Number(fd.get("departmentId")) : undefined,
    };
    createPatient.mutate({ data: body });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Patients" 
        description="Manage patient records and demographics."
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" /> Add Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Register New Patient</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-6 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">First Name *</label>
                    <input required name="firstName" className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Last Name *</label>
                    <input required name="lastName" className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date of Birth</label>
                    <input type="date" name="dateOfBirth" className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Gender *</label>
                    <select required name="gender" className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <input type="email" name="email" className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <input type="tel" name="phone" className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Blood Type</label>
                    <input name="bloodType" placeholder="e.g. O+" className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <select name="status" className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="discharged">Discharged</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Primary Doctor</label>
                    <select name="primaryDoctorId" className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                      <option value="">None</option>
                      {doctorsData?.doctors?.map(d => (
                        <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Department</label>
                    <select name="departmentId" className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                      <option value="">None</option>
                      {deptsData?.departments?.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-medium">Allergies</label>
                    <textarea name="allergies" rows={2} className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"></textarea>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createPatient.isPending} className="bg-primary text-white">
                    {createPatient.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Patient"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search patients by name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none shadow-sm"
          />
        </div>
        <select 
          value={status} 
          onChange={(e) => setStatus(e.target.value)}
          className="p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-primary outline-none shadow-sm min-w-[150px]"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="discharged">Discharged</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : !data?.patients?.length ? (
          <EmptyState 
            icon={Users} 
            title="No patients found" 
            description="There are no patients matching your current search criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Patient</th>
                  <th className="px-6 py-4 font-semibold">Contact</th>
                  <th className="px-6 py-4 font-semibold">DOB / Gender</th>
                  <th className="px-6 py-4 font-semibold">Primary Doctor</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.patients.map((patient, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={patient.id} 
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    onClick={() => window.location.href = `/health-os/patients/${patient.id}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs">
                          {patient.firstName[0]}{patient.lastName[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 group-hover:text-primary transition-colors">
                            {patient.firstName} {patient.lastName}
                          </div>
                          <div className="text-xs text-slate-500">ID: #{patient.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900">{patient.phone || "—"}</div>
                      <div className="text-xs text-slate-500">{patient.email || "—"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900">{formatDate(patient.dateOfBirth)}</div>
                      <div className="text-xs text-slate-500 capitalize">{patient.gender}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {patient.primaryDoctorName ? `Dr. ${patient.primaryDoctorName}` : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={patient.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/patients/${patient.id}`} onClick={(e) => e.stopPropagation()} className="text-primary font-medium hover:underline text-sm">
                        View Profile
                      </Link>
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
