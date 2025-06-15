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
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User, DashboardStats, CartItem, Notification, Email } from "@shared/schema";

export function Header() {
  const queryClient = useQueryClient();
  
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

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
      apiRequest(`/api/cart/${id}/quantity`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  const deleteCartItem = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/cart/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  const clearCart = useMutation({
    mutationFn: () => apiRequest("/api/cart", { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  // Notification mutations
  const markNotificationRead = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  const deleteNotification = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/notifications/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  const clearNotifications = useMutation({
    mutationFn: () => apiRequest("/api/notifications", { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  // Email mutations
  const markEmailRead = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/emails/${id}/read`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  const deleteEmail = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/emails/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  const clearEmails = useMutation({
    mutationFn: () => apiRequest("/api/emails", { method: "DELETE" }),
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
    <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 fixed w-full top-0 z-40">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="bg-blue-600 text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl">
              A
            </div>
          </div>
          <span className="ml-3 text-xl font-semibold text-gray-900 hidden sm:block">
            AppName
          </span>
        </div>

        {/* Center Navigation */}
        <nav className="hidden md:flex space-x-8">
          <Link href="/">
            <span className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">
              Dashboard
            </span>
          </Link>
          <Link href="/projects">
            <span className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">
              Projects
            </span>
          </Link>
          <Link href="/analytics">
            <span className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">
              Analytics
            </span>
          </Link>
          <Link href="/reports">
            <span className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">
              Reports
            </span>
          </Link>
        </nav>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Cart Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-900">Carrinho</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {cartItems.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Carrinho vazio
                    </div>
                  ) : (
                    <>
                      {cartItems.slice(0, 5).map((item) => (
                        <div key={item.id} className="p-4 border-b hover:bg-gray-50">
                          <div className="flex items-center space-x-3">
                            {item.productImage && (
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {item.productName}
                              </p>
                              <p className="text-sm text-gray-600">
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
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-900">Notificações</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Nenhuma notificação
                    </div>
                  ) : (
                    <>
                      {notifications.slice(0, 5).map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b hover:bg-gray-50 ${
                            !notification.isRead ? "bg-blue-50" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {formatTimeAgo(notification.createdAt)}
                              </p>
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
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-900">Emails</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {emails.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Nenhum email
                    </div>
                  ) : (
                    <>
                      {emails.slice(0, 5).map((email) => (
                        <div
                          key={email.id}
                          className={`p-4 border-b hover:bg-gray-50 ${
                            !email.isRead ? "bg-green-50" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {email.sender}
                              </p>
                              <p className="text-sm font-medium text-gray-800 mt-1">
                                {email.subject}
                              </p>
                              <p className="text-sm text-gray-600 mt-1 truncate">
                                {email.preview}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {formatTimeAgo(email.createdAt)}
                              </p>
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
                className="flex items-center space-x-3 p-2 hover:bg-gray-100"
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.avatar || undefined} alt={user?.name} />
                  <AvatarFallback>
                    {user?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.name}
                  </div>
                  <div className="text-xs text-gray-500">{user?.role}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <UserIcon className="w-4 h-4 mr-3" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-3" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard className="w-4 h-4 mr-3" />
                Cobrança
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="w-4 h-4 mr-3" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
