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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Upload,
  X,
  XCircle,
  Camera,
  User,
  Settings,
  CheckCircle2,
  AlertCircle,
  Clock
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
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

const emailAccountSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  signature: z.string().optional(),
  avatar: z.string().optional(),
});

type EmailAccountFormData = z.infer<typeof emailAccountSchema>;

export default function EmailAccounts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<EmailAccount | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  useWebSocket();

  const form = useForm<EmailAccountFormData>({
    resolver: zodResolver(emailAccountSchema),
    defaultValues: {},
  });

  // Upload de avatar
  const uploadAvatar = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await fetch('/api/upload/email-avatar', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }
      
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Avatar upload error:', error);
      throw error;
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const avatarUrl = await uploadAvatar(file);
      form.setValue('avatar', avatarUrl);
      toast({
        title: "📸 Avatar carregado",
        description: "Avatar carregado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Falha ao carregar avatar. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'inactive': return <Clock className="w-4 h-4 text-gray-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const { data: accounts = [], isLoading } = useQuery<EmailAccount[]>({
    queryKey: ['/api/email-accounts'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: EmailAccountFormData) => {
      const emailData = {
        name: data.name,
        email: data.email,
        password: data.password,
        provider: 'custom',
        smtpHost: '',
        smtpPort: 587,
        smtpSecure: false,
        imapHost: '',
        imapPort: 993,
        imapSecure: true,
        username: data.email,
        isDefault: false,
        status: 'active',
        syncFrequency: 15,
        signature: data.signature || '',
        autoReply: false,
        autoReplyMessage: '',
      };
      
      const response = await fetch('/api/email-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create email account');
      }
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
        password: '', // Don't pre-fill password for security
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
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Digite a senha da conta" {...field} />
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

                {/* Campo de Avatar */}
                <FormField
                  control={form.control}
                  name="avatar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Foto de Perfil</FormLabel>
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-20 h-20">
                          <AvatarImage src={field.value} alt="Avatar" />
                          <AvatarFallback>
                            {form.getValues('name') ? getInitials(form.getValues('name')) : <User className="w-8 h-8" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-2">
                          <div>
                            <label htmlFor="avatar-upload" className="cursor-pointer">
                              <div className="flex items-center justify-center w-32 h-10 px-4 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                                <Camera className="w-4 h-4 mr-2" />
                                <span className="text-sm">Escolher Foto</span>
                              </div>
                            </label>
                            <input
                              id="avatar-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleAvatarUpload}
                              disabled={uploadingAvatar}
                            />
                          </div>
                          {field.value && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => field.onChange("")}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Remover
                            </Button>
                          )}
                        </div>
                      </div>
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
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id} className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
              {account.isDefault && (
                <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Padrão
                </div>
              )}
              
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  {/* Avatar */}
                  <Avatar className="w-16 h-16 border-2 border-white shadow-lg">
                    <AvatarImage src={account.avatar} alt={account.name} />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-600 text-white font-semibold">
                      {getInitials(account.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Account Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 truncate">
                        {account.name}
                      </h3>
                      {getStatusIcon(account.status)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 truncate">
                      {account.email}
                    </p>
                    
                    {/* Status Badge */}
                    <Badge 
                      variant="secondary" 
                      className={`${getStatusColor(account.status)} text-xs font-medium`}
                    >
                      {account.status === 'active' ? 'Ativo' : 
                       account.status === 'inactive' ? 'Inativo' : 
                       account.status === 'error' ? 'Erro' : account.status}
                    </Badge>
                  </div>
                </div>

                {account.signature && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-indigo-500">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium uppercase tracking-wide">
                      Assinatura
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-3">
                      {account.signature}
                    </div>
                  </div>
                )}

                <Separator className="my-4" />

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDialog(account)}
                      className="hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 dark:hover:bg-indigo-900/20"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteMutation.mutate(account.id)}
                      disabled={deleteMutation.isPending}
                      className="hover:bg-red-50 hover:border-red-200 hover:text-red-700 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Excluir
                    </Button>
                  </div>
                  
                  {!account.isDefault && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDefaultMutation.mutate(account.id)}
                      disabled={setDefaultMutation.isPending}
                      className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
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