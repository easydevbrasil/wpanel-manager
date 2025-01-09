import { useState, useEffect, createContext, useContext } from "react";
import { useWebSocket } from "./use-websocket";

interface AuthUser {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useAuthState() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { sendMessage, lastMessage, isConnected } = useWebSocket();

  // Listen for WebSocket messages related to auth
  useEffect(() => {
    if (lastMessage?.type === 'auth_status_response') {
      const { valid, user: userData } = lastMessage.data;
      console.log(`[useAuth] Received auth_status_response: valid=${valid}, user=`, userData);
      if (valid && userData) {
        setUser(userData);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    } else if (lastMessage?.type === 'session_expired') {
      console.log('[useAuth] ⚠️ CRITICAL: session_expired received - about to redirect to login');
      console.log('[useAuth] Current timestamp:', new Date().toISOString());
      console.log('[useAuth] Message data:', lastMessage.data);
      console.log('[useAuth] WebSocket connected:', isConnected);
      
      // Instead of immediately redirecting, try to revalidate once more
      // This helps prevent false positives due to temporary network issues
      setTimeout(() => {
        if (isConnected) {
          console.log('[useAuth] Attempting session revalidation after session_expired...');
          requestAuthStatusViaWebSocket();
        }
      }, 1000);
      
      // Set a fallback timeout - if no valid response in 5 seconds, then redirect
      setTimeout(() => {
        if (!user) {
          console.log('[useAuth] 🔴 REDIRECT TO LOGIN: Session revalidation failed, redirecting...');
          setUser(null);
          window.location.href = "/login";
        } else {
          console.log('[useAuth] ✅ Session revalidation successful, staying logged in');
        }
      }, 5000);
    }
  }, [lastMessage, isConnected, user]);

  useEffect(() => {
    // Initial auth check via WebSocket only
    if (isConnected) {
      console.log('[useAuth] Initial auth check via WebSocket');
      requestAuthStatusViaWebSocket();
    }
    
    // Set up WebSocket session verification every minute
    const interval = setInterval(() => {
      if (isConnected) {
        console.log('[useAuth] ⏰ Periodic auth check (60s interval) - requesting auth status');
        requestAuthStatusViaWebSocket();
      } else {
        console.log('[useAuth] ⏰ Periodic auth check skipped - WebSocket not connected');
      }
    }, 60 * 1000); // 1 minute
    
    return () => {
      console.log('[useAuth] Cleaning up auth interval timer');
      clearInterval(interval);
    };
  }, [isConnected, sendMessage]);

  const requestAuthStatusViaWebSocket = () => {
    if (isConnected && sendMessage) {
      console.log('[useAuth] 📤 Sending auth_status_request via WebSocket');
      sendMessage({
        type: 'auth_status_request',
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('[useAuth] ❌ Cannot send auth_status_request - WebSocket not connected or sendMessage not available');
    }
  };

  

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include", // Important: include cookies
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Login successful, cookies set by server');
        setUser(data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // Important: include cookies
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    setUser(null);
    window.location.href = "/login";
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}