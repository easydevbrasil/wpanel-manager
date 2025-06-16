import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  StarOff, 
  Settings, 
  Server, 
  Shield, 
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useWebSocket } from '@/hooks/use-websocket';

interface EmailAccount {
  id: number;
  name: string;
  email: string;
  provider: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure: boolean;
  imapHost?: string;
  imapPort?: number;
  imapSecure: boolean;
  username: string;
  password: string;
  isDefault: boolean;
  status: string;
  lastSync?: string;
  syncFrequency: number;
  signature?: string;
  autoReply: boolean;
  autoReplyMessage?: string;
  createdAt: string;
  updatedAt: string;
}

const emailAccountSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  provider: z.string().min(1, 'Provedor é obrigatório'),
  smtpHost: z.string().optional(),
  smtpPort: z.number().min(1).max(65535).optional(),
  smtpSecure: z.boolean().default(true),
  imapHost: z.string().optional(),
  imapPort: z.number().min(1).max(65535).optional(),
  imapSecure: z.boolean().default(true),
  username: z.string().min(1, 'Nome de usuário é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
  syncFrequency: z.number().min(60).default(300),
  signature: z.string().optional(),
  autoReply: z.boolean().default(false),
  autoReplyMessage: z.string().optional(),
});

type EmailAccountFormData = z.infer<typeof emailAccountSchema>;

export default function EmailAccounts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<EmailAccount | null>(null);
  const [showPasswords, setShowPasswords] = useState<{[key: number]: boolean}>({});

  useWebSocket();

  const form = useForm<EmailAccountFormData>({
    resolver: zodResolver(emailAccountSchema),
    defaultValues: {
      smtpSecure: true,
      imapSecure: true,
      syncFrequency: 300,
      autoReply: false,
    },
  });

  const { data: accounts = [], isLoading } = useQuery<EmailAccount[]>({
    queryKey: ['/api/email-accounts'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: EmailAccountFormData) => {
      const response = await fetch('/api/email-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create email account');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-accounts'] });
      toast({
        title: "✅ Conta criada",
        description: "Conta de email criada com sucesso",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "❌ Erro",
        description: "Falha ao criar conta de email",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: EmailAccountFormData }) => {
      const response = await fetch(`/api/email-accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update email account');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-accounts'] });
      toast({
        title: "✅ Conta atualizada",
        description: "Conta de email atualizada com sucesso",
      });
      setIsDialogOpen(false);
      setEditingAccount(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "❌ Erro",
        description: "Falha ao atualizar conta de email",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/email-accounts/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete email account');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-accounts'] });
      toast({
        title: "🗑️ Conta removida",
        description: "Conta de email removida com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "❌ Erro",
        description: "Falha ao remover conta de email",
        variant: "destructive",
      });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/email-accounts/${id}/set-default`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to set default email account');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-accounts'] });
      toast({
        title: "⭐ Conta padrão definida",
        description: "Conta definida como padrão com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "❌ Erro",
        description: "Falha ao definir conta padrão",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EmailAccountFormData) => {
    if (editingAccount) {
      updateMutation.mutate({ id: editingAccount.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openDialog = (account?: EmailAccount) => {
    if (account) {
      setEditingAccount(account);
      form.reset({
        name: account.name,
        email: account.email,
        provider: account.provider,
        smtpHost: account.smtpHost || '',
        smtpPort: account.smtpPort || 587,
        smtpSecure: account.smtpSecure,
        imapHost: account.imapHost || '',
        imapPort: account.imapPort || 993,
        imapSecure: account.imapSecure,
        username: account.username,
        password: account.password,
        syncFrequency: account.syncFrequency,
        signature: account.signature || '',
        autoReply: account.autoReply,
        autoReplyMessage: account.autoReplyMessage || '',
      });
    } else {
      setEditingAccount(null);
      form.reset();
    }
    setIsDialogOpen(true);
  };

  const togglePasswordVisibility = (accountId: number) => {
    setShowPasswords(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }));
  };

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'gmail': return '📧';
      case 'outlook': return '📮';
      case 'smtp': return '📨';
      case 'imap': return '📬';
      default: return '📧';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'error': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Contas de Email</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie suas contas de email e configurações SMTP/IMAP
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAccount ? 'Editar Conta de Email' : 'Nova Conta de Email'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Conta</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Email Principal" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="usuario@empresa.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="provider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provedor</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o provedor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="gmail">Gmail</SelectItem>
                            <SelectItem value="outlook">Outlook</SelectItem>
                            <SelectItem value="smtp">SMTP Personalizado</SelectItem>
                            <SelectItem value="imap">IMAP Personalizado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome de Usuário</FormLabel>
                        <FormControl>
                          <Input placeholder="usuario@empresa.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center">
                      <Server className="w-4 h-4 mr-2" />
                      Configurações SMTP
                    </h4>
                    <FormField
                      control={form.control}
                      name="smtpHost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Servidor SMTP</FormLabel>
                          <FormControl>
                            <Input placeholder="smtp.gmail.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex space-x-2">
                      <FormField
                        control={form.control}
                        name="smtpPort"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Porta SMTP</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="587" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 587)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="smtpSecure"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 pt-6">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>SSL/TLS</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      Configurações IMAP
                    </h4>
                    <FormField
                      control={form.control}
                      name="imapHost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Servidor IMAP</FormLabel>
                          <FormControl>
                            <Input placeholder="imap.gmail.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex space-x-2">
                      <FormField
                        control={form.control}
                        name="imapPort"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Porta IMAP</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="993" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 993)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="imapSecure"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 pt-6">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>SSL/TLS</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Configurações Avançadas
                  </h4>
                  <FormField
                    control={form.control}
                    name="syncFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequência de Sincronização (segundos)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="300" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 300)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="signature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assinatura</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Sua assinatura de email..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center space-x-2">
                    <FormField
                      control={form.control}
                      name="autoReply"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>Resposta Automática</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                  {form.watch('autoReply') && (
                    <FormField
                      control={form.control}
                      name="autoReplyMessage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mensagem de Resposta Automática</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Obrigado por entrar em contato..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

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
                    {editingAccount ? 'Atualizar' : 'Criar'} Conta
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account: EmailAccount) => (
            <Card key={account.id} className="relative overflow-hidden">
              {account.isDefault && (
                <div className="absolute top-0 right-0 bg-yellow-500 text-white px-2 py-1 text-xs font-medium">
                  Padrão
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getProviderIcon(account.provider)}</span>
                    <CardTitle className="text-lg">{account.name}</CardTitle>
                  </div>
                  <Badge className={getStatusColor(account.status)}>
                    {account.status === 'active' ? 'Ativo' : 
                     account.status === 'inactive' ? 'Inativo' : 
                     account.status === 'error' ? 'Erro' : account.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{account.email}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-600 dark:text-gray-400">Provedor</div>
                    <div className="capitalize">{account.provider}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-600 dark:text-gray-400">Usuário</div>
                    <div className="truncate">{account.username}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-600 dark:text-gray-400">SMTP</div>
                    <div className="flex items-center space-x-1">
                      <Server className="w-3 h-3" />
                      <span>{account.smtpHost || 'N/A'}</span>
                      {account.smtpSecure && <Shield className="w-3 h-3 text-green-600" />}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-600 dark:text-gray-400">IMAP</div>
                    <div className="flex items-center space-x-1">
                      <Mail className="w-3 h-3" />
                      <span>{account.imapHost || 'N/A'}</span>
                      {account.imapSecure && <Shield className="w-3 h-3 text-green-600" />}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="font-medium text-gray-600 dark:text-gray-400">Senha</div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs">
                        {showPasswords[account.id] ? account.password : '••••••••'}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => togglePasswordVisibility(account.id)}
                      >
                        {showPasswords[account.id] ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {account.lastSync && (
                  <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>Última sincronização: {new Date(account.lastSync).toLocaleString()}</span>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  {account.autoReply && (
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Auto-resposta
                    </Badge>
                  )}
                  {account.signature && (
                    <Badge variant="outline" className="text-xs">
                      <Edit className="w-3 h-3 mr-1" />
                      Assinatura
                    </Badge>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between">
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDialog(account)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteMutation.mutate(account.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  {!account.isDefault && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDefaultMutation.mutate(account.id)}
                      disabled={setDefaultMutation.isPending}
                    >
                      <Star className="w-3 h-3 mr-1" />
                      Definir Padrão
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && accounts.length === 0 && (
        <Card className="p-8 text-center">
          <Mail className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma conta de email configurada</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Adicione sua primeira conta de email para começar a gerenciar seus emails.
          </p>
          <Button onClick={() => openDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Primeira Conta
          </Button>
        </Card>
      )}
    </div>
  );
}