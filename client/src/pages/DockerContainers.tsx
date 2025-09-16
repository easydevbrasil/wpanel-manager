
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";
import {
  Play,
  Square,
  RotateCcw,
  Container,
  Server,
  Database,
  Globe,
  HardDrive,
  Clock,
  Network,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useContainerStats, generateHistoricalData, StatsDataPoint } from "@/hooks/useContainerStats";

// Docker icon component usando a imagem fornecida
const DockerIcon = ({ className = "w-6 h-6" }) => (
  <div className={className}>
    <img
      src="/uploads/docker-logo.png"
      alt="Docker"
      className="w-full h-full object-contain"
      onError={(e) => {
        // Fallback para SVG se a imagem não carregar
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        target.parentElement!.innerHTML = `
          <svg viewBox="0 0 24 24" class="${className}" fill="currentColor">
            <path d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.184-.186h-2.12a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.082.185.184.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.718-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 00-.75.748 11.376 11.376 0 00.692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 003.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z"/>
          </svg>
        `;
      }}
    />
  </div>
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

// Helper functions
const getContainerName = (container: DockerApiContainer): string => {
  return container.Names[0]?.replace(/^\//, '') || container.Id.slice(0, 12);
};

const getContainerPorts = (container: DockerApiContainer) => {
  const externalPorts = container.Ports
    .filter(port => port.PublicPort) // Only show ports that are externally exposed
    .map(port => `${port.PublicPort}`)
    .join(', ');

  return externalPorts || 'Nenhuma porta externa';
};

const getContainerIP = (container: DockerApiContainer): string => {
  const networks = container.NetworkSettings?.Networks;
  if (!networks) return 'N/A';

  const networkNames = Object.keys(networks);
  if (networkNames.length === 0) return 'N/A';

  const firstNetwork = networks[networkNames[0]];
  return firstNetwork?.IPAddress || 'N/A';
};

const getUptime = (status: string): string => {
  // Parse the uptime from status string like "Up 2 hours" or "Exited (0) 5 minutes ago"
  if (status.startsWith('Up ')) {
    const uptimeText = status.replace('Up ', '');

    // Parse different formats
    const timeMatch = uptimeText.match(/(\d+)\s*(second|minute|hour|day)s?/gi);
    if (timeMatch) {
      let totalMinutes = 0;

      timeMatch.forEach(match => {
        const [, value, unit] = match.match(/(\d+)\s*(second|minute|hour|day)s?/i) || [];
        const num = parseInt(value);

        switch (unit.toLowerCase()) {
          case 'second':
            totalMinutes += num / 60;
            break;
          case 'minute':
            totalMinutes += num;
            break;
          case 'hour':
            totalMinutes += num * 60;
            break;
          case 'day':
            totalMinutes += num * 60 * 24;
            break;
        }
      });

      const days = Math.floor(totalMinutes / (60 * 24));
      const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
      const minutes = Math.floor(totalMinutes % 60);

      if (days > 0) return `${days}d ${hours}h`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
    }

    // Fallback: return simplified version
    return uptimeText;
  }

  // If not running, show stopped status
  if (status.includes('Exited')) {
    return 'Parado';
  }

  return 'N/A';
};

// Usage Chart Component
const UsageChart = ({ data, type }: { data: StatsDataPoint[], type: 'cpu' | 'memory' }) => {
  const config: ChartConfig = {
    [type]: {
      label: type === 'cpu' ? 'CPU' : 'Memória',
      color: type === 'cpu' ? '#3b82f6' : '#10b981',
    },
  };

  return (
    <ChartContainer config={config} className="h-16 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <Area
            type="monotone"
            dataKey={type}
            stroke={config[type].color}
            fill={config[type].color}
            fillOpacity={0.3}
            strokeWidth={1.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

// Real-time container stats component
const ContainerStatsDisplay = ({ container }: { container: DockerApiContainer }) => {
  const [historicalData, setHistoricalData] = useState<StatsDataPoint[]>([]);
  const { data: stats, error, isError } = useContainerStats(container.Id, container.State === "running");

  // Update historical data when new stats arrive
  useEffect(() => {
    if (stats && !stats.mock) {
      setHistoricalData(prev => generateHistoricalData(stats, prev));
    }
  }, [stats]);

  // Fallback to mock data if real stats fail or for non-running containers
  const useMockData = !stats || stats.mock || isError || container.State !== "running";

  let displayData = historicalData;
  let currentCpu = stats?.cpu || 0;
  let currentMemory = stats?.memory || 0;

  if (useMockData || displayData.length === 0) {
    // Generate mock data for display
    const baseValue = Math.random() * 50 + 20;
    displayData = Array.from({ length: 20 }, (_, i) => {
      const trend = Math.sin(i * 0.3) * 10;
      const noise = (Math.random() - 0.5) * 15;
      const value = Math.max(0, Math.min(100, baseValue + trend + noise));
      return {
        time: i,
        cpu: value,
        memory: Math.max(0, Math.min(100, value + (Math.random() - 0.5) * 20)),
      };
    });
    currentCpu = displayData[displayData.length - 1]?.cpu || 0;
    currentMemory = displayData[displayData.length - 1]?.memory || 0;
  }

  const isRealData = !useMockData && stats && !stats.mock && !isError;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Uso de Recursos</h4>
        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          {isRealData ? (
            <>
              <Activity className="w-3 h-3 text-green-500" />
              Dados em tempo real
            </>
          ) : (
            "Dados simulados"
          )}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">CPU</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              {currentCpu.toFixed(1)}%
            </span>
          </div>
          <UsageChart data={displayData} type="cpu" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">Memória</span>
            <span className="text-green-600 dark:text-green-400 font-medium">
              {currentMemory.toFixed(1)}%
            </span>
          </div>
          <UsageChart data={displayData} type="memory" />
        </div>
      </div>
    </div>
  );
};

const getStatusColor = (state: string) => {
  switch (state.toLowerCase()) {
    case "running":
      return "bg-green-500";
    case "exited":
      return "bg-red-500";
    case "paused":
      return "bg-orange-500";
    case "restarting":
      return "bg-orange-500";
    case "created":
    case "starting":
      return "bg-yellow-500";
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
      return "Iniciando";
    case "starting":
      return "Iniciando";
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
    if (containerLogos[containerId]) {
      return <img src={containerLogos[containerId]} alt="Logo" className="w-full h-4/5 object-contain" />;
    }

    // Use Docker logo as default for all containers
    return <img src="/uploads/docker-logo.png" alt="Docker" className="w-full h-4/5 object-contain" />;
  };

  const { data: allContainers = [], isLoading } = useQuery<DockerApiContainer[]>({
    queryKey: ["/api/docker/containers"],
    refetchInterval: 2000, // Update every 2 seconds for real-time feel
    refetchIntervalInBackground: true, // Keep updating even when tab is not active
    staleTime: 1000, // Consider data stale after 1 second
  });

  const containers = allContainers.filter(container => {
    const name = getContainerName(container).toLowerCase();
    // Filter out system containers but keep all user containers
    return !name.includes('docker-socket-proxy') &&
      !name.startsWith('k8s_');
  });

  // Mutations corrigidas
  const startMutation = useMutation({
    mutationFn: async (containerId: string) => {
      try {
        const response = await fetch(`/api/docker/containers/${containerId}/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = 'Falha ao iniciar container';
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        return result;
      } catch (error: any) {
        console.error('Start container network error:', error);
        throw new Error(error.message || 'Falha de comunicação ao iniciar container');
      }
    },
    onSuccess: async (data) => {
      // Wait a bit for Docker to update the container state
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/docker/containers"] });
        queryClient.refetchQueries({ queryKey: ["/api/docker/containers"] });
      }, 1000);

      toast({
        title: "▶️ Container iniciado",
        description: data.mock ? "Container iniciado (modo demo)" : "Container Docker iniciado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erro",
        description: error.message || "Falha ao iniciar container",
        variant: "destructive",
      });
    },
  });

  const stopMutation = useMutation({
    mutationFn: async (containerId: string) => {
      try {
        const response = await fetch(`/api/docker/containers/${containerId}/stop`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = 'Falha ao parar container';
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        return result;
      } catch (error: any) {
        console.error('Stop container network error:', error);
        throw new Error(error.message || 'Falha de comunicação ao parar container');
      }
    },
    onSuccess: async (data) => {
      // Wait a bit for Docker to update the container state
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/docker/containers"] });
        queryClient.refetchQueries({ queryKey: ["/api/docker/containers"] });
      }, 1000);

      toast({
        title: "⏹️ Container parado",
        description: data.mock ? "Container parado (modo demo)" : "Container Docker parado com sucesso!",
      });
    },
    onError: (error: any) => {
      console.error('Stop container error:', error);
      toast({
        title: "❌ Erro",
        description: error.message || "Falha ao parar container",
        variant: "destructive",
      });
    },
  });

  const restartMutation = useMutation({
    mutationFn: async (containerId: string) => {
      try {
        const response = await fetch(`/api/docker/containers/${containerId}/restart`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = 'Falha ao reiniciar container';
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        return result;
      } catch (error: any) {
        console.error('Restart container network error:', error);
        throw new Error(error.message || 'Falha de comunicação ao reiniciar container');
      }
    },
    onSuccess: async (data) => {
      // Wait a bit for Docker to update the container state
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/docker/containers"] });
        queryClient.refetchQueries({ queryKey: ["/api/docker/containers"] });
      }, 1000);

      toast({
        title: "🔄 Container reiniciado",
        description: data.mock ? "Container reiniciado (modo demo)" : "Container Docker reiniciado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erro",
        description: error.message || "Falha ao reiniciar container",
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
    }
  };

  return (
    <div className="w-full p-4 sm:p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <DockerIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
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
                <div className="w-32 flex-shrink-0 relative group">
                  <div className="w-full h-full flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-l-lg p-2">
                    {containerLogos[container.Id] ? (
                      <img
                        src={containerLogos[container.Id]}
                        alt="Logo"
                        className="w-full h-4/5 object-contain"
                      />
                    ) : (
                      getImageIcon(container.Image, container.Id)
                    )}
                  </div>

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
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          Status
                        </p>
                        <p className="text-foreground">{container.Status}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          Portas Externas
                        </p>
                        <p className="text-foreground font-mono">{getContainerPorts(container)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
                          <Network className="w-3 h-3" />
                          IP do Container
                        </p>
                        <p className="text-foreground font-mono">{getContainerIP(container)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Uptime
                        </p>
                        <p className="text-foreground">{getUptime(container.Status)}</p>
                      </div>
                    </div>

                    {/* Usage Charts */}
                    {container.State === "running" && (
                      <ContainerStatsDisplay container={container} />
                    )}

                    <div className="flex gap-2 mt-4">
                      {container.State === "running" ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleContainerAction(container.Id, 'stop')}
                            disabled={stopMutation.isPending}
                            className="flex items-center gap-1"
                            title="Parar container"
                          >
                            <Square className="w-3 h-3" />
                            Parar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleContainerAction(container.Id, 'restart')}
                            disabled={restartMutation.isPending}
                            className="flex items-center gap-1"
                            title="Reiniciar container"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Reiniciar
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleContainerAction(container.Id, 'start')}
                          disabled={startMutation.isPending}
                          className="flex items-center gap-1"
                          title="Iniciar container"
                        >
                          <Play className="w-3 h-3" />
                          Iniciar
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
          <h3 className="text-lg font-medium text-foreground mb-2">
            Nenhum container encontrado
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Verifique se o Docker está executando e a API está disponível
          </p>
        </div>
      )}
    </div>
  );
}
