import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Plus, Search, Edit, Trash2, Package, Clock, Star } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Service } from "@shared/schema";

const serviceFormSchema = z.object({
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

type ServiceFormData = z.infer<typeof serviceFormSchema>;

const statusColors = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  inactive: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  discontinued: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const durationTypeLabels = {
  minutes: "Minutos",
  hours: "Horas",
  days: "Dias",
  weeks: "Semanas",
  months: "Meses",
};

export default function Services() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const queryClient = useQueryClient();

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["/api/services"],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const createMutation = useMutation({
    mutationFn: (data: ServiceFormData) => {
      const payload = {
        ...data,
        tags: data.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return apiRequest("POST", "/api/services", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ServiceFormData }) => {
      const payload = {
        ...data,
        tags: data.tags || [],
        updatedAt: new Date().toISOString(),
      };
      return apiRequest("PUT", `/api/services/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setIsDialogOpen(false);
      setEditingService(null);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
    },
  });

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      price: "",
      duration: "",
      durationType: "hours",
      requiresBooking: false,
      status: "active",
      featured: false,
      tags: [],
    },
  });

  const onSubmit = (data: ServiceFormData) => {
    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    form.reset({
      name: service.name,
      description: service.description || "",
      sku: service.sku,
      price: service.price,
      categoryId: service.categoryId || undefined,
      duration: service.duration || "",
      durationType: (service.durationType as any) || "hours",
      requiresBooking: service.requiresBooking || false,
      maxBookingsPerDay: service.maxBookingsPerDay || undefined,
      status: (service.status as any) || "active",
      featured: service.featured || false,
      tags: service.tags || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const filteredServices = services.filter((service: Service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || service.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(value));
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Serviços</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingService(null);
              form.reset();
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingService ? "Editar Serviço" : "Novo Serviço"}
              </DialogTitle>
              <DialogDescription>
                {editingService ? "Edite as informações do serviço" : "Adicione um novo serviço ao sistema"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do serviço" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input placeholder="SRV-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descrição do serviço..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duração</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="durationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Duração</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category: any) => (
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
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="requiresBooking"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Requer Agendamento
                          </FormLabel>
                        </div>
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="featured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Serviço Destacado
                          </FormLabel>
                        </div>
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch("requiresBooking") && (
                  <FormField
                    control={form.control}
                    name="maxBookingsPerDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Máximo de Agendamentos por Dia</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="10"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingService ? "Salvar" : "Criar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar serviços..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
            <SelectItem value="discontinued">Descontinuado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredServices.map((service: Service) => (
          <Card key={service.id} className="relative">
            {service.featured && (
              <div className="absolute top-2 right-2 z-10">
                <Star className="h-5 w-5 text-yellow-500 fill-current" />
              </div>
            )}
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{service.name}</CardTitle>
                <Badge className={statusColors[service.status as keyof typeof statusColors]}>
                  {service.status === 'active' ? 'Ativo' : 
                   service.status === 'inactive' ? 'Inativo' : 'Descontinuado'}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                SKU: {service.sku}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {service.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {service.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold text-primary">
                    {formatCurrency(service.price)}
                  </div>
                  {service.duration && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      {service.duration} {durationTypeLabels[service.durationType as keyof typeof durationTypeLabels] || service.durationType}
                    </div>
                  )}
                </div>

                {service.requiresBooking && (
                  <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Requer agendamento
                    {service.maxBookingsPerDay && (
                      <span className="ml-1">
                        (máx. {service.maxBookingsPerDay}/dia)
                      </span>
                    )}
                  </div>
                )}

                {service.tags && service.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {service.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {service.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{service.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(service)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Serviço</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o serviço "{service.name}"?
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(service.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            Nenhum serviço encontrado
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== "all"
              ? "Tente ajustar seus filtros de busca"
              : "Comece criando um novo serviço"}
          </p>
        </div>
      )}
    </div>
  );
}