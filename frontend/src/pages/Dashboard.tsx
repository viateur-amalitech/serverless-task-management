import { useState, useEffect, type FormEvent } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Plus, RefreshCw, LayoutGrid, List, Search, Users } from 'lucide-react';
import Header from '../components/Header';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import { useTasks } from '../hooks/useTasks';
import { useUsers } from '../hooks/useUsers';
import { Task, User } from '../types';

interface DashboardProps {
  user: any;
  signOut: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, signOut }) => {

  // Derive role: prefer token groups from ID or Access token; update via fetchAuthSession to handle storage differences
  const idTokenPayload = user?.signInUserSession?.idToken?.payload || (user as any)?.userIdToken?.payload;
  const accessTokenPayload = user?.signInUserSession?.accessToken?.payload || (user as any)?.userAccessToken?.payload;
  const initialGroups: string[] =
    (idTokenPayload?.['cognito:groups'] as string[] | undefined) ||
    (accessTokenPayload?.['cognito:groups'] as string[] | undefined) ||
    [];
  const ADMIN_GROUP = import.meta.env.VITE_ADMIN_GROUP_NAME || 'Admin';
  const [isAdmin, setIsAdmin] = useState<boolean>(initialGroups.includes(ADMIN_GROUP));

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { tokens } = await fetchAuthSession();
        const idP = tokens?.idToken?.payload as any | undefined;
        const accessP = tokens?.accessToken?.payload as any | undefined;
        const groups: string[] =
          (idP?.['cognito:groups'] as string[] | undefined) ||
          (accessP?.['cognito:groups'] as string[] | undefined) ||
          [];
        if (alive) setIsAdmin(groups.includes(ADMIN_GROUP));
      } catch {
        // keep existing
      }
    })();
    return () => {
      alive = false;
    };
  }, [ADMIN_GROUP]);

  const { tasks, loading: loadingTasks, fetchTasks, createTask, updateTaskStatus, deleteTask } = useTasks();
  const { users: availableUsers, loading: loadingUsers } = useUsers(isAdmin);

  // DEBUG: Log state
  console.log('[Dashboard] isAdmin:', isAdmin);
  console.log('[Dashboard] availableUsers:', availableUsers);
  console.log('[Dashboard] loadingUsers:', loadingUsers);

  const [showForm, setShowForm] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTasks(searchQuery);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, fetchTasks]);

  const handleCreateTask = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      assignedTo: formData.get('assignedTo') as string,
      priority: formData.get('priority') as string
    };

    try {
      await createTask(data);
      setShowForm(false);
    } catch (err) {
      console.error('Error creating task', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to terminate this task? This action is irreversible.')) return;
    try {
      await deleteTask(taskId);
    } catch (err) {
      console.error('Error deleting task', err);
    }
  }

  return (
    <div className="min-h-screen bg-bg-dark">
      <div className="container px-4 py-8 mx-auto max-w-7xl">
        <Header
          username={idTokenPayload?.email || user.username}
          role={isAdmin ? 'Admin' : 'Member'}
          onFetch={() => fetchTasks(searchQuery)}
          onSignOut={signOut}
        />

        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex-1 max-w-xl">
            <h2 className="text-2xl font-bold text-text-main flex items-center gap-2 mb-4">
              <LayoutGrid className="text-primary" size={24} />
              Current tasks
            </h2>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-primary" size={20} />
              <input
                type="text"
                placeholder="Search tasks by title or brief..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-bg-card/50 border border-border rounded-xl text-text-main focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-text-muted/50 mb-0"
              />
            </div>
          </div>

          <div className="flex gap-4">
            {isAdmin && (
              <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-border">
                <Users size={18} className="text-primary" />
                <span className="text-sm font-medium text-text-muted">
                  {loadingUsers ? 'Loading...' : `${availableUsers.length} Agents Online`}
                </span>
                <button
                  onClick={() => window.location.reload()}
                  className="text-xs text-primary hover:underline ml-2"
                  title="Refresh to check API"
                >
                  Refresh
                </button>
              </div>
            )}

            {isAdmin && !showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 font-bold text-white transition-all rounded-xl bg-primary hover:bg-primary-hover shadow-lg shadow-primary/25 group w-full md:w-auto"
              >
                <Plus size={20} className="transition-transform group-hover:rotate-90" />
                <span>New Task</span>
              </button>
            )}
          </div>
        </div>

        {showForm && (
          <TaskForm
            onSubmit={handleCreateTask}
            onCancel={() => setShowForm(false)}
            users={availableUsers}
          />
        )}

        {loadingTasks ? (
          <div className="flex flex-col items-center justify-center py-24 text-text-muted">
            <RefreshCw className="mb-4 animate-spin text-primary" size={48} />
            <p className="text-lg font-medium animate-pulse">Scanning database...</p>
          </div>
        ) : (
          <TaskList
            tasks={tasks}
            loading={loadingTasks}
            isAdmin={isAdmin}
            onUpdateStatus={updateTaskStatus}
            onDelete={handleDeleteTask}
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
