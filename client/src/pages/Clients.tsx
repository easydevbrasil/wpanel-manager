import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  Building,
  User,
  MoreVertical,
  Upload,
  X,
  Crown,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Client, InsertClient, Plan } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Types for discount plans
type ClientDiscountPlan = {
  id: number;
  name: string;
  description?: string;
  gradient: string;
  isActive: boolean;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
};

const clientFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  image: z.string().optional(),
  status: z.enum(["active", "inactive", "pending"]).default("active"),
  notes: z.string().optional(),
  planId: z.number().optional(),
});

type ClientFormData = z.infer<typeof clientFormSchema>;

// Componente para upload com drag & drop
const DragDropUpload = ({ 
  onFileSelect, 
  className = "" 
}: { 
  onFileSelect: (files: FileList) => void;
  className?: string;
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        isDragging 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
      } ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center space-y-2">
        <Upload className="w-8 h-8 text-gray-400" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Arraste e solte uma imagem aqui ou
        </p>
        <label className="cursor-pointer">
          <span className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            clique para selecionar
          </span>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileInput}
          />
        </label>
      </div>
    </div>
  );
};

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "pending">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState("clients");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ["/api/plans"],
  });

  // Get default plan (Carbon)
  const defaultPlan = plans.find(plan => plan.isDefault) || plans.find(plan => plan.name.toLowerCase() === 'carbon');

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      position: "",
      image: "",
      status: "active",
      notes: "",
      planId: defaultPlan?.id,
    },
  });

  // Image upload function
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload/client-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      return result.url;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  };

  // Handle image upload
  const handleImageUpload = async (files: FileList) => {
    try {
      const imageUrl = await uploadImage(files[0]);
      form.setValue('image', imageUrl);
      toast({
        title: "Imagem carregada",
        description: "A imagem foi carregada com sucesso!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: "Falha ao carregar a imagem. Tente novamente.",
      });
    }
  };

  const createClientMutation = useMutation({
    mutationFn: (data: InsertClient) => apiRequest("POST", "/api/clients", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsDialogOpen(false);
      setEditingClient(null);
      form.reset();
      toast({
        title: "Cliente criado",
        description: "Cliente foi criado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar cliente.",
        variant: "destructive",
      });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertClient> }) =>
      apiRequest("PUT", `/api/clients/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsDialogOpen(false);
      setEditingClient(null);
      form.reset();
      toast({
        title: "Cliente atualizado",
        description: "Cliente foi atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar cliente.",
        variant: "destructive",
      });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/clients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Cliente excluído",
        description: "Cliente foi excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao excluir cliente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ClientFormData) => {
    if (editingClient) {
      updateClientMutation.mutate({ id: editingClient.id, data });
    } else {
      createClientMutation.mutate(data);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    form.reset({
      name: client.name,
      email: client.email,
      phone: client.phone || "",
      company: client.company || "",
      position: client.position || "",
      image: client.image || "",
      status: client.status as "active" | "inactive",
      notes: client.notes || "",
      planId: client.planId || defaultPlan?.id,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteClientMutation.mutate(id);
  };

  const handleNewClient = () => {
    setEditingClient(null);
    form.reset({
      planId: defaultPlan?.id,
    });
    setIsDialogOpen(true);
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Clientes
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie seus clientes e suas informações de contato.
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewClient} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {editingClient ? "Editar Cliente" : "Novo Cliente"}
                </DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400">
                  {editingClient 
                    ? "Atualize as informações do cliente."
                    : "Adicione um novo cliente ao seu sistema."
                  }
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Nome</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Nome completo" 
                            {...field} 
                            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-foreground"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="email@exemplo.com" 
                            {...field} 
                            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-foreground"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Telefone</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="+55 (11) 99999-9999" 
                            {...field} 
                            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-foreground"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Empresa</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Nome da empresa" 
                            {...field} 
                            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-foreground"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Cargo</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Cargo na empresa" 
                            {...field} 
                            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-foreground"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Imagem do Cliente</FormLabel>
                        <FormControl>
                          <div className="space-y-3">
                            {field.value && (
                              <div className="relative inline-block">
                                <img 
                                  src={field.value} 
                                  alt="Preview" 
                                  className="w-24 h-24 rounded-lg object-cover border border-gray-300 dark:border-gray-600"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                                  onClick={() => field.onChange("")}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                            <DragDropUpload 
                              onFileSelect={handleImageUpload}
                              className="w-full"
                            />
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Ou insira uma URL da imagem:
                            </div>
                            <Input 
                              placeholder="https://exemplo.com/imagem.jpg" 
                              value={field.value || ""} 
                              onChange={(e) => field.onChange(e.target.value)}
                              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-foreground"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-foreground">
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="planId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Plano de Assinatura</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-foreground">
                              <SelectValue placeholder="Selecione um plano" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover border-border">
                            {plans.map((plan) => (
                              <SelectItem key={plan.id} value={plan.id.toString()}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: plan.color }}
                                  />
                                  <span>{plan.name}</span>
                                  <span className="text-sm text-gray-500">- R$ {plan.price}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Observações</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Observações sobre o cliente..."
                            className="resize-none bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-foreground"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createClientMutation.isPending || updateClientMutation.isPending}
                    >
                      {editingClient ? "Atualizar" : "Criar"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="discount-plans">Planos de Desconto</TabsTrigger>
        </TabsList>
        
        <TabsContent value="clients" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-popover border-border text-foreground"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value: "all" | "active" | "inactive" | "pending") => setStatusFilter(value)}>
          <SelectTrigger className="w-[180px] bg-popover border-border text-foreground">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clients Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 className="mt-2 text-sm font-medium text-foreground">Nenhum cliente encontrado</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm || statusFilter !== "all" 
              ? "Tente ajustar os filtros de busca."
              : "Comece criando seu primeiro cliente."
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card key={client.id} className="client-card bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow overflow-hidden">
              <CardContent className="client-card-content p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Avatar className="w-12 h-12 flex-shrink-0">
                      <AvatarImage src={client.image || undefined} alt={client.name} />
                      <AvatarFallback className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                        {client.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground truncate">
                        {client.name}
                      </h3>
                      {client.position && client.company && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {client.position} na {client.company}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(client)}
                      className="h-8 w-8 p-0 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-foreground">
                            Excluir Cliente
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                            Tem certeza que deseja excluir {client.name}? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(client.id)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="mb-3">
                  <Badge 
                    variant={client.status === "active" ? "default" : "secondary"}
                    className={
                      client.status === "active" 
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                        : client.status === "pending"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                    }
                  >
                    {client.status === "active" ? "Ativo" : client.status === "pending" ? "Pendente" : "Inativo"}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 min-w-0">
                    <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 min-w-0">
                      <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{client.phone}</span>
                    </div>
                  )}
                  {client.company && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 min-w-0">
                      <Building className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{client.company}</span>
                    </div>
                  )}
                  {(() => {
                    const clientPlan = plans.find(plan => plan.id === client.planId) || defaultPlan;
                    return clientPlan ? (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 min-w-0">
                        <Crown className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">
                          Plano {clientPlan.name} - R$ {clientPlan.price}
                        </span>
                        <div
                          className="w-3 h-3 rounded-full ml-2 flex-shrink-0"
                          style={{ backgroundColor: clientPlan.color }}
                          title={clientPlan.name}
                        />
                      </div>
                    ) : null;
                  })()}
                </div>
                
                {client.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 break-words line-clamp-3">
                      {client.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
        </TabsContent>
        
        <TabsContent value="discount-plans" className="space-y-6">
          <DiscountPlansManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Component for managing discount plans
function DiscountPlansManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Predefined plans with gradients
  const predefinedPlans = [
    { name: "Carbon", gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", description: "Plano básico com desconto mínimo" },
    { name: "Bronze", gradient: "linear-gradient(135deg, #cd7f32 0%, #d2691e 100%)", description: "Plano bronze com descontos intermediários" },
    { name: "Gold", gradient: "linear-gradient(135deg, #ffd700 0%, #ffb347 100%)", description: "Plano gold com bons descontos" },
    { name: "Platinum", gradient: "linear-gradient(135deg, #e5e4e2 0%, #b0b0b0 100%)", description: "Plano platinum com ótimos descontos" },
    { name: "Diamond", gradient: "linear-gradient(135deg, #b9f2ff 0%, #00d4ff 100%)", description: "Plano diamond com descontos máximos" }
  ];

  const { data: discountPlans = [], isLoading } = useQuery<ClientDiscountPlan[]>({
    queryKey: ["/api/client-discount-plans"],
  });

  const createPlanMutation = useMutation({
    mutationFn: async (plan: any) => {
      const response = await fetch("/api/client-discount-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plan),
      });
      if (!response.ok) throw new Error("Failed to create discount plan");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-discount-plans"] });
      setIsDialogOpen(false);
      toast({
        title: "Plano criado",
        description: "Plano de desconto foi criado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar plano de desconto.",
        variant: "destructive",
      });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, ...plan }: any) => {
      const response = await fetch(`/api/client-discount-plans/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plan),
      });
      if (!response.ok) throw new Error("Failed to update discount plan");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-discount-plans"] });
      setIsDialogOpen(false);
      setEditingPlan(null);
      toast({
        title: "Plano atualizado",
        description: "Plano de desconto foi atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar plano de desconto.",
        variant: "destructive",
      });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/client-discount-plans/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete discount plan");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-discount-plans"] });
      toast({
        title: "Plano excluído",
        description: "Plano de desconto foi excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao excluir plano de desconto.",
        variant: "destructive",
      });
    },
  });

  const handleCreatePredefinedPlans = async () => {
    for (const [index, plan] of predefinedPlans.entries()) {
      const existingPlan = discountPlans.find((p: ClientDiscountPlan) => p.name === plan.name);
      if (!existingPlan) {
        await createPlanMutation.mutateAsync({
          name: plan.name,
          description: plan.description,
          gradient: plan.gradient,
          order: index + 1,
          isActive: true,
        });
      }
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando planos de desconto...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Planos de Desconto</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Configure os planos de desconto para seus clientes (Carbon, Bronze, Gold, Platinum, Diamond)
          </p>
        </div>
        
        <div className="flex gap-2">
          {discountPlans.length === 0 && (
            <Button 
              onClick={handleCreatePredefinedPlans}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Crown className="w-4 h-4" />
              Criar Planos Padrão
            </Button>
          )}
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Novo Plano
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-[600px] bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {editingPlan ? "Editar Plano de Desconto" : "Novo Plano de Desconto"}
                </DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400">
                  {editingPlan 
                    ? "Atualize as informações do plano de desconto."
                    : "Crie um novo plano de desconto para seus clientes."
                  }
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label>Nome do Plano</Label>
                  <Input placeholder="Ex: Diamond, Platinum..." />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea placeholder="Descrição do plano de desconto..." />
                </div>
                <div>
                  <Label>Gradiente (CSS)</Label>
                  <Input placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button>
                    {editingPlan ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Buscar planos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Plans Grid */}
      {discountPlans.length === 0 ? (
        <div className="text-center py-12">
          <Crown className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum plano de desconto encontrado</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Comece criando os planos padrão ou crie um plano personalizado.
          </p>
          <Button onClick={handleCreatePredefinedPlans} className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Criar Planos Padrão
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {discountPlans.map((plan: ClientDiscountPlan) => (
            <Card key={plan.id} className="relative overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              {/* Plan Header with Gradient */}
              <div 
                className="h-20 relative"
                style={{ background: plan.gradient }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                <div className="relative p-4 text-white">
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  {plan.isActive ? (
                    <Badge variant="secondary" className="bg-white bg-opacity-20 text-white border-white border-opacity-30 text-xs">
                      Ativo
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-red-500 bg-opacity-80 text-white text-xs">
                      Inativo
                    </Badge>
                  )}
                </div>
              </div>

              <CardContent className="p-4">
                {plan.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {plan.description}
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingPlan(plan);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white dark:bg-gray-800">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o plano "{plan.name}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deletePlanMutation.mutate(plan.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}