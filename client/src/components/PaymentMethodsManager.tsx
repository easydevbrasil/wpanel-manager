import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  Plus, Edit3, Trash2, Palette,
  CreditCard, DollarSign, Zap, FileText, ArrowLeftRight, FileCheck, 
  Wallet, Smartphone, Shield, Building, PiggyBank, Banknote
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

// Mapeamento de ícones
const iconMap = {
  CreditCard, DollarSign, Zap, FileText, ArrowLeftRight, FileCheck,
  Wallet, Smartphone, Shield, Building, PiggyBank, Banknote
};

// Ícones disponíveis para métodos de pagamento
const availableIcons = [
  { name: 'CreditCard', label: 'Cartão' },
  { name: 'DollarSign', label: 'Dinheiro' },
  { name: 'Zap', label: 'PIX' },
  { name: 'FileText', label: 'Boleto' },
  { name: 'ArrowLeftRight', label: 'Transferência' },
  { name: 'FileCheck', label: 'Cheque' },
  { name: 'Wallet', label: 'Carteira Digital' },
  { name: 'Smartphone', label: 'App Pagamento' },
  { name: 'Shield', label: 'Pagamento Seguro' },
  { name: 'Building', label: 'Banco' },
  { name: 'PiggyBank', label: 'Poupança' },
  { name: 'Banknote', label: 'Dinheiro' }
];

// Cores disponíveis
const availableColors = [
  '#00BC7E', '#3B82F6', '#10B981', '#F59E0B',
  '#8B5CF6', '#22C55E', '#6B7280', '#0070BA',
  '#009EE3', '#F7941E', '#EF4444', '#06B6D4'
];

interface PaymentMethod {
  id: number;
  name: string;
  icon: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface PaymentMethodFormData {
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
}

export function PaymentMethodsManager() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState<PaymentMethodFormData>({
    name: '',
    icon: 'CreditCard',
    color: '#3B82F6',
    sortOrder: 1
  });

  const queryClient = useQueryClient();

  // Buscar métodos de pagamento
  const { data: paymentMethods = [], isLoading } = useQuery({
    queryKey: ['/api/payment-methods'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/payment-methods');
      return response.json();
    }
  });

  // Criar método de pagamento
  const createMutation = useMutation({
    mutationFn: async (data: PaymentMethodFormData) => {
      const response = await apiRequest('POST', '/api/payment-methods', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
      setIsCreateModalOpen(false);
      resetForm();
      toast({
        title: "Sucesso",
        description: "Método de pagamento criado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar método de pagamento",
        variant: "destructive",
      });
    }
  });

  // Atualizar método de pagamento
  const updateMutation = useMutation({
    mutationFn: async (data: PaymentMethodFormData) => {
      const response = await apiRequest('PUT', `/api/payment-methods/${editingMethod?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
      setEditingMethod(null);
      resetForm();
      toast({
        title: "Sucesso",
        description: "Método de pagamento atualizado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar método de pagamento",
        variant: "destructive",
      });
    }
  });

  // Excluir método de pagamento
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/payment-methods/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
      toast({
        title: "Sucesso",
        description: "Método de pagamento removido com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover método de pagamento",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      icon: 'CreditCard',
      color: '#3B82F6',
      sortOrder: 1
    });
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      icon: method.icon,
      color: method.color,
      sortOrder: method.sortOrder
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMethod) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    setEditingMethod(null);
    setIsCreateModalOpen(false);
    resetForm();
  };

  const renderIcon = (iconName: string, color: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap];
    return IconComponent ? (
      <IconComponent className="h-5 w-5" style={{ color }} />
    ) : (
      <CreditCard className="h-5 w-5" style={{ color }} />
    );
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Carregando métodos de pagamento...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Métodos de Pagamento</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os métodos de pagamento disponíveis para suas despesas
          </p>
        </div>

        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Método
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingMethod ? 'Editar Método de Pagamento' : 'Novo Método de Pagamento'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: PIX, Cartão de Crédito"
                  required
                />
              </div>

              <div>
                <Label htmlFor="sortOrder">Ordem de Exibição</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 1 })}
                  min="1"
                />
              </div>

              <div>
                <Label>Ícone</Label>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {availableIcons.map(({ name, label }) => (
                    <Button
                      key={name}
                      type="button"
                      variant={formData.icon === name ? "default" : "outline"}
                      size="sm"
                      className="p-2"
                      onClick={() => setFormData({ ...formData, icon: name })}
                      title={label}
                    >
                      {renderIcon(name, formData.icon === name ? '#ffffff' : '#374151')}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Cor</Label>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {availableColors.map((color) => (
                    <Button
                      key={color}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="p-2 border-2"
                      style={{
                        backgroundColor: formData.color === color ? color : 'transparent',
                        borderColor: color,
                      }}
                      onClick={() => setFormData({ ...formData, color })}
                    >
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: color }}
                      />
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingMethod ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Métodos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {paymentMethods
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((method) => (
            <Card key={method.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {renderIcon(method.icon, method.color)}
                    <div>
                      <CardTitle className="text-sm font-medium">
                        {method.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Ordem: {method.sortOrder}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(method)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o método de pagamento "{method.name}"?
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(method.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Badge
                  variant={method.isActive ? "default" : "secondary"}
                  className="text-xs"
                >
                  {method.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Modal de Edição */}
      <Dialog open={!!editingMethod} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Método de Pagamento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: PIX, Cartão de Crédito"
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-sortOrder">Ordem de Exibição</Label>
              <Input
                id="edit-sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 1 })}
                min="1"
              />
            </div>

            <div>
              <Label>Ícone</Label>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {availableIcons.map(({ name, label }) => (
                  <Button
                    key={name}
                    type="button"
                    variant={formData.icon === name ? "default" : "outline"}
                    size="sm"
                    className="p-2"
                    onClick={() => setFormData({ ...formData, icon: name })}
                    title={label}
                  >
                    {renderIcon(name, formData.icon === name ? '#ffffff' : '#374151')}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label>Cor</Label>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {availableColors.map((color) => (
                  <Button
                    key={color}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="p-2 border-2"
                    style={{
                      backgroundColor: formData.color === color ? color : 'transparent',
                      borderColor: color,
                    }}
                    onClick={() => setFormData({ ...formData, color })}
                  >
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: color }}
                    />
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                Atualizar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}