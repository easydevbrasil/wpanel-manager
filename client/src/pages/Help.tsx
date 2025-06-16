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
  AlertTriangle,
  Code,
  Play,
  Copy,
  Database,
  Server,
  Zap,
  Settings
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

  const testApiEndpoint = async (method: string, endpoint: string, body?: any) => {
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(endpoint, options);
      const data = await response.json();

      if (response.ok) {
        toast({
          title: "✅ API Test Success",
          description: `${method} ${endpoint} - Status: ${response.status}`,
          variant: "default",
        });
        console.log('API Response:', data);
      } else {
        toast({
          title: "❌ API Test Failed", 
          description: `${method} ${endpoint} - Status: ${response.status}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "❌ API Test Error",
        description: `Failed to test ${method} ${endpoint}`,
        variant: "destructive",
      });
    }
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

  const apiEndpoints = [
    {
      category: 'Autenticação & Sistema',
      endpoints: [
        { method: 'GET', path: '/api/user', description: 'Obter dados do usuário atual', testBody: null },
        { method: 'GET', path: '/api/navigation', description: 'Listar itens de navegação', testBody: null },
        { method: 'GET', path: '/api/dashboard/stats', description: 'Estatísticas do dashboard', testBody: null },
      ]
    },
    {
      category: 'Clientes',
      endpoints: [
        { method: 'GET', path: '/api/clients', description: 'Listar todos os clientes', testBody: null },
        { method: 'POST', path: '/api/clients', description: 'Criar novo cliente', 
          testBody: { name: 'Teste API', email: 'teste@api.com', phone: '(11) 99999-9999', company: 'API Test Corp', position: 'Testador', status: 'active' } },
        { method: 'PUT', path: '/api/clients/1', description: 'Atualizar cliente específico', 
          testBody: { name: 'Cliente Atualizado', status: 'inactive' } },
        { method: 'DELETE', path: '/api/clients/1', description: 'Excluir cliente específico', testBody: null },
      ]
    },
    {
      category: 'Produtos',
      endpoints: [
        { method: 'GET', path: '/api/products', description: 'Listar todos os produtos', testBody: null },
        { method: 'GET', path: '/api/categories', description: 'Listar categorias de produtos', testBody: null },
        { method: 'GET', path: '/api/manufacturers', description: 'Listar fabricantes', testBody: null },
        { method: 'GET', path: '/api/product-groups', description: 'Listar grupos de produtos', testBody: null },
        { method: 'POST', path: '/api/products', description: 'Criar novo produto', 
          testBody: { name: 'Produto API Test', sku: 'API-001', description: 'Produto criado via API', price: '199.99', categoryId: 1, manufacturerId: 1, productGroupId: 1, status: 'active' } },
        { method: 'PUT', path: '/api/products/1', description: 'Atualizar produto específico', 
          testBody: { name: 'Produto Atualizado', price: '249.99' } },
        { method: 'DELETE', path: '/api/products/1', description: 'Excluir produto específico', testBody: null },
      ]
    },
    {
      category: 'Fornecedores',
      endpoints: [
        { method: 'GET', path: '/api/suppliers', description: 'Listar todos os fornecedores', testBody: null },
        { method: 'POST', path: '/api/suppliers', description: 'Criar novo fornecedor', 
          testBody: { name: 'Fornecedor API', email: 'fornecedor@api.com', phone: '(11) 88888-8888', address: 'Rua API, 123', city: 'São Paulo', state: 'SP', country: 'Brasil', status: 'active' } },
        { method: 'PUT', path: '/api/suppliers/1', description: 'Atualizar fornecedor específico', 
          testBody: { name: 'Fornecedor Atualizado', status: 'inactive' } },
        { method: 'DELETE', path: '/api/suppliers/1', description: 'Excluir fornecedor específico', testBody: null },
      ]
    },
    {
      category: 'Vendas',
      endpoints: [
        { method: 'GET', path: '/api/sales', description: 'Listar todas as vendas', testBody: null },
        { method: 'GET', path: '/api/sales/1/items', description: 'Listar itens de uma venda específica', testBody: null },
        { method: 'POST', path: '/api/sales', description: 'Criar nova venda', 
          testBody: { saleNumber: 'API-001', clientId: 1, userId: 1, totalAmount: '299.99', paymentMethod: 'credit_card', paymentStatus: 'paid', saleStatus: 'completed', deliveryMethod: 'pickup', deliveryStatus: 'delivered' } },
        { method: 'PUT', path: '/api/sales/1', description: 'Atualizar venda específica', 
          testBody: { paymentStatus: 'paid', saleStatus: 'completed' } },
        { method: 'DELETE', path: '/api/sales/1', description: 'Excluir venda específica', testBody: null },
      ]
    },
    {
      category: 'Suporte',
      endpoints: [
        { method: 'GET', path: '/api/support/tickets', description: 'Listar todos os tickets', testBody: null },
        { method: 'GET', path: '/api/support/categories', description: 'Listar categorias de suporte', testBody: null },
        { method: 'GET', path: '/api/support/tickets/1/messages', description: 'Listar mensagens de um ticket', testBody: null },
        { method: 'POST', path: '/api/support/tickets', description: 'Criar novo ticket', 
          testBody: { ticketNumber: 'API-TCK-001', clientId: 1, userId: 1, title: 'Ticket via API', description: 'Teste de criação via API', priority: 'medium', status: 'open', categoryId: 1 } },
        { method: 'PUT', path: '/api/support/tickets/1', description: 'Atualizar ticket específico', 
          testBody: { status: 'in_progress', priority: 'high' } },
        { method: 'DELETE', path: '/api/support/tickets/1', description: 'Excluir ticket específico', testBody: null },
      ]
    },
    {
      category: 'Interface',
      endpoints: [
        { method: 'GET', path: '/api/cart', description: 'Obter itens do carrinho', testBody: null },
        { method: 'GET', path: '/api/notifications', description: 'Listar notificações', testBody: null },
        { method: 'GET', path: '/api/emails', description: 'Listar emails', testBody: null },
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="features">Funcionalidades</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="api">API Reference</TabsTrigger>
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

        <TabsContent value="api" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Code className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-2xl font-bold">API Reference</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Documentação completa das APIs do sistema com funcionalidade de teste interativo.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-full">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Server className="w-5 h-5 text-green-600" />
                  <CardTitle>Informações do Servidor</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Base URL:</span>
                    <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {window.location.origin}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Content-Type:</span>
                    <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      application/json
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">WebSocket:</span>
                    <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      ws://localhost:5000/ws
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {apiEndpoints.map((category, categoryIndex) => (
            <div key={categoryIndex} className="space-y-4">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xl font-semibold">{category.category}</h3>
              </div>
              
              <div className="grid gap-4">
                {category.endpoints.map((endpoint, endpointIndex) => (
                  <Card key={endpointIndex} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge 
                            variant={endpoint.method === 'GET' ? 'secondary' : 
                                   endpoint.method === 'POST' ? 'default' : 
                                   endpoint.method === 'PUT' ? 'outline' : 'destructive'}
                            className={`font-mono text-xs ${
                              endpoint.method === 'GET' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                              endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                              endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            }`}
                          >
                            {endpoint.method}
                          </Badge>
                          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                            {endpoint.path}
                          </code>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testApiEndpoint(endpoint.method, endpoint.path, endpoint.testBody)}
                          className="flex items-center space-x-1"
                        >
                          <Play className="w-3 h-3" />
                          <span>Testar</span>
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {endpoint.description}
                      </p>
                    </CardHeader>
                    
                    {endpoint.testBody && (
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Settings className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium">Exemplo de Payload:</span>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 overflow-x-auto">
                            <pre className="text-xs text-gray-700 dark:text-gray-300">
                              {JSON.stringify(endpoint.testBody, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-purple-600" />
                <CardTitle>Testes de API</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Use os botões "Testar" em cada endpoint para executar requisições em tempo real.
                  Os resultados aparecerão nas notificações toast e no console do navegador.
                </p>
                
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Códigos de Status HTTP:</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>200 OK</span>
                        <span className="text-green-600">Sucesso</span>
                      </div>
                      <div className="flex justify-between">
                        <span>201 Created</span>
                        <span className="text-green-600">Criado</span>
                      </div>
                      <div className="flex justify-between">
                        <span>400 Bad Request</span>
                        <span className="text-red-600">Erro de Validação</span>
                      </div>
                      <div className="flex justify-between">
                        <span>404 Not Found</span>
                        <span className="text-red-600">Não Encontrado</span>
                      </div>
                      <div className="flex justify-between">
                        <span>500 Server Error</span>
                        <span className="text-red-600">Erro do Servidor</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm mb-2">Funcionalidades de Teste:</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center space-x-1">
                        <Check className="w-3 h-3 text-green-600" />
                        <span>Requisições em tempo real</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Check className="w-3 h-3 text-green-600" />
                        <span>Validação de payloads JSON</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Check className="w-3 h-3 text-green-600" />
                        <span>Notificações de resultado</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Check className="w-3 h-3 text-green-600" />
                        <span>Logs detalhados no console</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Check className="w-3 h-3 text-green-600" />
                        <span>Integração com WebSocket</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />
                
                <div className="bg-blue-50 dark:bg-blue-950 rounded p-3">
                  <div className="flex items-start space-x-2">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-800 dark:text-blue-200">Dica para Desenvolvedores</p>
                      <p className="text-blue-700 dark:text-blue-300 mt-1">
                        Abra o Console do Navegador (F12) para ver as respostas detalhadas das APIs.
                        Todas as operações CRUD disparam atualizações via WebSocket em tempo real.
                      </p>
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