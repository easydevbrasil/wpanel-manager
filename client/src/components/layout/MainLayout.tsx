import { useState, useRef, useEffect } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { WebSocketIndicator } from "../WebSocketIndicator";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header onToggleSidebar={toggleSidebar} />
      <div className="pt-20 flex h-screen">
        <div ref={sidebarRef}>
          <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
        </div>
        <main className="flex-1 p-4 md:p-6 overflow-auto bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
      <WebSocketIndicator />
    </div>
  );
}
