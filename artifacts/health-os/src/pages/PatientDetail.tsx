import React, { useState } from "react";
import { useRoute } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetPatient,
  getGetPatientQueryKey
} from "@workspace/api-client-react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Loader2, ArrowLeft, Activity, Pill, Calendar, ReceiptText, User } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PatientDetail() {
  const [, params] = useRoute("/patients/:id");
  const id = Number(params?.id);
  const { data: patient, isLoading, error } = useGetPatient(id);

  if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (error || !patient) return <div className="p-12 text-center text-red-500">Failed to load patient</div>;

  return (
    <div className="space-y-6 pb-12">
      <Link href="/patients" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Patients
      </Link>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Profile Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full lg:w-1/3 shrink-0"
        >
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
            <div className="h-24 bg-gradient-to-r from-teal-500 to-emerald-400 relative"></div>
            <div className="px-6 pb-6">
              <div className="flex justify-between items-end -mt-10 mb-4 relative z-10">
                <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-md border border-slate-100">
                  <div className="w-full h-full rounded-xl bg-teal-50 flex items-center justify-center text-teal-700 font-display font-bold text-2xl">
                    {patient.firstName[0]}{patient.lastName[0]}
                  </div>
                </div>
                <StatusBadge status={patient.status} className="mb-2" />
              </div>
              <h1 className="text-2xl font-display font-bold text-slate-900">
                {patient.firstName} {patient.lastName}
              </h1>
              <p className="text-slate-500 text-sm mt-1">Patient ID: #{patient.id} • Added {formatDate(patient.createdAt)}</p>
              
              <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 font-medium">DOB / Age</p>
                    <p className="text-slate-900 font-medium">{formatDate(patient.dateOfBirth)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium">Gender</p>
                    <p className="text-slate-900 font-medium capitalize">{patient.gender}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium">Blood Type</p>
                    <p className="text-slate-900 font-medium">{patient.bloodType || "—"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium">Primary Doctor</p>
                    <p className="text-slate-900 font-medium">{patient.primaryDoctorName ? `Dr. ${patient.primaryDoctorName}` : "—"}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 text-sm space-y-3">
                  <div className="flex gap-2">
                    <span className="text-slate-500 w-16">Email</span>
                    <span className="text-slate-900 font-medium break-all">{patient.email || "—"}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-500 w-16">Phone</span>
                    <span className="text-slate-900 font-medium">{patient.phone || "—"}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-500 w-16">Address</span>
                    <span className="text-slate-900 font-medium">{patient.address || "—"}</span>
                  </div>
                </div>

                {patient.allergies && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-slate-500 text-sm font-medium mb-2">Allergies</p>
                    <div className="p-3 bg-red-50 text-red-800 rounded-lg text-sm border border-red-100">
                      {patient.allergies}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Detail Tabs */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full lg:w-2/3"
        >
          <Tabs defaultValue="records" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-100/50 p-1 rounded-xl mb-6">
              <TabsTrigger value="records" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Activity className="w-4 h-4 mr-2" /> Records
              </TabsTrigger>
              <TabsTrigger value="prescriptions" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Pill className="w-4 h-4 mr-2" /> Meds
              </TabsTrigger>
              <TabsTrigger value="appointments" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Calendar className="w-4 h-4 mr-2" /> Visits
              </TabsTrigger>
              <TabsTrigger value="billing" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <ReceiptText className="w-4 h-4 mr-2" /> Billing
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="records" className="space-y-4">
              {patient.medicalRecords?.length ? patient.medicalRecords.map(record => (
                <div key={record.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">{record.diagnosis}</h4>
                      <p className="text-sm text-slate-500">{formatDate(record.visitDate)} • Dr. {record.doctorName}</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div><span className="font-medium text-slate-700">Chief Complaint:</span> {record.chiefComplaint}</div>
                    <div><span className="font-medium text-slate-700">Treatment:</span> {record.treatment}</div>
                    {record.notes && <div><span className="font-medium text-slate-700">Notes:</span> {record.notes}</div>}
                  </div>
                </div>
              )) : <p className="p-8 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">No medical records found.</p>}
            </TabsContent>

            <TabsContent value="prescriptions" className="space-y-4">
              {patient.prescriptions?.length ? patient.prescriptions.map(rx => (
                <div key={rx.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <Pill className="w-4 h-4 text-teal-600" /> {rx.medication}
                    </h4>
                    <p className="text-sm text-slate-600 mt-1">{rx.dosage} • {rx.frequency}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {formatDate(rx.startDate)} - {formatDate(rx.endDate)} • Dr. {rx.doctorName}
                    </p>
                  </div>
                  <StatusBadge status={rx.status} />
                </div>
              )) : <p className="p-8 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">No active prescriptions.</p>}
            </TabsContent>

            <TabsContent value="appointments" className="space-y-4">
              {patient.appointments?.length ? patient.appointments.map(apt => (
                <div key={apt.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center min-w-[70px]">
                      <div className="text-xs font-bold text-slate-500 uppercase">{formatDate(apt.scheduledAt, "MMM")}</div>
                      <div className="text-2xl font-display font-bold text-slate-900">{formatDate(apt.scheduledAt, "d")}</div>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 capitalize">{apt.type}</h4>
                      <p className="text-sm text-slate-500 mt-0.5">Dr. {apt.doctorName} • {apt.departmentName}</p>
                      <p className="text-xs font-medium text-slate-700 mt-1">{formatDate(apt.scheduledAt, "h:mm a")} ({apt.durationMinutes} min)</p>
                    </div>
                  </div>
                  <StatusBadge status={apt.status} />
                </div>
              )) : <p className="p-8 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">No appointments scheduled.</p>}
            </TabsContent>

            <TabsContent value="billing" className="space-y-4">
              {patient.bills?.length ? patient.bills.map(bill => (
                <div key={bill.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900">{bill.description}</h4>
                    <p className="text-sm text-slate-500 mt-0.5">Due: {formatDate(bill.dueDate)}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <span className="text-lg font-bold text-slate-900">{formatCurrency(bill.patientOwes)}</span>
                    <StatusBadge status={bill.status} />
                  </div>
                </div>
              )) : <p className="p-8 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">No billing records found.</p>}
            </TabsContent>

          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
