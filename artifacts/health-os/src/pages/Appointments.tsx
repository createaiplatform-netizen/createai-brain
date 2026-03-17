import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListAppointments, 
  useCreateAppointment,
  useListPatients,
  useListDoctors,
  getListAppointmentsQueryKey,
  CreateAppointmentBody
} from "@workspace/api-client-react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { formatDate } from "@/lib/utils";
import { Calendar, Plus, Loader2, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function Appointments() {
  const { data, isLoading } = useListAppointments();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const createApt = useCreateAppointment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
        setIsDialogOpen(false);
      }
    }
  });

  const { data: patientsData } = useListPatients();
  const { data: doctorsData } = useListDoctors();

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body: CreateAppointmentBody = {
      patientId: Number(fd.get("patientId")),
      doctorId: Number(fd.get("doctorId")),
      departmentId: Number(fd.get("departmentId") || 1), // Simplification for demo
      scheduledAt: new Date(`${fd.get("date")}T${fd.get("time")}`).toISOString(),
      durationMinutes: Number(fd.get("duration")),
      type: fd.get("type") as string,
      status: "scheduled",
      notes: fd.get("notes") as string,
    };
    createApt.mutate({ data: body });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Appointments" 
        description="Schedule and manage patient visits."
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" /> Schedule Visit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Appointment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Patient *</label>
                  <select required name="patientId" className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                    <option value="">Select Patient...</option>
                    {patientsData?.patients?.map(p => (
                      <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Doctor *</label>
                  <select required name="doctorId" className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                    <option value="">Select Doctor...</option>
                    {doctorsData?.doctors?.map(d => (
                      <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName} ({d.specialty})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date *</label>
                    <input required type="date" name="date" className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Time *</label>
                    <input required type="time" name="time" className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Duration (min) *</label>
                    <input required type="number" defaultValue="30" name="duration" className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type *</label>
                    <select required name="type" className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none">
                      <option value="Check-up">Check-up</option>
                      <option value="Follow-up">Follow-up</option>
                      <option value="Consultation">Consultation</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <textarea name="notes" rows={2} className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none"></textarea>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createApt.isPending} className="bg-primary text-white">
                    {createApt.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Schedule"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
        {isLoading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : !data?.appointments?.length ? (
          <EmptyState 
            icon={Calendar} 
            title="No appointments" 
            description="There are no appointments scheduled in the system."
          />
        ) : (
          <div className="space-y-4">
            {data.appointments.map((apt, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={apt.id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-teal-200 hover:shadow-md transition-all gap-4 bg-slate-50/50 hover:bg-white group"
              >
                <div className="flex items-center gap-5">
                  <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-3 text-center min-w-[80px]">
                    <div className="text-xs font-bold text-slate-500 uppercase">{formatDate(apt.scheduledAt, "MMM")}</div>
                    <div className="text-2xl font-display font-bold text-primary">{formatDate(apt.scheduledAt, "d")}</div>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg group-hover:text-primary transition-colors">{apt.patientName}</h4>
                    <p className="text-sm text-slate-600 mt-0.5 font-medium">{apt.type} • Dr. {apt.doctorName}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs font-medium text-slate-500">
                      <Clock className="w-3.5 h-3.5" /> 
                      {formatDate(apt.scheduledAt, "h:mm a")} ({apt.durationMinutes} min) • {apt.departmentName}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                  <StatusBadge status={apt.status} />
                  {apt.notes && <span className="text-xs text-slate-400 italic max-w-[200px] truncate">"{apt.notes}"</span>}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
