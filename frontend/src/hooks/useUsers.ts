import { useState, useCallback, useEffect } from 'react';
import { get } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { User } from '../types';

export const useUsers = (isAdmin: boolean) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const fetchUsers = useCallback(async () => {
        console.log('[useUsers] fetchUsers called, isAdmin:', isAdmin);
        if (!isAdmin) {
            console.log('[useUsers] Not admin, skipping fetch');
            return;
        }
        setLoading(true);
        try {
            const { tokens } = await fetchAuthSession();
            const token = tokens?.idToken?.toString();
            console.log('[useUsers] Calling API: TaskAPI /users');
            const restOperation = get({
                apiName: 'TaskAPI',
                path: '/users',
                options: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            });
            const { body } = await restOperation.response;
            const content = (await body.json()) as unknown as User[];
            console.log('[useUsers] API response:', content);
            console.log('[useUsers] Number of users:', content?.length || 0);
            setUsers(content);
        } catch (err) {
            console.error('[useUsers] Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    }, [isAdmin]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    return { users, loading, refetch: fetchUsers };
};
