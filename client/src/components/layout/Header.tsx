import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  User as UserIcon,
  Settings,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Menu,
  Sparkles,
  Crown,
  Grid3X3,
  Search,
  MessageSquare,
  HelpCircle,
  Shield,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProviderSimple";
import { cn } from "@/lib/utils";
import { NotificationManager } from "@/components/NotificationManager";
import { QuickLinksManager } from "@/components/QuickLinksManager";
import { UserStatsCard } from "@/components/UserStatsCard";

// Types for new features
interface QuickLink {
  id: string;
  title: string;
  url: string;
  icon: string;
  category: string;
  description?: string;
  isActive: boolean;
  isFavorite?: boolean;
  openInNewTab?: boolean;
  sortOrder?: number;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  userId?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  category?: string;
  actionUrl?: string;
}

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [quickLinksDialogOpen, setQuickLinksDialogOpen] = useState(false);
  const [userProfileDialogOpen, setUserProfileDialogOpen] = useState(false);

  // Fetch data
  const { data: notificationItems = [] } = useQuery<NotificationItem[]>({
    queryKey: ["/api/notification-items"],
    staleTime: 30000,
    initialData: [
      {
        id: "1",
        title: "Bem-vindo ao wPanel!",
        message: "Sistema de notificações configurado com sucesso",
        type: "success",
        isRead: false,
        createdAt: new Date().toISOString(),
        priority: "normal",
        category: "sistema"
      },
      {
        id: "2",
        title: "Backup automático",
        message: "Backup diário executado com sucesso às 03:00",
        type: "info",
        isRead: true,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        priority: "low",
        category: "backup"
      }
    ]
  });

  const { data: quickLinks = [] } = useQuery<QuickLink[]>({
    queryKey: ["/api/quick-links"],
    staleTime: 30000,
    initialData: [
      {
        id: "1",
        title: "GitHub",
        url: "https://github.com",
        icon: "github",
        category: "development",
        description: "Repositórios de código",
        isActive: true,
        isFavorite: true,
        openInNewTab: true
      },
      {
        id: "2",
        title: "Docker Hub",
        url: "https://hub.docker.com",
        icon: "docker",
        category: "development",
        description: "Imagens Docker",
        isActive: true,
        isFavorite: false,
        openInNewTab: true
      },
      {
        id: "3",
        title: "Nginx Docs",
        url: "https://nginx.org/en/docs/",
        icon: "nginx",
        category: "documentation",
        description: "Documentação oficial do Nginx",
        isActive: true,
        isFavorite: true,
        openInNewTab: true
      }
    ]
  });

  // Notification mutations
  const createNotificationMutation = useMutation({
    mutationFn: (notification: Omit<NotificationItem, 'id' | 'createdAt'>) =>
      apiRequest('POST', '/api/notification-items', notification),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notification-items"] }),
  });

  const updateNotificationMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<NotificationItem>) =>
      apiRequest('PUT', `/api/notification-items/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notification-items"] }),
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest('DELETE', `/api/notification-items/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notification-items"] }),
  });

  // Quick links mutations
  const createQuickLinkMutation = useMutation({
    mutationFn: (link: Omit<QuickLink, 'id'>) =>
      apiRequest('POST', '/api/quick-links', link),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/quick-links"] }),
  });

  const updateQuickLinkMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<QuickLink>) =>
      apiRequest('PUT', `/api/quick-links/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/quick-links"] }),
  });

  const deleteQuickLinkMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest('DELETE', `/api/quick-links/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/quick-links"] }),
  });

  // Notification handlers
  const handleMarkAsRead = (id: string) => {
    updateNotificationMutation.mutate({ id, isRead: true });
  };

  const handleMarkAsUnread = (id: string) => {
    updateNotificationMutation.mutate({ id, isRead: false });
  };

  const handleDeleteNotification = (id: string) => {
    deleteNotificationMutation.mutate(id);
  };

  const handleCreateNotification = (notification: Omit<NotificationItem, 'id' | 'createdAt'>) => {
    createNotificationMutation.mutate(notification);
  };

  const handleUpdateNotification = (id: string, notification: Partial<NotificationItem>) => {
    updateNotificationMutation.mutate({ id, ...notification });
  };

  // Quick links handlers
  const handleCreateQuickLink = (link: Omit<QuickLink, 'id'>) => {
    createQuickLinkMutation.mutate(link);
  };

  const handleUpdateQuickLink = (id: string, link: Partial<QuickLink>) => {
    updateQuickLinkMutation.mutate({ id, ...link });
  };

  const handleDeleteQuickLink = (id: string) => {
    deleteQuickLinkMutation.mutate(id);
  };

  const handleToggleFavorite = (id: string) => {
    const link = quickLinks.find(l => l.id === id);
    if (link) {
      handleUpdateQuickLink(id, { isFavorite: !link.isFavorite });
    }
  };

  const unreadCount = notificationItems.filter(n => !n.isRead).length;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-gradient-to-r from-indigo-900/95 via-purple-900/95 to-pink-900/95 border-b border-white/20 shadow-2xl">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -top-5 -right-20 w-60 h-60 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 py-2">
        <div className="flex items-center justify-between h-12">
          {/* Logo Section - Redesigned */}
          <div className="flex items-center space-x-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSidebar}
              className="lg:hidden text-white/90 hover:text-white hover:bg-white/20 p-2 rounded-xl"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <Link href="/">
              <div className="flex items-center space-x-4">
                <div className="relative group cursor-pointer">
                  <div className="bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl border border-white/30 group-hover:scale-105 transition-all duration-300">
                    <Shield className="w-8 h-8 text-white drop-shadow-lg" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full border-2 border-white/70 animate-pulse shadow-lg"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="hidden md:block">
                  <h1 className="text-2xl font-bold text-white tracking-tight bg-gradient-to-r from-white to-gray-200 bg-clip-text">
                    wPanel
                  </h1>
                  <p className="text-sm text-white/90 font-medium -mt-1 tracking-wide">
                    Enterprise Suite
                  </p>
                </div>
              </div>
            </Link>
          </div>

          {/* Action Buttons - Redesigned */}
          <div className="flex items-center space-x-3">
            {/* Quick Links */}
            <Dialog open={quickLinksDialogOpen} onOpenChange={setQuickLinksDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white/90 hover:text-white hover:bg-white/20 rounded-xl px-4 py-2 backdrop-blur-sm border border-white/20 transition-all duration-200 hover:scale-105">
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline font-medium">Links</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 border-0 shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Gerenciar Links Rápidos</DialogTitle>
                </DialogHeader>
                <QuickLinksManager
                  links={quickLinks}
                  onCreate={handleCreateQuickLink}
                  onUpdate={handleUpdateQuickLink}
                  onDelete={handleDeleteQuickLink}
                  onToggleFavorite={handleToggleFavorite}
                />
              </DialogContent>
            </Dialog>

            {/* Notifications */}
            <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="relative text-white/90 hover:text-white hover:bg-white/20 rounded-xl p-3 backdrop-blur-sm border border-white/20 transition-all duration-200 hover:scale-105">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold border-2 border-white/50 shadow-lg animate-pulse">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 border-0 shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Central de Notificações</DialogTitle>
                </DialogHeader>
                <NotificationManager
                  notifications={notificationItems}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAsUnread={handleMarkAsUnread}
                  onDelete={handleDeleteNotification}
                  onCreate={handleCreateNotification}
                  onUpdate={handleUpdateNotification}
                />
              </DialogContent>
            </Dialog>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 border border-white/30 backdrop-blur-sm transition-all duration-200 hover:scale-105 shadow-xl">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.avatar || undefined} alt={user?.name || "User"} />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-bold">
                      <Crown className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-gradient-to-br from-white/95 to-gray-50/95 dark:from-gray-900/95 dark:to-slate-900/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-2">
                <div className="p-4">
                  {/* User Stats Card */}
                  <UserStatsCard user={user} />

                  <Separator className="my-4 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

                  {/* Menu Items */}
                  <div className="space-y-1">
                    <DropdownMenuItem
                      className="cursor-pointer rounded-xl hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 transition-all duration-200"
                      onClick={() => setUserProfileDialogOpen(true)}
                    >
                      <UserIcon className="w-4 h-4 mr-3 text-indigo-500" />
                      <span className="font-medium">Perfil</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem className="cursor-pointer rounded-xl hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 transition-all duration-200">
                      <Settings className="w-4 h-4 mr-3 text-purple-500" />
                      <span className="font-medium">Configurações</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* Theme Selector */}
                    <div className="px-2 py-1">
                      <p className="text-sm font-medium mb-2">Tema</p>
                      <div className="flex space-x-1">
                        <Button
                          variant={theme === "light" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTheme("light")}
                          className="flex-1"
                        >
                          <Sun className="w-3 h-3 mr-1" />
                          Claro
                        </Button>
                        <Button
                          variant={theme === "dark" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTheme("dark")}
                          className="flex-1"
                        >
                          <Moon className="w-3 h-3 mr-1" />
                          Escuro
                        </Button>
                        <Button
                          variant={theme === "system" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTheme("system")}
                          className="flex-1"
                        >
                          <Monitor className="w-3 h-3 mr-1" />
                          Auto
                        </Button>
                      </div>
                    </div>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem className="cursor-pointer text-red-600" onClick={logout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* User Profile Dialog */}
      <Dialog open={userProfileDialogOpen} onOpenChange={setUserProfileDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Perfil do Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={user?.avatar || undefined} alt={user?.name || "User"} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-xl">
                  <Crown className="w-8 h-8" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{user?.name || "Usuário"}</h3>
                <p className="text-sm text-muted-foreground">{user?.email || "usuario@exemplo.com"}</p>
                <Badge variant="outline" className="mt-1">
                  <Crown className="w-3 h-3 mr-1" />
                  Administrador
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Button className="w-full" variant="outline">
                <UserIcon className="w-4 h-4 mr-2" />
                Editar Perfil
              </Button>
              <Button className="w-full" variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Configurações de Conta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
