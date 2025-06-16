import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ShoppingCart,
  Bell,
  Mail,
  ChevronDown,
  User as UserIcon,
  Settings,
  CreditCard,
  LogOut,
  Trash2,
  Check,
  Plus,
  Minus,
  Eye,
  MoreHorizontal,
  X,
  CheckCircle2,
  Sun,
  Moon,
  Monitor,
  Menu,
  MessageCircle,
  Send,
} from "lucide-react";
import { SiWhatsapp, SiTelegram } from "react-icons/si";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import type { User, DashboardStats, CartItem, Notification, Email } from "@shared/schema";

// Helper function to get service icon
function getServiceIcon(serviceType: string) {
  switch (serviceType) {
    case "whatsapp":
      return <SiWhatsapp className="w-3 h-3 text-green-500" />;
    case "telegram":
      return <SiTelegram className="w-3 h-3 text-blue-500" />;
    case "email":
      return <Mail className="w-3 h-3 text-gray-500" />;
    case "push":
      return <Bell className="w-3 h-3 text-orange-500" />;
    case "system":
      return <Monitor className="w-3 h-3 text-gray-500" />;
    case "app":
      return <MessageCircle className="w-3 h-3 text-blue-500" />;
    default:
      return <Send className="w-3 h-3 text-gray-500" />;
  }
}

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const queryClient = useQueryClient();
  const { theme, setTheme, actualTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: cartItems = [] } = useQuery<CartItem[]>({
    queryKey: ["/api/cart"],
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    staleTime: 30000, // Refresh every 30 seconds
  });

  const { data: emails = [] } = useQuery<Email[]>({
    queryKey: ["/api/emails"],
    staleTime: 30000, // Refresh every 30 seconds
  });

  // Cart mutations
  const updateCartQuantity = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) =>
      apiRequest("PATCH", `/api/cart/${id}/quantity`, { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  const deleteCartItem = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/cart/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  const clearCart = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/cart"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  // Notification mutations
  const markNotificationRead = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  const deleteNotification = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  const clearNotifications = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/notifications"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  // Email mutations
  const markEmailRead = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/emails/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  const deleteEmail = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/emails/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  const clearEmails = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/emails"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toFixed(2);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-4 fixed w-full top-0 z-40">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="bg-blue-600 text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl">
              A
            </div>
          </div>
          <span className="ml-3 text-xl font-semibold text-gray-900 dark:text-white hidden sm:block">
            AppName
          </span>
        </div>



        {/* Center Navigation */}
        <nav className="hidden md:flex space-x-8">
          <Link href="/">
            <span className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">
              Dashboard
            </span>
          </Link>
          <Link href="/projects">
            <span className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">
              Projects
            </span>
          </Link>
          <Link href="/analytics">
            <span className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">
              Analytics
            </span>
          </Link>
          <Link href="/reports">
            <span className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">
              Reports
            </span>
          </Link>
        </nav>

        {/* Right Section */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {actualTheme === "dark" ? (
                  <Moon className="w-6 h-6" />
                ) : (
                  <Sun className="w-6 h-6" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="w-4 h-4 mr-2" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="w-4 h-4 mr-2" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="w-4 h-4 mr-2" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Action Buttons */}
          <div className="hidden sm:flex items-center space-x-2 md:space-x-3">
            {/* Cart Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ShoppingCart className="w-6 h-6" />
                  {stats?.cartCount && stats.cartCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
                    >
                      {stats.cartCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Carrinho</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {cartItems.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Carrinho vazio
                    </div>
                  ) : (
                    <>
                      {cartItems.slice(0, 4).map((item) => (
                        <div key={item.id} className="p-4 border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 flex justify-center items-center">
                              {item.productImage && (
                                <img
                                  src={item.productImage}
                                  alt={item.productName}
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {item.productName}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                R$ {formatPrice(item.price)}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0"
                                onClick={() => updateCartQuantity.mutate({ 
                                  id: item.id, 
                                  quantity: Math.max(1, item.quantity - 1) 
                                })}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="text-sm w-8 text-center">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0"
                                onClick={() => updateCartQuantity.mutate({ 
                                  id: item.id, 
                                  quantity: item.quantity + 1 
                                })}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                onClick={() => deleteCartItem.mutate(item.id)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {cartItems.length > 5 && (
                        <DropdownMenuItem>
                          <MoreHorizontal className="w-4 h-4 mr-2" />
                          Ver mais ({cartItems.length - 5} items)
                        </DropdownMenuItem>
                      )}
                      <div className="p-4 border-t bg-gray-50">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-red-600 hover:text-red-700"
                          onClick={() => clearCart.mutate()}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Limpar Carrinho
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notifications Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Bell className="w-6 h-6" />
                  {stats?.notificationCount && stats.notificationCount > 0 && (
                    <Badge
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 bg-blue-500 hover:bg-blue-600"
                    >
                      {stats.notificationCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Notificações</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Nenhuma notificação
                    </div>
                  ) : (
                    <>
                      {notifications.slice(0, 4).map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b hover:bg-gray-50 dark:hover:bg-gray-700 ${
                            !notification.isRead ? "bg-blue-50 dark:bg-blue-900/20" : ""
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            {/* User Avatar */}
                            <div className="flex-shrink-0 flex justify-center items-center">
                              <Avatar className="w-8 h-8">
                                {notification.senderAvatar ? (
                                  <AvatarImage src={notification.senderAvatar} alt={notification.senderName || "User"} />
                                ) : (
                                  <AvatarFallback className="bg-gray-200 dark:bg-gray-600">
                                    {notification.senderName ? notification.senderName.charAt(0).toUpperCase() : "S"}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {notification.title}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center justify-between mt-2">
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                      {formatTimeAgo(notification.createdAt)}
                                    </p>
                                    {/* Service indicator */}
                                    <div className="flex items-center">
                                      {getServiceIcon(notification.serviceType)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 ml-2">
                                {!notification.isRead && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                                    onClick={() => markNotificationRead.mutate(notification.id)}
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                  onClick={() => deleteNotification.mutate(notification.id)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {notifications.length > 5 && (
                        <DropdownMenuItem>
                          <MoreHorizontal className="w-4 h-4 mr-2" />
                          Ver mais ({notifications.length - 5} notificações)
                        </DropdownMenuItem>
                      )}
                      <div className="p-4 border-t bg-gray-50">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-red-600 hover:text-red-700"
                          onClick={() => clearNotifications.mutate()}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Limpar Todas
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Email Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Mail className="w-6 h-6" />
                  {stats?.emailCount && stats.emailCount > 0 && (
                    <Badge
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 bg-green-500 hover:bg-green-600"
                    >
                      {stats.emailCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Emails</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {emails.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      Nenhum email
                    </div>
                  ) : (
                    <>
                      {emails.slice(0, 4).map((email) => (
                        <div
                          key={email.id}
                          className={`p-4 border-b hover:bg-gray-50 dark:hover:bg-gray-700 ${
                            !email.isRead ? "bg-green-50 dark:bg-green-900/20" : ""
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            {/* User Avatar */}
                            <div className="flex-shrink-0 flex justify-center items-center">
                              <Avatar className="w-8 h-8">
                                {email.senderAvatar ? (
                                  <AvatarImage src={email.senderAvatar} alt={email.sender} />
                                ) : (
                                  <AvatarFallback className="bg-gray-200 dark:bg-gray-600">
                                    {email.sender.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {email.sender}
                                  </p>
                                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-1 truncate">
                                    {email.subject}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                                    {email.preview}
                                  </p>
                                  <div className="flex items-center justify-between mt-2">
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                      {formatTimeAgo(email.createdAt)}
                                    </p>
                                    {/* Service indicator */}
                                    <div className="flex items-center">
                                      {getServiceIcon(email.serviceType)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 ml-2">
                              {!email.isRead && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                                  onClick={() => markEmailRead.mutate(email.id)}
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                onClick={() => deleteEmail.mutate(email.id)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {emails.length > 5 && (
                        <DropdownMenuItem>
                          <MoreHorizontal className="w-4 h-4 mr-2" />
                          Ver mais ({emails.length - 5} emails)
                        </DropdownMenuItem>
                      )}
                      <div className="p-4 border-t bg-gray-50">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-red-600 hover:text-red-700"
                          onClick={() => clearEmails.mutate()}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Limpar Todos
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.avatar || undefined} alt={user?.name} />
                  <AvatarFallback className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                    {user?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <DropdownMenuItem className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
                <Link href="/user-profile" className="flex items-center w-full">
                  <UserIcon className="w-4 h-4 mr-3" />
                  Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
                <Settings className="w-4 h-4 mr-3" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
                <CreditCard className="w-4 h-4 mr-3" />
                Cobrança
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-600" />
              <DropdownMenuItem 
                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                onClick={logout}
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Button - Moved to end */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (onToggleSidebar) {
                  onToggleSidebar();
                } else {
                  setMobileMenuOpen(!mobileMenuOpen);
                }
              }}
              data-sidebar-toggle
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3 space-y-1">
            <Link href="/">
              <span 
                className="block px-3 py-2 text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md cursor-pointer"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </span>
            </Link>
            <Link href="/projects">
              <span 
                className="block px-3 py-2 text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md cursor-pointer"
                onClick={() => setMobileMenuOpen(false)}
              >
                Projects
              </span>
            </Link>
            <Link href="/analytics">
              <span 
                className="block px-3 py-2 text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md cursor-pointer"
                onClick={() => setMobileMenuOpen(false)}
              >
                Analytics
              </span>
            </Link>
            <Link href="/reports">
              <span 
                className="block px-3 py-2 text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md cursor-pointer"
                onClick={() => setMobileMenuOpen(false)}
              >
                Reports
              </span>
            </Link>
          </div>
          
          {/* Mobile Action Buttons */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-center space-x-6">
              {/* Mobile Cart */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative p-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <ShoppingCart className="w-6 h-6" />
                    {stats?.cartCount && stats.cartCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
                      >
                        {stats.cartCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-80 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Carrinho</h3>
                  </div>
                  {/* Cart content - simplified for mobile */}
                  <div className="max-h-60 overflow-y-auto">
                    {cartItems.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        Carrinho vazio
                      </div>
                    ) : (
                      <>
                        {cartItems.slice(0, 3).map((item) => (
                          <div key={item.id} className="p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <div className="flex items-center space-x-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {item.productName}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  R$ {formatPrice(item.price)} x {item.quantity}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                onClick={() => deleteCartItem.mutate(item.id)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {cartItems.length > 3 && (
                          <div className="p-2 text-center text-sm text-gray-600 dark:text-gray-400">
                            +{cartItems.length - 3} mais items
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative p-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Bell className="w-6 h-6" />
                    {stats?.notificationCount && stats.notificationCount > 0 && (
                      <Badge
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 bg-blue-500 hover:bg-blue-600"
                      >
                        {stats.notificationCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-80 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Notificações</h3>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        Nenhuma notificação
                      </div>
                    ) : (
                      notifications.slice(0, 3).map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                            !notification.isRead ? "bg-blue-50 dark:bg-blue-900/20" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                {notification.message}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 ml-2"
                              onClick={() => deleteNotification.mutate(notification.id)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Emails */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative p-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Mail className="w-6 h-6" />
                    {stats?.emailCount && stats.emailCount > 0 && (
                      <Badge
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 bg-green-500 hover:bg-green-600"
                      >
                        {stats.emailCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-80 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Emails</h3>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {emails.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        Nenhum email
                      </div>
                    ) : (
                      emails.slice(0, 3).map((email) => (
                        <div
                          key={email.id}
                          className={`p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                            !email.isRead ? "bg-green-50 dark:bg-green-900/20" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {email.sender}
                              </p>
                              <p className="text-xs font-medium text-gray-800 dark:text-gray-200 mt-1">
                                {email.subject}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 ml-2"
                              onClick={() => deleteEmail.mutate(email.id)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
