import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  FolderOpen,
  Users,
  Settings,
  Eye,
  BarChart3,
  FileText,
  Folder,
  User,
  Copy,
  Sliders,
  Shield,
  Bell,
  Palette,
  Monitor,
  Sun,
  Moon,
  SidebarIcon,
  Package,
  Truck,
  ShoppingCart,
  MessageSquare,
  HelpCircle,
  Mail,
  Headphones,
  Database,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import type { NavigationItem } from "@shared/schema";

const iconMap = {
  LayoutDashboard,
  FolderOpen,
  Users,
  Settings,
  Eye,
  BarChart3,
  FileText,
  Folder,
  User,
  Copy,
  Package,
  Truck,
  ShoppingCart,
  MessageSquare,
  Sliders,
  Shield,
  Bell,
  HelpCircle,
  Mail,
  Headphones,
  Database,
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [location] = useLocation();
  const [openItems, setOpenItems] = useState<Set<number>>(new Set([])); // Start with all collapsed
  const { theme, setTheme, actualTheme } = useTheme();

  const { data: navigationItems = [] } = useQuery<NavigationItem[]>({
    queryKey: ["/api/navigation"],
  });

  // Group items by parent
  const parentItems = navigationItems.filter(item => !item.parentId);
  const childItems = navigationItems.filter(item => item.parentId);
  const childrenByParent = childItems.reduce((acc, item) => {
    if (!item.parentId) return acc;
    if (!acc[item.parentId]) acc[item.parentId] = [];
    acc[item.parentId].push(item);
    return acc;
  }, {} as Record<number, NavigationItem[]>);

  const toggleItem = (itemId: number) => {
    if (collapsed) return;
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(itemId)) {
      newOpenItems.delete(itemId);
    } else {
      newOpenItems.add(itemId);
    }
    setOpenItems(newOpenItems);
  };

  const renderIcon = (iconName: string) => {
    const Icon = iconMap[iconName as keyof typeof iconMap];
    return Icon ? <Icon className="w-6 h-6" /> : <LayoutDashboard className="w-6 h-6" />;
  };

  const isActive = (href: string | null) => {
    if (!href) return false;
    return location === href || (href !== "/" && location.startsWith(href));
  };

  return (
    <>
      <aside
        className={cn(
          "bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out flex-shrink-0 h-full flex flex-col",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {/* Main Navigation */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* Toggle Button */}
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className={cn(
                "p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800",
                collapsed ? "w-full justify-center" : "ml-auto"
              )}
              data-sidebar-toggle
            >
              {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </Button>
          </div>
          
          <nav className="space-y-2">
            {parentItems.map((item) => {
              const children = childrenByParent[item.id] || [];
              const hasChildren = children.length > 0;
              const isOpen = openItems.has(item.id);

              if (hasChildren) {
                return (
                  <Collapsible
                    key={item.id}
                    open={!collapsed && isOpen}
                    onOpenChange={() => toggleItem(item.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-between px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                          collapsed && "justify-center"
                        )}
                      >
                        <div className="flex items-center">
                          {renderIcon(item.icon)}
                          {!collapsed && (
                            <span className="ml-3">{item.label}</span>
                          )}
                        </div>
                        {!collapsed && hasChildren && (
                          <ChevronDown
                            className={cn(
                              "w-4 h-4 transition-transform",
                              isOpen && "rotate-180"
                            )}
                          />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1">
                      {children.map((child) => (
                        <Link key={child.id} href={child.href || "#"}>
                          <div
                            className={cn(
                              "block ml-8 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors cursor-pointer",
                              isActive(child.href) && "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                            )}
                          >
                            {child.label}
                          </div>
                        </Link>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              } else {
                return (
                  <Link key={item.id} href={item.href || "#"}>
                    <a
                      className={cn(
                        "flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                        isActive(item.href) && "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white",
                        collapsed && "justify-center"
                      )}
                    >
                      {renderIcon(item.icon)}
                      {!collapsed && (
                        <span className="ml-3">{item.label}</span>
                      )}
                    </a>
                  </Link>
                );
              }
            })}
          </nav>
        </div>

        {/* Configuration Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800",
                  collapsed ? "justify-center px-2" : "justify-start px-3"
                )}
              >
                <Settings className="w-6 h-6" />
                {!collapsed && <span className="ml-3">Configurações</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              side={collapsed ? "right" : "top"} 
              className="w-56 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            >
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Tema do Sistema</p>
              </div>
              <DropdownMenuItem 
                onClick={() => setTheme("light")}
                className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Sun className="w-4 h-4 mr-3" />
                Claro
                {theme === "light" && <span className="ml-auto text-xs">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setTheme("dark")}
                className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Moon className="w-4 h-4 mr-3" />
                Escuro
                {theme === "dark" && <span className="ml-auto text-xs">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setTheme("system")}
                className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Monitor className="w-4 h-4 mr-3" />
                Sistema
                {theme === "system" && <span className="ml-auto text-xs">✓</span>}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-600" />
              
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Aparência</p>
              </div>
              <DropdownMenuItem className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
                <Palette className="w-4 h-4 mr-3" />
                Cores do Sidebar
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
                <SidebarIcon className="w-4 h-4 mr-3" />
                Modo Inicial: {collapsed ? "Recolhido" : "Expandido"}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
                <Eye className="w-4 h-4 mr-3" />
                Cores do Header
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
                <LayoutDashboard className="w-4 h-4 mr-3" />
                Cores Principais
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  );
}
