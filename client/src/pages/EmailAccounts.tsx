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
  Star
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
  signature: z.string().optional(),
});

type EmailAccountFormData = z.infer<typeof emailAccountSchema>;

export default function EmailAccounts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<EmailAccount | null>(null);
  useWebSocket();

  const form = useForm<EmailAccountFormData>({
    resolver: zodResolver(emailAccountSchema),
    defaultValues: {},
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
        signature: account.signature || '',
      });
    } else {
      setEditingAccount(null);
      form.reset();
    }
    setIsDialogOpen(true);
  };

  const getProviderIcon = (provider: string) => {
    return '📧';
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

                <FormField
                  control={form.control}
                  name="signature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assinatura</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Sua assinatura de email..."
                          rows={4}
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
        <div className="grid gap-6 grid-cols-1">
          {accounts.map((account) => (
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
                {account.signature && (
                  <div>
                    <div className="font-medium text-gray-600 dark:text-gray-400 mb-1">Assinatura</div>
                    <div className="text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded whitespace-pre-wrap">
                      {account.signature}
                    </div>
                  </div>
                )}

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