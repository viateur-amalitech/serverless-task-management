import { Task } from '../types';
import TaskCard from './TaskCard';
import { List } from 'lucide-react';

interface TaskListProps {
    tasks: Task[];
    loading: boolean;
    isAdmin: boolean;
    onUpdateStatus: (taskId: string, status: string) => Promise<void>;
    onDelete: (taskId: string) => Promise<void>;
    searchQuery: string;
    onClearSearch: () => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, loading, isAdmin, onUpdateStatus, onDelete, searchQuery, onClearSearch }) => {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-text-muted">
                <div className="mb-4 animate-spin text-primary w-12 h-12 border-4 border-current border-t-transparent rounded-full" />
                <p className="text-lg font-medium animate-pulse">Scanning database...</p>
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center col-span-full py-24 glass rounded-2xl border-dashed border-2">
                <div className="p-4 bg-white/5 rounded-full mb-4">
                    <List size={40} className="text-text-muted" />
                </div>
                <h3 className="text-xl font-bold text-text-main mb-1">No Active Tasks</h3>
                <p className="text-text-muted">No tasks matched your search or the list is empty.</p>
                {searchQuery && (
                    <button onClick={onClearSearch} className="mt-4 text-primary hover:underline font-medium">Clear Search</button>
                )}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map(task => (
                <TaskCard
                    key={task.taskId}
                    task={task}
                    isAdmin={isAdmin}
                    onUpdateStatus={onUpdateStatus}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
};

export default TaskList;
