import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Bell,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  Save,
  Archive,
  BellRing,
  Settings,
  Filter,
  Search,
  MoreVertical,
  Clock,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

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

interface NotificationManagerProps {
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAsUnread: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: (notification: Omit<NotificationItem, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, notification: Partial<NotificationItem>) => void;
  className?: string;
}

export function NotificationManager({
  notifications,
  onMarkAsRead,
  onMarkAsUnread,
  onDelete,
  onCreate,
  onUpdate,
  className
}: NotificationManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRead, setFilterRead] = useState<string>("all");
  const [editingNotification, setEditingNotification] = useState<NotificationItem | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    category: '',
    actionUrl: ''
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || notification.type === filterType;
    const matchesRead = filterRead === "all" || 
                       (filterRead === "read" && notification.isRead) ||
                       (filterRead === "unread" && !notification.isRead);
    
    return matchesSearch && matchesType && matchesRead;
  });

  const getTypeIcon = (type: string) => {
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'normal':
        return 'bg-blue-500';
      case 'low':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  const handleSubmit = () => {
    if (!notificationForm.title || !notificationForm.message) return;

    if (editingNotification) {
      onUpdate(editingNotification.id, {
        ...notificationForm,
        isRead: false // Reset read status when editing
      });
      setEditingNotification(null);
    } else {
      onCreate({
        ...notificationForm,
        isRead: false
      });
    }

    setNotificationForm({
      title: '',
      message: '',
      type: 'info',
      priority: 'normal',
      category: '',
      actionUrl: ''
    });
    setIsCreateDialogOpen(false);
  };

  const startEdit = (notification: NotificationItem) => {
    setEditingNotification(notification);
    setNotificationForm({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority || 'normal',
      category: notification.category || '',
      actionUrl: notification.actionUrl || ''
    });
    setIsCreateDialogOpen(true);
  };

  const cancelEdit = () => {
    setEditingNotification(null);
    setNotificationForm({
      title: '',
      message: '',
      type: 'info',
      priority: 'normal',
      category: '',
      actionUrl: ''
    });
    setIsCreateDialogOpen(false);
  };

  return (
    <div className={cn("w-full max-w-4xl", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <BellRing className="w-6 h-6 text-primary" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold">Notificações</h2>
            <p className="text-sm text-muted-foreground">
              {notifications.length} total • {unreadCount} não lidas
            </p>
          </div>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Notificação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingNotification ? 'Editar Notificação' : 'Nova Notificação'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={notificationForm.title}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Título da notificação"
                />
              </div>
              <div>
                <Label>Mensagem</Label>
                <Textarea
                  value={notificationForm.message}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Conteúdo da notificação"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <Select value={notificationForm.type} onValueChange={(value: any) => setNotificationForm(prev => ({ ...prev, type: value }))}>
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
                <div>
                  <Label>Prioridade</Label>
                  <Select value={notificationForm.priority} onValueChange={(value: any) => setNotificationForm(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Categoria (opcional)</Label>
                <Input
                  value={notificationForm.category}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Ex: sistema, backup, segurança"
                />
              </div>
              <div>
                <Label>URL de Ação (opcional)</Label>
                <Input
                  value={notificationForm.actionUrl}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, actionUrl: e.target.value }))}
                  placeholder="Link para ação relacionada"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSubmit} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  {editingNotification ? 'Atualizar' : 'Criar'}
                </Button>
                <Button variant="outline" onClick={cancelEdit}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar notificações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="info">Informação</SelectItem>
            <SelectItem value="success">Sucesso</SelectItem>
            <SelectItem value="warning">Aviso</SelectItem>
            <SelectItem value="error">Erro</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterRead} onValueChange={setFilterRead}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="unread">Não lidas</SelectItem>
            <SelectItem value="read">Lidas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Nenhuma notificação encontrada
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm || filterType !== "all" || filterRead !== "all" 
                ? "Tente ajustar os filtros de busca"
                : "Crie sua primeira notificação"}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "group relative bg-card border rounded-lg p-4 transition-all duration-200 hover:shadow-md",
                !notification.isRead && "bg-primary/5 border-primary/20"
              )}
            >
              {/* Priority indicator */}
              <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg",
                getPriorityColor(notification.priority)
              )} />

              <div className="flex items-start gap-3 pl-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getTypeIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className={cn(
                      "font-medium text-sm line-clamp-1",
                      !notification.isRead && "font-semibold"
                    )}>
                      {notification.title}
                    </h4>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {notification.category && (
                        <Badge variant="outline" className="text-xs">
                          {notification.category}
                        </Badge>
                      )}
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", getTypeColor(notification.type))}
                      >
                        {notification.type}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {notification.message}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(notification.createdAt), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </div>
                      {notification.userId && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Sistema
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {notification.actionUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => window.open(notification.actionUrl, '_blank')}
                        >
                          Abrir
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => notification.isRead ? onMarkAsUnread(notification.id) : onMarkAsRead(notification.id)}
                      >
                        {notification.isRead ? (
                          <Archive className="w-3 h-3" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => startEdit(notification)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir esta notificação? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(notification.id)}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
