import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';

interface UserPreferences {
  sidebarCollapsed: boolean;
  sidebarColor: string;
  headerColor: string;
  primaryColor: string;
  autoCollapse: boolean;
}

const defaultPreferences: UserPreferences = {
  sidebarCollapsed: false,
  sidebarColor: 'default',
  headerColor: 'default', 
  primaryColor: 'blue',
  autoCollapse: false
};

export function useColorTheme() {
  const { isAuthenticated } = useAuth();
  
  const { data: userPreferences } = useQuery({
    queryKey: ["/api/user/preferences"],
    retry: false,
    enabled: isAuthenticated, // Only fetch when user is authenticated
  });

  const preferences = userPreferences ? { ...defaultPreferences, ...userPreferences } : defaultPreferences;

  // Apply color theme to CSS variables
  useEffect(() => {
    const root = document.documentElement;

    // Primary color variables
    switch (preferences.primaryColor) {
      case 'blue':
        root.style.setProperty('--primary', 'hsl(221, 83%, 53%)');
        root.style.setProperty('--primary-foreground', 'hsl(210, 40%, 98%)');
        break;
      case 'green':
        root.style.setProperty('--primary', 'hsl(142, 76%, 36%)');
        root.style.setProperty('--primary-foreground', 'hsl(138, 62%, 47%)');
        break;
      case 'purple':
        root.style.setProperty('--primary', 'hsl(262, 83%, 58%)');
        root.style.setProperty('--primary-foreground', 'hsl(210, 40%, 98%)');
        break;
      case 'orange':
        root.style.setProperty('--primary', 'hsl(25, 95%, 53%)');
        root.style.setProperty('--primary-foreground', 'hsl(210, 40%, 98%)');
        break;
      case 'red':
        root.style.setProperty('--primary', 'hsl(0, 84%, 60%)');
        root.style.setProperty('--primary-foreground', 'hsl(210, 40%, 98%)');
        break;
      default:
        root.style.setProperty('--primary', 'hsl(221, 83%, 53%)');
        root.style.setProperty('--primary-foreground', 'hsl(210, 40%, 98%)');
    }

    // Update ring color to match primary
    root.style.setProperty('--ring', getComputedStyle(root).getPropertyValue('--primary'));
  }, [preferences.primaryColor]);

  return preferences;
}