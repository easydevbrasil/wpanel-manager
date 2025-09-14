import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  Plus, Edit3, Trash2, Palette,
  Server, Code, Megaphone, Users, Settings, Building,
  CreditCard, ShoppingCart, Truck, Wifi, Smartphone,
  Monitor, Coffee, Car, Home, DollarSign, TrendingUp, FileText
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

// Mapeamento de ícones
const iconMap = {
  Server, Code, Megaphone, Users, Settings, Building,
  CreditCard, ShoppingCart, Truck, Wifi, Smartphone,
  Monitor, Coffee, Car, Home, DollarSign, TrendingUp, FileText
};

// Ícones disponíveis para categorias
const availableIcons = [
  { name: 'Server', label: 'Servidor' },
  { name: 'Code', label: 'Código' },
  { name: 'Megaphone', label: 'Megafone' },
  { name: 'Users', label: 'Usuários' },
  { name: 'Settings', label: 'Configurações' },
  { name: 'Building', label: 'Edifício' },
  { name: 'CreditCard', label: 'Cartão' },
  { name: 'ShoppingCart', label: 'Carrinho' },
  { name: 'Truck', label: 'Caminhão' },
  { name: 'Wifi', label: 'WiFi' },
  { name: 'Smartphone', label: 'Celular' },
  { name: 'Monitor', label: 'Monitor' },
  { name: 'Coffee', label: 'Café' },
  { name: 'Car', label: 'Carro' },
  { name: 'Home', label: 'Casa' },
  { name: 'DollarSign', label: 'Dólar' },
  { name: 'TrendingUp', label: 'Crescimento' },
  { name: 'FileText', label: 'Documento' }
];

// Cores disponíveis
const availableColors = [
  '#3B82F6', '#8B5CF6', '#EF4444', '#10B981',
  '#F59E0B', '#6366F1', '#EC4899', '#14B8A6',
  '#F97316', '#84CC16', '#06B6D4', '#8B5CF6'
];

interface ExpenseCategory {
  id: number;
  name: string;
  icon: string;
  color: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CategoryFormData {
  name: string;
  icon: string;
  color: string;
  description: string;
}

export function ExpenseCategoriesManager() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    icon: 'Settings',
    color: '#3B82F6',
    description: ''
  });

  const queryClient = useQueryClient();

  // Buscar categorias
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/expense-categories');
      return response.json();
    }
  });

  // Criar categoria
  const createMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const response = await apiRequest('POST', '/api/expense-categories', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
      setIsCreateModalOpen(false);
      resetForm();
      toast({
        title: 'Sucesso',
        description: 'Categoria criada com sucesso!'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar categoria',
        variant: 'destructive'
      });
    }
  });

  // Atualizar categoria
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<CategoryFormData> }) => {
      const response = await apiRequest('PUT', `/api/expense-categories/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
      setEditingCategory(null);
      resetForm();
      toast({
        title: 'Sucesso',
        description: 'Categoria atualizada com sucesso!'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar categoria',
        variant: 'destructive'
      });
    }
  });

  // Excluir categoria
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/expense-categories/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
      toast({
        title: 'Sucesso',
        description: 'Categoria removida com sucesso!'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao remover categoria',
        variant: 'destructive'
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      icon: 'Settings',
      color: '#3B82F6',
      description: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (category: ExpenseCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      icon: category.icon,
      color: category.color,
      description: category.description || ''
    });
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap];
    if (IconComponent) {
      return <IconComponent className="h-4 w-4" />;
    }
    return <Settings className="h-4 w-4" />; // ícone padrão
  };

  if (isLoading) {
    return <div className="p-6">Carregando categorias...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Categorias</h2>
          <p className="text-muted-foreground">
            Configure as categorias de despesas com ícones personalizados
          </p>
        </div>

        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingCategory(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome da categoria"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição da categoria (opcional)"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Ícone</Label>
                <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto">
                  {availableIcons.map((icon) => (
                    <button
                      key={icon.name}
                      type="button"
                      className={`p-2 rounded-md border transition-colors ${formData.icon === icon.name
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                      onClick={() => setFormData(prev => ({ ...prev, icon: icon.name }))}
                      title={icon.label}
                    >
                      {getIconComponent(icon.name)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="grid grid-cols-6 gap-2">
                  {availableColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${formData.color === color ? 'border-gray-400 scale-110' : 'border-gray-200'
                        }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingCategory(null);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingCategory ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category: ExpenseCategory) => (
          <Card key={category.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="p-2 rounded-full"
                    style={{ backgroundColor: `${category.color}20`, color: category.color }}
                  >
                    {getIconComponent(category.icon)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    {category.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>

                <Badge
                  variant={category.active ? "default" : "secondary"}
                  style={{ backgroundColor: category.active ? category.color : undefined }}
                >
                  {category.active ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleEdit(category);
                    setIsCreateModalOpen(true);
                  }}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover Categoria</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja remover a categoria "{category.name}"?
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate(category.id)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12">
          <Palette className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma categoria encontrada</h3>
          <p className="text-muted-foreground mb-4">
            Crie sua primeira categoria de despesas para começar
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Categoria
          </Button>
        </div>
      )}
    </div>
  );
}
