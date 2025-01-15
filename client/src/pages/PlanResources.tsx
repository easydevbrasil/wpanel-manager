import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Edit,
  Trash2,
  Settings,
  Upload,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { PlanResource, InsertPlanResource } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { formatBRL, parseBRLToNumber, formatBRLInput, parseBRLInputToCents, formatCentsToDisplay } from "@/lib/utils";

const resourceFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  value: z.string().min(1, "Valor é obrigatório"),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

type ResourceFormData = z.infer<typeof resourceFormSchema>;

// Component for drag & drop image upload
const DragDropUpload = ({ 
  onFileSelect, 
  className = "" 
}: { 
  onFileSelect: (file: File) => void; 
  className?: string; 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        isDragOver 
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950" 
          : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
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

export default function PlanResources() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<PlanResource | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: resources = [], isLoading } = useQuery<PlanResource[]>({
    queryKey: ["/api/plan-resources"],
  });

  const form = useForm<ResourceFormData>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: {
      name: "",
      value: "",
      image: "",
      isActive: true,
      sortOrder: 0,
    },
  });

  // Image upload function
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload/resource-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const createResourceMutation = useMutation({
    mutationFn: (data: Partial<InsertPlanResource>) => apiRequest("POST", "/api/plan-resources", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plan-resources"] });
      setIsDialogOpen(false);
      setEditingResource(null);
      form.reset();
      toast({
        title: "Recurso criado",
        description: "Recurso foi criado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar recurso.",
        variant: "destructive",
      });
    },
  });

  const updateResourceMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertPlanResource> }) =>
      apiRequest("PUT", `/api/plan-resources/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plan-resources"] });
      setIsDialogOpen(false);
      setEditingResource(null);
      form.reset();
      toast({
        title: "Recurso atualizado",
        description: "Recurso foi atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar recurso.",
        variant: "destructive",
      });
    },
  });

  const deleteResourceMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/plan-resources/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plan-resources"] });
      toast({
        title: "Recurso excluído",
        description: "Recurso foi excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao excluir recurso.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: ResourceFormData) => {
    if (editingResource) {
      updateResourceMutation.mutate({ id: editingResource.id, data });
    } else {
      createResourceMutation.mutate(data);
    }
  };

  const handleEdit = (resource: PlanResource) => {
    setEditingResource(resource);
    form.reset({
      name: resource.name,
      value: resource.value,
      image: resource.image || "",
      isActive: resource.isActive,
      sortOrder: resource.sortOrder,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteResourceMutation.mutate(id);
  };

  const handleNewResource = () => {
    setEditingResource(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    try {
      const imageUrl = await uploadImage(file);
      form.setValue('image', imageUrl);
      toast({
        title: "Imagem carregada",
        description: "Imagem foi carregada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Falha ao carregar imagem.",
        variant: "destructive",
      });
    }
  };

  const filteredResources = resources
    .filter((resource) =>
      resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.value.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Recursos dos Planos
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie os recursos que podem ser atribuídos aos planos de assinatura.
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewResource} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Novo Recurso
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-white">
                  {editingResource ? "Editar Recurso" : "Novo Recurso"}
                </DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400">
                  {editingResource 
                    ? "Atualize as informações do recurso."
                    : "Adicione um novo recurso que pode ser atribuído aos planos."
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
                        <FormLabel className="text-gray-900 dark:text-white">Nome</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Nome do recurso" 
                            {...field} 
                            className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 dark:text-white">Valor (R$)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: R$ 50,00" 
                            value={field.value ? formatCentsToDisplay(field.value) : ''}
                            onChange={(e) => {
                              const formatted = formatBRLInput(e.target.value);
                              const centsValue = parseBRLInputToCents(formatted);
                              field.onChange(centsValue);
                            }}
                            className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                        <FormLabel className="text-gray-900 dark:text-white">Imagem do Recurso</FormLabel>
                        <FormControl>
                          <div className="space-y-3">
                            {field.value && (
                              <div className="relative inline-block">
                                <img 
                                  src={field.value} 
                                  alt="Preview" 
                                  className="w-20 h-20 object-cover rounded-lg border"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                  onClick={() => field.onChange("")}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                            
                            <DragDropUpload 
                              onFileSelect={handleImageUpload}
                              className="w-full"
                            />
                            
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">ou</span>
                              <Input
                                placeholder="URL da imagem"
                                value={field.value || ""}
                                onChange={field.onChange}
                                className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sortOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Ordem</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="0" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 pt-7">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-gray-900 dark:text-white">Recurso Ativo</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      className="border-gray-300 dark:border-gray-600"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createResourceMutation.isPending || updateResourceMutation.isPending}
                    >
                      {editingResource ? "Atualizar" : "Criar"} Recurso
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Input
            type="text"
            placeholder="Buscar recursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredResources.map((resource) => (
          <Card key={resource.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  {resource.image ? (
                    <img 
                      src={resource.image} 
                      alt={resource.name}
                      className="w-10 h-10 object-cover rounded-lg border"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <Settings className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {resource.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {formatCentsToDisplay(resource.value)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(resource)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white dark:bg-gray-800">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900 dark:text-white">
                          Excluir Recurso
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                          Tem certeza de que deseja excluir o recurso "{resource.name}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-gray-300 dark:border-gray-600">
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(resource.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Badge variant={resource.isActive ? "default" : "secondary"}>
                  {resource.isActive ? "Ativo" : "Inativo"}
                </Badge>
                <span className="text-xs text-gray-500">
                  Ordem: {resource.sortOrder}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Nenhum recurso encontrado.
          </p>
        </div>
      )}
    </div>
  );
}