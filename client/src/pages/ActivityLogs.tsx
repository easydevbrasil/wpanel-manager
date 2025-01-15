import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Shield,
  User,
  Database,
  Server,
  Settings,
  Search,
  Filter,
  Calendar,
  Download,
  Trash2,
  Eye,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Tipos de log
export type LogLevel = 'error' | 'warning' | 'info' | 'success' | 'security' | 'system' | 'user' | 'api';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  details?: any;
  userId?: number;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  action?: string;
  resource?: string;
}

export interface LogsResponse {
  logs: LogEntry[];
  total: number;
  stats: Record<LogLevel, number>;
}

const logLevelConfig = {
  error: {
    label: 'Erro',
    icon: XCircle,
    color: 'bg-red-500 text-white',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  warning: {
    label: 'Aviso',
    icon: AlertTriangle,
    color: 'bg-yellow-500 text-white',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
  },
  info: {
    label: 'Informação',
    icon: Info,
    color: 'bg-blue-500 text-white',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  success: {
    label: 'Sucesso',
    icon: CheckCircle,
    color: 'bg-green-500 text-white',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  security: {
    label: 'Segurança',
    icon: Shield,
    color: 'bg-purple-500 text-white',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  system: {
    label: 'Sistema',
    icon: Server,
    color: 'bg-gray-500 text-white',
    borderColor: 'border-gray-200 dark:border-gray-800',
  },
  user: {
    label: 'Usuário',
    icon: User,
    color: 'bg-indigo-500 text-white',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
  },
  api: {
    label: 'API',
    icon: Database,
    color: 'bg-cyan-500 text-white',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
  },
};

export default function ActivityLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch logs
  const { data: logsData, isLoading } = useQuery<LogsResponse>({
    queryKey: ["/api/logs", { 
      page: currentPage, 
      pageSize, 
      search: searchTerm, 
      level: selectedLevel,
      category: selectedCategory,
      dateFilter 
    }],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ["/api/logs/categories"],
  });

  // Clear logs mutation
  const clearLogsMutation = useMutation({
    mutationFn: async (filters: any) => {
      const response = await fetch('/api/logs/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
      });
      if (!response.ok) throw new Error('Falha ao limpar logs');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
      toast({
        title: "✅ Logs limpos",
        description: "Logs foram removidos com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "❌ Erro",
        description: "Falha ao limpar logs",
        variant: "destructive",
      });
    },
  });

  // Export logs
  const exportLogs = async () => {
    try {
      const response = await fetch('/api/logs/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          search: searchTerm, 
          level: selectedLevel,
          category: selectedCategory,
          dateFilter 
        }),
      });
      
      if (!response.ok) throw new Error('Falha ao exportar logs');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "📁 Export realizado",
        description: "Logs exportados com sucesso",
      });
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Falha ao exportar logs",
        variant: "destructive",
      });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), "dd/MM/yyyy HH:mm:ss", { locale: ptBR });
  };

  const renderLogIcon = (level: LogLevel) => {
    const config = logLevelConfig[level];
    const Icon = config.icon;
    return <Icon className="w-4 h-4" />;
  };

  const logs = logsData?.logs || [];
  const totalCount = logsData?.total || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="w-full p-4 sm:p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Settings className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Logs de Atividades
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitore e analise todas as atividades do sistema
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(logLevelConfig).map(([level, config]) => {
          const count = logsData?.stats?.[level as LogLevel] || 0;
          return (
            <Card key={level} className="cursor-pointer hover:shadow-md transition-shadow" 
                  onClick={() => setSelectedLevel(level as LogLevel)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.color}`}>
                    {renderLogIcon(level as LogLevel)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{config.label}</p>
                    <p className="text-lg font-bold text-foreground">{count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Pesquisar logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Level Filter */}
            <Select value={selectedLevel} onValueChange={(value: string) => setSelectedLevel(value as "all" | LogLevel)}>
              <SelectTrigger>
                <SelectValue placeholder="Nível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os níveis</SelectItem>
                {Object.entries(logLevelConfig).map(([level, config]) => (
                  <SelectItem key={level} value={level}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((category: string) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
                <SelectItem value="all">Todos os períodos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={exportLogs} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            <Button 
              onClick={() => clearLogsMutation.mutate({ level: selectedLevel, category: selectedCategory })}
              variant="outline" 
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar Filtrados
            </Button>
            <Button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/logs"] })}
              variant="outline" 
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Entradas de Log ({totalCount} registros)
          </CardTitle>
          <CardDescription>
            Página {currentPage} de {totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
              <span className="ml-2">Carregando logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum log encontrado com os filtros aplicados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log: LogEntry) => {
                const config = logLevelConfig[log.level];
                return (
                  <div
                    key={log.id}
                    className={`p-4 rounded-lg border ${config.borderColor} hover:shadow-sm transition-shadow`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <Badge className={config.color}>
                          {renderLogIcon(log.level)}
                          <span className="ml-1">{config.label}</span>
                        </Badge>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTimestamp(log.timestamp)}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {log.category}
                            </Badge>
                            {log.userEmail && (
                              <Badge variant="outline" className="text-xs">
                                {log.userEmail}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-foreground mb-1">
                            {log.message}
                          </p>
                          
                          {log.action && log.resource && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {log.action} → {log.resource}
                            </p>
                          )}
                          
                          {log.details && (
                            <details className="mt-2">
                              <summary className="text-xs cursor-pointer text-indigo-600 dark:text-indigo-400">
                                Ver detalhes
                              </summary>
                              <pre className="text-xs mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                      
                      {log.ipAddress && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          IP: {log.ipAddress}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Mostrando {(currentPage - 1) * pageSize + 1} a {Math.min(currentPage * pageSize, totalCount)} de {totalCount} registros
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}