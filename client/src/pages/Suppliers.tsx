import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  Truck,
  Star,
  Phone,
  Mail,
  Globe,
  MapPin,
  Clock,
  DollarSign,
  Tag,
  Building,
  User,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Supplier, InsertSupplier, Category, Manufacturer, ProductGroup } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const supplierFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  companyName: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  cnpj: z.string().optional(),
  cpf: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().default("Brasil"),
  contactPerson: z.string().optional(),
  contactRole: z.string().optional(),
  paymentTerms: z.string().optional(),
  deliveryTime: z.string().optional(),
  minimumOrder: z.string().optional(),
  categories: z.array(z.string()).default([]),
  manufacturers: z.array(z.string()).default([]),
  productGroups: z.array(z.string()).default([]),
  notes: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  rating: z.number().min(0).max(5).default(0),
  image: z.string().url().optional().or(z.literal("")),
});

type SupplierFormData = z.infer<typeof supplierFormSchema>;

export default function Suppliers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: manufacturers = [] } = useQuery<Manufacturer[]>({
    queryKey: ["/api/manufacturers"],
  });

  const { data: productGroups = [] } = useQuery<ProductGroup[]>({
    queryKey: ["/api/product-groups"],
  });

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: "",
      companyName: "",
      email: "",
      phone: "",
      whatsapp: "",
      website: "",
      cnpj: "",
      cpf: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "Brasil",
      contactPerson: "",
      contactRole: "",
      paymentTerms: "",
      deliveryTime: "",
      minimumOrder: "",
      categories: [],
      manufacturers: [],
      productGroups: [],
      notes: "",
      status: "active",
      rating: 0,
      image: "",
    },
  });

  const createSupplierMutation = useMutation({
    mutationFn: (data: InsertSupplier) => apiRequest("POST", "/api/suppliers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setIsDialogOpen(false);
      setEditingSupplier(null);
      form.reset();
      toast({
        title: "Fornecedor criado",
        description: "Fornecedor foi criado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar fornecedor.",
        variant: "destructive",
      });
    },
  });

  const updateSupplierMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertSupplier> }) =>
      apiRequest("PUT", `/api/suppliers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setIsDialogOpen(false);
      setEditingSupplier(null);
      form.reset();
      toast({
        title: "Fornecedor atualizado",
        description: "Fornecedor foi atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar fornecedor.",
        variant: "destructive",
      });
    },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/suppliers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "Fornecedor excluído",
        description: "Fornecedor foi excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao excluir fornecedor.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SupplierFormData) => {
    if (editingSupplier) {
      updateSupplierMutation.mutate({ id: editingSupplier.id, data });
    } else {
      createSupplierMutation.mutate(data);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    form.reset({
      name: supplier.name,
      companyName: supplier.companyName || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      whatsapp: supplier.whatsapp || "",
      website: supplier.website || "",
      cnpj: supplier.cnpj || "",
      cpf: supplier.cpf || "",
      address: supplier.address || "",
      city: supplier.city || "",
      state: supplier.state || "",
      zipCode: supplier.zipCode || "",
      country: supplier.country || "Brasil",
      contactPerson: supplier.contactPerson || "",
      contactRole: supplier.contactRole || "",
      paymentTerms: supplier.paymentTerms || "",
      deliveryTime: supplier.deliveryTime || "",
      minimumOrder: supplier.minimumOrder || "",
      categories: supplier.categories || [],
      manufacturers: supplier.manufacturers || [],
      productGroups: supplier.productGroups || [],
      notes: supplier.notes || "",
      status: supplier.status as "active" | "inactive",
      rating: supplier.rating || 0,
      image: supplier.image || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteSupplierMutation.mutate(id);
  };

  const handleNewSupplier = () => {
    setEditingSupplier(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const getCategoryNames = (categoryIds: string[] | null) => {
    if (!categoryIds || categoryIds.length === 0) return [];
    return categoryIds.map(id => {
      const category = categories.find(c => c.id.toString() === id);
      return category?.name || id;
    });
  };

  const getManufacturerNames = (manufacturerIds: string[] | null) => {
    if (!manufacturerIds || manufacturerIds.length === 0) return [];
    return manufacturerIds.map(id => {
      const manufacturer = manufacturers.find(m => m.id.toString() === id);
      return manufacturer?.name || id;
    });
  };

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch = 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || supplier.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Fornecedores
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie seus fornecedores e suas vinculações com categorias, fabricantes e grupos de produtos.
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewSupplier} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Novo Fornecedor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-white">
                  {editingSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}
                </DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400">
                  {editingSupplier 
                    ? "Atualize as informações do fornecedor."
                    : "Adicione um novo fornecedor ao seu sistema."
                  }
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Informações Básicas */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Informações Básicas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-900 dark:text-white">Nome/Razão Social *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Nome do fornecedor" 
                                {...field} 
                                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-900 dark:text-white">Nome Fantasia</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Nome fantasia" 
                                {...field} 
                                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="cnpj"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-900 dark:text-white">CNPJ</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="00.000.000/0001-00" 
                                {...field} 
                                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                              />
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
                            <FormLabel className="text-gray-900 dark:text-white">Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                                  <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                                <SelectItem value="active">Ativo</SelectItem>
                                <SelectItem value="inactive">Inativo</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Contato */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Informações de Contato</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-900 dark:text-white">Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email"
                                placeholder="contato@fornecedor.com" 
                                {...field} 
                                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
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
                            <FormLabel className="text-gray-900 dark:text-white">Telefone</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="(11) 1234-5678" 
                                {...field} 
                                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="whatsapp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-900 dark:text-white">WhatsApp</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="(11) 99999-9999" 
                                {...field} 
                                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-900 dark:text-white">Website</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://www.fornecedor.com" 
                                {...field} 
                                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Vinculações */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Vinculações de Produtos</h3>
                    
                    <FormField
                      control={form.control}
                      name="categories"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Categorias</FormLabel>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded p-2 bg-white dark:bg-gray-700">
                            {categories.map((category) => (
                              <div key={category.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`category-${category.id}`}
                                  checked={field.value.includes(category.id.toString())}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...field.value, category.id.toString()]);
                                    } else {
                                      field.onChange(field.value.filter(id => id !== category.id.toString()));
                                    }
                                  }}
                                />
                                <label 
                                  htmlFor={`category-${category.id}`}
                                  className="text-sm text-gray-900 dark:text-white cursor-pointer"
                                >
                                  {category.name}
                                </label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="manufacturers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Fabricantes</FormLabel>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded p-2 bg-white dark:bg-gray-700">
                            {manufacturers.map((manufacturer) => (
                              <div key={manufacturer.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`manufacturer-${manufacturer.id}`}
                                  checked={field.value.includes(manufacturer.id.toString())}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...field.value, manufacturer.id.toString()]);
                                    } else {
                                      field.onChange(field.value.filter(id => id !== manufacturer.id.toString()));
                                    }
                                  }}
                                />
                                <label 
                                  htmlFor={`manufacturer-${manufacturer.id}`}
                                  className="text-sm text-gray-900 dark:text-white cursor-pointer"
                                >
                                  {manufacturer.name}
                                </label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Condições Comerciais */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Condições Comerciais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="paymentTerms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-900 dark:text-white">Prazo de Pagamento</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="30 dias" 
                                {...field} 
                                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="deliveryTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-900 dark:text-white">Prazo de Entrega</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="5-7 dias úteis" 
                                {...field} 
                                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="minimumOrder"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-900 dark:text-white">Pedido Mínimo</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="R$ 1.000,00" 
                                {...field} 
                                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 dark:text-white">Observações</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Informações adicionais sobre o fornecedor..."
                            className="resize-none bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
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
                      disabled={createSupplierMutation.isPending || updateSupplierMutation.isPending}
                    >
                      {editingSupplier ? "Atualizar" : "Criar"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar fornecedores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value: "all" | "active" | "inactive") => setStatusFilter(value)}>
          <SelectTrigger className="w-[180px] bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Suppliers Grid */}
      {isLoadingSuppliers ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="w-full h-48 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="text-center py-12">
          <Truck className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhum fornecedor encontrado</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm || statusFilter !== "all" 
              ? "Tente ajustar os filtros de busca."
              : "Comece criando seu primeiro fornecedor."
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier) => (
            <Card key={supplier.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Supplier Image */}
                  <div className="relative">
                    {supplier.image ? (
                      <img
                        src={supplier.image}
                        alt={supplier.name}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <Building className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(supplier)}
                        className="h-8 w-8 p-0 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-gray-900 dark:text-white">
                              Excluir Fornecedor
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                              Tem certeza que deseja excluir {supplier.name}? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(supplier.id)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {/* Supplier Info */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                        {supplier.name}
                      </h3>
                      <Badge 
                        variant={supplier.status === "active" ? "default" : "secondary"}
                        className={
                          supplier.status === "active" 
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }
                      >
                        {supplier.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>

                    {supplier.companyName && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {supplier.companyName}
                      </p>
                    )}

                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      {supplier.email && (
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-2" />
                          <span className="truncate">{supplier.email}</span>
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-2" />
                          <span>{supplier.phone}</span>
                        </div>
                      )}
                      {supplier.city && supplier.state && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>{supplier.city}, {supplier.state}</span>
                        </div>
                      )}
                    </div>

                    {/* Commercial Info */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {supplier.paymentTerms && (
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <DollarSign className="w-3 h-3 mr-1" />
                          <span className="truncate">{supplier.paymentTerms}</span>
                        </div>
                      )}
                      {supplier.deliveryTime && (
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Clock className="w-3 h-3 mr-1" />
                          <span className="truncate">{supplier.deliveryTime}</span>
                        </div>
                      )}
                    </div>

                    {/* Categories and Manufacturers */}
                    <div className="space-y-2">
                      {supplier.categories && supplier.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {getCategoryNames(supplier.categories).slice(0, 3).map((name, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {name}
                            </Badge>
                          ))}
                          {supplier.categories.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{supplier.categories.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {supplier.manufacturers && supplier.manufacturers.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {getManufacturerNames(supplier.manufacturers).slice(0, 2).map((name, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {name}
                            </Badge>
                          ))}
                          {supplier.manufacturers.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{supplier.manufacturers.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Rating */}
                    {supplier.rating && supplier.rating > 0 && (
                      <div className="flex items-center">
                        {[...Array(5)].map((_, index) => (
                          <Star
                            key={index}
                            className={`w-4 h-4 ${
                              index < (supplier.rating || 0)
                                ? "fill-yellow-400 text-yellow-400" 
                                : "text-gray-300 dark:text-gray-600"
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                          ({supplier.rating}/5)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}