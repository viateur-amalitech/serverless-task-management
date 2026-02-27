import { useState, useCallback } from 'react';
import { get, post, put, del } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Task } from '../types';

const getAuthHeaders = async () => {
    const { tokens } = await fetchAuthSession();
    return { Authorization: `Bearer ${tokens?.idToken?.toString()}` };
};

export const useTasks = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<unknown>(null);

    const fetchTasks = useCallback(async (query?: string) => {
        setLoading(true);
        try {
            const restOperation = get({
                apiName: 'TaskAPI',
                path: '/tasks',
                options: {
                    headers: await getAuthHeaders(),
                    queryParams: query ? { q: query } : undefined
                }
            });
            const { body } = await restOperation.response;
            const content = (await body.json()) as unknown as Task[];
            setTasks(content.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (err) {
            console.error('Error fetching tasks', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [])

    const createTask = async (data: any) => {
        try {
            await post({
                apiName: 'TaskAPI',
                path: '/tasks',
                options: { 
                    headers: await getAuthHeaders(),
                    body: data 
                }
            }).response;
            await fetchTasks();
        } catch (err) {
            console.error('Error creating task', err);
            throw err;
        }
    };

    const updateTaskStatus = async (taskId: string, status: string) => {
        try {
            await put({
                apiName: 'TaskAPI',
                path: `/tasks/${taskId}`,
                options: { 
                    headers: await getAuthHeaders(),
                    body: { status } 
                }
            }).response;
            await fetchTasks();
        } catch (err) {
            console.error('Error updating task', err);
            throw err;
        }
    };

    const deleteTask = async (taskId: string) => {
        try {
            await del({
                apiName: 'TaskAPI',
                path: `/tasks/${taskId}`,
                options: {
                    headers: await getAuthHeaders()
                }
            }).response;
            await fetchTasks();
        } catch (err) {
            console.error('Error deleting task', err);
            throw err;
        }
    };

    return {
        tasks,
        loading,
        error,
        fetchTasks,
        createTask,
        updateTaskStatus,
        deleteTask
    };
};
