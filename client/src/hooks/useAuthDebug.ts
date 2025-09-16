import { useEffect } from 'react';
import { useAuth } from '@/components/AuthProviderSimple';

export function useAuthDebug() {
    const { user, isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        console.log('Auth state changed:', {
            user: user?.username || null,
            isAuthenticated,
            isLoading,
            timestamp: new Date().toISOString()
        });
    }, [user, isAuthenticated, isLoading]);

    // Track when user becomes null unexpectedly
    useEffect(() => {
        if (!isLoading && !user && !isAuthenticated) {
            console.warn('User became unauthenticated:', {
                timestamp: new Date().toISOString(),
                stack: new Error().stack
            });
        }
    }, [user, isAuthenticated, isLoading]);
}