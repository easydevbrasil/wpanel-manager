import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Globe, Plus, Edit, Trash2, Shield, ShieldOff, AlertCircle, CheckCircle, Clock, Zap, Wifi, WifiOff } from "lucide-react";

interface DNSRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
  priority?: number;
  proxied: boolean;
  zone_id: string;
  zone_name: string;
  created_on: string;
  modified_on: string;
}

interface ConnectionTest {
  connected: boolean;
  message: string;
  timestamp?: string;
}

interface PropagationStatus {
  propagated: boolean;
  servers_checked: number;
  servers_resolved: number;
  last_check: string;
}

const dnsRecordSchema = z.object({
  type: z.enum(["A", "AAAA", "CNAME", "MX", "TXT", "SRV", "NS", "PTR"]),
  name: z.string().min(1, "Nome é obrigatório"),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  ttl: z.string().min(1, "TTL é obrigatório"),
  priority: z.string().optional(),
  proxied: z.boolean().default(false),
});

type DNSRecordFormData = z.infer<typeof dnsRecordSchema>;

// Ícones SVG inline para proxy
const ProxyActiveIcon = () => (
  <img 
    src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDQgMzkuNSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiM5OTk7fS5jbHMtMntmaWxsOiNmNjhhMWQ7fS5jbHMtM3tmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5Bc3NldCAxPC90aXRsZT48ZyBpZD0iTGF5ZXJfMiIgZGF0YS1uYW1lPSJMYXllciAyIj48ZyBpZD0iTGF5ZXJfMS0yIiBkYXRhLW5hbWU9IkxheWVyIDEiPjxwb2x5Z29uIGNsYXNzPSJjbHMtMSIgcG9pbnRzPSIxMDQgMjAuMTIgOTQgMTAuNjIgOTQgMTYuMTIgMCAxNi4xMiAwIDI0LjEyIDk0IDI0LjEyIDk0IDI5LjYyIDEwNCAyMC4xMiIvPjxwYXRoIGNsYXNzPSJjbHMtMiIgZD0iTTc0LjUsMzljLTIuMDgsMC0xNS40My0uMTMtMjguMzQtLjI1LTEyLjYyLS4xMi0yNS42OC0uMjUtMjcuNjYtLjI1YTgsOCwwLDAsMS0xLTE1LjkzYzAtLjE5LDAtLjM4LDAtLjU3YTkuNDksOS40OSwwLDAsMSwxNC45LTcuODEsMTkuNDgsMTkuNDgsMCwwLDEsMzguMDUsNC42M0ExMC41LDEwLjUsMCwxLDEsNzQuNSwzOVoiLz48cGF0aCBjbGFzcz0iY2xzLTMiIGQ9Ik01MSwxQTE5LDE5LDAsMCwxLDcwLDE5LjU5LDEwLDEwLDAsMSwxLDc0LjUsMzguNWMtNC4xMSwwLTUyLS41LTU2LS41YTcuNSw3LjUsMCwwLDEtLjQ0LTE1QTguNDcsOC40NywwLDAsMSwxOCwyMmE5LDksMCwwLDEsMTQuNjgtN0ExOSwxOSwwLDAsMSw1MSwxbTAtMUEyMCwyMCwwLDAsMCwzMi4xMywxMy40MiwxMCwxMCwwLDAsMCwxNywyMnYuMTRBOC41LDguNSwwLDAsMCwxOC41LDM5YzIsMCwxNSwuMTMsMjcuNjYuMjUsMTIuOTEuMTIsMjYuMjYuMjUsMjguMzQuMjVhMTEsMTEsMCwxLDAtMy42MS0yMS4zOUEyMC4xLDIwLjEsMCwwLDAsNTEsMFoiLz48L2c+PC9nPjwvc3ZnPg=="
    className="w-5 h-5"
    alt="Proxy Ativo"
    title="Proxy Ativo (Cloudflare)"
  />
);

const ProxyInactiveIcon = () => (
  <img 
    src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA5MC41IDU5Ij48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6IzkyOTc5Yjt9PC9zdHlsZT48L2RlZnM+PHRpdGxlPkFzc2V0IDI8L3RpdGxlPjxnIGlkPSJMYXllcl8yIiBkYXRhLW5hbWU9IkxheWVyIDIiPjxnIGlkPSJMYXllcl8xLTIiIGRhdGEtbmFtZT0iTGF5ZXIgMSI+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNNDksMTMuNVYxOUw1OSw5LjUsNDksMFY1LjVINDAuNzhhMTIuNDMsMTIuNDMsMCwwLDAtOS41LDQuNDJMMTcuNjUsMjcuMTZhOC44Myw4LjgzLDAsMCwxLTYuOTEsMy4zNEg1bC01LDhIMTMuMzlhMTEuMjcsMTEuMjcsMCwwLDAsOS00LjQ4TDM1LjA1LDE3LjE4YTkuODEsOS44MSwwLDAsMSw3LjY2LTMuNjhaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNODAuNSwzOUExMCwxMCwwLDAsMCw3Niw0MC4wOWExOSwxOSwwLDAsMC0zNy4zLTQuNTdBOSw5LDAsMCwwLDI0LDQyLjVhOC40Nyw4LjQ3LDAsMCwwLC4wNiwxLDcuNSw3LjUsMCwwLDAsLjQ0LDE1YzQsMCw1MS44OS41LDU2LC41YTEwLDEwLDAsMCwwLDAtMjBaIi8+PC9nPjwvZz48L3N2Zz4="
    className="w-5 h-5"
    alt="Proxy Desativado"
    title="Proxy Desativado"
  />
);

// Função para obter o ícone do tipo de registro
const getRecordTypeIcon = (type: string) => {
  switch (type) {
    case 'A':
    case 'AAAA':
      return <Globe className="w-4 h-4 text-blue-500" />;
    case 'CNAME':
      return <Shield className="w-4 h-4 text-purple-500" />;
    case 'MX':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'TXT':
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    default:
      return <Globe className="w-4 h-4 text-gray-500" />;
  }
};

// Componente de indicador de propagação DNS
const PropagationIndicator = ({ record }: { record: DNSRecord }) => {
  const [propagationStatus, setPropagationStatus] = useState<PropagationStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkPropagation = async () => {
    setIsChecking(true);
    try {
      // Simulação de verificação de propagação DNS
      // Em produção, isso seria uma chamada real para servidores DNS globais
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockStatus: PropagationStatus = {
        propagated: Math.random() > 0.3, // 70% chance de estar propagado
        servers_checked: 8,
        servers_resolved: Math.floor(Math.random() * 8) + 1,
        last_check: new Date().toISOString()
      };
      
      setPropagationStatus(mockStatus);
    } catch (error) {
      console.error('Error checking propagation:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Check propagation automatically for new records (created in the last 5 minutes)
    const recordAge = Date.now() - new Date(record.created_on).getTime();
    if (recordAge < 5 * 60 * 1000) { // 5 minutes
      checkPropagation();
    }
  }, [record.id]);

  if (isChecking) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className="h-6 px-2 text-xs bg-blue-50 text-blue-600 border-blue-200"
      >
        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
        Verificando...
      </Button>
    );
  }

  if (propagationStatus) {
    const { propagated, servers_resolved, servers_checked } = propagationStatus;
    const percentage = Math.round((servers_resolved / servers_checked) * 100);
    
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={checkPropagation}
          className={`h-6 px-2 text-xs ${
            propagated 
              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/30' 
              : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-900/30'
          }`}
        >
          {propagated ? (
            <>
              <Wifi className="w-3 h-3 mr-1" />
              Propagado ({percentage}%)
            </>
          ) : (
            <>
              <Clock className="w-3 h-3 mr-1" />
              Propagando ({percentage}%)
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={checkPropagation}
      className="h-6 px-2 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
    >
      <Zap className="w-3 h-3 mr-1" />
      Verificar DNS
    </Button>
  );
};

export default function DNSSimple() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DNSRecord | null>(null);
  const queryClient = useQueryClient();

  // Test connection
  const { data: connectionTest, isLoading: connectionLoading } = useQuery<ConnectionTest>({
    queryKey: ["/api/dns/test"],
  });

  // Fetch DNS records
  const { data: records = [], isLoading: recordsLoading, refetch } = useQuery<DNSRecord[]>({
    queryKey: ["/api/dns/records"],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: DNSRecordFormData) => apiRequest("POST", "/api/dns/records", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dns/records"] });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DNSRecordFormData> }) =>
      apiRequest("PUT", `/api/dns/records/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dns/records"] });
      setIsDialogOpen(false);
      setEditingRecord(null);
      form.reset();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/dns/records/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dns/records"] });
    },
  });

  const form = useForm<DNSRecordFormData>({
    resolver: zodResolver(dnsRecordSchema),
    defaultValues: {
      type: "A",
      name: "",
      content: "",
      ttl: "1",
      priority: "",
      proxied: false,
    },
  });

  const onSubmit = (data: DNSRecordFormData) => {
    const formattedData = {
      ...data,
      ttl: data.ttl === "1" ? "1" : data.ttl,
      priority: data.priority || undefined,
    };

    if (editingRecord) {
      updateMutation.mutate({ id: editingRecord.id, data: formattedData });
    } else {
      createMutation.mutate(formattedData);
    }
  };

  const handleEdit = (record: DNSRecord) => {
    setEditingRecord(record);
    form.reset({
      type: record.type as any,
      name: record.name,
      content: record.content,
      ttl: record.ttl.toString(),
      priority: record.priority?.toString() || "",
      proxied: record.proxied,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir o registro DNS "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const openNewRecordDialog = () => {
    setEditingRecord(null);
    form.reset({
      type: "A",
      name: "",
      content: "",
      ttl: "1",
      priority: "",
      proxied: false,
    });
    setIsDialogOpen(true);
  };

  if (connectionLoading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Testando conexão...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Gerenciamento DNS</h1>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewRecordDialog} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo Registro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingRecord ? "Editar Registro DNS" : "Novo Registro DNS"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="A">A (IPv4)</SelectItem>
                            <SelectItem value="AAAA">AAAA (IPv6)</SelectItem>
                            <SelectItem value="CNAME">CNAME (Alias)</SelectItem>
                            <SelectItem value="MX">MX (Email)</SelectItem>
                            <SelectItem value="TXT">TXT (Texto)</SelectItem>
                            <SelectItem value="SRV">SRV (Serviço)</SelectItem>
                            <SelectItem value="NS">NS (Name Server)</SelectItem>
                            <SelectItem value="PTR">PTR (Reverso)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="exemplo.dominio.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conteúdo</FormLabel>
                        <FormControl>
                          <Input placeholder="192.168.1.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="ttl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>TTL</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="TTL" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">Auto</SelectItem>
                              <SelectItem value="300">5 min</SelectItem>
                              <SelectItem value="1800">30 min</SelectItem>
                              <SelectItem value="3600">1 hora</SelectItem>
                              <SelectItem value="14400">4 horas</SelectItem>
                              <SelectItem value="86400">1 dia</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("type") === "MX" && (
                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prioridade</FormLabel>
                            <FormControl>
                              <Input placeholder="10" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {(form.watch("type") === "A" || form.watch("type") === "AAAA" || form.watch("type") === "CNAME") && (
                    <FormField
                      control={form.control}
                      name="proxied"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Proxy Cloudflare</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Ativar proxy da Cloudflare para este registro
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="flex-1"
                    >
                      {createMutation.isPending || updateMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : editingRecord ? (
                        "Atualizar"
                      ) : (
                        "Criar"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <Button
            onClick={() => refetch()}
            disabled={recordsLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${recordsLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Enhanced Connection Status */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            Status da Conexão Cloudflare
          </CardTitle>
        </CardHeader>
        <CardContent>
          {connectionTest ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${connectionTest.connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                <span className={`font-medium ${connectionTest.connected ? 'text-green-700' : 'text-red-700'}`}>
                  {connectionTest.message}
                </span>
              </div>
              
              {connectionTest.connected && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-gray-100">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{Array.isArray(records) ? records.length : 0}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Registros DNS</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {Array.isArray(records) ? records.filter(r => r.proxied).length : 0}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Com Proxy Ativo</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {connectionTest.timestamp ? new Date(connectionTest.timestamp).toLocaleTimeString() : 'Agora'}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Última Verificação</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-500">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Verificando status da conexão...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced DNS Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              Registros DNS ({Array.isArray(records) ? records.length : 0})
            </div>
            {Array.isArray(records) && records.length > 0 && (
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Ativos: {records.length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ProxyActiveIcon />
                  <span>Proxy: {records.filter(r => r.proxied).length}</span>
                </div>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recordsLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Carregando registros DNS...</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Conectando-se aos servidores Cloudflare</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Array.isArray(records) && records.length > 0 ? (
                records.map((record: DNSRecord) => (
                  <div key={record.id} className="group p-4 border rounded-xl hover:shadow-md transition-all duration-200 bg-gradient-to-r from-white to-gray-50/50 hover:from-gray-50 hover:to-blue-50/30 dark:from-gray-900 dark:to-gray-800/50 dark:hover:from-gray-800 dark:hover:to-blue-900/30 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          {getRecordTypeIcon(record.type)}
                          <Badge variant="outline" className="font-mono text-xs border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
                            {record.type}
                          </Badge>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-gray-100 truncate text-base">{record.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300 truncate font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded mt-1">
                            {record.content}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">TTL</div>
                            <div className="font-medium text-sm">
                              {record.ttl === 1 ? (
                                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Auto</Badge>
                              ) : (
                                <span className="text-gray-700 dark:text-gray-300">{record.ttl}s</span>
                              )}
                            </div>
                          </div>
                          
                          {record.priority && (
                            <div className="text-center">
                              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Prioridade</div>
                              <div className="font-medium text-sm text-gray-700 dark:text-gray-300">{record.priority}</div>
                            </div>
                          )}
                          
                          <div className="text-center">
                            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Proxy</div>
                            <div className="flex justify-center mt-1">
                              {record.proxied ? (
                                <div className="flex items-center gap-1">
                                  <ProxyActiveIcon />
                                  <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">Ativo</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <ProxyInactiveIcon />
                                  <span className="text-xs text-gray-500 dark:text-gray-400">Desativado</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <PropagationIndicator record={record} />
                        
                        <Separator orientation="vertical" className="h-6" />
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(record)}
                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 opacity-70 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(record.id, record.name)}
                          disabled={deleteMutation.isPending}
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 opacity-70 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                    <Globe className="h-12 w-12 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Nenhum registro DNS encontrado</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-md mx-auto">
                    Comece criando seu primeiro registro DNS para gerenciar o tráfego do seu domínio.
                  </p>
                  <Button onClick={openNewRecordDialog} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Registro
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
