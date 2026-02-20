import React, { FormEvent } from 'react';
import { Send, X, AlertCircle } from 'lucide-react';
import { User } from '../types';

interface TaskFormProps {
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
    onCancel: () => void;
    users: User[];
}

const TaskForm: React.FC<TaskFormProps> = ({ onSubmit, onCancel, users }) => {
    return (
        <form onSubmit={onSubmit} className="p-8 mb-8 glass animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <AlertCircle className="text-primary" size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-text-main">Deploy New Task</h3>
                </div>
                <button
                    type="button"
                    onClick={onCancel}
                    className="p-1 rounded-full hover:bg-white/10 text-text-muted transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-text-muted uppercase tracking-wider text-[10px]">Task Title</label>
                        <input
                            name="title"
                            required
                            placeholder="Operational objective"
                            className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-text-main focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-text-muted/50"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-text-muted uppercase tracking-wider text-[10px]">Priority Level</label>
                        <select
                            name="priority"
                            defaultValue="MEDIUM"
                            className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-text-main focus:ring-2 focus:ring-primary/50 outline-none transition-all cursor-pointer"
                        >
                            <option value="LOW">Low - Routine</option>
                            <option value="MEDIUM">Medium - Operational</option>
                            <option value="HIGH">High - Critical</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block mb-2 text-sm font-medium text-text-muted uppercase tracking-wider text-[10px]">Detailed Brief</label>
                    <textarea
                        name="description"
                        required
                        rows={3}
                        placeholder="Define the task scope and required outcomes..."
                        className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-text-main focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-text-muted/50 resize-none"
                    ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-text-muted uppercase tracking-wider text-[10px]">Assigned Agent</label>
                        <div className="relative">
                            <select
                                name="assignedTo"
                                className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-text-main focus:ring-2 focus:ring-primary/50 outline-none transition-all cursor-pointer appearance-none"
                            >
                                <option value="UNASSIGNED">-- Standby (Unassigned) --</option>
                                {users.map(u => (
                                    <option key={u.email} value={u.email}>
                                        {u.username} ({u.email})
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                                <Users size={16} />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-text-muted uppercase tracking-wider text-[10px]">Deadline Date</label>
                        <input
                            type="date"
                            name="dueDate"
                            className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-text-main focus:ring-2 focus:ring-primary/50 outline-none transition-all cursor-pointer"
                        />
                    </div>
                </div>

                <div className="flex gap-4 pt-2">
                    <button
                        type="submit"
                        className="flex-1 flex items-center justify-center gap-2 px-8 py-3 font-bold text-white transition-all rounded-lg bg-primary hover:bg-primary-hover shadow-lg shadow-primary/25"
                    >
                        <Send size={18} />
                        <span>Initialize Task</span>
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-shrink-0 px-8 py-3 font-semibold transition-all border rounded-lg border-border text-text-main hover:bg-white/5"
                    >
                        Abort
                    </button>
                </div>
            </div>
        </form>
    );
};

const Users = ({ size }: { size: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);

export default TaskForm;
