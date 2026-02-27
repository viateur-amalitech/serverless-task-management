import React from 'react';
import { User, CheckCircle, RotateCcw, Play, Trash2, Shield } from 'lucide-react';
import { Task } from '../types';

interface TaskCardProps {
    task: Task;
    isAdmin: boolean;
    onUpdateStatus: (taskId: string, status: string) => void;
    onDelete: (taskId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, isAdmin, onUpdateStatus, onDelete }) => {

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'HIGH': return 'text-red-400 bg-red-400/10 border-red-400/20';
            case 'MEDIUM': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
            case 'LOW': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
            default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
        }
    }

    return (
        <div className="flex flex-col h-full glass card group hover:border-primary/50 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
                <div className="flex flex-wrap gap-2">
                    <span className={`badge ${task.status === 'OPEN' ? 'badge-open' :
                        task.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' :
                            'badge-closed'
                        }`}>
                        {task.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                    </span>
                </div>

                {isAdmin && (
                    <button
                        onClick={() => onDelete(task.taskId)}
                        className="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Task"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>

            <h3 className="mb-2 text-lg font-bold text-text-main group-hover:text-primary transition-colors">{task.title}</h3>
            <p className="flex-grow text-sm leading-relaxed text-text-muted mb-4">{task.description}</p>

            {task.dueDate && (
                <div className="flex items-center gap-2 mb-4 px-3 py-1.5 rounded-lg bg-white/5 border border-border/50 w-fit">
                    <span className="text-[10px] uppercase font-bold text-text-muted/70">Deadline:</span>
                    <span className="text-[11px] font-mono text-primary">{new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
            )}

            <div className="pt-4 mt-auto border-t border-border">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                        <div className="p-1.5 rounded-full bg-white/5">
                            <User size={14} className="text-primary" />
                        </div>
                        <span className="truncate max-w-[120px]" title={task.assignedTo}>{task.assignedTo}</span>
                    </div>
                    <span className="text-[10px] font-mono text-text-muted/50">ID: {task.taskId.slice(-4)}</span>
                </div>

                <div className="flex gap-2">
                    {task.status === 'OPEN' && (
                        <button
                            onClick={() => onUpdateStatus(task.taskId, 'IN_PROGRESS')}
                            className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-semibold text-white transition-all rounded-lg bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/20"
                        >
                            <Play size={16} />
                            <span>Start</span>
                        </button>
                    )}

                    {task.status === 'IN_PROGRESS' && (
                        <button
                            onClick={() => onUpdateStatus(task.taskId, 'CLOSED')}
                            className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-semibold text-white transition-all rounded-lg bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
                        >
                            <CheckCircle size={16} />
                            <span>Complete</span>
                        </button>
                    )}

                    {task.status === 'CLOSED' && (
                        <button
                            onClick={() => onUpdateStatus(task.taskId, 'OPEN')}
                            className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-semibold transition-all border rounded-lg border-border text-text-main hover:bg-white/5"
                        >
                            <RotateCcw size={16} />
                            <span>Reopen</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskCard;
