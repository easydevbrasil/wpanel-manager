import { useState, useEffect, createContext, useContext } from "react";

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

  useEffect(() => {
    checkAuthStatus();
    
    // Check auth status every minute to keep session alive
    const interval = setInterval(() => {
      if (user) {
        checkAuthStatus();
      }
    }, 60 * 1000); // 1 minute
    
    return () => clearInterval(interval);
  }, [user]);

  const checkAuthStatus = async () => {
    try {
      console.log('Checking auth status with cookies...');
      
      const response = await fetch("/api/auth/verify", {
        credentials: "include", // Important: include cookies in request
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Auth verification successful:', data);
        setUser(data.user);
      } else {
        console.log('Auth verification failed:', response.status);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth verification error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
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