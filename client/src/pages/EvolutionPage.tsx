import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  MessageSquare, 
  QrCode, 
  Play, 
  Square, 
  RotateCcw, 
  Trash2, 
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';

interface EvolutionInstance {
  instanceName: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'qrcode';
  qrcode?: string;
  webhook?: string;
  webhookByEvents?: boolean;
  events?: string[];
  profileName?: string;
  profilePictureUrl?: string;
  owner?: string;
  profileStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface QRCodeData {
  base64: string;
  code: string;
  count: number;
}

const EvolutionPage: React.FC = () => {
  const [instances, setInstances] = useState<EvolutionInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeData, setQRCodeData] = useState<QRCodeData | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [credentials, setCredentials] = useState<any>(null);

  // New instance form
  const [newInstanceName, setNewInstanceName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [webhookEvents, setWebhookEvents] = useState('');

  useEffect(() => {
    fetchCredentials();
    fetchInstances();
  }, []);

  const fetchCredentials = async () => {
    try {
      const response = await fetch('/api/evolution/credentials');
      const data = await response.json();
      setCredentials(data);
    } catch (err) {
      console.error('Error fetching Evolution credentials:', err);
    }
  };

  const fetchInstances = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/evolution/instances');
      const data = await response.json();
      
      if (data.success) {
        setInstances(Array.isArray(data.data) ? data.data : []);
        if (data.data && data.data.length > 0) {
          setSelectedInstance(data.data[0].instanceName);
        }
      } else {
        setError(data.error || 'Erro ao carregar instâncias');
        setInstances([]);
      }
    } catch (err) {
      setError('Erro de conexão');
      setInstances([]);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (instanceName: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/evolution/instance/${instanceName}/qrcode`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setQRCodeData(data.data);
      } else {
        setError(data.error || 'Erro ao gerar QR Code');
      }
    } catch (err) {
      setError('Erro ao gerar QR Code');
    } finally {
      setLoading(false);
    }
  };

  const getInstanceStatus = async (instanceName: string) => {
    try {
      const response = await fetch(`/api/evolution/instance/${instanceName}/status`);
      const data = await response.json();
      
      if (data.success) {
        // Update instance status in the list
        setInstances(prev => prev.map(inst => 
          inst.instanceName === instanceName 
            ? { ...inst, status: data.data.instance.status }
            : inst
        ));
      }
    } catch (err) {
      console.error('Error fetching instance status:', err);
    }
  };

  const restartInstance = async (instanceName: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/evolution/instance/${instanceName}/restart`, {
        method: 'PUT'
      });
      const data = await response.json();
      
      if (data.success) {
        await fetchInstances();
      } else {
        setError(data.error || 'Erro ao reiniciar instância');
      }
    } catch (err) {
      setError('Erro ao reiniciar instância');
    } finally {
      setLoading(false);
    }
  };

  const logoutInstance = async (instanceName: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/evolution/instance/${instanceName}/logout`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        await fetchInstances();
        setQRCodeData(null);
      } else {
        setError(data.error || 'Erro ao desconectar instância');
      }
    } catch (err) {
      setError('Erro ao desconectar instância');
    } finally {
      setLoading(false);
    }
  };

  const deleteInstance = async (instanceName: string) => {
    if (!confirm(`Tem certeza que deseja deletar a instância ${instanceName}?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/evolution/instance/${instanceName}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        await fetchInstances();
        setQRCodeData(null);
      } else {
        setError(data.error || 'Erro ao deletar instância');
      }
    } catch (err) {
      setError('Erro ao deletar instância');
    } finally {
      setLoading(false);
    }
  };

  const createInstance = async () => {
    if (!newInstanceName.trim()) {
      setError('Nome da instância é obrigatório');
      return;
    }

    try {
      setLoading(true);
      const body: any = {
        instanceName: newInstanceName.trim()
      };

      if (webhookUrl.trim()) {
        body.webhook = {
          url: webhookUrl.trim(),
          enabled: webhookEnabled,
          events: webhookEvents.split(',').map(e => e.trim()).filter(e => e)
        };
      }

      const response = await fetch('/api/evolution/instance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowCreateForm(false);
        setNewInstanceName('');
        setWebhookUrl('');
        setWebhookEnabled(false);
        setWebhookEvents('');
        await fetchInstances();
      } else {
        setError(data.error || 'Erro ao criar instância');
      }
    } catch (err) {
      setError('Erro ao criar instância');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'qrcode': return 'bg-blue-500';
      case 'disconnected': 
      default: return 'bg-red-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4" />;
      case 'connecting': return <Clock className="h-4 w-4" />;
      case 'qrcode': return <QrCode className="h-4 w-4" />;
      case 'disconnected':
      default: return <XCircle className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Conectando';
      case 'qrcode': return 'Aguardando QR';
      case 'disconnected':
      default: return 'Desconectado';
    }
  };

  if (!credentials?.available) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Credenciais Evolution API não configuradas. Verifique as variáveis de ambiente:
            EVOLUTION_ENDPOINT, EVOLUTION_INSTANCE, EVOLUTION_API_KEY
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Evolution API</h1>
          <p className="text-muted-foreground">
            Gerencie suas instâncias WhatsApp Business API
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchInstances} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => setShowCreateForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Instância
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="instances" className="w-full">
        <TabsList>
          <TabsTrigger value="instances">Instâncias</TabsTrigger>
          <TabsTrigger value="qrcode">QR Code</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="instances" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  Carregando instâncias...
                </div>
              </CardContent>
            </Card>
          ) : instances.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma instância encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  Crie sua primeira instância Evolution API
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Instância
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {instances.map((instance) => (
                <Card key={instance.instanceName}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{instance.instanceName}</CardTitle>
                        <CardDescription>
                          {instance.profileName || 'Perfil não configurado'}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className={`${getStatusColor(instance.status)} text-white`}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(instance.status)}
                          {getStatusText(instance.status)}
                        </div>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {instance.profilePictureUrl && (
                      <img
                        src={instance.profilePictureUrl}
                        alt="Profile"
                        className="w-16 h-16 rounded-full mx-auto"
                      />
                    )}
                    
                    <div className="flex flex-wrap gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => getInstanceStatus(instance.instanceName)}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                      
                      {instance.status !== 'connected' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedInstance(instance.instanceName);
                            generateQRCode(instance.instanceName);
                          }}
                        >
                          <QrCode className="h-3 w-3 mr-1" />
                          QR
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => restartInstance(instance.instanceName)}
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                      
                      {instance.status === 'connected' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => logoutInstance(instance.instanceName)}
                        >
                          <WifiOff className="h-3 w-3" />
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteInstance(instance.instanceName)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {instance.createdAt && (
                      <p className="text-xs text-muted-foreground">
                        Criado: {new Date(instance.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Create Instance Form */}
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>Criar Nova Instância</CardTitle>
                <CardDescription>
                  Configure uma nova instância Evolution API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="instanceName">Nome da Instância</Label>
                  <Input
                    id="instanceName"
                    value={newInstanceName}
                    onChange={(e) => setNewInstanceName(e.target.value)}
                    placeholder="Digite o nome da instância"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">Webhook URL (Opcional)</Label>
                  <Input
                    id="webhookUrl"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://seu-webhook.com/api"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="webhookEnabled"
                    checked={webhookEnabled}
                    onCheckedChange={setWebhookEnabled}
                  />
                  <Label htmlFor="webhookEnabled">Ativar Webhook</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhookEvents">Eventos Webhook (separados por vírgula)</Label>
                  <Textarea
                    id="webhookEvents"
                    value={webhookEvents}
                    onChange={(e) => setWebhookEvents(e.target.value)}
                    placeholder="message.received, message.sent, connection.update"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={createInstance} disabled={loading}>
                    {loading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Criar Instância
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setError(null);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="qrcode">
          <Card>
            <CardHeader>
              <CardTitle>QR Code para Conexão</CardTitle>
              <CardDescription>
                Escaneie o QR Code com o WhatsApp para conectar a instância
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedInstance && (
                <div className="space-y-2">
                  <Label>Instância Selecionada</Label>
                  <div className="flex gap-2">
                    <select
                      value={selectedInstance}
                      onChange={(e) => setSelectedInstance(e.target.value)}
                      className="flex-1 p-2 border rounded"
                    >
                      {instances.map((instance) => (
                        <option key={instance.instanceName} value={instance.instanceName}>
                          {instance.instanceName} ({getStatusText(instance.status)})
                        </option>
                      ))}
                    </select>
                    <Button onClick={() => generateQRCode(selectedInstance)}>
                      <QrCode className="h-4 w-4 mr-2" />
                      Gerar QR
                    </Button>
                  </div>
                </div>
              )}

              {qrCodeData && (
                <div className="text-center space-y-4">
                  <div className="inline-block p-4 bg-white rounded-lg shadow">
                    <img
                      src={qrCodeData.base64}
                      alt="QR Code"
                      className="max-w-sm mx-auto"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Contagem: {qrCodeData.count}
                  </p>
                  <Alert>
                    <Wifi className="h-4 w-4" />
                    <AlertDescription>
                      Abra o WhatsApp no seu celular, vá em Configurações → Aparelhos conectados → 
                      Conectar um aparelho e escaneie este QR Code.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {!qrCodeData && selectedInstance && (
                <div className="text-center py-8">
                  <QrCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Clique em "Gerar QR" para obter o código de conexão
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Evolution API</CardTitle>
              <CardDescription>
                Informações sobre as credenciais configuradas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label>Endpoint</Label>
                  <Input value={credentials?.credentials?.endpoint || ''} readOnly />
                </div>
                <div>
                  <Label>Instância Padrão</Label>
                  <Input value={credentials?.credentials?.instance || ''} readOnly />
                </div>
                <div>
                  <Label>API Key</Label>
                  <Input value={credentials?.credentials?.apiKey || ''} readOnly type="password" />
                </div>
              </div>
              
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {credentials?.message}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EvolutionPage;