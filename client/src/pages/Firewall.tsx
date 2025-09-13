import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  ShieldCheck, 
  ShieldX, 
  ShieldOff,
  Plus, 
  Trash2, 
  RefreshCw, 
  RotateCcw,
  Loader2,
  AlertTriangle,
  Network,
  Lock,
  Unlock,
  Eye,
  Settings,
  Download,
  Upload,
  Server,
  Globe,
  Edit
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FirewallRule {
  id: string;
  chain: string;
  target: string;
  protocol?: string;
  source?: string;
  destination?: string;
  port?: string;
  interface?: string;
  state?: string;
  comment?: string;
  line_number: number;
  rule_text: string;
  is_custom: boolean;
}

interface FirewallStats {
  total_rules: number;
  allow_rules: number;
  deny_rules: number;
  custom_rules: number;
  protected_ports: string[];
  status: 'active' | 'inactive';
}

interface FirewallServiceStatus {
  service_status: string;
  is_active: boolean;
  rule_count: number;
  timestamp: string;
}

interface NetworkInterface {
  name: string;
  ip: string;
  state: string;
  type: string;
  flags: string[];
}

interface NewRuleForm {
  action: 'ACCEPT' | 'DROP' | 'REJECT';
  protocol: 'tcp' | 'udp' | 'icmp' | 'all';
  source_ip: string;
  destination_ip: string;
  port: string;
  interface: string;
  comment: string;
}

const PROTECTED_PORTS = ['22', '80', '443', '25', '587', '993', '995'];
const COMMON_PORTS = [
  { port: '22', service: 'SSH' },
  { port: '80', service: 'HTTP' },
  { port: '443', service: 'HTTPS' },
  { port: '25', service: 'SMTP' },
  { port: '587', service: 'SMTP Submission' },
  { port: '993', service: 'IMAPS' },
  { port: '995', service: 'POP3S' },
  { port: '21', service: 'FTP' },
  { port: '53', service: 'DNS' },
  { port: '3306', service: 'MySQL' },
  { port: '5432', service: 'PostgreSQL' },
  { port: '6379', service: 'Redis' },
  { port: '27017', service: 'MongoDB' },
];

// Function to convert technical iptables rule to user-friendly description
const formatRuleDescription = (rule: FirewallRule): string => {
  const { target, protocol, source, destination, port, interface: iface, state } = rule;
  
  let description = "";
  
  // Action description
  switch (target?.toUpperCase()) {
    case 'ACCEPT':
      description = "Permitir";
      break;
    case 'DROP':
      description = "Bloquear silenciosamente";
      break;
    case 'REJECT':
      description = "Rejeitar";
      break;
    default:
      description = target || "Ação desconhecida";
  }
  
  // Protocol
  if (protocol && protocol !== 'all') {
    description += ` conexões ${protocol.toUpperCase()}`;
  } else {
    description += " todas as conexões";
  }
  
  // Port
  if (port) {
    const portInfo = COMMON_PORTS.find(p => p.port === port);
    if (portInfo) {
      description += ` na porta ${port} (${portInfo.service})`;
    } else {
      description += ` na porta ${port}`;
    }
  }
  
  // Source
  if (source && source !== '0.0.0.0/0' && source !== 'anywhere') {
    description += ` vindas de ${source}`;
  }
  
  // Destination
  if (destination && destination !== '0.0.0.0/0' && destination !== 'anywhere') {
    description += ` para ${destination}`;
  }
  
  // Interface
  if (iface) {
    description += ` via interface ${iface}`;
  }
  
  // State
  if (state) {
    description += ` (estado: ${state})`;
  }
  
  return description;
};

export default function Firewall() {
  const [isAddRuleDialogOpen, setIsAddRuleDialogOpen] = useState(false);
  const [isEditRuleDialogOpen, setIsEditRuleDialogOpen] = useState(false);
  const [isQuickActionDialogOpen, setIsQuickActionDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<FirewallRule | null>(null);
  const [editingRule, setEditingRule] = useState<FirewallRule | null>(null);
  const [quickActionType, setQuickActionType] = useState<'block' | 'allow'>('block');
  const [quickActionTarget, setQuickActionTarget] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [newRule, setNewRule] = useState<NewRuleForm>({
    action: 'ACCEPT',
    protocol: 'tcp',
    source_ip: '',
    destination_ip: '',
    port: '',
    interface: '',
    comment: '',
  });

  const [editRule, setEditRule] = useState<NewRuleForm>({
    action: 'ACCEPT',
    protocol: 'tcp',
    source_ip: '',
    destination_ip: '',
    port: '',
    interface: '',
    comment: '',
  });

  // Fetch firewall rules
  const { data: rules = [], isLoading: isLoadingRules, refetch: refetchRules } = useQuery<FirewallRule[]>({
    queryKey: ["/api/firewall/rules"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch firewall stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<FirewallStats>({
    queryKey: ["/api/firewall/stats"],
    refetchInterval: 30000,
  });

  // Fetch firewall service status
  const { data: serviceStatus, isLoading: isLoadingServiceStatus, refetch: refetchServiceStatus } = useQuery<FirewallServiceStatus>({
    queryKey: ["/api/firewall/status"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch network interfaces
  const { data: interfaces = [], isLoading: isLoadingInterfaces } = useQuery<NetworkInterface[]>({
    queryKey: ["/api/firewall/interfaces"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Set default interface when dialog opens (simplified)
  // useEffect(() => {
  //   if (isAddRuleDialogOpen && interfaces.length > 0) {
  //     const defaultInterface = interfaces.find(iface => iface.name === 'eth0') || interfaces[0];
  //     if (defaultInterface && !newRule.interface) {
  //       setNewRule(prev => ({ ...prev, interface: defaultInterface.name }));
  //     }
  //   }
  // }, [isAddRuleDialogOpen]);

  // Function to reset form with default interface
  const resetFormWithDefaults = () => {
    setNewRule({
      action: 'ACCEPT',
      protocol: 'tcp',
      source_ip: '',
      destination_ip: '',
      port: '',
      interface: '',
      comment: '',
    });
  };

  // Add rule mutation
  const addRuleMutation = useMutation({
    mutationFn: (ruleData: NewRuleForm) => apiRequest("POST", "/api/firewall/rules", ruleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/firewall/rules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/firewall/stats"] });
      setIsAddRuleDialogOpen(false);
      resetFormWithDefaults();
      toast({
        title: "Regra adicionada",
        description: "A regra de firewall foi adicionada com sucesso.",
      });
      // Auto-save after adding rule
      autoSaveRules();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao adicionar regra de firewall.",
        variant: "destructive",
      });
    },
  });

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: (ruleId: string) => apiRequest("DELETE", `/api/firewall/rules/${ruleId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/firewall/rules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/firewall/stats"] });
      toast({
        title: "Regra removida",
        description: "A regra de firewall foi removida com sucesso.",
      });
      // Auto-save after deleting rule
      autoSaveRules();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao remover regra de firewall.",
        variant: "destructive",
      });
    },
  });

  // Edit rule mutation
  const editRuleMutation = useMutation({
    mutationFn: ({ ruleId, ruleData }: { ruleId: string; ruleData: NewRuleForm }) => 
      apiRequest("PUT", `/api/firewall/rules/${ruleId}`, ruleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/firewall/rules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/firewall/stats"] });
      setIsEditRuleDialogOpen(false);
      setEditingRule(null);
      toast({
        title: "Regra atualizada",
        description: "A regra de firewall foi atualizada com sucesso.",
      });
      // Auto-save after editing rule
      autoSaveRules();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar regra de firewall.",
        variant: "destructive",
      });
    },
  });

  // Quick action mutation (block/allow IP)
  const quickActionMutation = useMutation({
    mutationFn: ({ action, target }: { action: 'block' | 'allow', target: string }) => 
      apiRequest("POST", "/api/firewall/quick-action", { action, target }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/firewall/rules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/firewall/stats"] });
      setIsQuickActionDialogOpen(false);
      setQuickActionTarget('');
      toast({
        title: "Ação executada",
        description: `IP ${quickActionTarget} foi ${quickActionType === 'block' ? 'bloqueado' : 'liberado'} com sucesso.`,
      });
      // Auto-save after quick action
      autoSaveRules();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao executar ação rápida.",
        variant: "destructive",
      });
    },
  });

  // Flush rules mutation
  const flushRulesMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/firewall/flush"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/firewall/rules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/firewall/stats"] });
      toast({
        title: "Regras limpas",
        description: "Todas as regras personalizadas foram removidas.",
      });
      // Auto-save after flushing rules
      autoSaveRules();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao limpar regras.",
        variant: "destructive",
      });
    },
  });

  // Auto-save function
  const autoSaveRules = async () => {
    try {
      await apiRequest("POST", "/api/firewall/save");
      console.log("Rules auto-saved successfully");
    } catch (error) {
      console.warn("Auto-save failed:", error);
      // Silent fail for auto-save to not interrupt user experience
    }
  };

  // Save rules mutation (kept for manual saves if needed)
  const saveRulesMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/firewall/save"),
    onSuccess: () => {
      toast({
        title: "Regras salvas",
        description: "As regras de firewall foram salvas permanentemente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao salvar regras.",
        variant: "destructive",
      });
    },
  });

  // Enable firewall mutation
  const enableFirewallMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/firewall/enable"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/firewall/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/firewall/rules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/firewall/stats"] });
      toast({
        title: "Firewall ativado",
        description: "O firewall foi ativado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao ativar firewall.",
        variant: "destructive",
      });
    },
  });

  // Disable firewall mutation
  const disableFirewallMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/firewall/disable"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/firewall/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/firewall/rules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/firewall/stats"] });
      toast({
        title: "Firewall desativado",
        description: "O firewall foi desativado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao desativar firewall.",
        variant: "destructive",
      });
    },
  });

  // Restart firewall mutation
  const restartFirewallMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/firewall/restart"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/firewall/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/firewall/rules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/firewall/stats"] });
      toast({
        title: "Firewall reiniciado",
        description: "O firewall foi reiniciado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao reiniciar firewall.",
        variant: "destructive",
      });
    },
  });

  const handleAddRule = () => {
    // Validate protected ports
    if (newRule.action === 'DROP' || newRule.action === 'REJECT') {
      if (PROTECTED_PORTS.includes(newRule.port)) {
        toast({
          title: "Porta protegida",
          description: `A porta ${newRule.port} é protegida e não pode ser bloqueada.`,
          variant: "destructive",
        });
        return;
      }
    }

    addRuleMutation.mutate(newRule);
  };

  const handleQuickAction = () => {
    if (!quickActionTarget.trim()) {
      toast({
        title: "IP inválido",
        description: "Por favor, insira um endereço IP válido.",
        variant: "destructive",
      });
      return;
    }

    quickActionMutation.mutate({ action: quickActionType, target: quickActionTarget.trim() });
  };

  const handleDeleteRule = (rule: FirewallRule) => {
    if (!rule.is_custom) {
      toast({
        title: "Regra protegida",
        description: "Esta regra do sistema não pode ser removida.",
        variant: "destructive",
      });
      return;
    }

    deleteRuleMutation.mutate(rule.id);
  };

  const handleEditRule = (rule: FirewallRule) => {
    if (!rule.is_custom) {
      toast({
        title: "Regra protegida",
        description: "Esta regra do sistema não pode ser editada.",
        variant: "destructive",
      });
      return;
    }

    setEditingRule(rule);
    setEditRule({
      action: rule.target as 'ACCEPT' | 'DROP' | 'REJECT',
      protocol: (rule.protocol || 'tcp') as 'tcp' | 'udp' | 'icmp' | 'all',
      source_ip: rule.source || '',
      destination_ip: rule.destination || '',
      port: rule.port || '',
      interface: rule.interface || '',
      comment: rule.comment || '',
    });
    setIsEditRuleDialogOpen(true);
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'ACCEPT': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'DROP': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'REJECT': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'ACCEPT': return <ShieldCheck className="w-4 h-4" />;
      case 'DROP': return <ShieldX className="w-4 h-4" />;
      case 'REJECT': return <ShieldX className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getProtocolIcon = (protocol: string) => {
    switch (protocol?.toLowerCase()) {
      case 'tcp': return <Server className="w-4 h-4" />;
      case 'udp': return <Download className="w-4 h-4" />;
      case 'icmp': return <Network className="w-4 h-4" />;
      case 'http':
      case 'https': return <Globe className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const getPortIcon = (port: string) => {
    const commonPort = COMMON_PORTS.find(p => p.port === port);
    if (commonPort) {
      switch (commonPort.service.toLowerCase()) {
        case 'ssh': return <Lock className="w-4 h-4" />;
        case 'http': return <Globe className="w-4 h-4" />;
        case 'https': return <Lock className="w-4 h-4" />;
        case 'smtp':
        case 'smtp submission': return <Upload className="w-4 h-4" />;
        case 'imaps':
        case 'pop3s': return <Download className="w-4 h-4" />;
        case 'ftp': return <Upload className="w-4 h-4" />;
        case 'dns': return <Network className="w-4 h-4" />;
        case 'mysql':
        case 'postgresql':
        case 'redis':
        case 'mongodb': return <Server className="w-4 h-4" />;
        default: return <Settings className="w-4 h-4" />;
      }
    }
    
    // Protected ports get a special icon
    if (PROTECTED_PORTS.includes(port)) {
      return <Lock className="w-4 h-4" />;
    }
    
    return <Settings className="w-4 h-4" />;
  };

  const getRuleTypeIcon = (isCustom: boolean) => {
    return isCustom ? <Edit className="w-4 h-4" /> : <Shield className="w-4 h-4" />;
  };

  return (
    <div className="w-full max-w-full p-6 space-y-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground">
            Firewall Controller
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie regras de iptables e controle o tráfego de rede
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => refetchRules()}
            disabled={isLoadingRules}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingRules ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Warning Alert */}
      <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
        <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        <AlertDescription className="text-yellow-800 dark:text-yellow-300">
          <strong>Atenção:</strong> As portas 22 (SSH), 80 (HTTP), 443 (HTTPS), 25 (SMTP), 587, 993 e 995 são protegidas contra bloqueio para evitar perda de acesso.
        </AlertDescription>
      </Alert>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Status do Firewall
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {serviceStatus?.is_active ? (
                    <span className="text-green-500">Ativo</span>
                  ) : (
                    <span className="text-red-500">Inativo</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Serviço: {serviceStatus?.service_status || "Desconhecido"}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${serviceStatus?.is_active ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                {serviceStatus?.is_active ? 
                  <Shield className="w-6 h-6 text-green-600 dark:text-green-400" /> :
                  <ShieldX className="w-6 h-6 text-red-600 dark:text-red-400" />
                }
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={serviceStatus?.is_active ? "secondary" : "default"}
                onClick={() => enableFirewallMutation.mutate()}
                disabled={enableFirewallMutation.isPending || serviceStatus?.is_active}
                title="Ativar Firewall"
                className="px-2"
              >
                {enableFirewallMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant={serviceStatus?.is_active ? "destructive" : "secondary"}
                onClick={() => disableFirewallMutation.mutate()}
                disabled={disableFirewallMutation.isPending || !serviceStatus?.is_active}
                title="Desativar Firewall"
                className="px-2"
              >
                {disableFirewallMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldOff className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => restartFirewallMutation.mutate()}
                disabled={restartFirewallMutation.isPending}
                title="Reiniciar Firewall"
                className="px-2"
              >
                {restartFirewallMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total de Regras
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {stats?.total_rules || 0}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Regras de Permissão
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats?.allow_rules || 0}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                <Unlock className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Regras de Bloqueio
                </p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats?.deny_rules || 0}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                <Lock className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <Dialog open={isQuickActionDialogOpen} onOpenChange={setIsQuickActionDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Ação Rápida
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Ação Rápida</DialogTitle>
              <DialogDescription>
                Bloqueie ou libere rapidamente um endereço IP
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="quick-action">Ação</Label>
                <Select value={quickActionType} onValueChange={(value: 'block' | 'allow') => setQuickActionType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="block" className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <ShieldX className="w-4 h-4 text-red-500" />
                        Bloquear IP
                      </div>
                    </SelectItem>
                    <SelectItem value="allow" className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                        Liberar IP
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quick-target">Endereço IP</Label>
                <Input
                  id="quick-target"
                  placeholder="192.168.1.100"
                  value={quickActionTarget}
                  onChange={(e) => setQuickActionTarget(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsQuickActionDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleQuickAction}
                  disabled={quickActionMutation.isPending}
                  className={`flex items-center gap-2 ${quickActionType === 'block' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {quickActionType === 'block' ? (
                    <>
                      <ShieldX className="w-4 h-4" />
                      Bloquear
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Liberar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isAddRuleDialogOpen} onOpenChange={setIsAddRuleDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Nova Regra
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Regra</DialogTitle>
              <DialogDescription>
                Crie uma nova regra de firewall personalizada
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="action">Ação</Label>
                  <Select value={newRule.action} onValueChange={(value: 'ACCEPT' | 'DROP' | 'REJECT') => setNewRule(prev => ({ ...prev, action: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACCEPT">ACCEPT (Permitir)</SelectItem>
                      <SelectItem value="DROP">DROP (Descartar)</SelectItem>
                      <SelectItem value="REJECT">REJECT (Rejeitar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="protocol">Protocolo</Label>
                  <Select value={newRule.protocol} onValueChange={(value: 'tcp' | 'udp' | 'icmp' | 'all') => setNewRule(prev => ({ ...prev, protocol: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tcp">TCP</SelectItem>
                      <SelectItem value="udp">UDP</SelectItem>
                      <SelectItem value="icmp">ICMP</SelectItem>
                      <SelectItem value="all">Todos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="source_ip">IP de Origem</Label>
                  <Input
                    id="source_ip"
                    placeholder="0.0.0.0/0 ou IP específico"
                    value={newRule.source_ip}
                    onChange={(e) => setNewRule(prev => ({ ...prev, source_ip: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="destination_ip">IP de Destino</Label>
                  <Input
                    id="destination_ip"
                    placeholder="0.0.0.0/0 ou IP específico"
                    value={newRule.destination_ip}
                    onChange={(e) => setNewRule(prev => ({ ...prev, destination_ip: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="port">Porta</Label>
                  <Input
                    id="port"
                    placeholder="80, 443, 22-80, etc."
                    value={newRule.port}
                    onChange={(e) => setNewRule(prev => ({ ...prev, port: e.target.value }))}
                  />
                  {PROTECTED_PORTS.includes(newRule.port) && (newRule.action === 'DROP' || newRule.action === 'REJECT') && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      ⚠️ Esta porta é protegida e não pode ser bloqueada
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="interface">Interface</Label>
                  <Select 
                    value={newRule.interface || 'all'} 
                    onValueChange={(value) => setNewRule(prev => ({ ...prev, interface: value === 'all' ? '' : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma interface" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as interfaces</SelectItem>
                      {interfaces && interfaces.map((iface) => (
                        <SelectItem key={iface.name} value={iface.name}>
                          {iface.name} ({iface.ip || 'Sem IP'}) - {iface.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="comment">Comentário</Label>
                <Input
                  id="comment"
                  placeholder="Descrição da regra (opcional)"
                  value={newRule.comment}
                  onChange={(e) => setNewRule(prev => ({ ...prev, comment: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddRuleDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleAddRule}
                  disabled={addRuleMutation.isPending}
                >
                  Adicionar Regra
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Rule Dialog */}
        <Dialog open={isEditRuleDialogOpen} onOpenChange={setIsEditRuleDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Editar Regra de Firewall</DialogTitle>
              <DialogDescription>
                Modifique a regra de firewall existente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-action">Ação</Label>
                  <Select value={editRule.action} onValueChange={(value: 'ACCEPT' | 'DROP' | 'REJECT') => setEditRule(prev => ({ ...prev, action: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACCEPT">ACCEPT (Permitir)</SelectItem>
                      <SelectItem value="DROP">DROP (Descartar)</SelectItem>
                      <SelectItem value="REJECT">REJECT (Rejeitar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-protocol">Protocolo</Label>
                  <Select value={editRule.protocol} onValueChange={(value: 'tcp' | 'udp' | 'icmp' | 'all') => setEditRule(prev => ({ ...prev, protocol: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tcp">TCP</SelectItem>
                      <SelectItem value="udp">UDP</SelectItem>
                      <SelectItem value="icmp">ICMP</SelectItem>
                      <SelectItem value="all">Todos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-source_ip">IP de Origem</Label>
                  <Input
                    id="edit-source_ip"
                    placeholder="0.0.0.0/0 ou IP específico"
                    value={editRule.source_ip}
                    onChange={(e) => setEditRule(prev => ({ ...prev, source_ip: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-destination_ip">IP de Destino</Label>
                  <Input
                    id="edit-destination_ip"
                    placeholder="0.0.0.0/0 ou IP específico"
                    value={editRule.destination_ip}
                    onChange={(e) => setEditRule(prev => ({ ...prev, destination_ip: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-port">Porta</Label>
                  <Input
                    id="edit-port"
                    placeholder="80, 443, 22-80, etc."
                    value={editRule.port}
                    onChange={(e) => setEditRule(prev => ({ ...prev, port: e.target.value }))}
                  />
                  {PROTECTED_PORTS.includes(editRule.port) && (editRule.action === 'DROP' || editRule.action === 'REJECT') && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      ⚠️ Esta porta é protegida e não pode ser bloqueada
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="edit-interface">Interface</Label>
                  <Select 
                    value={editRule.interface || 'all'} 
                    onValueChange={(value) => setEditRule(prev => ({ ...prev, interface: value === 'all' ? '' : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma interface" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as interfaces</SelectItem>
                      {interfaces && interfaces.map((iface) => (
                        <SelectItem key={iface.name} value={iface.name}>
                          {iface.name} ({iface.ip || 'Sem IP'}) - {iface.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-comment">Comentário</Label>
                <Input
                  id="edit-comment"
                  placeholder="Descrição da regra (opcional)"
                  value={editRule.comment}
                  onChange={(e) => setEditRule(prev => ({ ...prev, comment: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditRuleDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={() => {
                    if (editingRule) {
                      editRuleMutation.mutate({ 
                        ruleId: editingRule.id, 
                        ruleData: editRule 
                      });
                    }
                  }}
                  disabled={editRuleMutation.isPending || PROTECTED_PORTS.includes(editRule.port) && (editRule.action === 'DROP' || editRule.action === 'REJECT')}
                >
                  {editRuleMutation.isPending ? "Atualizando..." : "Atualizar Regra"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Button 
          variant="destructive" 
          onClick={() => flushRulesMutation.mutate()}
          disabled={flushRulesMutation.isPending}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Limpar Regras Personalizadas
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Regras Ativas
          </TabsTrigger>
          <TabsTrigger value="interfaces" className="flex items-center gap-2">
            <Network className="w-4 h-4" />
            Interfaces
          </TabsTrigger>
          <TabsTrigger value="common-ports" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Portas Comuns
          </TabsTrigger>
          <TabsTrigger value="protected" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Portas Protegidas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regras de Firewall Ativas</CardTitle>
              <CardDescription>
                Lista de todas as regras iptables atualmente configuradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRules ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  Carregando regras...
                </div>
              ) : rules.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Nenhuma regra encontrada
                </div>
              ) : (
                <div className="space-y-2">
                  {rules.map((rule) => (
                    <div 
                      key={rule.id}
                      className="flex flex-col lg:flex-row lg:items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 gap-4"
                    >
                      <div className="flex flex-col gap-3 flex-1 min-w-0">
                        {/* Header badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={getActionBadgeColor(rule.target)}>
                            {getActionIcon(rule.target)}
                            {rule.target}
                          </Badge>
                          <Badge variant="outline">{rule.chain}</Badge>
                          
                          {rule.is_custom ? (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 flex items-center gap-1">
                              {getRuleTypeIcon(rule.is_custom)}
                              Personalizada
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 flex items-center gap-1">
                              {getRuleTypeIcon(rule.is_custom)}
                              Sistema
                            </Badge>
                          )}
                        </div>
                        
                        {/* Rule description */}
                        <div className="min-w-0">
                          <p className="text-sm text-foreground break-words">
                            {formatRuleDescription(rule)}
                          </p>
                        </div>

                        {/* Additional info badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          {rule.protocol && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              {getProtocolIcon(rule.protocol)}
                              {rule.protocol.toUpperCase()}
                            </Badge>
                          )}
                          {rule.port && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              {getPortIcon(rule.port)}
                              :{rule.port}
                            </Badge>
                          )}
                          {rule.interface && (
                            <Badge variant="outline" className="flex items-center gap-1 text-xs">
                              <Network className="w-3 h-3" />
                              {rule.interface}
                            </Badge>
                          )}
                          {(rule.source && rule.source !== '0.0.0.0/0' && rule.source !== 'anywhere') && (
                            <Badge variant="outline" className="flex items-center gap-1 text-xs">
                              <Upload className="w-3 h-3" />
                              <span className="truncate max-w-[120px]" title={rule.source}>{rule.source}</span>
                            </Badge>
                          )}
                          {(rule.destination && rule.destination !== '0.0.0.0/0' && rule.destination !== 'anywhere') && (
                            <Badge variant="outline" className="flex items-center gap-1 text-xs">
                              <Download className="w-3 h-3" />
                              <span className="truncate max-w-[120px]" title={rule.destination}>{rule.destination}</span>
                            </Badge>
                          )}
                        </div>

                        {/* Comment */}
                        {rule.comment && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1 break-words">
                            <Eye className="w-3 h-3 flex-shrink-0" />
                            <span>Comentário: {rule.comment}</span>
                          </p>
                        )}

                        {/* Technical details */}
                        <details className="group">
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
                            <Settings className="w-3 h-3" />
                            Ver comando técnico
                          </summary>
                          <div className="mt-2 overflow-hidden">
                            <p className="font-mono text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto break-all">
                              {rule.rule_text}
                            </p>
                          </div>
                        </details>
                      </div>

                      {/* Action buttons */}
                      {rule.is_custom && (
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRule(rule)}
                            disabled={editRuleMutation.isPending}
                            className="flex items-center gap-1"
                          >
                            <Edit className="w-4 h-4" />
                            <span className="hidden sm:inline">Editar</span>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteRule(rule)}
                            disabled={deleteRuleMutation.isPending}
                            className="flex items-center gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Remover</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interfaces" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Interfaces de Rede</CardTitle>
              <CardDescription>
                Lista de todas as interfaces de rede disponíveis no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingInterfaces ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  Carregando interfaces...
                </div>
              ) : interfaces.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Nenhuma interface encontrada
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {interfaces.map((iface) => (
                    <Card key={iface.name} className="border-2">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-lg">{iface.name}</h3>
                          <Badge 
                            className={
                              iface.state === 'UP' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            }
                          >
                            {iface.state}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Network className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">
                              IP: {iface.ip || 'Não atribuído'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4 text-gray-500" />
                            <span className="text-sm capitalize">
                              Tipo: {iface.type}
                            </span>
                          </div>
                          
                          {iface.flags && iface.flags.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Flags:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {iface.flags.map((flag) => (
                                  <Badge 
                                    key={flag} 
                                    variant="outline" 
                                    className="text-xs"
                                  >
                                    {flag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="common-ports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portas Comuns</CardTitle>
              <CardDescription>
                Referência de portas comumente utilizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {COMMON_PORTS.map((item) => (
                  <div key={item.port} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                        {getPortIcon(item.port)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground flex items-center gap-1">
                          <span>Porta {item.port}</span>
                          {PROTECTED_PORTS.includes(item.port) && (
                            <Lock className="w-4 h-4 text-yellow-500" />
                          )}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.service}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setQuickActionType('block');
                          setNewRule(prev => ({ ...prev, port: item.port, action: 'DROP' }));
                          setIsAddRuleDialogOpen(true);
                        }}
                        disabled={PROTECTED_PORTS.includes(item.port)}
                        className="flex items-center gap-1"
                      >
                        <ShieldX className="w-4 h-4" />
                        Bloquear
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setQuickActionType('allow');
                          setNewRule(prev => ({ ...prev, port: item.port, action: 'ACCEPT' }));
                          setIsAddRuleDialogOpen(true);
                        }}
                        className="flex items-center gap-1"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Permitir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="protected" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portas Protegidas</CardTitle>
              <CardDescription>
                Estas portas são protegidas contra bloqueio para manter o acesso ao sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PROTECTED_PORTS.map((port) => {
                  const service = COMMON_PORTS.find(p => p.port === port);
                  return (
                    <div key={port} className="flex items-center justify-between p-3 border rounded-lg bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/40">
                          {getPortIcon(port)}
                        </div>
                        <div>
                          <p className="font-semibold text-green-800 dark:text-green-300 flex items-center gap-1">
                            <span>Porta {port}</span>
                            <Lock className="w-4 h-4" />
                          </p>
                          <p className="text-sm text-green-600 dark:text-green-400">
                            {service?.service || 'Serviço Protegido'}
                          </p>
                        </div>
                      </div>
                      <ShieldCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
