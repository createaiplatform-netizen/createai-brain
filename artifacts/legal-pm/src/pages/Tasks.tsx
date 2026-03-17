import { useListLegalTasks, useUpdateLegalTask, getListLegalTasksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { CheckSquare, Calendar, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function Tasks() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useListLegalTasks({});
  const updateTask = useUpdateLegalTask({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListLegalTasksQueryKey({}) })
    }
  });

  const tasks = data?.tasks ?? [];

  const handleToggle = (task: any) => {
    updateTask.mutate({ 
      id: task.id, 
      data: { ...task, isCompleted: !task.isCompleted } 
    });
  };

  const getPriorityColor = (priority: string) => {
    const p = priority.toLowerCase();
    if (p === 'urgent') return "text-red-600 bg-red-100 border-red-200";
    if (p === 'high') return "text-orange-600 bg-orange-100 border-orange-200";
    if (p === 'medium') return "text-blue-600 bg-blue-100 border-blue-200";
    return "text-slate-600 bg-slate-100 border-slate-200";
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="My Tasks" 
        description="Master list of all deadlines and to-dos across matters."
      />

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl"></div>)}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState 
          icon={CheckSquare} 
          title="All caught up!" 
          description="You don't have any tasks scheduled. Add tasks from within individual matters." 
        />
      ) : (
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <ul className="divide-y divide-border">
            {tasks.map(task => (
              <li key={task.id} className={`p-5 flex items-start gap-4 transition-colors ${task.isCompleted ? 'bg-slate-50/50' : 'hover:bg-slate-50'}`}>
                <div className="pt-0.5">
                  <input 
                    type="checkbox" 
                    checked={task.isCompleted} 
                    onChange={() => handleToggle(task)}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className={`text-base font-medium ${task.isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                      {task.title}
                    </h4>
                    <span className={`inline-flex px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-indigo-600 mb-1">{task.matterTitle}</p>
                  {task.description && <p className="text-sm text-slate-500 line-clamp-2">{task.description}</p>}
                </div>
                <div className="shrink-0 flex flex-col items-end gap-2">
                  {task.dueAt && (
                    <div className={`flex items-center gap-1.5 text-sm font-medium ${new Date(task.dueAt) < new Date() && !task.isCompleted ? 'text-red-600' : 'text-slate-500'}`}>
                      {new Date(task.dueAt) < new Date() && !task.isCompleted ? <AlertCircle className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                      {formatDate(task.dueAt)}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
