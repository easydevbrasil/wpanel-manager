import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { DockerContainer } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Play, 
  Square, 
  RotateCcw, 
  Pause, 
  Edit, 
  Trash2, 
  Plus,
  Container,
  Server,
  Database,
  Globe,
  HardDrive,
  Cpu,
  MemoryStick
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Docker icon component
const DockerIcon = ({ className = "w-6 h-6" }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className}
    fill="currentColor"
  >
    <path d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.184-.186h-2.12a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.082.185.184.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.718-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 00-.75.748 11.376 11.376 0 00.692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 003.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z"/>
  </svg>
);

// Form schema
const containerFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  image: z.string().min(1, "Imagem é obrigatória"),
  tag: z.string().default("latest"),
  description: z.string().optional(),
  command: z.string().optional(),
  networkMode: z.string().default("bridge"),
  restartPolicy: z.string().default("unless-stopped"),
  cpuLimit: z.string().optional(),
  memoryLimit: z.string().optional(),
});

type ContainerFormData = z.infer<typeof containerFormSchema>;

export default function DockerContainers() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContainer, setEditingContainer] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch containers
  const { data: containers = [], isLoading } = useQuery<DockerContainer[]>({
    queryKey: ["/api/docker-containers"],
  });

  // Form setup
  const form = useForm<ContainerFormData>({
    resolver: zodResolver(containerFormSchema),
    defaultValues: {
      name: "",
      image: "",
      tag: "latest",
      description: "",
      command: "",
      networkMode: "bridge",
      restartPolicy: "unless-stopped",
      cpuLimit: "",
      memoryLimit: "",
    },
  });

  // Create container mutation
  const createMutation = useMutation({
    mutationFn: async (data: ContainerFormData) => {
      return await apiRequest("POST", "/api/docker-containers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/docker-containers"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "🐳 Container criado",
        description: "Container Docker criado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "❌ Erro",
        description: "Falha ao criar container Docker",
        variant: "destructive",
      });
    },
  });

  // Update container mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ContainerFormData }) => {
      return await apiRequest("PUT", `/api/docker-containers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/docker-containers"] });
      setIsDialogOpen(false);
      setEditingContainer(null);
      form.reset();
      toast({
        title: "🔄 Container atualizado",
        description: "Container Docker atualizado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "❌ Erro",
        description: "Falha ao atualizar container Docker",
        variant: "destructive",
      });
    },
  });

  // Delete container mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/docker-containers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/docker-containers"] });
      toast({
        title: "🗑️ Container excluído",
        description: "Container Docker excluído com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "❌ Erro",
        description: "Falha ao excluir container Docker",
        variant: "destructive",
      });
    },
  });

  // Container control mutations
  const startMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("POST", `/api/docker-containers/${id}/start`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/docker-containers"] });
      toast({
        title: "▶️ Container iniciado",
        description: "Container Docker iniciado com sucesso!",
      });
    },
  });

  const stopMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("POST", `/api/docker-containers/${id}/stop`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/docker-containers"] });
      toast({
        title: "⏹️ Container parado",
        description: "Container Docker parado com sucesso!",
      });
    },
  });

  const restartMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("POST", `/api/docker-containers/${id}/restart`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/docker-containers"] });
      toast({
        title: "🔄 Container reiniciado",
        description: "Container Docker reiniciado com sucesso!",
      });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("POST", `/api/docker-containers/${id}/pause`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/docker-containers"] });
      toast({
        title: "⏸️ Container pausado",
        description: "Container Docker pausado com sucesso!",
      });
    },
  });

  const onSubmit = (data: ContainerFormData) => {
    if (editingContainer) {
      updateMutation.mutate({ id: editingContainer.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (container: any) => {
    setEditingContainer(container);
    form.reset({
      name: container.name,
      image: container.image,
      tag: container.tag,
      description: container.description || "",
      command: container.command || "",
      networkMode: container.networkMode,
      restartPolicy: container.restartPolicy,
      cpuLimit: container.cpuLimit || "",
      memoryLimit: container.memoryLimit || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este container?")) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-green-500";
      case "stopped":
        return "bg-red-500";
      case "paused":
        return "bg-yellow-500";
      case "restarting":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "running":
        return "Executando";
      case "stopped":
        return "Parado";
      case "paused":
        return "Pausado";
      case "restarting":
        return "Reiniciando";
      default:
        return "Desconhecido";
    }
  };

  const getImageIcon = (image: string) => {
    if (image.includes("nginx") || image.includes("apache")) return <Globe className="w-5 h-5" />;
    if (image.includes("mysql") || image.includes("postgres") || image.includes("mongo")) return <Database className="w-5 h-5" />;
    if (image.includes("node") || image.includes("express")) return <Server className="w-5 h-5" />;
    if (image.includes("redis")) return <HardDrive className="w-5 h-5" />;
    return <Container className="w-5 h-5" />;
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <DockerIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Containers Docker
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie containers Docker com controle completo
            </p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingContainer(null);
                form.reset();
              }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Container
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DockerIcon className="w-5 h-5" />
                {editingContainer ? "Editar Container" : "Novo Container Docker"}
              </DialogTitle>
              <DialogDescription>
                {editingContainer 
                  ? "Atualize as configurações do container Docker"
                  : "Configure um novo container Docker para deploy"
                }
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Container</FormLabel>
                        <FormControl>
                          <Input placeholder="nginx-web-server" {...field} />
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
                        <FormLabel>Imagem Docker</FormLabel>
                        <FormControl>
                          <Input placeholder="nginx" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tag"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tag</FormLabel>
                        <FormControl>
                          <Input placeholder="latest" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="networkMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modo de Rede</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o modo de rede" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="bridge">Bridge</SelectItem>
                            <SelectItem value="host">Host</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="restartPolicy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Política de Restart</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="no">No</SelectItem>
                            <SelectItem value="always">Always</SelectItem>
                            <SelectItem value="unless-stopped">Unless Stopped</SelectItem>
                            <SelectItem value="on-failure">On Failure</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cpuLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Limite de CPU</FormLabel>
                        <FormControl>
                          <Input placeholder="0.5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="memoryLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Limite de Memória</FormLabel>
                        <FormControl>
                          <Input placeholder="512m" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="command"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comando (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="npm start" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva a finalidade deste container..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
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
                    {editingContainer ? "Atualizar" : "Criar"} Container
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {containers.map((container: DockerContainer) => (
            <Card key={container.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      {getImageIcon(container.image)}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">{container.name}</CardTitle>
                      <CardDescription className="flex items-center space-x-2">
                        <span>{container.image}:{container.tag}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <Badge 
                    className={`${getStatusColor(container.status)} text-white`}
                  >
                    {getStatusText(container.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {container.description || "Sem descrição disponível"}
                </p>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {container.cpuLimit && (
                    <div className="flex items-center space-x-1">
                      <Cpu className="w-3 h-3" />
                      <span>CPU: {container.cpuLimit}</span>
                    </div>
                  )}
                  {container.memoryLimit && (
                    <div className="flex items-center space-x-1">
                      <MemoryStick className="w-3 h-3" />
                      <span>RAM: {container.memoryLimit}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {container.status === "running" ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => stopMutation.mutate(container.id)}
                        disabled={stopMutation.isPending}
                      >
                        <Square className="w-3 h-3 mr-1" />
                        Parar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => restartMutation.mutate(container.id)}
                        disabled={restartMutation.isPending}
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Reiniciar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => pauseMutation.mutate(container.id)}
                        disabled={pauseMutation.isPending}
                      >
                        <Pause className="w-3 h-3 mr-1" />
                        Pausar
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startMutation.mutate(container.id)}
                      disabled={startMutation.isPending}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Iniciar
                    </Button>
                  )}
                </div>

                <div className="flex justify-between pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(container)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(container.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {containers.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <DockerIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nenhum container encontrado
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Comece criando seu primeiro container Docker
          </p>
          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Criar Container
          </Button>
        </div>
      )}
    </div>
  );
}