import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListDepartments, 
  useCreateDepartment,
  useListDoctors,
  getListDepartmentsQueryKey,
  CreateDepartmentBody
} from "@workspace/api-client-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Building2, Plus, Loader2, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function Departments() {
  const { data, isLoading } = useListDepartments();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const createDept = useCreateDepartment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDepartmentsQueryKey() });
        setIsDialogOpen(false);
      }
    }
  });

  const { data: doctorsData } = useListDoctors();

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body: CreateDepartmentBody = {
      name: fd.get("name") as string,
      description: fd.get("description") as string,
      headDoctorId: fd.get("headDoctorId") ? Number(fd.get("headDoctorId")) : undefined,
      floor: fd.get("floor") as string,
      capacity: Number(fd.get("capacity")),
    };
    createDept.mutate({ data: body });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Departments" 
        description="Hospital wards and medical units."
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" /> Add Department
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Department</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department Name *</label>
                  <input required name="name" placeholder="e.g. Cardiology" className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea name="description" rows={2} className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none"></textarea>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Head of Department</label>
                  <select name="headDoctorId" className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none">
                    <option value="">Select Doctor...</option>
                    {doctorsData?.doctors?.map(d => (
                      <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Floor</label>
                    <input name="floor" placeholder="e.g. 3rd Floor, East Wing" className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bed Capacity</label>
                    <input type="number" name="capacity" defaultValue="0" className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createDept.isPending} className="bg-primary text-white">
                    {createDept.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : !data?.departments?.length ? (
        <EmptyState 
          icon={Building2} 
          title="No departments" 
          description="There are no departments registered in the system."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {data.departments.map((dept, i) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              key={dept.id} 
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                <div>
                  <h3 className="font-bold text-slate-900 text-xl font-display">{dept.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{dept.floor || "Location unspecified"}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Building2 className="w-6 h-6" />
                </div>
              </div>
              <div className="p-6 flex-1 text-sm text-slate-600">
                {dept.description || "No description provided."}
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">HD</div>
                  <span className="font-medium text-slate-700 truncate max-w-[120px]">
                    {dept.headDoctorName ? `Dr. ${dept.headDoctorName}` : "Unassigned"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 font-medium bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm">
                  <Users className="w-3.5 h-3.5" />
                  {dept.capacity} Beds
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
