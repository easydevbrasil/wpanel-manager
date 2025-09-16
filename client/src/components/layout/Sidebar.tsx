// Default navigation items for fallback when API fails
const defaultNavigationItems = [
  { id: 1, label: 'Dashboard', href: '/', icon: 'LayoutDashboard', parentId: null },
  { id: 2, label: 'Clientes', href: '/clients', icon: 'Users', parentId: null },
  { id: 3, label: 'Produtos', href: '/products', icon: 'Package', parentId: null },
  { id: 4, label: 'Fornecedores', href: '/suppliers', icon: 'Truck', parentId: null },
  { id: 5, label: 'Vendas', href: '/sales', icon: 'ShoppingCart', parentId: null },
  { id: 6, label: 'Suporte', href: '/support', icon: 'Headphones', parentId: null },
  { id: 7, label: 'Firewall', href: '/firewall', icon: 'Shield', parentId: null },
  { id: 8, label: 'Docker', href: '/docker-containers', icon: 'Container', parentId: null },
  { id: 9, label: 'DNS', href: '/dns', icon: 'Globe', parentId: null },
  { id: 10, label: 'Nginx', href: '/nginx-hosts', icon: 'Server', parentId: null },
  { id: 11, label: 'Despesas', href: '/expenses', icon: 'CreditCard', parentId: null },
  { id: 12, label: 'Lembretes', href: '/reminders', icon: 'Bell', parentId: null },
  { id: 13, label: 'Banco', href: '/banco', icon: 'Database', parentId: null },
  { id: 14, label: 'Email', href: '/email-accounts', icon: 'Mail', parentId: null },
  { id: 15, label: 'Base de Dados', href: '/database-admin', icon: 'Database', parentId: null },
  { id: 16, label: 'Serviços', href: '/services', icon: 'Zap', parentId: null },
  { id: 17, label: 'Tarefas', href: '/task-scheduler', icon: 'Calendar', parentId: null },
  { id: 18, label: 'Ajuda', href: '/help', icon: 'HelpCircle', parentId: null },
  { id: 19, label: 'Documentação', href: '/documentation', icon: 'FileText', parentId: null }
];

import { useState, useEffect } from "react";
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
  CreditCard,
  Headphones,
  Database,
  Container,
  Server,
  Globe,
  Lock,
  Activity,
  GitBranch,
  Zap,
  Cloud,
  Wifi,
  UserCheck,
  Archive,
  Bookmark,
  Calendar,
  Clock,
  Download,
  Upload,
  RefreshCw,
  Search,
  Star,
  Tag,
  Target,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
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
  Container,
  CreditCard,
  Server,
  Globe,
  Lock,
  Activity,
  GitBranch,
  Zap,
  Cloud,
  Wifi,
  UserCheck,
  Archive,
  Bookmark,
  Calendar,
  Clock,
  Download,
  Upload,
  RefreshCw,
  Search,
  Star,
  Tag,
  Target,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Monitor,
  Palette,
};

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

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [location] = useLocation();
  const [openItems, setOpenItems] = useState<Set<number>>(new Set([])); // Start with all collapsed
  const { theme, setTheme, actualTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(defaultPreferences);
  const isMobile = useIsMobile();

  const { data: navigationItems = [], error: navigationError, isLoading: navigationLoading } = useQuery<NavigationItem[]>({
    queryKey: ["/api/navigation"],
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Use fallback navigation if API fails or returns empty array
  const effectiveNavigationItems = navigationError || navigationItems.length === 0 
    ? defaultNavigationItems 
    : navigationItems;

  // Load user preferences
  const { data: preferencesData } = useQuery({
    queryKey: ["/api/user/preferences"],
    retry: false,
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: Partial<UserPreferences>) => {
      return await apiRequest("PUT", "/api/user/preferences", preferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/preferences"] });
      toast({
        title: "Configurações salvas",
        description: "Suas preferências foram atualizadas com sucesso",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao salvar configurações",
      });
    },
  });

  // Update preferences state when data loads
  useEffect(() => {
    if (preferencesData) {
      setUserPreferences({ ...defaultPreferences, ...preferencesData });
    }
  }, [preferencesData]);

  // Auto-collapse on mobile devices (only on initial load, not constantly)
  useEffect(() => {
    // Only auto-collapse when switching to mobile for the first time
    if (isMobile !== undefined && isMobile && !collapsed) {
      // Add a small delay to prevent conflicts with other state changes
      const timer = setTimeout(() => {
        onToggle();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isMobile]); // Removed collapsed and onToggle from dependencies to prevent constant triggering

  // Functions to update preferences
  const updatePreference = async (key: keyof UserPreferences, value: any) => {
    const newPreferences = { ...userPreferences, [key]: value };
    setUserPreferences(newPreferences);
    await updatePreferencesMutation.mutateAsync({ [key]: value });
  };

  const toggleSidebarMode = async () => {
    const newCollapsed = !collapsed;
    onToggle();
    // Always save preference for user
    await updatePreference('sidebarCollapsed', newCollapsed);
  };

  const updateSidebarColor = async (color: string) => {
    await updatePreference('sidebarColor', color);
  };

  const updateHeaderColor = async (color: string) => {
    await updatePreference('headerColor', color);
  };

  const updatePrimaryColor = async (color: string) => {
    await updatePreference('primaryColor', color);
  };

  // Color theme functions
  const getSidebarColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-200/70 dark:border-blue-800/50';
      case 'green':
        return 'bg-green-50/50 dark:bg-green-950/30 border-green-200/70 dark:border-green-800/50';
      case 'purple':
        return 'bg-purple-50/50 dark:bg-purple-950/30 border-purple-200/70 dark:border-purple-800/50';
      case 'red':
        return 'bg-red-50/50 dark:bg-red-950/30 border-red-200/70 dark:border-red-800/50';
      default:
        return 'bg-white/80 dark:bg-gray-900/80 border-gray-200/70 dark:border-gray-700/50';
    }
  };

  const getSidebarItemClasses = (color: string, isActive: boolean) => {
    if (isActive) {
      switch (color) {
        case 'blue':
          return 'bg-blue-100/80 dark:bg-blue-900/60 text-blue-700 dark:text-blue-200 shadow-sm';
        case 'green':
          return 'bg-green-100/80 dark:bg-green-900/60 text-green-700 dark:text-green-200 shadow-sm';
        case 'purple':
          return 'bg-purple-100/80 dark:bg-purple-900/60 text-purple-700 dark:text-purple-200 shadow-sm';
        case 'red':
          return 'bg-red-100/80 dark:bg-red-900/60 text-red-700 dark:text-red-200 shadow-sm';
        default:
          return 'bg-gray-100/80 dark:bg-gray-800/60 text-gray-800 dark:text-gray-200 shadow-sm';
      }
    }

    switch (color) {
      case 'blue':
        return 'text-gray-600 dark:text-gray-400 hover:bg-blue-50/80 dark:hover:bg-blue-900/40 hover:text-blue-700 dark:hover:text-blue-300';
      case 'green':
        return 'text-gray-600 dark:text-gray-400 hover:bg-green-50/80 dark:hover:bg-green-900/40 hover:text-green-700 dark:hover:text-green-300';
      case 'purple':
        return 'text-gray-600 dark:text-gray-400 hover:bg-purple-50/80 dark:hover:bg-purple-900/40 hover:text-purple-700 dark:hover:text-purple-300';
      case 'red':
        return 'text-gray-600 dark:text-gray-400 hover:bg-red-50/80 dark:hover:bg-red-900/40 hover:text-red-700 dark:hover:text-red-300';
      default:
        return 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/60 hover:text-gray-800 dark:hover:text-gray-200';
    }
  };

  // Group items by parent
  const parentItems = effectiveNavigationItems.filter(item => !item.parentId);
  const childItems = effectiveNavigationItems.filter(item => item.parentId);
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
    return Icon ? <Icon className={collapsed ? "w-5 h-5" : "w-4 h-4"} /> : <LayoutDashboard className={collapsed ? "w-5 h-5" : "w-4 h-4"} />;
  };

  const isActive = (href: string | null) => {
    if (!href) return false;
    return location === href || (href !== "/" && location.startsWith(href));
  };

  return (
    <>
      <aside
        className={cn(
          "relative border-r transition-all duration-300 ease-in-out flex-shrink-0 h-full flex flex-col overflow-hidden",
          "bg-gradient-to-b from-slate-50/80 via-white/80 to-slate-100/80 dark:from-gray-900/80 dark:via-gray-800/80 dark:to-gray-900/80",
          "border-gradient-to-b border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl",
          "shadow-2xl shadow-gray-200/20 dark:shadow-gray-900/40",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 via-transparent to-purple-50/30 dark:from-indigo-900/20 dark:via-transparent dark:to-purple-900/20 pointer-events-none"></div>

        {/* Main Navigation */}
        <div className="relative flex-1 p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {/* Toggle Button */}
          <div className="mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className={cn(
                "group relative rounded-xl p-2 text-gray-700 dark:text-gray-300 transition-all duration-300 ease-in-out",
                "hover:bg-indigo-100/80 dark:hover:bg-indigo-900/40 hover:text-indigo-700 dark:hover:text-indigo-300",
                "hover:shadow-lg hover:shadow-indigo-200/30 dark:hover:shadow-indigo-900/30 hover:scale-105",
                "backdrop-blur-sm border border-gray-200/30 dark:border-gray-700/30",
                collapsed ? "w-full justify-center" : "ml-auto"
              )}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
              ) : (
                <ChevronLeft className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
              )}
            </Button>
          </div>

          <nav className="space-y-1">
            {/* Show loading indicator if navigation is loading */}
            {navigationLoading && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
              </div>
            )}
            
            {/* Show error message if navigation failed and using fallback */}
            {navigationError && (
              <div className="px-3 py-2 mb-2 text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                Usando navegação padrão - API indisponível
              </div>
            )}
            
            {[...parentItems].map((item) => {
              const children = childrenByParent[item.id] || [];
              const hasChildren = children.length > 0;
              const isOpen = openItems.has(item.id);
              const itemIsActive = isActive(item.href);

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
                          "w-full group relative rounded-2xl transition-all duration-300 hover:scale-[1.02]",
                          "border border-transparent hover:border-indigo-200/50 dark:hover:border-indigo-700/50",
                          "hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20",
                          "hover:shadow-lg hover:shadow-indigo-200/30 dark:hover:shadow-indigo-900/30",
                          collapsed ? "justify-center px-3 py-2 h-10" : "justify-between px-4 py-2 h-10"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            {renderIcon(item.icon)}
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                          </div>
                          {!collapsed && (
                            <span className="text-base font-semibold text-gray-700 dark:text-gray-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                              {item.label}
                            </span>
                          )}
                        </div>
                        {!collapsed && hasChildren && (
                          <ChevronDown
                            className={cn(
                              "w-4 h-4 transition-all duration-300 text-gray-500 group-hover:text-indigo-600",
                              isOpen && "rotate-180"
                            )}
                          />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1.5 mt-2">
                      {children.map((child) => (
                        <Link key={child.id} href={child.href || "#"}>
                          <div
                            className={cn(
                              "block ml-8 px-4 py-2.5 text-sm rounded-xl transition-all duration-300 cursor-pointer group",
                              "border-l-4 border-transparent hover:border-indigo-400 dark:hover:border-indigo-500",
                              "hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 dark:hover:from-indigo-900/10 dark:hover:to-purple-900/10",
                              "hover:shadow-md hover:shadow-indigo-200/20 dark:hover:shadow-indigo-900/20",
                              isActive(child.href)
                                ? "bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-500 shadow-md font-medium"
                                : "text-gray-600 dark:text-gray-400 hover:text-indigo-700 dark:hover:text-indigo-300"
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
                    <div
                      className={cn(
                        "flex items-center gap-4 rounded-2xl transition-all duration-300 cursor-pointer group relative hover:scale-[1.02]",
                        "border border-transparent hover:border-indigo-200/50 dark:hover:border-indigo-700/50",
                        "hover:shadow-lg hover:shadow-indigo-200/30 dark:hover:shadow-indigo-900/30",
                        collapsed ? "justify-center px-3 py-2 h-10" : "px-4 py-2 h-10",
                        itemIsActive
                          ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/30 border-indigo-400/50"
                          : "hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 text-gray-700 dark:text-gray-300 hover:text-indigo-700 dark:hover:text-indigo-300"
                      )}
                    >
                      <div className="relative">
                        {renderIcon(item.icon)}
                        {!itemIsActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                        )}
                      </div>
                      {!collapsed && (
                        <span className="text-base font-semibold transition-colors duration-300">
                          {item.label}
                        </span>
                      )}
                      {itemIsActive && !collapsed && (
                        <div className="absolute right-2 w-2 h-2 bg-white rounded-full shadow-lg"></div>
                      )}
                    </div>
                  </Link>
                );
              }
            })}
          </nav>
        </div>

        {/* Configuration Section */}
        <div className="relative border-t border-gradient-to-r border-gray-200/50 dark:border-gray-700/50 p-4 bg-gradient-to-r from-slate-50/50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full group relative rounded-2xl transition-all duration-300 hover:scale-[1.02]",
                  "border border-transparent hover:border-indigo-200/50 dark:hover:border-indigo-700/50",
                  "hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20",
                  "hover:shadow-lg hover:shadow-indigo-200/30 dark:hover:shadow-indigo-900/30",
                  "text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400",
                  collapsed ? "justify-center px-3 py-2 h-10" : "justify-start px-4 py-2 h-10"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Settings className={collapsed ? "w-5 h-5" : "w-4 h-4"} />
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                  </div>
                  {!collapsed && <span className="text-sm font-semibold">Configurações</span>}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side={collapsed ? "right" : "top"}
              className="w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl rounded-2xl p-2"
            >
              <div className="px-3 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl mb-2">
                <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">Tema do Sistema</p>
              </div>
              <DropdownMenuItem
                onClick={() => setTheme("light")}
                className="rounded-xl hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 dark:hover:from-yellow-900/20 dark:hover:to-orange-900/20 text-gray-900 dark:text-gray-100 transition-all duration-200"
              >
                <Sun className="w-4 h-4 mr-3 text-yellow-500" />
                <span className="font-medium">Claro</span>
                {theme === "light" && <span className="ml-auto text-yellow-500 font-bold">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("dark")}
                className="rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 text-gray-900 dark:text-gray-100 transition-all duration-200"
              >
                <Moon className="w-4 h-4 mr-3 text-blue-500" />
                <span className="font-medium">Escuro</span>
                {theme === "dark" && <span className="ml-auto text-blue-500 font-bold">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("system")}
                className="rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 dark:hover:from-gray-900/20 dark:hover:to-slate-900/20 text-gray-900 dark:text-gray-100 transition-all duration-200"
              >
                <Monitor className="w-4 h-4 mr-3 text-gray-500" />
                <span className="font-medium">Sistema</span>
                {theme === "system" && <span className="ml-auto text-gray-500 font-bold">✓</span>}
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-600 my-2" />

              <div className="px-3 py-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl mb-2">
                <p className="text-sm font-bold text-purple-700 dark:text-purple-300">Aparência</p>
              </div>

              {/* Sidebar Mode Toggle */}
              <DropdownMenuItem
                onClick={toggleSidebarMode}
                className="rounded-xl hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 text-gray-900 dark:text-gray-100 transition-all duration-200"
              >
                <SidebarIcon className="w-4 h-4 mr-3 text-indigo-500" />
                <span className="font-medium">Alternar Sidebar</span>
                <span className="ml-auto text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                  {collapsed ? "Expandir" : "Recolher"}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  );
}
