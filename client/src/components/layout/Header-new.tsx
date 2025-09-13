import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  ChevronDown,
  User as UserIcon,
  Settings,
  LogOut,
  Trash2,
  Plus,
  Edit,
  Sun,
  Moon,
  Monitor,
  Menu,
  Search,
  Star,
  Globe,
  Shield,
  Zap,
  Heart,
  Bookmark,
  Grid3X3,
  ExternalLink,
  Sparkles,
  Crown,
  Users,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  Save,
} from "lucide-react";
import { SiGithub, SiDocker, SiNginx, SiPostgresql } from "react-icons/si";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProviderSimple";
import { cn } from "@/lib/utils";

// Types for new features
interface QuickLink {
  id: string;
  title: string;
  url: string;
  icon: string;
  category: string;
  description?: string;
  isActive: boolean;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  userId?: string;
}

// Helper function to get quick link icon
function getQuickLinkIcon(iconName: string) {
  const iconMap: Record<string, any> = {
    github: SiGithub,
    docker: SiDocker,
    nginx: SiNginx,
    database: SiPostgresql,
    shield: Shield,
    globe: Globe,
    zap: Zap,
    star: Star,
    heart: Heart,
    bookmark: Bookmark,
    users: Users,
    trending: TrendingUp,
  };
  
  const IconComponent = iconMap[iconName] || Globe;
  return <IconComponent className="w-4 h-4" />;
}

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const queryClient = useQueryClient();
  const { theme, setTheme, actualTheme } = useTheme();
  const { user, logout } = useAuth();
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [quickLinksDialogOpen, setQuickLinksDialogOpen] = useState(false);
  const [userProfileDialogOpen, setUserProfileDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<NotificationItem | null>(null);
  const [editingQuickLink, setEditingQuickLink] = useState<QuickLink | null>(null);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    isRead: false
  });
  const [quickLinkForm, setQuickLinkForm] = useState({
    title: '',
    url: '',
    icon: 'globe',
    category: 'general',
    description: '',
    isActive: true
  });

  // Mock data for development - replace with real API calls
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
        createdAt: new Date().toISOString()
      },
      {
        id: "2", 
        title: "Backup automático",
        message: "Backup diário executado com sucesso",
        type: "info",
        isRead: true,
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ]
  });

  const { data: quickLinks = [] } = useQuery<QuickLink[]>({
    queryKey: ["/api/quick-links"],
    staleTime: 60000,
    initialData: [
      {
        id: "1",
        title: "GitHub",
        url: "https://github.com",
        icon: "github",
        category: "dev",
        description: "Repositórios e código fonte",
        isActive: true
      },
      {
        id: "2",
        title: "Docker Hub",
        url: "https://hub.docker.com",
        icon: "docker",
        category: "dev",
        description: "Imagens Docker",
        isActive: true
      },
      {
        id: "3",
        title: "Nginx Docs",
        url: "https://nginx.org/en/docs/",
        icon: "nginx",
        category: "docs",
        description: "Documentação do Nginx",
        isActive: true
      }
    ]
  });

  // Notification mutations
  const createNotification = useMutation({
    mutationFn: (data: Omit<NotificationItem, 'id' | 'createdAt'>) =>
      apiRequest("POST", "/api/notification-items", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-items"] });
      setNotificationDialogOpen(false);
      setEditingNotification(null);
      setNotificationForm({ title: '', message: '', type: 'info', isRead: false });
    },
  });

  const updateNotification = useMutation({
    mutationFn: ({ id, ...data }: Partial<NotificationItem> & { id: string }) =>
      apiRequest("PATCH", `/api/notification-items/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-items"] });
      setNotificationDialogOpen(false);
      setEditingNotification(null);
      setNotificationForm({ title: '', message: '', type: 'info', isRead: false });
    },
  });

  const deleteNotification = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/notification-items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-items"] });
    },
  });

  // Quick Links mutations
  const createQuickLink = useMutation({
    mutationFn: (data: Omit<QuickLink, 'id'>) =>
      apiRequest("POST", "/api/quick-links", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quick-links"] });
      setQuickLinksDialogOpen(false);
      setEditingQuickLink(null);
      setQuickLinkForm({ title: '', url: '', icon: 'globe', category: 'general', description: '', isActive: true });
    },
  });

  const updateQuickLink = useMutation({
    mutationFn: ({ id, ...data }: Partial<QuickLink> & { id: string }) =>
      apiRequest("PATCH", `/api/quick-links/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quick-links"] });
      setQuickLinksDialogOpen(false);
      setEditingQuickLink(null);
      setQuickLinkForm({ title: '', url: '', icon: 'globe', category: 'general', description: '', isActive: true });
    },
  });

  const deleteQuickLink = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/quick-links/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quick-links"] });
    },
  });

  const handleEditNotification = (notification: NotificationItem) => {
    setEditingNotification(notification);
    setNotificationForm({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: notification.isRead
    });
    setNotificationDialogOpen(true);
  };

  const handleEditQuickLink = (link: QuickLink) => {
    setEditingQuickLink(link);
    setQuickLinkForm({
      title: link.title,
      url: link.url,
      icon: link.icon,
      category: link.category,
      description: link.description || '',
      isActive: link.isActive
    });
    setQuickLinksDialogOpen(true);
  };

  const handleSubmitNotification = () => {
    if (editingNotification) {
      updateNotification.mutate({
        id: editingNotification.id,
        ...notificationForm
      });
    } else {
      createNotification.mutate({
        ...notificationForm,
        userId: user?.id?.toString()
      });
    }
  };

  const handleSubmitQuickLink = () => {
    if (editingQuickLink) {
      updateQuickLink.mutate({
        id: editingQuickLink.id,
        ...quickLinkForm
      });
    } else {
      createQuickLink.mutate(quickLinkForm);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const unreadCount = notificationItems.filter(n => !n.isRead).length;
  const activeQuickLinks = quickLinks.filter(l => l.isActive);

  return (
    <header className="relative">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 opacity-95" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/10" />
      
      {/* Content */}
      <div className="relative border-b border-white/20 px-4 lg:px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSidebar}
              className="lg:hidden text-white/90 hover:text-white hover:bg-white/10"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-lg border border-white/20">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-white">wPanel</h1>
                <p className="text-white/70 text-xs">Sistema de Gerenciamento</p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
              <Input
                placeholder="Buscar..."
                className="w-full pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/40"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white/90 hover:text-white hover:bg-white/10">
                  {actualTheme === "dark" ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="h-4 w-4 mr-2" />
                  Claro
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="h-4 w-4 mr-2" />
                  Escuro
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Monitor className="h-4 w-4 mr-2" />
                  Sistema
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Quick Links */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white/90 hover:text-white hover:bg-white/10">
                  <Grid3X3 className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Links</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-96">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Links Úteis</h3>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setEditingQuickLink(null);
                        setQuickLinkForm({ title: '', url: '', icon: 'globe', category: 'general', description: '', isActive: true });
                        setQuickLinksDialogOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                    {activeQuickLinks.map((link) => (
                      <div key={link.id} className="group relative">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          {getQuickLinkIcon(link.icon)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{link.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{link.description}</p>
                          </div>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                          onClick={() => handleEditQuickLink(link)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative text-white/90 hover:text-white hover:bg-white/10">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Notificações</h3>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setEditingNotification(null);
                        setNotificationForm({ title: '', message: '', type: 'info', isRead: false });
                        setNotificationDialogOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Nova
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {notificationItems.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">Nenhuma notificação</p>
                    ) : (
                      notificationItems.map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            "flex items-start space-x-3 p-3 rounded-lg transition-colors group",
                            notification.isRead ? "bg-gray-50 dark:bg-gray-800/50" : "bg-blue-50 dark:bg-blue-900/20"
                          )}
                        >
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{notification.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notification.createdAt).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleEditNotification(notification)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                              onClick={() => deleteNotification.mutate(notification.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar || undefined} alt={user?.name || "User"} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                      {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="p-4 border-b">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user?.avatar || undefined} alt={user?.name || "User"} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                        {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{user?.name || 'Usuário'}</p>
                      <p className="text-sm text-muted-foreground truncate">{user?.email || 'email@exemplo.com'}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Crown className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs font-medium text-yellow-600">Premium</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-2">
                  <DropdownMenuItem>
                    <UserIcon className="h-4 w-4 mr-2" />
                    Meu Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Notification Management Dialog */}
      <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingNotification ? 'Editar Notificação' : 'Nova Notificação'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={notificationForm.title}
                onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Título da notificação"
              />
            </div>
            <div>
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                value={notificationForm.message}
                onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Conteúdo da notificação"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="type">Tipo</Label>
              <Select 
                value={notificationForm.type} 
                onValueChange={(value: any) => setNotificationForm(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Informação</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="warning">Aviso</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setNotificationDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleSubmitNotification}>
                <Save className="w-4 h-4 mr-2" />
                {editingNotification ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Links Management Dialog */}
      <Dialog open={quickLinksDialogOpen} onOpenChange={setQuickLinksDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingQuickLink ? 'Editar Link' : 'Novo Link Útil'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="link-title">Título</Label>
              <Input
                id="link-title"
                value={quickLinkForm.title}
                onChange={(e) => setQuickLinkForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Nome do link"
              />
            </div>
            <div>
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                value={quickLinkForm.url}
                onChange={(e) => setQuickLinkForm(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://exemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="link-description">Descrição</Label>
              <Input
                id="link-description"
                value={quickLinkForm.description}
                onChange={(e) => setQuickLinkForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Breve descrição"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="link-icon">Ícone</Label>
                <Select 
                  value={quickLinkForm.icon} 
                  onValueChange={(value) => setQuickLinkForm(prev => ({ ...prev, icon: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="globe">Globe</SelectItem>
                    <SelectItem value="github">GitHub</SelectItem>
                    <SelectItem value="docker">Docker</SelectItem>
                    <SelectItem value="nginx">Nginx</SelectItem>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="shield">Shield</SelectItem>
                    <SelectItem value="zap">Zap</SelectItem>
                    <SelectItem value="star">Star</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="link-category">Categoria</Label>
                <Select 
                  value={quickLinkForm.category} 
                  onValueChange={(value) => setQuickLinkForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Geral</SelectItem>
                    <SelectItem value="dev">Desenvolvimento</SelectItem>
                    <SelectItem value="docs">Documentação</SelectItem>
                    <SelectItem value="tools">Ferramentas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setQuickLinksDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleSubmitQuickLink}>
                <Save className="w-4 h-4 mr-2" />
                {editingQuickLink ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
