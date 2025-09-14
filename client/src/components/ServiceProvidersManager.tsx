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
  Upload,
  X
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
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragging
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

// Provider schema
const providerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  serviceType: z.string().min(1, "Categoria é obrigatória"),
  image: z.string().min(1, "Logo é obrigatório"),
});

type ProviderFormData = z.infer<typeof providerSchema>;

interface Provider {
  id: number;
  name: string;
  serviceType: string;
  image: string;
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

  // Upload image function
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload/provider-image', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionToken')}`,
        },
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
        title: "Logo carregado",
        description: "O logo foi carregado com sucesso!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: "Falha ao carregar o logo. Tente novamente.",
      });
    }
  };

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
      serviceType: "",
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
      serviceType: provider.serviceType,
      image: provider.image,
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
      serviceType: "",
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
          <p className="text-gray-600">
            Gerencie os prestadores de serviços do sistema ({providers.length} prestadores)
          </p>
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
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Nome Field */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Prestador *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do prestador de serviços" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Categoria Field */}
                  <FormField
                    control={form.control}
                    name="serviceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a categoria do serviço" />
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

                  {/* Logo Upload Field */}
                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo do Prestador *</FormLabel>
                        <div className="space-y-4">
                          {field.value ? (
                            <div className="relative inline-block">
                              <img
                                src={field.value}
                                alt="Logo do prestador"
                                className="w-32 h-32 object-contain border rounded-lg bg-white"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute -top-2 -right-2 w-8 h-8 p-0 rounded-full"
                                onClick={() => field.onChange("")}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <DragDropUpload
                              onFileSelect={handleImageUpload}
                              className="w-full"
                            />
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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

      {/* Providers Grid */}
      {isLoading ? (
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
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum prestador encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Adicione um novo prestador para começar.
          </p>
          <Button onClick={openNewProviderDialog} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Novo Prestador
          </Button>
        </div>
      )}
    </div>
  );
}
