import { useState, useEffect } from "react";
import { useListTimeEntries, useListLegalMatters, useCreateTimeEntry, getListTimeEntriesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, Play, Square, Save, Plus } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function TimeTracking() {
  const queryClient = useQueryClient();
  const { data: mattersData } = useListLegalMatters();
  const { data: timeData, isLoading } = useListTimeEntries({});
  
  const createTime = useCreateTimeEntry({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTimeEntriesQueryKey() });
        setIsOpen(false);
        setSeconds(0);
      }
    }
  });

  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    matterId: "",
    description: "",
    hours: "0.1",
    rate: "250",
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStopTimer = () => {
    setIsTimerRunning(false);
    // Convert seconds to decimal hours (e.g. 1.5 hours)
    const decimalHours = Math.max(0.1, Math.round((seconds / 3600) * 10) / 10);
    setFormData(prev => ({ ...prev, hours: decimalHours.toString() }));
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTime.mutate({
      data: {
        matterId: parseInt(formData.matterId, 10),
        description: formData.description,
        hours: parseFloat(formData.hours),
        rate: parseFloat(formData.rate),
        date: formData.date
      }
    });
  };

  const entries = timeData?.entries ?? [];
  const matters = mattersData?.matters ?? [];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Time Tracking" 
        description="Track billable hours and manage time entries."
      />

      {/* Timer Widget */}
      <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50 to-white shadow-sm overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center border border-indigo-100">
              <Clock className={`h-8 w-8 ${isTimerRunning ? 'text-indigo-600 animate-pulse' : 'text-slate-400'}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-indigo-900 uppercase tracking-wider mb-1">Active Timer</p>
              <div className="text-4xl font-mono font-bold text-slate-900 tracking-tight">
                {formatTimer(seconds)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isTimerRunning ? (
              <Button size="lg" onClick={() => setIsTimerRunning(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/20 font-medium">
                <Play className="h-5 w-5 mr-2 fill-current" /> Start Timer
              </Button>
            ) : (
              <Button size="lg" variant="destructive" onClick={handleStopTimer} className="rounded-xl shadow-lg shadow-red-600/20 font-medium">
                <Square className="h-5 w-5 mr-2 fill-current" /> Stop & Log Time
              </Button>
            )}
            <Button size="lg" variant="outline" onClick={() => setIsOpen(true)} className="bg-white rounded-xl font-medium border-slate-200">
              <Plus className="h-5 w-5 mr-2" /> Manual Entry
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Log Time Entry</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Matter</label>
              <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" value={formData.matterId} onChange={e => setFormData({...formData, matterId: e.target.value})}>
                <option value="" disabled>Select a matter...</option>
                {matters.map(m => <option key={m.id} value={m.id}>{m.title} ({m.clientName})</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <input required type="date" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea required className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 min-h-[100px]" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe the work performed..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Hours</label>
                <input required type="number" step="0.1" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" value={formData.hours} onChange={e => setFormData({...formData, hours: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Rate ($/hr)</label>
                <input required type="number" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" value={formData.rate} onChange={e => setFormData({...formData, rate: e.target.value})} />
              </div>
            </div>
            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={createTime.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                <Save className="h-4 w-4 mr-2" /> {createTime.isPending ? "Saving..." : "Save Entry"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* History Table */}
      {isLoading ? (
        <div className="animate-pulse h-64 bg-slate-100 rounded-2xl"></div>
      ) : entries.length === 0 ? (
        <EmptyState 
          icon={Clock} 
          title="No recent time entries" 
          description="Start the timer or manually add an entry to build your timesheet." 
        />
      ) : (
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-border text-slate-500 font-medium uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Matter / Client</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4 text-right">Hours</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entries.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700">{formatDate(entry.date)}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-indigo-600">{entry.matterTitle}</p>
                      <p className="text-xs text-slate-500">{entry.clientName}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-700 max-w-md truncate" title={entry.description}>{entry.description}</td>
                    <td className="px-6 py-4 text-right font-mono font-medium">{entry.hours}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">{formatCurrency(entry.amount)}</td>
                    <td className="px-6 py-4 text-center">
                      {entry.isBilled 
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 tracking-wider">BILLED</span> 
                        : <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 tracking-wider">UNBILLED</span>}
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
