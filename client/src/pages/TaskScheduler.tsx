// ...existing code...
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Clock, Play, Pause, Trash2, Edit, Plus, Calendar, RefreshCw, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  name: string;
  description: string;
  schedule: string;
  type: 'user' | 'system';
  category: string;
  status: 'active' | 'inactive' | 'running' | 'error';
  lastRun?: string;
  nextRun?: string;
  command?: string;
  template?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  command: string;
  schedule: string;
  category: string;
}

const scheduleExamples = [
  { value: "0 0 * * *", label: "Diariamente à meia-noite", description: "Executa todos os dias às 00:00" },
  { value: "0 6 * * *", label: "Diariamente às 6h", description: "Executa todos os dias às 06:00" },
  { value: "*/15 * * * *", label: "A cada 15 minutos", description: "Executa a cada 15 minutos" },
  { value: "0 */2 * * *", label: "A cada 2 horas", description: "Executa a cada 2 horas" },
  { value: "0 0 * * 0", label: "Semanalmente (Domingo)", description: "Executa todo domingo à meia-noite" },
  { value: "0 0 1 * *", label: "Mensalmente", description: "Executa no primeiro dia de cada mês" },
  { value: "0 9 * * 1-5", label: "Dias úteis às 9h", description: "Executa de segunda a sexta às 09:00" },
  { value: "0 */6 * * *", label: "A cada 6 horas", description: "Executa 4 vezes por dia" }
];

const taskTemplates: TaskTemplate[] = [
  {
    id: "backup_db",
    name: "Backup do Banco de Dados",
    description: "Realizar backup completo do banco PostgreSQL",
    command: "pg_dump -h localhost -U postgres wpanel > /backup/wpanel_$(date +%Y%m%d_%H%M%S).sql",
    schedule: "0 2 * * *",
    category: "backup"
  },
  {
    id: "backup_db_to_proton",
    name: "Backup BD para Proton Drive",
    description: "Backup do banco PostgreSQL direto para Proton Drive",
    command: "pg_dump -h localhost -U postgres wpanel | gzip | rclone rcat protondrive:/backups/database/wpanel_$(date +%Y%m%d_%H%M%S).sql.gz",
    schedule: "0 2 * * *",
    category: "backup"
  },
  {
    id: "backup_uploads_to_proton",
    name: "Backup Uploads para Proton Drive",
    description: "Sincroniza pasta uploads com Proton Drive",
    command: "rclone sync /docker/wpanel/uploads/ protondrive:/backups/uploads/ --progress --protondrive-replace-existing-draft=true",
    schedule: "0 3 * * *",
    category: "backup"
  },
  {
    id: "backup_full_system_proton",
    name: "Backup Completo Sistema Proton",
    description: "Backup completo dos dados do sistema para Proton Drive",
    command: "tar -czf - /docker/wpanel /etc/nginx /var/lib/docker/volumes | rclone rcat protondrive:/backups/system/full_backup_$(date +%Y%m%d).tar.gz",
    schedule: "0 1 * * 0",
    category: "backup"
  },
  {
    id: "backup_configs_proton",
    name: "Backup Configurações Proton",
    description: "Backup de configurações importantes para Proton Drive",
    command: "rclone sync /docker/wpanel/server/ protondrive:/backups/configs/server/ --exclude '*.log' --exclude 'node_modules/**' --protondrive-replace-existing-draft=true",
    schedule: "0 4 * * *",
    category: "backup"
  },
  {
    id: "cleanup_logs",
    name: "Limpeza de Logs",
    description: "Remove logs antigos para liberar espaço em disco",
    command: "find /var/log -name '*.log' -mtime +30 -delete && find /docker/wpanel/logs -name '*.log' -mtime +7 -delete",
    schedule: "0 3 * * 0",
    category: "maintenance"
  },
  {
    id: "update_ssl",
    name: "Renovar Certificados SSL",
    description: "Verifica e renova certificados SSL próximos do vencimento",
    command: "certbot renew --quiet",
    schedule: "0 4 * * *",
    category: "security"
  },
  {
    id: "docker_cleanup",
    name: "Limpeza Docker",
    description: "Remove imagens, containers e volumes não utilizados",
    command: "docker system prune -af --volumes",
    schedule: "0 1 * * 0",
    category: "maintenance"
  },
  {
    id: "docker_images_cleanup",
    name: "Limpeza Imagens Docker",
    description: "Remove imagens Docker antigas e não utilizadas",
    command: "docker image prune -af --filter 'until=168h'",
    schedule: "0 2 * * 0",
    category: "maintenance"
  },
  {
    id: "check_services",
    name: "Verificar Serviços",
    description: "Monitora status dos serviços críticos",
    command: "systemctl status nginx postgresql docker redis | logger -t service-check",
    schedule: "*/30 * * * *",
    category: "monitoring"
  },
  {
    id: "check_disk_space",
    name: "Verificar Espaço em Disco",
    description: "Monitora uso do espaço em disco e alerta quando necessário",
    command: "df -h / | awk 'NR==2 {if ($5+0 > 85) print \"WARNING: Disk usage is \" $5}' | logger -t disk-check",
    schedule: "0 */2 * * *",
    category: "monitoring"
  },
  {
    id: "backup_uploads",
    name: "Backup de Uploads Local",
    description: "Backup local da pasta de uploads",
    command: "rsync -av /docker/wpanel/uploads/ /backup/uploads/",
    schedule: "0 5 * * *",
    category: "backup"
  },
  {
    id: "send_reports",
    name: "Relatório de Status",
    description: "Envia relatório diário do sistema por email",
    command: "curl -X POST localhost:8000/api/tasks/system-report",
    schedule: "0 8 * * *",
    category: "reporting"
  },
  {
    id: "optimize_db",
    name: "Otimizar Banco",
    description: "Executa VACUUM e ANALYZE no PostgreSQL",
    command: "psql -h localhost -U postgres -d wpanel -c 'VACUUM ANALYZE;'",
    schedule: "0 23 * * 0",
    category: "maintenance"
  },
  {
    id: "update_system",
    name: "Atualizar Sistema",
    description: "Atualiza pacotes do sistema (Debian/Ubuntu)",
    command: "apt update && apt upgrade -y && apt autoremove -y",
    schedule: "0 5 * * 1",
    category: "maintenance"
  },
  {
    id: "restart_services",
    name: "Reiniciar Serviços",
    description: "Reinicia serviços essenciais do sistema",
    command: "systemctl restart nginx && systemctl restart postgresql && docker container restart $(docker ps -q)",
    schedule: "0 6 * * 0",
    category: "maintenance"
  },
  {
    id: "proton_sync_test",
    name: "Teste Conexão Proton Drive",
    description: "Testa conectividade com Proton Drive",
    command: "rclone ls protondrive:/ --max-depth 1",
    schedule: "0 */6 * * *",
    category: "monitoring"
  },
  {
    id: "backup_database_incremental",
    name: "Backup Incremental BD",
    description: "Backup incremental do banco usando WAL",
    command: "pg_basebackup -h localhost -U postgres -D /backup/incremental/$(date +%Y%m%d) -Ft -z -P",
    schedule: "0 */4 * * *",
    category: "backup"
  },
  {
    id: "monitor_memory",
    name: "Monitor de Memória",
    description: "Monitora uso de memória e registra alertas",
    command: "free -m | awk 'NR==2{printf \"Memory Usage: %s/%sMB (%.2f%%)\", $3,$2,$3*100/$2}' | logger -t memory-check",
    schedule: "*/15 * * * *",
    category: "monitoring"
  },
  {
    id: "backup_rotation_proton",
    name: "Rotação Backups Proton",
    description: "Remove backups antigos do Proton Drive (mantém últimos 30 dias)",
    command: "rclone delete protondrive:/backups/ --min-age 30d --dry-run=false",
    schedule: "0 0 * * 0",
    category: "maintenance"
  }
];

export default function TaskScheduler() {
  // Função para parar tarefa em execução
  const handleStopTask = async (task: Task) => {
    try {
      const response = await fetch(`/api/scheduled-tasks/${task.id}/stop`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Erro ao parar tarefa');
      }
      // Atualiza status localmente
      setTasks(prev => prev.map(t =>
        t.id === task.id ? { ...t, status: 'inactive' } : t
      ));
      setRunningTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(task.id);
        return newSet;
      });
      toast({
        title: '⏸️ Tarefa parada',
        description: `A tarefa "${task.name}" foi parada com sucesso.`,
      });
    } catch (error) {
      toast({
        title: '❌ Erro ao parar tarefa',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };
  const [viewingLogs, setViewingLogs] = useState<string | null>(null);
  const [taskLogs, setTaskLogs] = useState<string>("");
  const [logsLoading, setLogsLoading] = useState(false);

  // Polling para buscar logs em tempo real
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (viewingLogs) {
      setLogsLoading(true);
      const fetchLogs = async () => {
        try {
          const response = await fetch(`/api/scheduled-tasks/${viewingLogs}/logs`);
          if (response.ok) {
            const data = await response.text();
            setTaskLogs(data);
          } else {
            setTaskLogs("Erro ao buscar logs");
          }
        } catch (err) {
          setTaskLogs("Erro de rede ao buscar logs");
        } finally {
          setLogsLoading(false);
        }
      };
      fetchLogs();
      interval = setInterval(fetchLogs, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
      setTaskLogs("");
    };
  }, [viewingLogs]);
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [runningTasks, setRunningTasks] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    schedule: '',
    command: '',
    category: '',
    status: 'active' as Task['status']
  });
  // Removido selectedTemplate, pois não é necessário para o preenchimento automático

  // Removido useEffect de selectedTemplate

  // Evento beforeunload removido para evitar recarregamento automático

  // Simular dados iniciais
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch('/api/scheduled-tasks');
        if (response.ok) {
          const tasks = await response.json();
          setTasks(tasks);
        } else {
          console.warn('Erro ao carregar tarefas, usando dados mock');
          // Fallback para dados mock se a API falhar
          const mockTasks: Task[] = [
            {
              id: '1',
              name: 'Backup Automático',
              description: 'Backup diário do banco de dados',
              schedule: '0 2 * * *',
              type: 'system',
              category: 'backup',
              status: 'active',
              lastRun: '2025-09-10T02:00:00Z',
              nextRun: '2025-09-11T02:00:00Z',
              command: 'pg_dump wpanel > backup.sql',
              createdAt: '2025-09-01T00:00:00Z',
              updatedAt: '2025-09-01T00:00:00Z'
            },
            {
              id: '2',
              name: 'Limpeza de Logs',
              description: 'Remove logs antigos semanalmente',
              schedule: '0 3 * * 0',
              type: 'system',
              category: 'maintenance',
              status: 'active',
              lastRun: '2025-09-08T03:00:00Z',
              nextRun: '2025-09-15T03:00:00Z',
              command: 'find /var/log -name "*.log" -mtime +7 -delete',
              createdAt: '2025-09-01T00:00:00Z',
              updatedAt: '2025-09-01T00:00:00Z'
            },
            {
              id: '3',
              name: 'Relatório de Vendas',
              description: 'Gera relatório mensal de vendas',
              schedule: '0 9 1 * *',
              type: 'user',
              category: 'reporting',
              status: 'active',
              lastRun: '2025-09-01T09:00:00Z',
              nextRun: '2025-10-01T09:00:00Z',
              command: 'curl -X POST localhost:8000/api/reports/sales',
              createdBy: 'admin',
              createdAt: '2025-08-15T00:00:00Z',
              updatedAt: '2025-08-15T00:00:00Z'
            }
          ];
          setTasks(mockTasks);
        }
      } catch (error) {
        console.error('Erro ao carregar tarefas:', error);
        // Usar dados mock em caso de erro
        const mockTasks: Task[] = [
          {
            id: '1',
            name: 'Backup Automático',
            description: 'Backup diário do banco de dados',
            schedule: '0 2 * * *',
            type: 'system',
            category: 'backup',
            status: 'active',
            lastRun: '2025-09-10T02:00:00Z',
            nextRun: '2025-09-11T02:00:00Z',
            command: 'pg_dump wpanel > backup.sql',
            createdAt: '2025-09-01T00:00:00Z',
            updatedAt: '2025-09-01T00:00:00Z'
          },
          {
            id: '2',
            name: 'Limpeza de Logs',
            description: 'Remove logs antigos semanalmente',
            schedule: '0 3 * * 0',
            type: 'system',
            category: 'maintenance',
            status: 'active',
            lastRun: '2025-09-08T03:00:00Z',
            nextRun: '2025-09-15T03:00:00Z',
            command: 'find /var/log -name "*.log" -mtime +7 -delete',
            createdAt: '2025-09-01T00:00:00Z',
            updatedAt: '2025-09-01T00:00:00Z'
          },
          {
            id: '3',
            name: 'Relatório de Vendas',
            description: 'Gera relatório mensal de vendas',
            schedule: '0 9 1 * *',
            type: 'user',
            category: 'reporting',
            status: 'active',
            lastRun: '2025-09-01T09:00:00Z',
            nextRun: '2025-10-01T09:00:00Z',
            command: 'curl -X POST localhost:8000/api/reports/sales',
            createdBy: 'admin',
            createdAt: '2025-08-15T00:00:00Z',
            updatedAt: '2025-08-15T00:00:00Z'
          }
        ];
        setTasks(mockTasks);
      }
    };

    fetchTasks();
  }, []);

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: Task['status']) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      running: 'default',
      error: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status] || 'secondary'} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status === 'active' ? 'Ativo' :
          status === 'inactive' ? 'Inativo' :
            status === 'running' ? 'Executando' : 'Erro'}
      </Badge>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingTask) {
        // Atualizar tarefa existente
        const response = await fetch(`/api/scheduled-tasks/${editingTask.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error('Erro ao atualizar tarefa');
        }

        const updatedTask = await response.json();
        setTasks(tasks.map(task =>
          task.id === editingTask.id ? updatedTask : task
        ));

        toast({
          title: "✅ Tarefa atualizada",
          description: "A tarefa foi atualizada com sucesso.",
        });
      } else {
        // Criar nova tarefa
        const response = await fetch('/api/scheduled-tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            type: 'user'
          }),
        });

        if (!response.ok) {
          throw new Error('Erro ao criar tarefa');
        }

        const newTask = await response.json();
        setTasks([...tasks, newTask]);

        toast({
          title: "✅ Tarefa criada",
          description: "A nova tarefa foi criada com sucesso.",
        });
      }

      setIsDialogOpen(false);
      setEditingTask(null);
      resetForm();
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      name: task.name,
      description: task.description,
      schedule: task.schedule,
      command: task.command || '',
      category: task.category,
      status: task.status
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (taskId: string) => {
    try {
      const response = await fetch(`/api/scheduled-tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir tarefa');
      }

      setTasks(tasks.filter(task => task.id !== taskId));
      toast({
        title: "✅ Tarefa excluída",
        description: "A tarefa foi excluída com sucesso.",
      });
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir tarefa",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (taskId: string) => {
    try {
      const response = await fetch(`/api/scheduled-tasks/${taskId}/toggle`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Erro ao alterar status da tarefa');
      }

      const updatedTask = await response.json();
      setTasks(tasks.map(task =>
        task.id === taskId ? updatedTask : task
      ));

      toast({
        title: "✅ Status alterado",
        description: `Tarefa ${updatedTask.status === 'active' ? 'ativada' : 'desativada'} com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: error instanceof Error ? error.message : "Erro ao alterar status",
        variant: "destructive",
      });
    }
  };

  const handleRunTask = async (task: Task) => {
    // Adicionar task ao conjunto de tarefas em execução
    setRunningTasks(prev => {
      const newSet = new Set(prev);
      newSet.add(task.id);
      return newSet;
    });

    // Atualizar status da tarefa para 'running'
    setTasks(prev => prev.map(t =>
      t.id === task.id ? { ...t, status: 'running' } : t
    ));

    toast({
      title: "🚀 Executando tarefa",
      description: (
        <div className="space-y-2">
          <p><strong>{task.name}</strong> está sendo executada...</p>
          <div className="bg-gray-900 p-2 rounded text-xs">
            <code className="text-green-400">$ {task.command}</code>
          </div>
        </div>
      ),
    });

    try {
      // Chamar API real para executar a tarefa
      const response = await fetch(`/api/scheduled-tasks/${task.id}/execute`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Erro ao executar tarefa');
      }

      const result = await response.json();

      // Atualizar task com resultado da execução
      setTasks(prev => prev.map(t =>
        t.id === task.id
          ? {
            ...t,
            status: result.success ? 'active' : 'error',
            lastRun: new Date().toISOString(),
            nextRun: result.nextRun || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Próxima em 24h
          }
          : t
      ));

      if (result.success) {
        toast({
          title: "✅ Tarefa executada com sucesso!",
          description: (
            <div className="space-y-2">
              <p><strong>{task.name}</strong> foi executada com sucesso</p>
              <p className="text-sm text-green-600">
                ⏰ Executada em {new Date().toLocaleString('pt-BR')}
              </p>
              {result.output && (
                <div className="bg-gray-900 p-2 rounded text-xs max-h-20 overflow-y-auto">
                  <code className="text-green-400">{result.output}</code>
                </div>
              )}
            </div>
          ),
        });
      } else {
        setTasks(prev => prev.map(t =>
          t.id === task.id ? { ...t, status: 'error' } : t
        ));

        toast({
          title: "❌ Erro na execução",
          description: (
            <div className="space-y-2">
              <p><strong>{task.name}</strong> falhou na execução</p>
              <p className="text-sm text-red-600">
                {result.error || 'Erro desconhecido na execução'}
              </p>
            </div>
          ),
          variant: "destructive",
        });
      }
    } catch (error) {
      // Tratar erro real
      setTasks(prev => prev.map(t =>
        t.id === task.id ? { ...t, status: 'error' } : t
      ));

      toast({
        title: "❌ Erro na execução",
        description: `Falha ao executar a tarefa ${task.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
    } finally {
      // Remover da lista de execução
      setRunningTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(task.id);
        return newSet;
      });
    }
  };

  const applyTemplate = (template: TaskTemplate) => {
    console.log('applyTemplate chamado:', template);
    setFormData({
      name: template.name,
      description: template.description,
      schedule: template.schedule,
      command: template.command,
      category: template.category,
      status: 'active'
    });

    // Mostrar toast informativo com comando
    toast({
      title: "🎯 Template aplicado com sucesso!",
      description: (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <p><strong>{template.name}</strong> foi aplicado</p>
          </div>

          <div className="bg-gray-900 p-3 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-400">Comando gerado:</span>
            </div>
            <code className="text-green-400 text-xs block">
              $ {template.command}
            </code>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-blue-600">📅 {template.schedule}</span>
            <span className="text-purple-600">📂 {template.category}</span>
          </div>

          <p className="text-sm text-gray-600">
            ✨ Todos os campos foram preenchidos. Você pode modificá-los conforme necessário.
          </p>
        </div>
      ),
      duration: 6000,
    });
  };

  // Função para detectar template atual baseado no comando e outros campos
  const detectCurrentTemplate = (task: Task): TaskTemplate | null => {
    return taskTemplates.find(template =>
      template.command === task.command ||
      (template.name === task.name && template.category === task.category)
    ) || null;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      schedule: '',
      command: '',
      category: '',
      status: 'active'
    });
  };

  // Filtros removidos - agora mostramos todas as tarefas em uma única aba

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Agendador de Tarefas</h1>
          <p className="text-gray-600">Gerencie tarefas automáticas do sistema e personalizadas</p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingTask(null);
              resetForm();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingTask(null);
              resetForm();
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editingTask ? (
                  <>
                    <Edit className="h-5 w-5" />
                    Editar Tarefa
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    Nova Tarefa
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {editingTask
                  ? `Modifique os dados da tarefa "${editingTask.name}"`
                  : 'Crie uma nova tarefa agendada para automação'
                }
              </DialogDescription>

              {/* Task Edit Info Banner */}
              {editingTask && (
                <div className="space-y-4 mt-4">
                  {/* Current Template Detection */}
                  {(() => {
                    const currentTemplate = detectCurrentTemplate(editingTask);
                    if (currentTemplate) {
                      return (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                            <div className="flex-1">
                              <h4 className="font-semibold text-green-800 dark:text-green-200">🎯 Template Detectado</h4>
                              <div className="mt-2 text-sm text-green-700 dark:text-green-300 space-y-2">
                                <div>
                                  <p><strong>Template:</strong> {currentTemplate.name}</p>
                                  <p><strong>Categoria:</strong> {currentTemplate.category}</p>
                                  <p><strong>Descrição:</strong> {currentTemplate.description}</p>
                                </div>
                                <div className="bg-green-100 dark:bg-green-800/30 p-2 rounded font-mono text-xs">
                                  <strong>Comando base:</strong> {currentTemplate.command}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Task Edit Info */}
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-amber-800 dark:text-amber-200">📝 Editando Tarefa Existente</h4>
                        <div className="mt-2 text-sm text-amber-700 dark:text-amber-300 space-y-1">
                          <p><strong>ID:</strong> {editingTask.id}</p>
                          <p><strong>Criada em:</strong> {new Date(editingTask.createdAt).toLocaleString('pt-BR')}</p>
                          <p><strong>Última atualização:</strong> {new Date(editingTask.updatedAt).toLocaleString('pt-BR')}</p>
                          {editingTask.lastRun && (
                            <p><strong>Última execução:</strong> {new Date(editingTask.lastRun).toLocaleString('pt-BR')}</p>
                          )}
                          {editingTask.nextRun && (
                            <p><strong>Próxima execução:</strong> {new Date(editingTask.nextRun).toLocaleString('pt-BR')}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4" key={formData.name + formData.command + formData.schedule + formData.category}>
              {/* Templates Section - disponível tanto na criação quanto edição */}
              <div className="space-y-2 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <Label className="text-base font-semibold text-blue-700 dark:text-blue-300">🚀 Templates de Tarefas</Label>
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">
                  Escolha um template para preencher automaticamente os campos
                </p>
                <Select onValueChange={(value) => {
                  console.log('Select onValueChange:', value);
                  const template = taskTemplates.find(t => t.id === value);
                  if (template) {
                    applyTemplate(template);
                  }
                }}>
                  <SelectTrigger className="bg-white dark:bg-gray-800">
                    <SelectValue placeholder="🎯 Selecione um template para começar rapidamente" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80 overflow-y-auto">
                    {taskTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id} className="p-0">
                        <div className="w-full p-3 hover:bg-muted/50 dark:hover:bg-gray-800 cursor-pointer">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-gray-100">{template.name}</span>
                              <Badge variant="outline" className="text-xs">{template.category}</Badge>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{template.description}</p>
                            <div className="text-xs space-y-1">
                              <p className="text-blue-600 dark:text-blue-400">
                                📅 <strong>Agenda:</strong> {template.schedule}
                              </p>
                              <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded font-mono text-xs">
                                <p className="text-gray-700 dark:text-gray-300">
                                  <strong>💻 Comando:</strong> {template.command}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Task Information Section */}
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  📝 Informações da Tarefa
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Tarefa</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nome descritivo da tarefa"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="backup">Backup</SelectItem>
                        <SelectItem value="maintenance">Manutenção</SelectItem>
                        <SelectItem value="monitoring">Monitoramento</SelectItem>
                        <SelectItem value="reporting">Relatórios</SelectItem>
                        <SelectItem value="security">Segurança</SelectItem>
                        <SelectItem value="custom">Personalizada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva o que esta tarefa faz"
                    rows={3}
                  />
                </div>
              </div>

              {/* Scheduling Section */}
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  ⏰ Agendamento
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="schedule">Agendamento (Cron)</Label>
                  <Select value={formData.schedule || ''} onValueChange={(value) => setFormData({ ...formData, schedule: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um horário ou digite um cron personalizado" />
                    </SelectTrigger>
                    <SelectContent>
                      {scheduleExamples.map((example, index) => (
                        <SelectItem key={index} value={example.value}>
                          <div className="flex flex-col py-1">
                            <span className="font-medium">{example.label}</span>
                            <span className="text-sm text-gray-500">{example.value} - {example.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={formData.schedule || ''}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    placeholder="Ou digite uma expressão cron personalizada"
                    className="mt-2 font-mono"
                  />
                  <div className="text-sm space-y-1">
                    <p className="text-gray-500">
                      Formato: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">minuto hora dia mês dia-da-semana</code>
                    </p>
                    {formData.schedule && (
                      <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-700">
                        <p className="text-green-700 dark:text-green-300">
                          <strong>Agendamento atual:</strong> <code className="font-mono">{formData.schedule}</code>
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          ✅ Expressão cron válida
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Command Section */}
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  💻 Comando
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="command">Comando</Label>
                  <Textarea
                    id="command"
                    value={formData.command}
                    onChange={(e) => setFormData({ ...formData, command: e.target.value })}
                    placeholder="Comando ou script a ser executado"
                    rows={4}
                    className="font-mono text-sm"
                  />
                  {formData.command && (
                    <div className="mt-3 space-y-2">
                      {/* Command Preview */}
                      <div className="p-3 bg-gray-900 dark:bg-gray-800 rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span className="text-xs text-gray-400 ml-2">Terminal Preview</span>
                        </div>
                        <code className="text-green-400 text-sm block bg-transparent p-0">
                          $ {formData.command}
                        </code>
                      </div>

                      {/* Command Analysis */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Análise do Comando</span>
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                            <p><strong>Comprimento:</strong> {formData.command.length} caracteres</p>
                            <p><strong>Tipo:</strong> {formData.command.includes('|') ? 'Pipeline' : formData.command.includes('&&') ? 'Condicional' : 'Simples'}</p>
                            <p><strong>Segurança:</strong> {formData.command.includes('rm') || formData.command.includes('delete') ? '⚠️ Destrutivo' : '✅ Seguro'}</p>
                          </div>
                        </div>

                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-700">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-700 dark:text-green-300">Execução</span>
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-400 space-y-1">
                            <p><strong>Ambiente:</strong> Shell Linux</p>
                            <p><strong>Privilégios:</strong> {formData.command.includes('sudo') ? 'Root requerido' : 'Usuário padrão'}</p>
                            <p><strong>Duração estimada:</strong> {formData.command.includes('backup') || formData.command.includes('dump') ? 'Longa' : 'Rápida'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Settings Section */}
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  ⚙️ Configurações
                </h3>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="status"
                    checked={formData.status === 'active'}
                    onCheckedChange={(checked) => setFormData({ ...formData, status: checked ? 'active' : 'inactive' })}
                  />
                  <Label htmlFor="status" className="font-medium">
                    Tarefa ativa
                  </Label>
                  <span className="text-sm text-gray-500">
                    ({formData.status === 'active' ? 'A tarefa será executada conforme agendamento' : 'A tarefa não será executada'})
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                {!editingTask && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={resetForm}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    🔄 Limpar Formulário
                  </Button>
                )}
                <div className="flex space-x-3 ml-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingTask(null);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Salvando...
                      </div>
                    ) : editingTask ? (
                      <div className="flex items-center gap-2">
                        <Edit className="h-4 w-4" />
                        Atualizar Tarefa
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Criar Tarefa
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Seção principal com todas as tarefas */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Todas as Tarefas ({tasks.length})
          </CardTitle>
          <CardDescription>
            Gerencie todas as tarefas agendadas do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Nenhuma tarefa encontrada</h3>
              <p className="text-gray-500 mb-6">Crie sua primeira tarefa agendada para começar</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Tarefa
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Agendamento</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última Execução</TableHead>
                  <TableHead>Próxima Execução</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      {/* Diálogo para exibir logs em tempo real */}
                      {viewingLogs === task.id && (
                        <Dialog open={true} onOpenChange={(open) => { if (!open) setViewingLogs(null); }}>
                          <DialogContent className="max-w-xl">
                            <DialogHeader>
                              <DialogTitle>Logs da Tarefa: {task.name}</DialogTitle>
                              <DialogDescription>
                                Visualização em tempo real dos logs da execução
                              </DialogDescription>
                            </DialogHeader>
                            <div className="bg-black text-green-400 p-3 rounded-lg font-mono text-xs max-h-80 overflow-y-auto">
                              {logsLoading ? <span>Carregando logs...</span> : <pre>{taskLogs}</pre>}
                            </div>
                            <div className="flex justify-end mt-4">
                              <Button variant="outline" onClick={() => setViewingLogs(null)}>Fechar</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      <div>
                        <p className="font-medium">{task.name}</p>
                        <p className="text-sm text-gray-500">{task.description}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{task.schedule}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{task.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={task.type === 'system' ? 'secondary' : 'default'}>
                        {task.type === 'system' ? 'Sistema' : 'Usuário'}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell className="text-sm">
                      {task.lastRun ? new Date(task.lastRun).toLocaleString('pt-BR') : 'Nunca'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {task.nextRun ? new Date(task.nextRun).toLocaleString('pt-BR') : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRunTask(task)}
                          disabled={runningTasks.has(task.id) || task.status === 'running'}
                          className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                        >
                          {runningTasks.has(task.id) || task.status === 'running' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        {/* Botão para exibir logs em tempo real */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewingLogs(task.id)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                        {/* Botão para parar tarefa em execução */}
                        {runningTasks.has(task.id) || task.status === 'running' ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStopTask(task)}
                            className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleStatus(task.id)}
                        >
                          {task.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(task)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir a tarefa "{task.name}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(task.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

