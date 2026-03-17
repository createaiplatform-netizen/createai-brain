import React from "react";
import { Link } from "wouter";
import { 
  useGetHealthDashboard, 
  useListPatients,
  getListPatientsQueryKey,
  getGetHealthDashboardQueryKey
} from "@workspace/api-client-react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Users, Calendar, Activity, Receipt, ArrowRight, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: dashboard, isLoading } = useGetHealthDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-slate-200 rounded-2xl"></div>
          <div className="h-96 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const stats = [
    { title: "Total Patients", value: dashboard?.totalPatients ?? 0, icon: Users, color: "text-teal-600", bg: "bg-teal-50" },
    { title: "Appointments Today", value: dashboard?.todayAppointments ?? 0, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Active Doctors", value: dashboard?.activeDoctors ?? 0, icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "Pending Billing", value: formatCurrency(dashboard?.pendingBillAmount), icon: Receipt, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-8 pb-12">
      <PageHeader 
        title="Good Morning, Dr. Jenkins" 
        description="Here is what's happening at HealthOS today."
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.title}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-slate-50 to-transparent rounded-bl-full opacity-50 group-hover:scale-110 transition-transform"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h3 className="font-medium text-slate-500 text-sm">{stat.title}</h3>
              <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
            <div className="text-3xl font-display font-bold text-slate-900 relative z-10">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Upcoming Appointments */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-lg font-bold font-display text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" /> Today's Appointments
            </h2>
            <Link href="/appointments" className="text-sm font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex-1 overflow-auto">
            {dashboard?.upcomingAppointments?.length ? (
              <ul className="divide-y divide-slate-100">
                {dashboard.upcomingAppointments.map((appt) => (
                  <li key={appt.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                    <div>
                      <p className="font-medium text-slate-900 group-hover:text-teal-700 transition-colors">
                        {appt.patientName}
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        with Dr. {appt.doctorName} • {appt.type}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <span className="text-sm font-semibold text-slate-700">
                        {formatDate(appt.scheduledAt, 'h:mm a')}
                      </span>
                      <StatusBadge status={appt.status} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-slate-500">No appointments scheduled today.</div>
            )}
          </div>
        </motion.div>

        {/* Recent Patients */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-lg font-bold font-display text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" /> Recent Patients
            </h2>
            <Link href="/patients" className="text-sm font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex-1 overflow-auto">
            {dashboard?.recentPatients?.length ? (
              <ul className="divide-y divide-slate-100">
                {dashboard.recentPatients.map((patient) => (
                  <li key={patient.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <Link href={`/patients/${patient.id}`} className="flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">
                          {patient.firstName[0]}{patient.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 group-hover:text-teal-700 transition-colors">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <p className="text-sm text-slate-500 mt-0.5">
                            ID: #{patient.id} • Added {formatDate(patient.createdAt)}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={patient.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-slate-500">No recent patients.</div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
