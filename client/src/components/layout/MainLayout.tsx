import { useState, useRef, useEffect } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { WebSocketIndicator } from "../WebSocketIndicator";
import { SystemAlerts } from "../SystemAlerts";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // default collapsed
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Set initial sidebar state based on device type
  useEffect(() => {
    // Only collapse on mobile, otherwise restore from localStorage/user preference
    if (isMobile !== undefined) {
      if (isMobile) {
        setSidebarCollapsed(true);
      } else {
        // Try to restore from localStorage (for instant UX)
        const saved = localStorage.getItem('sidebarCollapsed');
        if (saved !== null) {
          setSidebarCollapsed(saved === 'true');
        }
      }
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      localStorage.setItem('sidebarCollapsed', (!prev).toString());
      return !prev;
    });
  };

  // Handle click outside sidebar to collapse it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        !sidebarCollapsed &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        !(event.target as Element)?.closest('[data-sidebar-toggle]')
      ) {
        setSidebarCollapsed(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarCollapsed]);

  return (
    <div className="min-h-screen bg-background">
      <Header onToggleSidebar={toggleSidebar} />
      <div className="pt-16 flex h-screen">
        <div ref={sidebarRef}>
          <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
        </div>
        <main className="flex-1 p-2 md:p-4 overflow-auto bg-background w-full">
          <div className="w-full max-w-none mx-auto" style={{ width: '90%' }}>
            {children}
          </div>
        </main>
      </div>
      <WebSocketIndicator />
      <SystemAlerts interval={5000} enabled={true} />
    </div>
  );
}
