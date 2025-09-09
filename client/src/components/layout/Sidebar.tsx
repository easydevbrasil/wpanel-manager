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
  Headphones,
  Database,
  Container,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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

  const { data: navigationItems = [] } = useQuery<NavigationItem[]>({
    queryKey: ["/api/navigation"],
  });

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

  // Functions to update preferences
  const updatePreference = async (key: keyof UserPreferences, value: any) => {
    const newPreferences = { ...userPreferences, [key]: value };
    setUserPreferences(newPreferences);
    await updatePreferencesMutation.mutateAsync({ [key]: value });
  };

  const toggleSidebarMode = async () => {
    const newCollapsed = !collapsed;
    onToggle();
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
  const parentItems = navigationItems.filter(item => !item.parentId && item.href !== "/docker-containers");
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
          "border-r transition-all duration-300 ease-in-out flex-shrink-0 h-full flex flex-col backdrop-blur-sm",
          getSidebarColorClasses(userPreferences.sidebarColor),
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Main Navigation */}
        <div className="flex-1 p-2 overflow-y-auto">
          {/* Toggle Button */}
          <div className="mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className={cn(
                "p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 rounded-md transition-all duration-200",
                collapsed ? "w-full justify-center" : "ml-auto"
              )}
              data-sidebar-toggle
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>
          
          <nav className="space-y-1">
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
                          "w-full justify-between rounded-md transition-all duration-200 group",
                          getSidebarItemClasses(userPreferences.sidebarColor, false),
                          collapsed ? "justify-center px-2 py-2 h-10" : "px-3 py-2 h-9"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {renderIcon(item.icon)}
                          {!collapsed && (
                            <span className="text-sm font-medium">{item.label}</span>
                          )}
                        </div>
                        {!collapsed && hasChildren && (
                          <ChevronDown
                            className={cn(
                              "w-3 h-3 transition-transform duration-200 opacity-60 group-hover:opacity-100",
                              isOpen && "rotate-180"
                            )}
                          />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1 mt-1">
                      {children.map((child) => (
                        <Link key={child.id} href={child.href || "#"}>
                          <div
                            className={cn(
                              "block ml-6 px-3 py-1.5 text-sm rounded-md transition-all duration-200 cursor-pointer border-l-2 border-transparent hover:border-current",
                              getSidebarItemClasses(userPreferences.sidebarColor, isActive(child.href))
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
                        "flex items-center gap-3 rounded-md transition-all duration-200 cursor-pointer group",
                        getSidebarItemClasses(userPreferences.sidebarColor, isActive(item.href)),
                        collapsed ? "justify-center px-2 py-2 h-10" : "px-3 py-2 h-9"
                      )}
                    >
                      {renderIcon(item.icon)}
                      {!collapsed && (
                        <span className="text-sm font-medium">{item.label}</span>
                      )}
                    </div>
                  </Link>
                );
              }
            })}
            
            {/* Separador */}
            <div className="my-3 border-t border-gray-200/60 dark:border-gray-700/60"></div>
            
            {/* Link fixo para Docker Containers */}
            <Link href="/docker-containers">
              <div
                className={cn(
                  "flex items-center gap-3 rounded-md transition-all duration-200 cursor-pointer group",
                  getSidebarItemClasses(userPreferences.sidebarColor, isActive("/docker-containers")),
                  collapsed ? "justify-center px-2 py-2 h-10" : "px-3 py-2 h-9"
                )}
              >
                <Container className={collapsed ? "w-5 h-5" : "w-4 h-4"} />
                {!collapsed && (
                  <span className="text-sm font-medium">Docker Containers</span>
                )}
              </div>
            </Link>
          </nav>
        </div>

        {/* Configuration Section */}
        <div className="border-t border-gray-200/60 dark:border-gray-700/60 p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 rounded-md transition-all duration-200",
                  collapsed ? "justify-center px-2 py-2 h-10" : "justify-start px-3 py-2 h-9"
                )}
              >
                <Settings className={collapsed ? "w-5 h-5" : "w-4 h-4"} />
                {!collapsed && <span className="ml-3 text-sm font-medium">Configurações</span>}
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
              
              {/* Sidebar Colors */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <DropdownMenuItem className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Palette className="w-4 h-4 mr-3" />
                    Cores do Sidebar
                    <ChevronRight className="w-3 h-3 ml-auto" />
                  </DropdownMenuItem>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" className="w-48">
                  <DropdownMenuItem onClick={() => updateSidebarColor('default')} className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-gray-500 mr-3"></div>
                    Padrão
                    {userPreferences.sidebarColor === 'default' && <span className="ml-auto text-xs">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateSidebarColor('blue')} className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
                    Azul
                    {userPreferences.sidebarColor === 'blue' && <span className="ml-auto text-xs">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateSidebarColor('green')} className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                    Verde
                    {userPreferences.sidebarColor === 'green' && <span className="ml-auto text-xs">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateSidebarColor('purple')} className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-purple-500 mr-3"></div>
                    Roxo
                    {userPreferences.sidebarColor === 'purple' && <span className="ml-auto text-xs">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateSidebarColor('red')} className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-3"></div>
                    Vermelho
                    {userPreferences.sidebarColor === 'red' && <span className="ml-auto text-xs">✓</span>}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Sidebar Mode Toggle */}
              <DropdownMenuItem 
                onClick={toggleSidebarMode}
                className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <SidebarIcon className="w-4 h-4 mr-3" />
                Alternar Sidebar
                <span className="ml-auto text-xs text-gray-500">
                  {collapsed ? "Expandir" : "Recolher"}
                </span>
              </DropdownMenuItem>

              {/* Header Colors */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <DropdownMenuItem className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Eye className="w-4 h-4 mr-3" />
                    Cores do Header
                    <ChevronRight className="w-3 h-3 ml-auto" />
                  </DropdownMenuItem>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" className="w-48">
                  <DropdownMenuItem onClick={() => updateHeaderColor('default')} className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-gray-500 mr-3"></div>
                    Padrão
                    {userPreferences.headerColor === 'default' && <span className="ml-auto text-xs">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateHeaderColor('blue')} className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
                    Azul
                    {userPreferences.headerColor === 'blue' && <span className="ml-auto text-xs">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateHeaderColor('green')} className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                    Verde
                    {userPreferences.headerColor === 'green' && <span className="ml-auto text-xs">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateHeaderColor('dark')} className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-gray-800 mr-3"></div>
                    Escuro
                    {userPreferences.headerColor === 'dark' && <span className="ml-auto text-xs">✓</span>}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Primary Colors */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <DropdownMenuItem className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <LayoutDashboard className="w-4 h-4 mr-3" />
                    Cores Principais
                    <ChevronRight className="w-3 h-3 ml-auto" />
                  </DropdownMenuItem>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" className="w-48">
                  <DropdownMenuItem onClick={() => updatePrimaryColor('blue')} className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-600 mr-3"></div>
                    Azul
                    {userPreferences.primaryColor === 'blue' && <span className="ml-auto text-xs">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updatePrimaryColor('green')} className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-600 mr-3"></div>
                    Verde
                    {userPreferences.primaryColor === 'green' && <span className="ml-auto text-xs">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updatePrimaryColor('purple')} className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-purple-600 mr-3"></div>
                    Roxo
                    {userPreferences.primaryColor === 'purple' && <span className="ml-auto text-xs">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updatePrimaryColor('orange')} className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-orange-600 mr-3"></div>
                    Laranja
                    {userPreferences.primaryColor === 'orange' && <span className="ml-auto text-xs">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updatePrimaryColor('red')} className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-600 mr-3"></div>
                    Vermelho
                    {userPreferences.primaryColor === 'red' && <span className="ml-auto text-xs">✓</span>}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  );
}
