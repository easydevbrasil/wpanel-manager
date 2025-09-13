import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Server, Plus, Edit, Trash2, Globe, ExternalLink, AlertCircle, CheckCircle, FileText, Save, RotateCcw, Moon, Sun, Shield, Lock, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// import Editor from '@monaco-editor/react';
// import { useColorTheme } from "@/hooks/useColorTheme";
// import { useMonacoNginx } from "@/hooks/useMonacoNginx";

interface NginxHost {
  id: string;
  filename: string;
  subdomain: string;
  serverName: string;
  port: number;
  createdAt: string;
  modifiedAt: string;
}

const hostSchema = z.object({
  subdomain: z.string()
    .min(1, "Subdomínio é obrigatório")
    .regex(/^[a-zA-Z0-9-]+$/, "Subdomínio pode conter apenas letras, números e hífens"),
  port: z.string()
    .min(1, "Porta é obrigatória")
    .regex(/^\d+$/, "Porta deve ser um número")
    .refine((val) => {
      const num = parseInt(val);
      return num >= 1 && num <= 65535;
    }, "Porta deve estar entre 1 e 65535"),
});

type HostFormData = z.infer<typeof hostSchema>;

interface SSLInfo {
  issued: boolean;
  configuredInHost?: boolean;
  domain: string;
  domains?: string[];
  certPath?: string;
  keyPath?: string;
  validUntil?: string;
  expirationDate?: string;
  daysUntilExpiry?: number;
  issuer?: string;
  validFrom?: string;
  status: 'not-issued' | 'valid' | 'expiring-soon' | 'expired' | 'configured-but-missing' | 'available-not-configured';
}

export default function NginxHosts() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHost, setEditingHost] = useState<NginxHost | null>(null);
  const [hostConfig, setHostConfig] = useState<string>("");
  const [editedConfig, setEditedConfig] = useState<string>("");
  const [configHasChanges, setConfigHasChanges] = useState(false);
  const [sslInfo, setSslInfo] = useState<SSLInfo | null>(null);
  const [sslLoading, setSslLoading] = useState(false);
  const [sslDialogOpen, setSslDialogOpen] = useState(false);
  const [sslFormData, setSslFormData] = useState({
    email: '',
    cloudflareApiToken: '',
    cloudflareZoneId: ''
  });
  const [editorTheme, setEditorTheme] = useState<'light' | 'dark'>('dark');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Initialize Monaco Nginx support
  // useMonacoNginx();

  // Fetch nginx hosts
  const { data: hosts = [], isLoading, refetch } = useQuery<NginxHost[]>({
    queryKey: ["/api/nginx/hosts"],
  });

    // Query para buscar detalhes específicos do host quando editando
  const { data: hostDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ["nginx-host-details", editingHost?.id],
    queryFn: async () => {
      if (!editingHost) return null;
      
      const response = await fetch(`/api/nginx/hosts/${editingHost.id}`, {
        headers: {
          "session-token": localStorage.getItem("sessionToken") || "",
        },
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar host: ${response.status}`);
      }
      
      return response.json();
    },
    enabled: !!editingHost,
  });

  // Reset states when editingHost changes
  useEffect(() => {
    if (editingHost) {
      // Reset config when changing hosts
      setHostConfig("");
      setEditedConfig("");
      setConfigHasChanges(false);
    }
  }, [editingHost?.id]);

  // Efeito para atualizar configuração quando dados chegam
  useEffect(() => {
    if (hostDetails?.content) {
      setHostConfig(hostDetails.content);
      setEditedConfig(hostDetails.content);
      setConfigHasChanges(false);
    } else if (hostDetails && !hostDetails.content) {
      // If no content, set empty string
      setHostConfig("");
      setEditedConfig("");
      setConfigHasChanges(false);
    }
  }, [hostDetails]);

  // Monitor changes in edited config
  useEffect(() => {
    setConfigHasChanges(editedConfig !== hostConfig && editedConfig.trim() !== "");
  }, [editedConfig, hostConfig]);

  // Sync editor theme with app theme
  useEffect(() => {
    // setEditorTheme(colorTheme === 'dark' ? 'dark' : 'light');
    // For now, detect based on body class or default to dark
    setEditorTheme('dark');
  }, []);

  // Fetch SSL info when host changes
  const fetchSslInfo = async (hostId: string) => {
    setSslLoading(true);
    try {
      const response = await fetch(`/api/nginx/hosts/${hostId}/ssl`);
      if (response.ok) {
        const data = await response.json();
        setSslInfo(data);
      } else {
        setSslInfo(null);
      }
    } catch (error) {
      console.error('Erro ao buscar informações SSL:', error);
      setSslInfo(null);
    } finally {
      setSslLoading(false);
    }
  };

  // Issue SSL certificate
  const issueSSL = async (hostId: string) => {
    setSslLoading(true);
    try {
      const response = await fetch(`/api/nginx/hosts/${hostId}/ssl/issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sslFormData)
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Sucesso",
          description: `Certificado SSL emitido com sucesso usando ${result.challengeType}`,
        });
        await fetchSslInfo(hostId);
        setSslDialogOpen(false);
        setSslFormData({ email: '', cloudflareApiToken: '', cloudflareZoneId: '' });
      } else {
        const error = await response.text();
        toast({
          variant: "destructive",
          title: "Erro",
          description: `Erro ao emitir certificado SSL: ${error}`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao emitir certificado SSL",
      });
    } finally {
      setSslLoading(false);
    }
  };

  // Renew SSL certificate
  const renewSSL = async (hostId: string) => {
    setSslLoading(true);
    try {
      const response = await fetch(`/api/nginx/hosts/${hostId}/ssl/renew`, {
        method: 'POST'
      });
      
      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Certificado SSL renovado com sucesso",
        });
        await fetchSslInfo(hostId);
      } else {
        const error = await response.text();
        toast({
          variant: "destructive",
          title: "Erro",
          description: `Erro ao renovar certificado SSL: ${error}`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao renovar certificado SSL",
      });
    } finally {
      setSslLoading(false);
    }
  };

  // Update SSL info when editing host changes
  useEffect(() => {
    if (editingHost?.id) {
      fetchSslInfo(editingHost.id);
    } else {
      setSslInfo(null);
    }
  }, [editingHost?.id]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: HostFormData) => {
      const response = await fetch("/api/nginx/hosts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "session-token": localStorage.getItem("sessionToken") || "",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create host");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nginx/hosts"] });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, port }: { id: string; port: string }) => {
      const response = await fetch(`/api/nginx/hosts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "session-token": localStorage.getItem("sessionToken") || "",
        },
        body: JSON.stringify({ port }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update host");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nginx/hosts"] });
      setIsDialogOpen(false);
      setEditingHost(null);
      form.reset();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/nginx/hosts/${id}`, {
        method: "DELETE",
        headers: {
          "session-token": localStorage.getItem("sessionToken") || "",
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete host");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nginx/hosts"] });
    },
  });

  // Save config mutation
  const saveConfigMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const response = await fetch(`/api/nginx/hosts/${id}/config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "session-token": localStorage.getItem("sessionToken") || "",
        },
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || "Failed to save configuration");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nginx-host-details", editingHost?.id] });
      toast({
        title: "Configuração salva",
        description: "O arquivo de configuração foi atualizado e o Nginx foi recarregado.",
      });
      setConfigHasChanges(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar configuração",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<HostFormData>({
    resolver: zodResolver(hostSchema),
    defaultValues: {
      subdomain: "",
      port: "",
    },
  });

  const onSubmit = (data: HostFormData) => {
    if (editingHost) {
      updateMutation.mutate({ id: editingHost.id, port: data.port });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (host: NginxHost) => {
    setEditingHost(host);
    setHostConfig(""); // Limpar configuração anterior
    setEditedConfig(""); // Limpar configuração editada
    setConfigHasChanges(false);
    form.reset({
      subdomain: host.subdomain,
      port: host.port.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleSaveConfig = () => {
    if (editingHost && editedConfig.trim()) {
      saveConfigMutation.mutate({ 
        id: editingHost.id, 
        content: editedConfig 
      });
    }
  };

  const handleResetConfig = () => {
    setEditedConfig(hostConfig);
    setConfigHasChanges(false);
  };

  const handleDelete = (id: string, serverName: string) => {
    if (confirm(`Tem certeza que deseja excluir o host "${serverName}"?\n\nIsso irá:\n- Remover a configuração do Nginx\n- Tentar remover o registro DNS\n- Recarregar o Nginx`)) {
      deleteMutation.mutate(id);
    }
  };

  const openNewHostDialog = () => {
    setEditingHost(null);
    setHostConfig(""); // Limpar configuração
    setEditedConfig(""); // Limpar configuração editada
    setConfigHasChanges(false);
    form.reset({
      subdomain: "",
      port: "",
    });
    setIsDialogOpen(true);
  };

  const getStatusColor = (port: number) => {
    // Simple check - ports commonly used for different services
    if (port >= 3000 && port <= 3999) return "bg-blue-100 text-blue-800";
    if (port >= 8000 && port <= 8999) return "bg-green-100 text-green-800";
    if (port >= 9000 && port <= 9999) return "bg-purple-100 text-purple-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Gerenciamento de Hosts Nginx</h1>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewHostDialog} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo Host
              </Button>
            </DialogTrigger>
            <DialogContent className={editingHost ? "max-w-4xl max-h-[80vh] overflow-hidden flex flex-col" : "max-w-md max-h-[80vh] overflow-y-auto"}>
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>
                  {editingHost ? "Editar Host Nginx" : "Novo Host Nginx"}
                </DialogTitle>
              </DialogHeader>
              
              {editingHost ? (
                <div className="overflow-y-auto flex-1">
                  <Tabs defaultValue="proxy" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="proxy" className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Editar Proxy
                    </TabsTrigger>
                    <TabsTrigger value="ssl" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      SSL
                    </TabsTrigger>
                    <TabsTrigger value="file" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Editar Arquivo
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="proxy" className="mt-4">
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Server className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-800">Configuração do Proxy Reverso</span>
                        </div>
                        <p className="text-sm text-blue-700">
                          Edite apenas a porta e parâmetros básicos do proxy. O subdomínio não pode ser alterado.
                        </p>
                      </div>
                      
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="subdomain"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Subdomínio</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="exemplo" 
                                    {...field} 
                                    disabled={true}
                                    className="bg-gray-50"
                                  />
                                </FormControl>
                                <div className="text-xs text-muted-foreground">
                                  ⚠️ Para alterar o subdomínio, delete e recrie o host
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="port"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Porta do Serviço</FormLabel>
                                <FormControl>
                                  <Input placeholder="3000" type="number" {...field} />
                                </FormControl>
                                <div className="text-xs text-muted-foreground">
                                  Porta onde seu aplicativo está rodando internamente (1-65535)
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

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
                                  Atualizando...
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  Atualizar Proxy
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="file" className="mt-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-green-500" />
                          <h3 className="text-lg font-medium">Editar Arquivo de Configuração</h3>
                          <Badge variant="outline" className="font-mono text-xs">
                            {editingHost?.filename}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleResetConfig}
                            disabled={!configHasChanges || saveConfigMutation.isPending}
                            className="flex items-center gap-1"
                          >
                            <RotateCcw className="h-4 w-4" />
                            Reverter
                          </Button>
                          <Button
                            onClick={handleSaveConfig}
                            disabled={!configHasChanges || saveConfigMutation.isPending}
                            className="flex items-center gap-1"
                          >
                            {saveConfigMutation.isPending ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            Salvar Arquivo
                          </Button>
                        </div>
                      </div>
                      
                      {loadingDetails ? (
                        <div className="flex items-center justify-center py-8">
                          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                          <span>Carregando configuração...</span>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Editor Controls */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono text-xs">
                                {editingHost?.filename || 'nginx.conf'}
                              </Badge>
                              <Badge variant={editorTheme === 'dark' ? 'default' : 'secondary'}>
                                {editorTheme === 'dark' ? 'Dark Theme' : 'Light Theme'}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {editedConfig.length} chars
                              </Badge>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditorTheme(editorTheme === 'dark' ? 'light' : 'dark')}
                              className="flex items-center gap-1"
                            >
                              {editorTheme === 'dark' ? (
                                <>
                                  <Sun className="h-4 w-4" />
                                  Light
                                </>
                              ) : (
                                <>
                                  <Moon className="h-4 w-4" />
                                  Dark
                                </>
                              )}
                            </Button>
                          </div>

                          {/* Debug info */}
                          {editedConfig.length === 0 && (
                            <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                              ⚠️ Nenhum conteúdo carregado. Host ID: {editingHost?.id} | Loading: {loadingDetails ? 'Sim' : 'Não'}
                            </div>
                          )}

                          {/* Temporary Textarea Editor (Monaco will be added later) */}
                          <div className={`border rounded-lg overflow-hidden ${editorTheme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
                            <Textarea
                              value={editedConfig}
                              onChange={(e) => setEditedConfig(e.target.value)}
                              className={`font-mono text-sm min-h-96 resize-none border-0 ${
                                editorTheme === 'dark' 
                                  ? 'bg-gray-900 text-gray-100 placeholder-gray-400' 
                                  : 'bg-white text-gray-900 placeholder-gray-500'
                              }`}
                              placeholder={`Configuração do Nginx para ${editingHost?.subdomain || 'host'}...`}
                              style={{
                                fontFamily: 'JetBrains Mono, Fira Code, Monaco, monospace',
                                fontSize: '14px',
                                lineHeight: '1.5'
                              }}
                            />
                          </div>

                          {configHasChanges && (
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                ⚠️ Você fez alterações na configuração. Clique em "Salvar Arquivo" para aplicar as mudanças.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <strong>🔒 Processo Seguro:</strong>
                            <ul className="mt-1 space-y-1">
                              <li>• ✅ Backup automático criado antes da alteração</li>
                              <li>• ✅ Configuração testada com <code>nginx -t</code></li>
                              <li>• ✅ Rollback automático se houver erro</li>
                              <li>• ✅ Nginx recarregado automaticamente</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="ssl" className="mt-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        <h3 className="text-lg font-semibold">Certificado SSL</h3>
                        {sslLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
                      </div>

                      {sslInfo && sslInfo.issued ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                {sslInfo.issued ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : sslInfo.configuredInHost ? (
                                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                                ) : (
                                  <AlertCircle className="h-5 w-5 text-red-500" />
                                )}
                                <h4 className="font-medium">Status</h4>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {sslInfo.issued 
                                  ? "Certificado SSL ativo e válido"
                                  : sslInfo.configuredInHost
                                    ? "SSL configurado, mas certificado não encontrado"
                                    : "Nenhum certificado SSL"
                                }
                              </p>
                              {sslInfo.configuredInHost && (
                                <div className="mt-2 text-xs">
                                  <Badge variant="secondary">Configurado no host</Badge>
                                </div>
                              )}
                            </Card>

                            {sslInfo.issued && (
                              <Card className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Calendar className="h-5 w-5 text-blue-500" />
                                  <h4 className="font-medium">Validade</h4>
                                </div>
                                <p className="text-sm">
                                  {sslInfo.expirationDate ? 
                                    new Date(sslInfo.expirationDate).toLocaleDateString('pt-BR') : 
                                    'Data não disponível'
                                  }
                                </p>
                                {sslInfo.daysUntilExpiry !== null && (
                                  <div className="mt-1">
                                    <Badge 
                                      variant={
                                        (sslInfo.daysUntilExpiry || 0) > 30 ? 'default' :
                                        (sslInfo.daysUntilExpiry || 0) > 7 ? 'secondary' : 'destructive'
                                      }
                                    >
                                      {sslInfo.daysUntilExpiry} dias restantes
                                    </Badge>
                                  </div>
                                )}
                              </Card>
                            )}
                          </div>

                          {sslInfo.domains && sslInfo.domains.length > 0 && (
                            <Card className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Globe className="h-5 w-5 text-purple-500" />
                                <h4 className="font-medium">Domínios Cobertos</h4>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {sslInfo.domains.map((domain, index) => (
                                  <Badge key={index} variant="secondary">
                                    {domain}
                                  </Badge>
                                ))}
                              </div>
                            </Card>
                          )}

                          {sslInfo.certPath && (
                            <Card className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-5 w-5 text-orange-500" />
                                <h4 className="font-medium">Arquivos do Certificado</h4>
                              </div>
                              <div className="space-y-1 text-xs font-mono">
                                <div className="text-muted-foreground">Certificado: {sslInfo.certPath}</div>
                                <div className="text-muted-foreground">Chave: {sslInfo.keyPath}</div>
                              </div>
                            </Card>
                          )}

                          {sslInfo.issuer && (
                            <Card className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Lock className="h-5 w-5 text-orange-500" />
                                <h4 className="font-medium">Emissor</h4>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {sslInfo.issuer}
                              </p>
                            </Card>
                          )}

                          <div className="flex gap-2">
                            {sslInfo.issued && (
                              <Button
                                onClick={() => renewSSL(editingHost!.id)}
                                disabled={sslLoading}
                                variant="outline"
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Renovar Certificado
                              </Button>
                            )}
                            <Button
                              onClick={() => setSslDialogOpen(true)}
                              disabled={sslLoading}
                              variant={sslInfo.issued ? "outline" : "default"}
                            >
                              <Lock className="h-4 w-4 mr-2" />
                              {sslInfo.issued ? "Reemitir" : "Emitir"} Certificado
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {sslInfo?.status === 'available-not-configured' ? (
                            <Alert>
                              <CheckCircle className="h-4 w-4 text-orange-500" />
                              <AlertDescription>
                                Certificado SSL encontrado mas não configurado no arquivo host. 
                                <Button 
                                  variant="link" 
                                  className="p-0 h-auto ml-1"
                                  onClick={() => {
                                    // Trigger host file update to include SSL
                                    // This could trigger a separate function to update the host config
                                    toast({
                                      title: "Info",
                                      description: "Configure SSL manualmente na aba 'Arquivo' ou reemita o certificado",
                                    });
                                  }}
                                >
                                  Clique aqui para mais informações
                                </Button>
                              </AlertDescription>
                            </Alert>
                          ) : (
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                {sslInfo?.configuredInHost 
                                  ? "Certificado SSL configurado no host mas arquivos não encontrados."
                                  : "Nenhum certificado SSL encontrado para este host."
                                }
                              </AlertDescription>
                            </Alert>
                          )}

                          <Card className="p-6">
                            <div className="text-center space-y-4">
                              <div className="flex justify-center">
                                <Shield className="h-12 w-12 text-muted-foreground" />
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Emitir Certificado SSL</h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                  {sslInfo?.status === 'available-not-configured' 
                                    ? "Reemita o certificado para configurar automaticamente no host."
                                    : "Emita um certificado SSL gratuito usando Let's Encrypt."
                                  }
                                </p>
                                <Button
                                  onClick={() => setSslDialogOpen(true)}
                                  disabled={sslLoading}
                                  className="w-full"
                                >
                                  <Lock className="h-4 w-4 mr-2" />
                                  {sslInfo?.status === 'available-not-configured' ? "Reemitir e Configurar" : "Emitir Certificado SSL"}
                                </Button>
                              </div>
                            </div>
                          </Card>

                          {/* SSL Issue Dialog */}
                          <Dialog open={sslDialogOpen} onOpenChange={setSslDialogOpen}>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>Emitir Certificado SSL</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">Email *</label>
                                  <Input
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={sslFormData.email}
                                    onChange={(e) => setSslFormData(prev => ({
                                      ...prev,
                                      email: e.target.value
                                    }))}
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Email para notificações do Let's Encrypt
                                  </p>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4" />
                                    <span className="text-sm font-medium">Cloudflare DNS Challenge (Opcional)</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Para domínios gerenciados pela Cloudflare. Deixe em branco para usar webroot challenge.
                                  </p>
                                </div>

                                <div>
                                  <label className="text-sm font-medium">API Token da Cloudflare</label>
                                  <Input
                                    type="password"
                                    placeholder="Token API da Cloudflare"
                                    value={sslFormData.cloudflareApiToken}
                                    onChange={(e) => setSslFormData(prev => ({
                                      ...prev,
                                      cloudflareApiToken: e.target.value
                                    }))}
                                  />
                                </div>

                                <div>
                                  <label className="text-sm font-medium">Zone ID da Cloudflare</label>
                                  <Input
                                    placeholder="Zone ID do domínio"
                                    value={sslFormData.cloudflareZoneId}
                                    onChange={(e) => setSslFormData(prev => ({
                                      ...prev,
                                      cloudflareZoneId: e.target.value
                                    }))}
                                  />
                                </div>

                                <div className="flex gap-2 pt-4">
                                  <Button
                                    variant="outline"
                                    onClick={() => setSslDialogOpen(false)}
                                    className="flex-1"
                                  >
                                    Cancelar
                                  </Button>
                                  <Button
                                    onClick={() => issueSSL(editingHost!.id)}
                                    disabled={sslLoading || !sslFormData.email}
                                    className="flex-1"
                                  >
                                    {sslLoading ? (
                                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <Lock className="h-4 w-4 mr-2" />
                                    )}
                                    Emitir
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="subdomain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subdomínio</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="exemplo" 
                            {...field} 
                            disabled={!!editingHost}
                          />
                        </FormControl>
                        <div className="text-xs text-muted-foreground">
                          Será criado como: {form.watch("subdomain") || "exemplo"}.easydev.com.br
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="port"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Porta do Serviço</FormLabel>
                        <FormControl>
                          <Input placeholder="3000" type="number" {...field} />
                        </FormControl>
                        <div className="text-xs text-muted-foreground">
                          Porta onde o serviço está rodando internamente
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                          {editingHost ? "Atualizando..." : "Criando..."}
                        </>
                      ) : editingHost ? (
                        "Atualizar"
                      ) : (
                        "Criar Host"
                      )}
                    </Button>
                  </div>
                  
                  {!editingHost && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-yellow-800">
                          <strong>Processo de criação:</strong>
                          <ul className="mt-1 space-y-1">
                            <li>• Criará registro DNS CNAME</li>
                            <li>• Emitirá certificado SSL automático</li>
                            <li>• Configurará proxy reverso</li>
                            <li>• Recarregará o Nginx</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </Form>
              )}
            </DialogContent>
          </Dialog>
          <Button
            onClick={() => refetch()}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Hosts List */}
      <Card>
        <CardHeader>
          <CardTitle>Hosts Configurados ({hosts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Carregando hosts...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {hosts.length > 0 ? (
                hosts.map((host) => (
                  <div key={host.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-blue-500" />
                        <div className="flex flex-col">
                          <div className="font-medium">{host.serverName}</div>
                          <div className="text-sm text-gray-500">
                            Subdomínio: {host.subdomain}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={`font-mono text-xs ${getStatusColor(host.port)}`}>
                          Porta: {host.port}
                        </Badge>
                        
                        <div className="text-xs text-gray-500">
                          Criado: {new Date(host.createdAt).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`https://${host.serverName}`, '_blank')}
                        className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
                        title="Abrir site"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(host)}
                        className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                        title="Editar porta"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(host.id, host.serverName)}
                        disabled={deleteMutation.isPending}
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        title="Excluir host"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Server className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Nenhum host configurado</p>
                  <p className="text-sm">Clique em "Novo Host" para criar seu primeiro proxy reverso.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Como funciona
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-gray-600">
            <strong>Criação de Host:</strong>
            <ul className="mt-1 ml-4 space-y-1">
              <li>• Executa o script nginx_proxy.sh automaticamente</li>
              <li>• Cria registro DNS CNAME no Cloudflare</li>
              <li>• Emite certificado SSL via Let's Encrypt</li>
              <li>• Configura proxy reverso para a porta especificada</li>
              <li>• Recarrega o Nginx com a nova configuração</li>
            </ul>
          </div>
          
          <div className="text-sm text-gray-600">
            <strong>Edição:</strong> Permite alterar apenas a porta do serviço. Para mudar o subdomínio, delete e recrie o host.
          </div>
          
          <div className="text-sm text-gray-600">
            <strong>Exclusão:</strong> Remove a configuração do Nginx, tenta remover o DNS e recarrega o servidor.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
