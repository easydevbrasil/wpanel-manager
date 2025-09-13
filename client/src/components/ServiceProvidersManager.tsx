import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Building, 
  Phone, 
  Mail, 
  Globe,
  User
} from 'lucide-react';
import { apiRequest } from '../lib/queryClient';
import { useToast } from '../hooks/use-toast';

// UI Components
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';

// Provider schema
const providerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  companyName: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  website: z.string().optional(),
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
  serviceType: z.string().optional(),
  categories: z.array(z.string()).default([]),
  notes: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  rating: z.number().min(0).max(5).default(0),
  image: z.string().optional(),
});

type ProviderFormData = z.infer<typeof providerSchema>;

interface Provider {
  id: number;
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  cnpj?: string;
  cpf?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  contactPerson?: string;
  contactRole?: string;
  paymentTerms?: string;
  serviceType?: string;
  categories?: string[];
  notes?: string;
  status: string;
  rating: number;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

const serviceTypes = [
  "Hospedagem",
  "Domínio",
  "Software",
  "Marketing",
  "Consultoria",
  "Design",
  "Desenvolvimento",
  "Suporte Técnico",
  "Segurança",
  "Backup",
  "Outros"
];

export default function ServiceProvidersManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch providers
  const { data: providers = [], isLoading } = useQuery<Provider[]>({
    queryKey: ["/api/providers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/providers");
      return response.json();
    }
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: ProviderFormData) => {
      const response = await apiRequest("POST", "/api/providers", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/providers"] });
      setIsDialogOpen(false);
      toast({
        title: "✅ Sucesso",
        description: "Prestador criado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Erro",
        description: error instanceof Error ? error.message : "Erro ao criar prestador",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: ProviderFormData & { id: number }) => {
      const response = await apiRequest("PUT", `/api/providers/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/providers"] });
      setIsDialogOpen(false);
      setEditingProvider(null);
      toast({
        title: "✅ Sucesso",
        description: "Prestador atualizado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar prestador",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/providers/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/providers"] });
      toast({
        title: "✅ Sucesso",
        description: "Prestador excluído com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "❌ Erro",
        description: "Erro ao excluir prestador",
        variant: "destructive",
      });
    },
  });

  // Form setup
  const form = useForm<ProviderFormData>({
    resolver: zodResolver(providerSchema),
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
      serviceType: "",
      categories: [],
      notes: "",
      status: "active",
      rating: 0,
      image: "",
    },
  });

  const onSubmit = (data: ProviderFormData) => {
    if (editingProvider) {
      updateMutation.mutate({ id: editingProvider.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (provider: Provider) => {
    setEditingProvider(provider);
    form.reset({
      name: provider.name,
      companyName: provider.companyName || "",
      email: provider.email || "",
      phone: provider.phone || "",
      whatsapp: provider.whatsapp || "",
      website: provider.website || "",
      cnpj: provider.cnpj || "",
      cpf: provider.cpf || "",
      address: provider.address || "",
      city: provider.city || "",
      state: provider.state || "",
      zipCode: provider.zipCode || "",
      country: provider.country || "Brasil",
      contactPerson: provider.contactPerson || "",
      contactRole: provider.contactRole || "",
      paymentTerms: provider.paymentTerms || "",
      serviceType: provider.serviceType || "",
      categories: provider.categories || [],
      notes: provider.notes || "",
      status: (provider.status as "active" | "inactive") || "active",
      rating: provider.rating || 0,
      image: provider.image || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Tem certeza que deseja excluir o prestador "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const openNewProviderDialog = () => {
    setEditingProvider(null);
    form.reset({
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
      serviceType: "",
      categories: [],
      notes: "",
      status: "active",
      rating: 0,
      image: "",
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Prestadores de Serviços</h2>
          <p className="text-gray-600">Gerencie os prestadores de serviços do sistema</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewProviderDialog} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Prestador
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>
                {editingProvider ? "Editar Prestador" : "Novo Prestador"}
              </DialogTitle>
            </DialogHeader>
            
            <div className="overflow-y-auto flex-1 pr-2">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do prestador" {...field} />
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
                          <FormLabel>Nome da Empresa</FormLabel>
                          <FormControl>
                            <Input placeholder="Razão social" {...field} />
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
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@exemplo.com" {...field} />
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
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input placeholder="(11) 99999-9999" {...field} />
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
                          <FormLabel>WhatsApp</FormLabel>
                          <FormControl>
                            <Input placeholder="(11) 99999-9999" {...field} />
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
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input placeholder="https://www.exemplo.com" {...field} />
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
                          <FormLabel>CNPJ</FormLabel>
                          <FormControl>
                            <Input placeholder="00.000.000/0000-00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF</FormLabel>
                          <FormControl>
                            <Input placeholder="000.000.000-00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="serviceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Serviço</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {serviceTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
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
                                <SelectValue placeholder="Selecione o status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
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
                      name="contactPerson"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pessoa de Contato</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do contato" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactRole"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cargo do Contato</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Gerente, Suporte" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentTerms"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Condições de Pagamento</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 30 dias, À vista, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Informações adicionais sobre o prestador..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
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
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {createMutation.isPending || updateMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : null}
                      {editingProvider ? "Atualizar" : "Criar"} Prestador
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Providers List */}
      <Card>
        <CardHeader>
          <CardTitle>Prestadores ({providers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Carregando prestadores...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {providers.length > 0 ? (
                providers.map((provider) => (
                  <div key={provider.id} className="flex items-center justify-between p-4 border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <div className="flex flex-col">
                          <div className="font-medium">{provider.name}</div>
                          <div className="text-sm text-gray-500">
                            {provider.serviceType && (
                              <Badge variant="outline" className="mr-2">
                                {provider.serviceType}
                              </Badge>
                            )}
                            {provider.contactPerson && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {provider.contactPerson}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {provider.email && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Mail className="h-3 w-3" />
                          {provider.email}
                        </div>
                      )}
                      
                      {provider.phone && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Phone className="h-3 w-3" />
                          {provider.phone}
                        </div>
                      )}
                      
                      <Badge 
                        variant={provider.status === 'active' ? 'default' : 'secondary'}
                        className={provider.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {provider.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(provider)}
                        className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(provider.id, provider.name)}
                        disabled={deleteMutation.isPending}
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Nenhum prestador encontrado</p>
                  <p className="text-sm">Adicione um novo prestador para começar.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
