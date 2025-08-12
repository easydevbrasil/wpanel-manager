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
    
    // Check auth status every 5 minutes to keep session alive
    const interval = setInterval(() => {
      const token = localStorage.getItem("sessionToken");
      if (token && user) {
        checkAuthStatus();
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [user]);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem("sessionToken");
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      console.log('Checking auth status with token:', token);
      
      const response = await fetch("/api/auth/verify", {
        headers: {
          "session-token": token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Auth verification successful:', data);
        setUser(data.user);
      } else {
        console.log('Auth verification failed:', response.status);
        localStorage.removeItem("sessionToken");
      }
    } catch (error) {
      console.error('Auth verification error:', error);
      localStorage.removeItem("sessionToken");
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("sessionToken", data.sessionToken);
        setUser(data.user);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const logout = async () => {
    const token = localStorage.getItem("sessionToken");
    if (token) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "session-token": token,
          },
        });
      } catch (error) {
        // Continue with logout even if API call fails
      }
    }
    
    localStorage.removeItem("sessionToken");
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