import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, Plus, Edit, Trash2, Search, Filter, ShoppingCart, User, Calendar, DollarSign, Package2, Truck, FileText } from "lucide-react";
import type { Sale, InsertSale, Client, Product } from "@shared/schema";

const saleFormSchema = z.object({
  saleNumber: z.string().min(1, "Número da venda é obrigatório"),
  clientId: z.number().min(1, "Cliente é obrigatório"),
  saleDate: z.string().min(1, "Data da venda é obrigatória"),
  status: z.enum(["pendente", "confirmada", "enviada", "entregue", "cancelada"]),
  paymentMethod: z.enum(["dinheiro", "cartao", "pix", "boleto", "credito"]).optional(),
  paymentStatus: z.enum(["pendente", "pago", "atrasado", "cancelado"]),
  subtotal: z.string().min(1, "Subtotal é obrigatório"),
  discount: z.string().default("0.00"),
  tax: z.string().default("0.00"),
  shipping: z.string().default("0.00"),
  total: z.string().min(1, "Total é obrigatório"),
  notes: z.string().optional(),
  deliveryAddress: z.string().optional(),
  deliveryDate: z.string().optional(),
});

type SaleFormData = z.infer<typeof saleFormSchema>;

const statusColors = {
  pendente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  confirmada: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  enviada: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  entregue: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cancelada: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const paymentStatusColors = {
  pendente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  pago: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  atrasado: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  cancelado: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

export default function Sales() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const queryClient = useQueryClient();

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["/api/sales"],
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  // Hook para buscar itens de uma venda específica
  const useSaleItems = (saleId: number) => {
    return useQuery({
      queryKey: ["/api/sales", saleId, "items"],
      queryFn: () => apiRequest("GET", `/api/sales/${saleId}/items`),
    });
  };

  const createMutation = useMutation({
    mutationFn: (data: InsertSale) => apiRequest("POST", "/api/sales", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertSale> }) =>
      apiRequest("PUT", `/api/sales/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      setIsDialogOpen(false);
      setEditingSale(null);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/sales/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
    },
  });

  const form = useForm<SaleFormData>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      saleNumber: "",
      saleDate: new Date().toISOString().split('T')[0],
      status: "pendente",
      paymentStatus: "pendente",
      subtotal: "0.00",
      discount: "0.00",
      tax: "0.00",
      shipping: "0.00",
      total: "0.00",
      notes: "",
      deliveryAddress: "",
      deliveryDate: "",
    },
  });

  const onSubmit = (data: SaleFormData) => {
    const formattedData = {
      ...data,
      clientId: Number(data.clientId),
      userId: 1, // Mock user ID
    };

    if (editingSale) {
      updateMutation.mutate({ id: editingSale.id, data: formattedData });
    } else {
      createMutation.mutate(formattedData);
    }
  };

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    form.reset({
      saleNumber: sale.saleNumber,
      clientId: sale.clientId || 0,
      saleDate: sale.saleDate.split('T')[0],
      status: sale.status as any,
      paymentMethod: sale.paymentMethod as any,
      paymentStatus: sale.paymentStatus as any,
      subtotal: sale.subtotal || "0.00",
      discount: sale.discount || "0.00",
      tax: sale.tax || "0.00",
      shipping: sale.shipping || "0.00",
      total: sale.total || "0.00",
      notes: sale.notes || "",
      deliveryAddress: sale.deliveryAddress || "",
      deliveryDate: sale.deliveryDate?.split('T')[0] || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta venda?")) {
      deleteMutation.mutate(id);
    }
  };

  const openNewSaleDialog = () => {
    setEditingSale(null);
    form.reset({
      saleNumber: `VDA-${String(salesArray.length + 1).padStart(3, '0')}`,
      saleDate: new Date().toISOString().split('T')[0],
      status: "pendente",
      paymentStatus: "pendente",
      subtotal: "0.00",
      discount: "0.00",
      tax: "0.00",
      shipping: "0.00",
      total: "0.00",
    });
    setIsDialogOpen(true);
  };

  const salesArray = Array.isArray(sales) ? sales : [];
  const clientsArray = Array.isArray(clients) ? clients : [];
  
  const filteredSales = salesArray.filter((sale: Sale) => {
    const matchesSearch = 
      sale.saleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientsArray.find(c => c.id === sale.clientId)?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || sale.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getClientName = (clientId: number | null) => {
    if (!clientId) return "Cliente não informado";
    const client = clientsArray.find((c: Client) => c.id === clientId);
    return client?.name || "Cliente não encontrado";
  };

  const formatCurrency = (value: string | null) => {
    if (!value) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(value));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Cache para itens de venda por venda
  const [saleItemsCache, setSaleItemsCache] = useState<Record<number, any[]>>({});

  // Carregar itens de venda quando as vendas são carregadas
  useEffect(() => {
    if (sales && Array.isArray(sales) && sales.length > 0) {
      const loadSaleItems = async () => {
        const newCache: Record<number, any[]> = {};
        
        for (const sale of sales) {
          try {
            const response = await apiRequest("GET", `/api/sales/${sale.id}/items`);
            const items = await response.json();
            // Garantir que items é sempre um array
            newCache[sale.id] = Array.isArray(items) ? items : [];
          } catch (error) {
            console.error(`Erro ao carregar itens da venda ${sale.id}:`, error);
            newCache[sale.id] = [];
          }
        }
        
        setSaleItemsCache(newCache);
      };
      
      loadSaleItems();
    }
  }, [sales]);

  const getSaleProducts = (saleId: number) => {
    const items = saleItemsCache[saleId] || [];
    // Garantir que items é sempre um array
    const itemsArray = Array.isArray(items) ? items : [];
    return itemsArray.map((item: any) => {
      const product = (products as any[]).find((p: any) => p.id === item.productId);
      return {
        ...item,
        product: product || { name: "Produto não encontrado", sku: "", image: "" }
      };
    });
  };

  const getLatestStatus = (sale: Sale) => {
    // Retorna apenas o status principal da venda (não o status de pagamento)
    return sale.status || "pendente";
  };

  const generateReceipt = (sale: Sale) => {
    const client = clientsArray.find((c: Client) => c.id === sale.clientId);
    const saleProducts = getSaleProducts(sale.id);
    
    let receiptContent = `
================================
         CUPOM DE VENDA
      (NÃO É DOCUMENTO FISCAL)
================================

Venda: ${sale.saleNumber}
Data: ${formatDate(sale.saleDate)}
Cliente: ${client?.name || "Cliente não informado"}

--------------------------------
            PRODUTOS
--------------------------------
`;

    saleProducts.forEach((item: any) => {
      const unitPrice = item.unitPrice ? Number(item.unitPrice) : 0;
      const total = unitPrice * item.quantity;
      receiptContent += `
${item.product.name}
SKU: ${item.product.sku}
Qtd: ${item.quantity} x ${formatCurrency(unitPrice.toString())}
Total: ${formatCurrency(total.toString())}
--------------------------------`;
    });

    receiptContent += `

SUBTOTAL: ${formatCurrency(sale.subtotal || "0")}
DESCONTO: ${formatCurrency(sale.discount || "0")}
TAXA: ${formatCurrency(sale.tax || "0")}
FRETE: ${formatCurrency(sale.shipping || "0")}

TOTAL: ${formatCurrency(sale.total)}

Pagamento: ${sale.paymentMethod?.toUpperCase() || "NÃO INFORMADO"}
Status: ${getLatestStatus(sale).toUpperCase()}

${sale.deliveryAddress ? `
Endereço de Entrega:
${sale.deliveryAddress}
${sale.deliveryDate ? `Data prevista: ${formatDate(sale.deliveryDate)}` : ''}
` : ''}

${sale.notes ? `Observações: ${sale.notes}` : ''}

================================
    Obrigado pela preferência!
================================
`;

    // Criar um novo arquivo de texto e baixar
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cupom-venda-${sale.saleNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendas</h1>
          <p className="text-muted-foreground">Gerencie suas vendas e pedidos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewSaleDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Venda
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSale ? "Editar Venda" : "Nova Venda"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="saleNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número da Venda</FormLabel>
                        <FormControl>
                          <Input placeholder="VDA-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente</FormLabel>
                        <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um cliente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clientsArray.map((client: Client) => (
                              <SelectItem key={client.id} value={client.id.toString()}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="saleDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data da Venda</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="confirmada">Confirmada</SelectItem>
                            <SelectItem value="enviada">Enviada</SelectItem>
                            <SelectItem value="entregue">Entregue</SelectItem>
                            <SelectItem value="cancelada">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Método de Pagamento</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="dinheiro">Dinheiro</SelectItem>
                            <SelectItem value="cartao">Cartão</SelectItem>
                            <SelectItem value="pix">PIX</SelectItem>
                            <SelectItem value="boleto">Boleto</SelectItem>
                            <SelectItem value="credito">Crédito</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status do Pagamento</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="pago">Pago</SelectItem>
                            <SelectItem value="atrasado">Atrasado</SelectItem>
                            <SelectItem value="cancelado">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="subtotal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subtotal</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="discount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Desconto</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Impostos</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="shipping"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frete</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="total"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliveryAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço de Entrega</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Endereço completo..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliveryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Entrega</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Observações sobre a venda..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingSale ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar vendas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="confirmada">Confirmada</SelectItem>
            <SelectItem value="enviada">Enviada</SelectItem>
            <SelectItem value="entregue">Entregue</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Vendas */}
      <div className="grid gap-4">
        {filteredSales.map((sale: Sale) => (
          <Card key={sale.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">{sale.saleNumber}</CardTitle>
                  </div>
                  <Badge className={statusColors[getLatestStatus(sale) as keyof typeof statusColors]}>
                    {getLatestStatus(sale).charAt(0).toUpperCase() + getLatestStatus(sale).slice(1)}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateReceipt(sale)}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(sale)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(sale.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informações da Venda */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{getClientName(sale.clientId)}</p>
                      <p className="text-xs text-muted-foreground">Cliente</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{formatDate(sale.saleDate)}</p>
                      <p className="text-xs text-muted-foreground">Data da Venda</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{formatCurrency(sale.total)}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Package2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {sale.paymentMethod ? sale.paymentMethod.toUpperCase() : "Não informado"}
                      </p>
                      <p className="text-xs text-muted-foreground">Pagamento</p>
                    </div>
                  </div>
                </div>
                
                {/* Produtos Vendidos */}
                <div>
                  <p className="text-sm font-medium mb-3">Produtos Vendidos</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {getSaleProducts(sale.id).map((item: any) => {
                      const unitPrice = item.unitPrice ? Number(item.unitPrice) : 0;
                      const itemTotal = unitPrice * item.quantity;
                      
                      return (
                        <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                              {item.product.image ? (
                                <img 
                                  src={item.product.image} 
                                  alt={item.product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  <Package2 className="h-3 w-3 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {item.quantity}x {item.product.name}
                              </p>
                              {item.product.sku && (
                                <p className="text-xs text-muted-foreground">SKU: {item.product.sku}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(itemTotal.toString())}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Resumo Financeiro */}
                  <div className="mt-4 pt-3 border-t">
                    <div className="space-y-1 text-xs">
                      {sale.subtotal && Number(sale.subtotal) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal:</span>
                          <span className="font-medium">{formatCurrency(sale.subtotal)}</span>
                        </div>
                      )}
                      {sale.discount && Number(sale.discount) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Desconto:</span>
                          <span className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(sale.discount)}</span>
                        </div>
                      )}
                      {sale.tax && Number(sale.tax) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Taxa:</span>
                          <span className="font-medium">{formatCurrency(sale.tax)}</span>
                        </div>
                      )}
                      {sale.shipping && Number(sale.shipping) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Frete:</span>
                          <span className="font-medium">{formatCurrency(sale.shipping)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-semibold">Total Final:</span>
                        <span className="font-bold text-lg text-green-600 dark:text-green-400">
                          {formatCurrency(sale.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {sale.deliveryAddress && (
                <>
                  <Separator className="my-3" />
                  <div className="flex items-start space-x-2">
                    <Truck className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Endereço de Entrega</p>
                      <p className="text-xs text-muted-foreground">{sale.deliveryAddress}</p>
                      {sale.deliveryDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Entrega prevista: {formatDate(sale.deliveryDate)}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
              
              {sale.notes && (
                <>
                  <Separator className="my-3" />
                  <div>
                    <p className="text-sm font-medium mb-1">Observações</p>
                    <p className="text-xs text-muted-foreground">{sale.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredSales.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma venda encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "Tente ajustar os filtros de busca."
                  : "Comece criando sua primeira venda."}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button onClick={openNewSaleDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Venda
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}