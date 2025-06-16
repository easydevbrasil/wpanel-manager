import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Package, 
  Truck, 
  ShoppingCart, 
  Ticket,
  Plus,
  Edit,
  Trash2,
  Bell,
  Volume2,
  Check,
  X,
  Info,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ToastSounds } from '@/utils/toast-sounds';

export default function Help() {
  const { toast } = useToast();

  const showExampleToast = (type: 'success' | 'error' | 'info' | 'warning', title: string, description: string, icon: string) => {
    ToastSounds.playSound(type);
    toast({
      title: `${icon} ${title}`,
      description: description,
      variant: type === 'error' ? 'destructive' : 'default',
    });
  };

  const features = [
    {
      category: 'Clientes',
      icon: User,
      color: 'bg-blue-500',
      description: 'Gerencie sua base de clientes com informações completas',
      operations: [
        {
          type: 'create',
          title: 'Criar Cliente',
          description: 'Adicione novos clientes com dados de contato, empresa e observações',
          example: 'Nome: João Silva, Email: joao@empresa.com, Telefone: (11) 99999-9999',
          toast: { icon: '✅', title: 'Cliente criado', desc: 'João Silva foi adicionado com sucesso', sound: 'success' as const }
        },
        {
          type: 'update',
          title: 'Editar Cliente',
          description: 'Atualize informações de clientes existentes',
          example: 'Alterar status de "ativo" para "inativo" ou atualizar dados de contato',
          toast: { icon: '👤', title: 'Cliente atualizado', desc: 'João Silva foi modificado', sound: 'info' as const }
        },
        {
          type: 'delete',
          title: 'Excluir Cliente',
          description: 'Remove clientes do sistema permanentemente',
          example: 'Exclusão de cliente inativo ou duplicado',
          toast: { icon: '🗑️', title: 'Cliente removido', desc: 'Cliente foi excluído do sistema', sound: 'error' as const }
        }
      ]
    },
    {
      category: 'Produtos',
      icon: Package,
      color: 'bg-green-500',
      description: 'Controle seu catálogo de produtos com preços e estoque',
      operations: [
        {
          type: 'create',
          title: 'Criar Produto',
          description: 'Adicione novos produtos com SKU, preços, categorias e imagens',
          example: 'Nome: iPhone 14, SKU: IPH-14-128, Preço: R$ 4.999,00, Categoria: Eletrônicos',
          toast: { icon: '✅', title: 'Produto criado', desc: 'iPhone 14 foi adicionado ao catálogo', sound: 'success' as const }
        },
        {
          type: 'update',
          title: 'Editar Produto',
          description: 'Atualize preços, estoque, descrições e status dos produtos',
          example: 'Atualizar preço de R$ 4.999,00 para R$ 4.799,00 ou ajustar estoque',
          toast: { icon: '📦', title: 'Produto atualizado', desc: 'iPhone 14 foi modificado', sound: 'info' as const }
        },
        {
          type: 'delete',
          title: 'Excluir Produto',
          description: 'Remove produtos descontinuados ou incorretos do catálogo',
          example: 'Remoção de produto descontinuado ou duplicado',
          toast: { icon: '🗑️', title: 'Produto removido', desc: 'Produto foi excluído do catálogo', sound: 'error' as const }
        }
      ]
    },
    {
      category: 'Fornecedores',
      icon: Truck,
      color: 'bg-orange-500',
      description: 'Gerencie relacionamentos com fornecedores e termos comerciais',
      operations: [
        {
          type: 'create',
          title: 'Criar Fornecedor',
          description: 'Cadastre novos fornecedores com dados comerciais e contatos',
          example: 'Nome: Tech Supply Co., CNPJ: 12.345.678/0001-90, Contato: Maria Santos',
          toast: { icon: '✅', title: 'Fornecedor criado', desc: 'Tech Supply Co. foi adicionado', sound: 'success' as const }
        },
        {
          type: 'update',
          title: 'Editar Fornecedor',
          description: 'Atualize termos comerciais, contatos e avaliações',
          example: 'Alterar prazo de entrega de 15 para 10 dias ou atualizar contato',
          toast: { icon: '🚛', title: 'Fornecedor atualizado', desc: 'Tech Supply Co. foi modificado', sound: 'info' as const }
        },
        {
          type: 'delete',
          title: 'Excluir Fornecedor',
          description: 'Remove fornecedores inativos ou descontinuados',
          example: 'Remoção de fornecedor que não atende mais à empresa',
          toast: { icon: '🗑️', title: 'Fornecedor removido', desc: 'Fornecedor foi excluído', sound: 'error' as const }
        }
      ]
    },
    {
      category: 'Vendas',
      icon: ShoppingCart,
      color: 'bg-purple-500',
      description: 'Registre e acompanhe vendas com status e métodos de pagamento',
      operations: [
        {
          type: 'create',
          title: 'Criar Venda',
          description: 'Registre novas vendas com produtos, quantidades e forma de pagamento',
          example: 'Cliente: João Silva, Produto: iPhone 14, Qtd: 1, Pagamento: Cartão de Crédito',
          toast: { icon: '✅', title: 'Venda criada', desc: 'Venda VDA-001 foi registrada', sound: 'success' as const }
        },
        {
          type: 'update',
          title: 'Editar Venda',
          description: 'Atualize status de pagamento, entrega ou dados da venda',
          example: 'Alterar status de "pendente" para "pago" ou atualizar endereço de entrega',
          toast: { icon: '🛒', title: 'Venda atualizada', desc: 'Venda VDA-001 foi modificada', sound: 'info' as const }
        },
        {
          type: 'delete',
          title: 'Excluir Venda',
          description: 'Remove vendas canceladas ou registradas incorretamente',
          example: 'Cancelamento de venda por desistência do cliente',
          toast: { icon: '🗑️', title: 'Venda removida', desc: 'Venda foi excluída do sistema', sound: 'error' as const }
        }
      ]
    },
    {
      category: 'Suporte',
      icon: Ticket,
      color: 'bg-red-500',
      description: 'Gerencie tickets de suporte e atendimento ao cliente',
      operations: [
        {
          type: 'create',
          title: 'Criar Ticket',
          description: 'Abra novos tickets de suporte com prioridade e categoria',
          example: 'Assunto: Problema com produto, Prioridade: Alta, Categoria: Técnico',
          toast: { icon: '✅', title: 'Ticket criado', desc: 'Ticket TCK-001 foi aberto', sound: 'success' as const }
        },
        {
          type: 'update',
          title: 'Editar Ticket',
          description: 'Atualize status, prioridade ou adicione mensagens ao ticket',
          example: 'Alterar status de "aberto" para "em andamento" ou adicionar resposta',
          toast: { icon: '🎫', title: 'Ticket atualizado', desc: 'Ticket TCK-001 foi modificado', sound: 'info' as const }
        },
        {
          type: 'delete',
          title: 'Excluir Ticket',
          description: 'Remove tickets duplicados ou criados incorretamente',
          example: 'Remoção de ticket duplicado ou spam',
          toast: { icon: '🗑️', title: 'Ticket removido', desc: 'Ticket foi excluído', sound: 'error' as const }
        }
      ]
    }
  ];

  const toastExamples = [
    {
      type: 'success' as const,
      icon: Check,
      title: 'Sucesso',
      description: 'Operações de criação bem-sucedidas',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      examples: ['✅ Cliente criado', '✅ Produto criado', '✅ Venda registrada'],
      sound: 'Chime ascendente (880Hz → 1108Hz)'
    },
    {
      type: 'info' as const,
      icon: Info,
      title: 'Informação',
      description: 'Atualizações e modificações de dados',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      examples: ['ℹ️ Cliente atualizado', '📦 Produto modificado', '🛒 Status alterado'],
      sound: 'Tom suave (660Hz por 0.2s)'
    },
    {
      type: 'error' as const,
      icon: X,
      title: 'Erro',
      description: 'Exclusões e operações destrutivas',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      examples: ['🗑️ Cliente removido', '🗑️ Produto excluído', '🗑️ Venda cancelada'],
      sound: 'Tom grave (220Hz por 0.3s)'
    },
    {
      type: 'warning' as const,
      icon: AlertTriangle,
      title: 'Aviso',
      description: 'Alertas e notificações importantes',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      examples: ['⚠️ Estoque baixo', '⚠️ Pagamento pendente', '⚠️ Prazo vencendo'],
      sound: 'Tom médio (440Hz por 0.25s)'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Central de Ajuda</h1>
          <p className="text-muted-foreground">
            Guia completo de funcionalidades e exemplos práticos do sistema
          </p>
        </div>
      </div>

      <Tabs defaultValue="features" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="features">Funcionalidades</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="space-y-6">
          <div className="grid gap-6">
            {features.map((feature) => (
              <Card key={feature.category} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 ${feature.color} rounded-lg`}>
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{feature.category}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {feature.operations.map((operation, index) => (
                    <div key={operation.type} className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {operation.type === 'create' && (
                            <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded">
                              <Plus className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                          )}
                          {operation.type === 'update' && (
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded">
                              <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                          )}
                          {operation.type === 'delete' && (
                            <div className="p-1.5 bg-red-100 dark:bg-red-900 rounded">
                              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{operation.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {operation.type === 'create' && 'POST'}
                              {operation.type === 'update' && 'PUT'}
                              {operation.type === 'delete' && 'DELETE'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {operation.description}
                          </p>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm font-mono">
                              <span className="text-muted-foreground">Exemplo:</span> {operation.example}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => showExampleToast(
                                operation.toast.sound,
                                operation.toast.title,
                                operation.toast.desc,
                                operation.toast.icon
                              )}
                              className="text-xs"
                            >
                              <Bell className="w-3 h-3 mr-1" />
                              Testar Notificação
                            </Button>
                            <span className="text-xs text-muted-foreground">
                              {operation.toast.icon} {operation.toast.title}
                            </span>
                          </div>
                        </div>
                      </div>
                      {index < feature.operations.length - 1 && (
                        <Separator className="ml-10" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Sistema de Notificações
              </CardTitle>
              <CardDescription>
                O sistema possui notificações toast com sons contextuais e ícones visuais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                {toastExamples.map((example) => (
                  <div key={example.type} className={`p-4 rounded-lg border ${example.bgColor}`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded ${example.color.replace('text-', 'bg-').replace('600', '100')} dark:${example.color.replace('text-', 'bg-').replace('600', '900')}`}>
                        <example.icon className={`w-4 h-4 ${example.color}`} />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{example.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {example.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {example.description}
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Volume2 className="w-4 h-4" />
                            <span className="font-mono text-xs">{example.sound}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {example.examples.map((ex, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {ex}
                              </Badge>
                            ))}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => showExampleToast(
                              example.type,
                              example.title,
                              example.description,
                              example.examples[0].split(' ')[0]
                            )}
                            className="text-xs"
                          >
                            <Volume2 className="w-3 h-3 mr-1" />
                            Testar Som e Notificação
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Como Funciona</h4>
                <div className="grid gap-3 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <div>
                      <p className="font-medium">Operação Realizada</p>
                      <p className="text-muted-foreground">Usuário cria, edita ou exclui um item no sistema</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <div>
                      <p className="font-medium">WebSocket Broadcast</p>
                      <p className="text-muted-foreground">Servidor envia notificação em tempo real para todos os clientes conectados</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <div>
                      <p className="font-medium">Som + Notificação</p>
                      <p className="text-muted-foreground">Sistema reproduz som contextual e exibe toast com ícone apropriado</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">4</span>
                    <div>
                      <p className="font-medium">Cache Atualizado</p>
                      <p className="text-muted-foreground">Dados são automaticamente atualizados em todas as páginas abertas</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}