import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Zap, 
  Plus, 
  Edit, 
  Trash2, 
  Star,
  Clock,
  Tag,
  Building,
  DollarSign,
  Folder,
  Users,
  Settings,
  Package,
  Calendar,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';

// Interfaces
interface Service {
  id: number;
  name: string;
  description?: string;
  sku: string;
  price: string;
  categoryId?: number;
  duration?: string;
  durationType: string;
  requiresBooking: boolean;
  maxBookingsPerDay?: number;
  images?: string[];
  defaultImageIndex: number;
  status: string;
  featured: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  category?: {
    id: number;
    name: string;
  };
}

interface ServiceCategory {
  id: number;
  name: string;
  description?: string;
  parentId?: number;
  image?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Provider {
  id: number;
  name: string;
  serviceType: string;
  image?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Schemas
const serviceCategorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  parentId: z.number().optional(),
  image: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

const serviceSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  sku: z.string().min(1, "SKU é obrigatório"),
  price: z.string().min(1, "Preço é obrigatório"),
  categoryId: z.number().optional(),
  duration: z.string().optional(),
  durationType: z.enum(["minutes", "hours", "days", "weeks", "months"]).default("hours"),
  requiresBooking: z.boolean().default(false),
  maxBookingsPerDay: z.number().optional(),
  status: z.enum(["active", "inactive", "discontinued"]).default("active"),
  featured: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
});

type ServiceCategoryFormData = z.infer<typeof serviceCategorySchema>;
type ServiceFormData = z.infer<typeof serviceSchema>;

export default function Services() {
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [activeTab, setActiveTab] = useState<'services' | 'categories' | 'providers'>('services');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: services = [], isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/services");
      return response.json();
    }
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<ServiceCategory[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/categories");
      return response.json();
    }
  });

  const { data: providers = [], isLoading: providersLoading } = useQuery<Provider[]>({
    queryKey: ["/api/providers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/providers");
      return response.json();
    }
  });

  // Forms
  const serviceForm = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      price: "",
      categoryId: undefined,
      duration: "",
      durationType: "hours",
      requiresBooking: false,
      maxBookingsPerDay: undefined,
      status: "active",
      featured: false,
      tags: [],
    },
  });

  const categoryForm = useForm<ServiceCategoryFormData>({
    resolver: zodResolver(serviceCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      parentId: undefined,
      image: "",
      status: "active",
    },
  });

  // Mutations
  const createServiceMutation = useMutation({
    mutationFn: async (data: ServiceFormData) => {
      const response = await apiRequest("POST", "/api/services", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setIsServiceDialogOpen(false);
      serviceForm.reset();
      toast({
        title: "✅ Sucesso",
        description: "Serviço criado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Erro",
        description: error instanceof Error ? error.message : "Erro ao criar serviço",
        variant: "destructive",
      });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, ...data }: ServiceFormData & { id: number }) => {
      const response = await apiRequest("PUT", `/api/services/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setIsServiceDialogOpen(false);
      setEditingService(null);
      serviceForm.reset();
      toast({
        title: "✅ Sucesso",
        description: "Serviço atualizado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar serviço",
        variant: "destructive",
      });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/services/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({
        title: "✅ Sucesso",
        description: "Serviço excluído com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir serviço",
        variant: "destructive",
      });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: ServiceCategoryFormData) => {
      const response = await apiRequest("POST", "/api/categories", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsCategoryDialogOpen(false);
      categoryForm.reset();
      toast({
        title: "✅ Sucesso",
        description: "Categoria criada com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Erro",
        description: error instanceof Error ? error.message : "Erro ao criar categoria",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, ...data }: ServiceCategoryFormData & { id: number }) => {
      const response = await apiRequest("PUT", `/api/categories/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      categoryForm.reset();
      toast({
        title: "✅ Sucesso",
        description: "Categoria atualizada com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar categoria",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/categories/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "✅ Sucesso",
        description: "Categoria excluída com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir categoria",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleServiceSubmit = (data: ServiceFormData) => {
    if (editingService) {
      updateServiceMutation.mutate({ id: editingService.id, ...data });
    } else {
      createServiceMutation.mutate(data);
    }
  };

  const handleCategorySubmit = (data: ServiceCategoryFormData) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, ...data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleServiceEdit = (service: Service) => {
    setEditingService(service);
    serviceForm.reset({
      name: service.name,
      description: service.description || "",
      sku: service.sku,
      price: service.price,
      categoryId: service.categoryId,
      duration: service.duration || "",
      durationType: service.durationType as any,
      requiresBooking: service.requiresBooking,
      maxBookingsPerDay: service.maxBookingsPerDay,
      status: service.status as any,
      featured: service.featured,
      tags: service.tags || [],
    });
    setIsServiceDialogOpen(true);
  };

  const handleCategoryEdit = (category: ServiceCategory) => {
    setEditingCategory(category);
    categoryForm.reset({
      name: category.name,
      description: category.description || "",
      parentId: category.parentId,
      image: category.image || "",
      status: category.status as any,
    });
    setIsCategoryDialogOpen(true);
  };

  const handleServiceDelete = (id: number, name: string) => {
    if (confirm(`Tem certeza que deseja excluir o serviço "${name}"?`)) {
      deleteServiceMutation.mutate(id);
    }
  };

  const handleCategoryDelete = (id: number, name: string) => {
    if (confirm(`Tem certeza que deseja excluir a categoria "${name}"?`)) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const openNewServiceDialog = () => {
    setEditingService(null);
    serviceForm.reset();
    setIsServiceDialogOpen(true);
  };

  const openNewCategoryDialog = () => {
    setEditingCategory(null);
    categoryForm.reset();
    setIsCategoryDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", label: "Ativo" },
      inactive: { color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300", label: "Inativo" },
      discontinued: { color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300", label: "Descontinuado" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(price));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Gerenciamento de Serviços</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie seus serviços, categorias e prestadores
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'services'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <Package className="h-4 w-4 mr-2 inline" />
          Serviços ({services.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'categories'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <Folder className="h-4 w-4 mr-2 inline" />
          Categorias ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('providers')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'providers'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <Users className="h-4 w-4 mr-2 inline" />
          Prestadores ({providers.length})
        </button>
      </div>

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Serviços</h2>
            <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewServiceDialog} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Serviço
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingService ? "Editar Serviço" : "Novo Serviço"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...serviceForm}>
                  <form onSubmit={serviceForm.handleSubmit(handleServiceSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={serviceForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Nome do Serviço *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Hospedagem de Site" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={serviceForm.control}
                        name="sku"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SKU *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: HOST-001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={serviceForm.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preço (R$) *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 29.90" type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={serviceForm.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoria</FormLabel>
                            <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma categoria" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">Sem categoria</SelectItem>
                                {categories.map((category) => (
                                  <SelectItem key={category.id} value={category.id.toString()}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={serviceForm.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duração</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 1" type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={serviceForm.control}
                        name="durationType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Duração</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="minutes">Minutos</SelectItem>
                                <SelectItem value="hours">Horas</SelectItem>
                                <SelectItem value="days">Dias</SelectItem>
                                <SelectItem value="weeks">Semanas</SelectItem>
                                <SelectItem value="months">Meses</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={serviceForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="active">Ativo</SelectItem>
                                <SelectItem value="inactive">Inativo</SelectItem>
                                <SelectItem value="discontinued">Descontinuado</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={serviceForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descrição detalhada do serviço..."
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
                        control={serviceForm.control}
                        name="requiresBooking"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Requer Agendamento</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Marque se este serviço precisa ser agendado
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={serviceForm.control}
                        name="featured"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Serviço em Destaque</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Marque para destacar este serviço
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {serviceForm.watch("requiresBooking") && (
                      <FormField
                        control={serviceForm.control}
                        name="maxBookingsPerDay"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Máximo de Agendamentos por Dia</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 5" type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsServiceDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={createServiceMutation.isPending || updateServiceMutation.isPending}>
                        {(createServiceMutation.isPending || updateServiceMutation.isPending) && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        )}
                        {editingService ? "Atualizar" : "Criar"} Serviço
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {servicesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Carregando serviços...</p>
            </div>
          ) : services.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <Card key={service.id} className="hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                  {service.featured && (
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Destaque
                    </div>
                  )}
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold truncate text-gray-900 dark:text-gray-100">
                          {service.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs font-mono">
                            {service.sku}
                          </Badge>
                          {getStatusBadge(service.status)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {service.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                        {service.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {formatPrice(service.price)}
                        </span>
                      </div>
                      {service.duration && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="h-4 w-4" />
                          <span>{service.duration} {service.durationType}</span>
                        </div>
                      )}
                    </div>

                    {service.category && (
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {service.category.name}
                        </span>
                      </div>
                    )}

                    {service.requiresBooking && (
                      <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                        <Calendar className="h-4 w-4" />
                        <span>Requer agendamento</span>
                        {service.maxBookingsPerDay && (
                          <span className="text-xs text-gray-500">
                            (máx {service.maxBookingsPerDay}/dia)
                          </span>
                        )}
                      </div>
                    )}

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Criado em {new Date(service.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleServiceEdit(service)}
                          className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleServiceDelete(service.id, service.name)}
                          disabled={deleteServiceMutation.isPending}
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum serviço encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Adicione um novo serviço para começar.
              </p>
              <Button onClick={openNewServiceDialog} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo Serviço
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Categorias</h2>
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewCategoryDialog} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Categoria
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? "Editar Categoria" : "Nova Categoria"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...categoryForm}>
                  <form onSubmit={categoryForm.handleSubmit(handleCategorySubmit)} className="space-y-4">
                    <FormField
                      control={categoryForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Categoria *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Hospedagem" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={categoryForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descrição da categoria..."
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={categoryForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Ativa</SelectItem>
                              <SelectItem value="inactive">Inativa</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}>
                        {(createCategoryMutation.isPending || updateCategoryMutation.isPending) && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        )}
                        {editingCategory ? "Atualizar" : "Criar"} Categoria
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {categoriesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Carregando categorias...</p>
            </div>
          ) : categories.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Card key={category.id} className="hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <Folder className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{category.name}</CardTitle>
                          {getStatusBadge(category.status)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {category.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {category.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Criado em {new Date(category.createdAt).toLocaleDateString('pt-BR')}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCategoryEdit(category)}
                          className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCategoryDelete(category.id, category.name)}
                          disabled={deleteCategoryMutation.isPending}
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma categoria encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Adicione uma nova categoria para começar.
              </p>
              <Button onClick={openNewCategoryDialog} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Nova Categoria
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Providers Tab */}
      {activeTab === 'providers' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Prestadores de Serviços</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Os prestadores são gerenciados na seção de despesas
            </p>
          </div>

          {providersLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Carregando prestadores...</p>
            </div>
          ) : providers.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {providers.map((provider) => (
                <Card key={provider.id} className="hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 border rounded-lg overflow-hidden bg-white flex items-center justify-center shadow-sm">
                          {provider.image ? (
                            <img
                              src={provider.image}
                              alt={`Logo ${provider.name}`}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Building className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{provider.name}</CardTitle>
                          <Badge variant="outline" className="mt-1 bg-blue-50 text-blue-700 border-blue-200">
                            {provider.serviceType}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Criado em {new Date(provider.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                      <Badge className={provider.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {provider.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum prestador encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Os prestadores de serviços podem ser gerenciados na seção de despesas.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}