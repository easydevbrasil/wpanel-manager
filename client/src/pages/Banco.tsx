import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, CreditCardIcon, TrendingDownIcon, TrendingUpIcon, RefreshCwIcon, Users, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  object: string;
  dateCreated: string;
  customer: string;
  paymentLink?: string;
  value: number;
  netValue?: number;
  originalValue?: number;
  interestValue?: number;
  description: string;
  billingType: string;
  pixTransaction?: any;
  status: string;
  dueDate: string;
  originalDueDate: string;
  paymentDate?: string;
  clientPaymentDate?: string;
  installmentNumber?: number;
  transactionReceiptUrl?: string;
  nossoNumero?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  invoiceNumber?: string;
}

interface AsaasBalance {
  totalBalance: number;
  availableBalance: number;
  blockedBalance: number;
}

interface AsaasStats {
  totalReceived: number;
  totalPending: number;
  totalOverdue: number;
  totalCanceled: number;
}

interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateCreated: string;
  totalPaid: number;
  totalPending: number;
}

interface AsaasAccountInfo {
  walletId: string;
  apiMode: string;
  baseUrl: string;
  isConnected: boolean;
}

export default function Banco() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<AsaasCustomer[]>([]);
  const [balance, setBalance] = useState<AsaasBalance | null>(null);
  const [stats, setStats] = useState<AsaasStats | null>(null);
  const [accountInfo, setAccountInfo] = useState<AsaasAccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const fetchBankData = async () => {
    try {
      setLoading(true);
      
      // Buscar transações
      const transactionsResponse = await fetch("/api/asaas/payments");
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData.data || []);
      }

      // Buscar saldo
      const balanceResponse = await fetch("/api/asaas/balance");
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        setBalance(balanceData);
      }

      // Buscar estatísticas
      const statsResponse = await fetch("/api/asaas/stats");
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Buscar clientes
      const customersResponse = await fetch("/api/asaas/customers");
      if (customersResponse.ok) {
        const customersData = await customersResponse.json();
        setCustomers(customersData.data || []);
      }

      // Buscar informações da conta
      const accountResponse = await fetch("/api/asaas/account");
      if (accountResponse.ok) {
        const accountData = await accountResponse.json();
        setAccountInfo(accountData);
      }

    } catch (error) {
      console.error("Erro ao buscar dados bancários:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados bancários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'received':
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'awaiting_payment':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'canceled':
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'received': 'Recebido',
      'pending': 'Pendente',
      'awaiting_payment': 'Aguardando Pagamento',
      'overdue': 'Vencido',
      'canceled': 'Cancelado',
      'refunded': 'Estornado',
      'confirmed': 'Confirmado'
    };
    return statusMap[status.toLowerCase()] || status;
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesFilter = transaction.description.toLowerCase().includes(filter.toLowerCase()) ||
                         transaction.customer.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = statusFilter === "all" || transaction.status.toLowerCase() === statusFilter;
    return matchesFilter && matchesStatus;
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCwIcon className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando dados bancários...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Banco - Asaas</h1>
          <p className="text-muted-foreground">
            Gerencie suas transações e acompanhe o saldo da conta
          </p>
        </div>
        <Button onClick={fetchBankData} variant="outline">
          <RefreshCwIcon className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Saldo e Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {balance && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
                <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(balance.totalBalance)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Disponível</CardTitle>
                <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(balance.availableBalance)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Bloqueado</CardTitle>
                <TrendingDownIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(balance.blockedBalance)}</div>
              </CardContent>
            </Card>
          </>
        )}
        
        {stats && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
              <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalReceived)}</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs para organizar o conteúdo */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <CreditCardIcon className="h-4 w-4" />
            Transações
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Tab de Transações */}
        <TabsContent value="transactions" className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Buscar transações..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="max-w-sm"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="all">Todos os Status</option>
              <option value="received">Recebidos</option>
              <option value="pending">Pendentes</option>
              <option value="overdue">Vencidos</option>
              <option value="canceled">Cancelados</option>
            </select>
          </div>

          {/* Lista de Transações */}
          <Card>
            <CardHeader>
              <CardTitle>Transações Recentes</CardTitle>
              <CardDescription>
                {filteredTransactions.length} transação(ões) encontrada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCardIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma transação encontrada</p>
                  </div>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{transaction.description}</h3>
                          <Badge className={getStatusColor(transaction.status)}>
                            {getStatusText(transaction.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Cliente: {transaction.customer}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            Vencimento: {formatDate(transaction.dueDate)}
                          </span>
                          {transaction.paymentDate && (
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              Pagamento: {formatDate(transaction.paymentDate)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {formatCurrency(transaction.value)}
                        </div>
                        {transaction.netValue && transaction.netValue !== transaction.value && (
                          <div className="text-sm text-muted-foreground">
                            Líquido: {formatCurrency(transaction.netValue)}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {transaction.billingType.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Clientes */}
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clientes</CardTitle>
              <CardDescription>
                Gerencie seus clientes e visualize histórico de pagamentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum cliente encontrado</p>
                  <p className="text-sm mt-2">Os clientes aparecerão aqui conforme as transações forem criadas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customers.map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{customer.name}</h3>
                          <Badge variant="outline">
                            Cliente desde {formatDate(customer.dateCreated)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Email: {customer.email}
                        </p>
                        {customer.phone && (
                          <p className="text-sm text-muted-foreground">
                            Telefone: {customer.phone}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(customer.totalPaid)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total pago
                        </div>
                        {customer.totalPending > 0 && (
                          <div className="text-sm text-yellow-600 mt-1">
                            {formatCurrency(customer.totalPending)} pendente
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Configurações */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Asaas</CardTitle>
              <CardDescription>
                Configure sua integração com o Asaas Bank
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Informações da Conta</h3>
                  <div className="space-y-2">
                    {accountInfo && (
                      <>
                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <span className="text-sm text-muted-foreground">Wallet ID:</span>
                          <code className="text-sm bg-background px-2 py-1 rounded">
                            {accountInfo.walletId.slice(0, 8)}...
                          </code>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <span className="text-sm text-muted-foreground">Modo API:</span>
                          <Badge variant={accountInfo.apiMode === 'production' ? 'default' : 'secondary'}>
                            {accountInfo.apiMode}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <span className="text-sm text-muted-foreground">Base URL:</span>
                          <code className="text-sm bg-background px-2 py-1 rounded text-xs">
                            {accountInfo.baseUrl}
                          </code>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Status e Ações</h3>
                  <div className="space-y-2">
                    {accountInfo && (
                      <div className={`p-3 border rounded-lg ${
                        accountInfo.isConnected 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            accountInfo.isConnected ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <span className={`text-sm ${
                            accountInfo.isConnected ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {accountInfo.isConnected ? 'Conectado ao Asaas' : 'Desconectado'}
                          </span>
                        </div>
                      </div>
                    )}
                    <Button 
                      onClick={fetchBankData} 
                      className="w-full"
                      variant="outline"
                    >
                      <RefreshCwIcon className="h-4 w-4 mr-2" />
                      Atualizar Dados
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Estatísticas da Conta</h3>
                {stats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-sm text-green-600 mb-1">Total Recebido</div>
                      <div className="text-xl font-bold text-green-700">
                        {formatCurrency(stats.totalReceived)}
                      </div>
                    </div>
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="text-sm text-yellow-600 mb-1">Pendente</div>
                      <div className="text-xl font-bold text-yellow-700">
                        {formatCurrency(stats.totalPending)}
                      </div>
                    </div>
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-sm text-red-600 mb-1">Vencido</div>
                      <div className="text-xl font-bold text-red-700">
                        {formatCurrency(stats.totalOverdue)}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Cancelado</div>
                      <div className="text-xl font-bold text-gray-700">
                        {formatCurrency(stats.totalCanceled)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Configurações Avançadas</h3>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Webhook Configuration</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Configure webhooks para receber notificações em tempo real sobre mudanças de status dos pagamentos.
                  </p>
                  <Button variant="outline" size="sm" disabled>
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar Webhooks
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
