import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, MessageSquare, Clock, AlertCircle, CheckCircle, User, Calendar, Tag, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import type { SupportTicket, InsertSupportTicket, SupportTicketMessage, Client } from "@shared/schema";

const ticketFormSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  category: z.string().min(1, "Categoria é obrigatória"),
  clientId: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

type TicketFormData = z.infer<typeof ticketFormSchema>;

const messageFormSchema = z.object({
  message: z.string().min(1, "Mensagem é obrigatória"),
  messageType: z.enum(["message", "note", "status_change"]),
  isInternal: z.boolean().default(false),
});

type MessageFormData = z.infer<typeof messageFormSchema>;

export default function Support() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  // Queries
  const { data: tickets = [], isLoading: ticketsLoading } = useQuery<SupportTicket[]>({
    queryKey: ["/api/support/tickets"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/support/categories"],
  });

  const { data: messages = [] } = useQuery<SupportTicketMessage[]>({
    queryKey: ["/api/support/tickets", selectedTicket?.id, "messages"],
    enabled: !!selectedTicket?.id,
  });

  // Mutations
  const createTicketMutation = useMutation({
    mutationFn: (data: InsertSupportTicket) => apiRequest("POST", "/api/support/tickets", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
      setIsTicketDialogOpen(false);
      ticketForm.reset();
    },
  });

  const createMessageMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/support/tickets/${selectedTicket?.id}/messages`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets", selectedTicket?.id, "messages"] });
      setIsMessageDialogOpen(false);
      messageForm.reset();
    },
  });

  // Forms
  const ticketForm = useForm<TicketFormData>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      category: "",
      tags: [],
    },
  });

  const messageForm = useForm<MessageFormData>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      message: "",
      messageType: "message",
      isInternal: false,
    },
  });

  // Helper functions
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-500";
      case "in-progress": return "bg-purple-500";
      case "pending": return "bg-yellow-500";
      case "resolved": return "bg-green-500";
      case "closed": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open": return <MessageSquare className="h-4 w-4" />;
      case "in-progress": return <Clock className="h-4 w-4" />;
      case "pending": return <AlertCircle className="h-4 w-4" />;
      case "resolved": return <CheckCircle className="h-4 w-4" />;
      case "closed": return <CheckCircle className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getClientName = (clientId: number) => {
    const client = clients.find((c) => c.id === clientId);
    return client ? client.name : "Cliente não encontrado";
  };

  // Filter tickets
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const onSubmitTicket = (data: TicketFormData) => {
    const now = new Date().toISOString();
    const ticketNumber = `TCK-${Date.now().toString().slice(-6)}`;
    
    createTicketMutation.mutate({
      ...data,
      ticketNumber,
      userId: 1, // Mock user ID
      tags: data.tags || [],
    });
  };

  const onSubmitMessage = (data: MessageFormData) => {
    createMessageMutation.mutate({
      ...data,
      userId: 1, // Mock user ID
    });
  };

  const openChatwootIntegration = () => {
    // This would open Chatwoot conversation in a new tab/window
    window.open('https://app.chatwoot.com', '_blank');
  };

  return (
    <div className="w-full p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tickets de Suporte</h1>
          <p className="text-muted-foreground">
            Gerencie tickets de suporte e integração com Chatwoot
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openChatwootIntegration} variant="outline">
            <ExternalLink className="mr-2 h-4 w-4" />
            Abrir Chatwoot
          </Button>
          <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Criar Novo Ticket</DialogTitle>
              </DialogHeader>
              <Form {...ticketForm}>
                <form onSubmit={ticketForm.handleSubmit(onSubmitTicket)} className="space-y-4">
                  <FormField
                    control={ticketForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input placeholder="Descreva o problema brevemente" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={ticketForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descreva o problema em detalhes"
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={ticketForm.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prioridade</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a prioridade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Baixa</SelectItem>
                              <SelectItem value="medium">Média</SelectItem>
                              <SelectItem value="high">Alta</SelectItem>
                              <SelectItem value="urgent">Urgente</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={ticketForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="technical">Técnico</SelectItem>
                              <SelectItem value="billing">Financeiro</SelectItem>
                              <SelectItem value="general">Geral</SelectItem>
                              <SelectItem value="feature">Nova Funcionalidade</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={ticketForm.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente (Opcional)</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um cliente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id.toString()}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsTicketDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createTicketMutation.isPending}>
                      {createTicketMutation.isPending ? "Criando..." : "Criar Ticket"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="open">Aberto</SelectItem>
            <SelectItem value="in-progress">Em Andamento</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="resolved">Resolvido</SelectItem>
            <SelectItem value="closed">Fechado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Prioridades</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tickets Grid */}
      <div className="grid gap-4">
        {ticketsLoading ? (
          <div className="text-center py-8">
            <p>Carregando tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum ticket encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                  ? "Tente ajustar os filtros ou criar um novo ticket."
                  : "Comece criando seu primeiro ticket de suporte."}
              </p>
              <Button onClick={() => setIsTicketDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Ticket
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredTickets.map((ticket) => (
            <Card 
              key={ticket.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedTicket(ticket)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs font-mono">
                        {ticket.ticketNumber}
                      </Badge>
                      <Badge className={`${getPriorityColor(ticket.priority)} text-white`}>
                        {ticket.priority === "low" && "Baixa"}
                        {ticket.priority === "medium" && "Média"}
                        {ticket.priority === "high" && "Alta"}
                        {ticket.priority === "urgent" && "Urgente"}
                      </Badge>
                      <Badge variant="secondary" className={`${getStatusColor(ticket.status)} text-white`}>
                        {getStatusIcon(ticket.status)}
                        <span className="ml-1">
                          {ticket.status === "open" && "Aberto"}
                          {ticket.status === "in-progress" && "Em Andamento"}
                          {ticket.status === "pending" && "Pendente"}
                          {ticket.status === "resolved" && "Resolvido"}
                          {ticket.status === "closed" && "Fechado"}
                        </span>
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{ticket.title}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {ticket.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {ticket.clientId ? getClientName(ticket.clientId) : "Sem cliente"}
                    </div>
                    <div className="flex items-center gap-1">
                      <Tag className="h-4 w-4" />
                      {ticket.category}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(ticket.createdAt)}
                  </div>
                </div>

                {ticket.tags && ticket.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {ticket.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Ticket Detail Dialog */}
      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {selectedTicket.ticketNumber}
                </Badge>
                {selectedTicket.title}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Ticket Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Detalhes do Ticket</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className={`${getStatusColor(selectedTicket.status)} text-white`}>
                        {selectedTicket.status === "open" && "Aberto"}
                        {selectedTicket.status === "in-progress" && "Em Andamento"}
                        {selectedTicket.status === "pending" && "Pendente"}
                        {selectedTicket.status === "resolved" && "Resolvido"}
                        {selectedTicket.status === "closed" && "Fechado"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prioridade:</span>
                      <Badge className={`${getPriorityColor(selectedTicket.priority)} text-white`}>
                        {selectedTicket.priority === "low" && "Baixa"}
                        {selectedTicket.priority === "medium" && "Média"}
                        {selectedTicket.priority === "high" && "Alta"}
                        {selectedTicket.priority === "urgent" && "Urgente"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Categoria:</span>
                      <span>{selectedTicket.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cliente:</span>
                      <span>{selectedTicket.clientId ? getClientName(selectedTicket.clientId) : "Não atribuído"}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Datas</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Criado:</span>
                      <span>{formatDate(selectedTicket.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Atualizado:</span>
                      <span>{formatDate(selectedTicket.updatedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Última atividade:</span>
                      <span>{formatDate(selectedTicket.lastActivityAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div>
                <h4 className="font-semibold mb-2">Descrição</h4>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Chatwoot Integration */}
              {selectedTicket.chatwootConversationId && (
                <div>
                  <h4 className="font-semibold mb-2">Integração Chatwoot</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      Conversa ID: {selectedTicket.chatwootConversationId}
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={openChatwootIntegration}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Abrir no Chatwoot
                    </Button>
                  </div>
                </div>
              )}

              <Separator />

              {/* Messages */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Mensagens</h4>
                  <Button 
                    size="sm"
                    onClick={() => setIsMessageDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Mensagem
                  </Button>
                </div>
                
                <div className="space-y-4 max-h-60 overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      Nenhuma mensagem ainda. Seja o primeiro a responder!
                    </p>
                  ) : (
                    messages.map((message) => (
                      <div key={message.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">Usuário</span>
                            {message.isInternal && (
                              <Badge variant="secondary" className="text-xs">
                                Interno
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm">{message.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* New Message Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Mensagem</DialogTitle>
          </DialogHeader>
          <Form {...messageForm}>
            <form onSubmit={messageForm.handleSubmit(onSubmitMessage)} className="space-y-4">
              <FormField
                control={messageForm.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensagem</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Digite sua mensagem..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMessageDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMessageMutation.isPending}>
                  {createMessageMutation.isPending ? "Enviando..." : "Enviar Mensagem"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}