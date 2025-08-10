import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Square, 
  RotateCcw, 
  Pause,
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

// Interface para containers da API Docker
interface DockerApiContainer {
  Id: string;
  Names: string[];
  Image: string;
  ImageID: string;
  Command: string;
  Created: number;
  Ports: Array<{
    IP?: string;
    PrivatePort: number;
    PublicPort?: number;
    Type: string;
  }>;
  Labels: Record<string, string>;
  State: string;
  Status: string;
  HostConfig: {
    NetworkMode: string;
  };
  NetworkSettings: {
    Networks: Record<string, any>;
  };
  Mounts: Array<{
    Type: string;
    Source: string;
    Destination: string;
    Mode: string;
    RW: boolean;
    Propagation: string;
  }>;
}

// Helper functions defined outside component
const getContainerName = (container: DockerApiContainer): string => {
  return container.Names[0]?.replace(/^\//, '') || container.Id.slice(0, 12);
};

const getContainerPorts = (container: DockerApiContainer) => {
  return container.Ports.map(port => {
    if (port.PublicPort) {
      return `${port.PublicPort}:${port.PrivatePort}/${port.Type}`;
    }
    return `${port.PrivatePort}/${port.Type}`;
  }).join(', ') || 'Nenhuma porta exposta';
};

const getStatusColor = (state: string) => {
  switch (state.toLowerCase()) {
    case "running":
      return "bg-green-500";
    case "exited":
      return "bg-red-500";
    case "paused":
      return "bg-yellow-500";
    case "restarting":
      return "bg-blue-500";
    case "created":
      return "bg-gray-500";
    default:
      return "bg-gray-500";
  }
};

const getStatusText = (state: string) => {
  switch (state.toLowerCase()) {
    case "running":
      return "Executando";
    case "exited":
      return "Parado";
    case "paused":
      return "Pausado";
    case "restarting":
      return "Reiniciando";
    case "created":
      return "Criado";
    default:
      return state;
  }
};

export default function DockerContainers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [containerLogos, setContainerLogos] = useState<Record<string, string>>({});

  const handleLogoUpload = async (containerId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/container-logo', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setContainerLogos(prev => ({
          ...prev,
          [containerId]: result.url
        }));
        toast({
          title: "✅ Logo atualizado",
          description: "Logo do container foi atualizado com sucesso!",
        });
      }
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Falha ao fazer upload do logo",
        variant: "destructive",
      });
    }
  };

  const getImageIcon = (image: string, containerId: string) => {
    // Se há logo personalizado, usar ele
    if (containerLogos[containerId]) {
      return <img src={containerLogos[containerId]} alt="Logo" className="w-5 h-5 object-contain" />;
    }

    // Caso contrário, usar ícone padrão baseado na imagem
    if (image.includes("nginx") || image.includes("apache")) return <Globe className="w-5 h-5" />;
    if (image.includes("mysql") || image.includes("postgres") || image.includes("mongo")) return <Database className="w-5 h-5" />;
    if (image.includes("node") || image.includes("express")) return <Server className="w-5 h-5" />;
    if (image.includes("redis")) return <HardDrive className="w-5 h-5" />;
    return <Container className="w-5 h-5" />;
  };

  // Fetch containers da API Docker real
  const { data: allContainers = [], isLoading } = useQuery<DockerApiContainer[]>({
    queryKey: ["/api/docker/containers"],
    refetchInterval: 5000, // Atualiza a cada 5 segundos
  });

  // Filtrar o container docker-socket-proxy
  const containers = allContainers.filter(container => 
    !getContainerName(container).toLowerCase().includes('docker-socket-proxy')
  );

  // Container control mutations usando API Docker real
  const startMutation = useMutation({
    mutationFn: async (containerId: string) => {
      return await apiRequest("POST", `/api/docker/containers/${containerId}/start`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/docker/containers"] });
      toast({
        title: "▶️ Container iniciado",
        description: "Container Docker iniciado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "❌ Erro",
        description: "Falha ao iniciar container",
        variant: "destructive",
      });
    },
  });

  const stopMutation = useMutation({
    mutationFn: async (containerId: string) => {
      return await apiRequest("POST", `/api/docker/containers/${containerId}/stop`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/docker/containers"] });
      toast({
        title: "⏹️ Container parado",
        description: "Container Docker parado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "❌ Erro",
        description: "Falha ao parar container",
        variant: "destructive",
      });
    },
  });

  const restartMutation = useMutation({
    mutationFn: async (containerId: string) => {
      return await apiRequest("POST", `/api/docker/containers/${containerId}/restart`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/docker/containers"] });
      toast({
        title: "🔄 Container reiniciado",
        description: "Container Docker reiniciado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "❌ Erro",
        description: "Falha ao reiniciar container",
        variant: "destructive",
      });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: async (containerId: string) => {
      return await apiRequest("POST", `/api/docker/containers/${containerId}/pause`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/docker/containers"] });
      toast({
        title: "⏸️ Container pausado",
        description: "Container Docker pausado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "❌ Erro",
        description: "Falha ao pausar container",
        variant: "destructive",
      });
    },
  });

  const handleContainerAction = async (containerId: string, action: string) => {
    switch (action) {
      case 'start':
        startMutation.mutate(containerId);
        break;
      case 'stop':
        stopMutation.mutate(containerId);
        break;
      case 'restart':
        restartMutation.mutate(containerId);
        break;
      case 'pause':
        pauseMutation.mutate(containerId);
        break;
      default:
        break;
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <DockerIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Containers Docker
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visualize e controle containers Docker em tempo real
          </p>
        </div>
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
        <div className="space-y-4">
          {containers.map((container: DockerApiContainer) => (
            <Card key={container.Id} className="hover:shadow-lg transition-shadow duration-200 w-full">
              <div className="flex">
                {/* Ícone lateral esquerdo */}
                <div className="w-32 flex-shrink-0 relative group">
                  <div className="w-full h-full flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-l-lg">
                    {containerLogos[container.Id] ? (
                      <img 
                        src={containerLogos[container.Id]} 
                        alt="Logo" 
                        className="w-16 h-16 object-contain" 
                      />
                    ) : (
                      getImageIcon(container.Image, container.Id)
                    )}
                  </div>

                  {/* Overlay para upload de logo */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-l-lg">
                    <label className="cursor-pointer text-white text-xs text-center p-2">
                      <span>Clique para<br />trocar logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleLogoUpload(container.Id, file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Conteúdo do card */}
                <div className="flex-1 flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold">
                          {getContainerName(container)}
                        </CardTitle>
                        <CardDescription className="flex items-center space-x-2">
                          <span>{container.Image}</span>
                        </CardDescription>
                      </div>
                      <Badge 
                        className={`${getStatusColor(container.State)} text-white`}
                      >
                        {getStatusText(container.State)}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 flex-1">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p><strong>Status:</strong> {container.Status}</p>
                      <p><strong>Portas:</strong> {getContainerPorts(container)}</p>
                      <p><strong>Rede:</strong> {container.HostConfig.NetworkMode}</p>
                      {container.Command && (
                        <p><strong>Comando:</strong> {container.Command.length > 50 ? container.Command.substring(0, 50) + '...' : container.Command}</p>
                      )}
                    </div>

                    <div className="flex gap-1">
                      {container.State === "running" ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleContainerAction(container.Id, 'stop')}
                            disabled={stopMutation.isPending}
                            className="p-2"
                            title="Parar container"
                          >
                            <Square className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleContainerAction(container.Id, 'restart')}
                            disabled={restartMutation.isPending}
                            className="p-2"
                            title="Reiniciar container"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleContainerAction(container.Id, 'pause')}
                            disabled={pauseMutation.isPending}
                            className="p-2"
                            title="Pausar container"
                          >
                            <Pause className="w-3 h-3" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleContainerAction(container.Id, 'start')}
                          disabled={startMutation.isPending}
                          className="p-2"
                          title="Iniciar container"
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </div>
              </div>
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
            Verifique se o Docker está executando e a API está disponível em: {process.env.DOCKER_URI || 'http://localhost:2375'}
          </p>
        </div>
      )}

      {/* Exibir aviso se API Docker não estiver disponível */}
      {containers.length === 1 && containers[0]?.Id === "error-fallback" && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                API Docker Indisponível
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>Não foi possível conectar com a API Docker. Verifique se:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>O Docker está em execução</li>
                  <li>A variável DOCKER_URI está configurada corretamente</li>
                  <li>A API Docker está acessível em: {process.env.DOCKER_URI || 'http://localhost:2375'}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}