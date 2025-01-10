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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { CalendarIcon, Plus, Edit, Trash2, Search, Filter, ShoppingCart, User, Calendar, DollarSign, Package2, Truck, FileText, ChevronDown, ChevronUp, CreditCard, RefreshCw, ExternalLink, CheckCircle, AlertCircle, Check, ChevronsUpDown } from "lucide-react";
import type { Sale, InsertSale, Client, Product, Service } from "@shared/schema";

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
  const [expandedSales, setExpandedSales] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["/api/sales"],
  });

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["/api/clients"],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: services = [] } = useQuery({
    queryKey: ["/api/services"],
  });

  // Queries para planos de desconto
  const { data: discountPlans = [] } = useQuery<any[]>({
    queryKey: ["/api/client-discount-plans"],
  });

  const { data: discountRules = [] } = useQuery<any[]>({
    queryKey: ["/api/client-discount-rules"],
  });

  // Hook para buscar itens de uma venda específica
  const useSaleItems = (saleId: number) => {
    return useQuery({
      queryKey: ["/api/sales", saleId, "items"],
      queryFn: () => apiRequest("GET", `/api/sales/${saleId}/items`),
    });
  };
  
  // Estado para os itens de venda atual (sendo editados)
  const [currentSaleItems, setCurrentSaleItems] = useState<Array<{
    productId?: number;
    serviceId?: number;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    product?: any;
    service?: any;
    type: 'product' | 'service';
  }>>([]);

  // Estados para desconto automático
  const [appliedDiscount, setAppliedDiscount] = useState<{
    planName: string;
    discountValue: number;
    discountType: string;
    paymentMethod: string;
  } | null>(null);

  // Estado para controlar se o popover está aberto
  const [productPopoverOpen, setProductPopoverOpen] = useState(false);
  
  const createMutation = useMutation({
    mutationFn: (data: InsertSale) => apiRequest("POST", "/api/sales", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      setIsDialogOpen(false);
      form.reset();
      setCurrentSaleItems([]);
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
      setCurrentSaleItems([]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/sales/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
    },
  });

  // Mutações para integração com Asaas
  const createPaymentMutation = useMutation({
    mutationFn: ({ saleId, billingType, dueDate }: { saleId: number; billingType: string; dueDate?: string }) =>
      apiRequest("POST", `/api/sales/${saleId}/create-payment`, { billingType, dueDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
    },
  });

  const syncPaymentMutation = useMutation({
    mutationFn: (saleId: number) =>
      apiRequest("POST", `/api/sales/${saleId}/sync-payment`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
    },
  });

  const getPaymentLinkQuery = (saleId: number) => {
    return useQuery({
      queryKey: ["/api/sales", saleId, "payment-link"],
      queryFn: () => apiRequest("GET", `/api/sales/${saleId}/payment-link`),
      enabled: false,
    });
  };

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

  // Função para calcular o total da venda
  const calculateTotal = (items: any[], subtotal: string, discount: string, tax: string, shipping: string) => {
    let itemsTotal = 0;
    if (Array.isArray(items)) {
      itemsTotal = items.reduce((acc, item) => {
        const unitPrice = item.unitPrice ? Number(item.unitPrice) : 0;
        return acc + unitPrice * item.quantity;
      }, 0);
    }
    const sub = subtotal ? Number(subtotal) : itemsTotal;
    const disc = discount ? Number(discount) : 0;
    const tx = tax ? Number(tax) : 0;
    const ship = shipping ? Number(shipping) : 0;
    return (sub - disc + tx + ship).toFixed(2);
  };
  
  // Função para atualizar os totais com base nos itens selecionados
  const updateFormTotals = () => {
    const itemsTotal = currentSaleItems.reduce((acc, item) => {
      return acc + (Number(item.unitPrice) * item.quantity);
    }, 0);
    
    form.setValue("subtotal", itemsTotal.toFixed(2));
    
    // Recalcular o total com base no subtotal atualizado
    const subtotal = itemsTotal;
    const discount = Number(form.getValues("discount") || 0);
    const tax = Number(form.getValues("tax") || 0);
    const shipping = Number(form.getValues("shipping") || 0);
    
    const total = (subtotal - discount + tax + shipping).toFixed(2);
    form.setValue("total", total);
  };
  
  // Função para adicionar um produto à venda atual
  const addProductToSale = (productId: number, quantity: number = 1) => {
    if (!products || !Array.isArray(products)) return;
    const product = products.find((p: any) => p.id === productId);
    if (!product) return;
    
    const unitPrice = product.price || "0.00";
    const totalPrice = (Number(unitPrice) * quantity).toFixed(2);
    
    const newItem = {
      productId,
      quantity,
      unitPrice,
      totalPrice,
      product,
      type: 'product' as const
    };
    
    setCurrentSaleItems(prev => [...prev, newItem]);
    
    // Atualizar os valores no formulário
    setTimeout(updateFormTotals, 0);
  };

  // Função para adicionar um serviço à venda atual
  const addServiceToSale = (serviceId: number, quantity: number = 1) => {
    if (!services || !Array.isArray(services)) return;
    const service = services.find((s: any) => s.id === serviceId);
    if (!service) return;
    
    const unitPrice = service.price || "0.00";
    const totalPrice = (Number(unitPrice) * quantity).toFixed(2);
    
    const newItem = {
      serviceId,
      quantity,
      unitPrice,
      totalPrice,
      service,
      type: 'service' as const
    };
    
    setCurrentSaleItems(prev => [...prev, newItem]);
    
    // Atualizar os valores no formulário
    setTimeout(updateFormTotals, 0);
  };
  
  // Função para remover um item da venda atual
  const removeItemFromSale = (index: number) => {
    setCurrentSaleItems(prev => prev.filter((_, i) => i !== index));
    
    // Atualizar os valores no formulário
    setTimeout(updateFormTotals, 0);
  };
  
  // Função para atualizar a quantidade de um item
  const updateItemQuantity = (index: number, newQuantity: number) => {
    setCurrentSaleItems(prev => {
      const updated = [...prev];
      const item = updated[index];
      if (item) {
        const unitPrice = Number(item.unitPrice);
        updated[index] = {
          ...item,
          quantity: newQuantity,
          totalPrice: (unitPrice * newQuantity).toFixed(2)
        };
      }
      return updated;
    });
    
    // Atualizar os valores no formulário
    setTimeout(updateFormTotals, 0);
  };

  // Função para calcular desconto automático baseado no plano do cliente e forma de pagamento
  const calculateAutomaticDiscount = (clientId: number, paymentMethod: string, subtotal: number) => {
    if (!clientId || !paymentMethod || !clients.length || !discountPlans.length || !discountRules.length) {
      return { discount: 0, discountInfo: null };
    }

    // Buscar o cliente selecionado
    const client = clients.find((c: any) => c.id === clientId);
    if (!client || !client.discountPlanId) {
      return { discount: 0, discountInfo: null };
    }

    // Buscar o plano de desconto do cliente
    const discountPlan = discountPlans.find((p: any) => p.id === client.discountPlanId);
    if (!discountPlan || !discountPlan.isActive) {
      return { discount: 0, discountInfo: null };
    }

    // Buscar as regras de desconto para o plano e forma de pagamento
    const rule = discountRules.find((r: any) => 
      r.discountPlanId === discountPlan.id && 
      r.paymentMethod === paymentMethod &&
      r.isActive
    );

    if (!rule) {
      return { discount: 0, discountInfo: null };
    }

    // Verificar valor mínimo do pedido se especificado
    if (rule.minOrderValue && subtotal < Number(rule.minOrderValue)) {
      return { discount: 0, discountInfo: null };
    }

    let discountAmount = 0;

    if (rule.discountType === 'percentage') {
      discountAmount = (subtotal * Number(rule.discountValue)) / 100;
      
      // Aplicar limite máximo se especificado
      if (rule.maxDiscountAmount && discountAmount > Number(rule.maxDiscountAmount)) {
        discountAmount = Number(rule.maxDiscountAmount);
      }
    } else if (rule.discountType === 'fixed') {
      discountAmount = Number(rule.discountValue);
    }

    const discountInfo = {
      planName: discountPlan.name,
      discountValue: Number(rule.discountValue),
      discountType: rule.discountType,
      paymentMethod: paymentMethod,
    };

    return { discount: discountAmount, discountInfo };
  };

  // Função para aplicar desconto automático quando cliente ou forma de pagamento mudar
  const applyAutomaticDiscount = () => {
    const clientId = form.getValues("clientId");
    const paymentMethod = form.getValues("paymentMethod");
    const subtotal = Number(form.getValues("subtotal") || 0);

    if (!clientId || !paymentMethod || subtotal === 0) {
      setAppliedDiscount(null);
      form.setValue("discount", "0.00");
      updateFormTotals();
      return;
    }

    const { discount, discountInfo } = calculateAutomaticDiscount(clientId, paymentMethod, subtotal);
    
    if (discount > 0 && discountInfo) {
      setAppliedDiscount(discountInfo);
      form.setValue("discount", discount.toFixed(2));
    } else {
      setAppliedDiscount(null);
      form.setValue("discount", "0.00");
    }
    
    updateFormTotals();
  };

  // Efeito para aplicar desconto automático quando dados relevantes mudarem
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "clientId" || name === "paymentMethod") {
        applyAutomaticDiscount();
      }
    });
    return () => subscription.unsubscribe();
  }, [form, clients, discountPlans, discountRules]);

  const onSubmit = async (data: SaleFormData) => {
    // Usar os itens atuais que estão sendo editados na interface
    const items = currentSaleItems.map(item => ({
      productId: item.productId || null,
      serviceId: item.serviceId || null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      type: item.type
    }));
    
    // Calcular o total final com os valores atuais
    const total = calculateTotal(items, data.subtotal, data.discount, data.tax, data.shipping);
    
    const formattedData = {
      ...data,
      clientId: Number(data.clientId),
      userId: 1, // Mock user ID
      total,
      items: items, // Adicionar itens de venda junto com os dados da venda
    };
    
    if (editingSale) {
      updateMutation.mutate({ id: editingSale.id, data: formattedData });
    } else {
      createMutation.mutate(formattedData);
    }
  };

  const handleEdit = async (sale: Sale) => {
    setEditingSale(sale);
    
    // Carregar os itens da venda sendo editada
    try {
      const response = await apiRequest("GET", `/api/sales/${sale.id}/items`);
      const items = await response.json();
      
      // Converter os itens para o formato usado pelo componente
      const formattedItems = items.map((item: any) => {
        const product = Array.isArray(products) ? products.find((p: any) => p.id === item.productId) : null;
        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice || "0.00",
          totalPrice: ((Number(item.unitPrice) || 0) * item.quantity).toFixed(2),
          product
        };
      });
      
      setCurrentSaleItems(formattedItems);
    } catch (error) {
      console.error("Erro ao carregar itens da venda:", error);
      setCurrentSaleItems([]);
    }
    
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

  // Funções para integração com Asaas
  const handleCreatePayment = async (sale: Sale, billingType: string = 'PIX') => {
    try {
      await createPaymentMutation.mutateAsync({
        saleId: sale.id,
        billingType,
        dueDate: sale.deliveryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      alert('Cobrança criada com sucesso no Asaas!');
    } catch (error) {
      console.error('Erro ao criar cobrança:', error);
      alert('Erro ao criar cobrança no Asaas');
    }
  };

  const handleSyncPayment = async (sale: Sale) => {
    try {
      await syncPaymentMutation.mutateAsync(sale.id);
      alert('Status sincronizado com sucesso!');
    } catch (error) {
      console.error('Erro ao sincronizar status:', error);
      alert('Erro ao sincronizar status com Asaas');
    }
  };

  const handleGetPaymentLink = async (sale: Sale) => {
    try {
      const response = await apiRequest("GET", `/api/sales/${sale.id}/payment-link`);
      const data = await response.json();
      if (data.paymentLink) {
        window.open(data.paymentLink, '_blank');
      } else {
        alert('Link de pagamento não disponível');
      }
    } catch (error) {
      console.error('Erro ao obter link de pagamento:', error);
      alert('Erro ao obter link de pagamento');
    }
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

  const toggleExpanded = (saleId: number) => {
    const newExpanded = new Set(expandedSales);
    if (newExpanded.has(saleId)) {
      newExpanded.delete(saleId);
    } else {
      newExpanded.add(saleId);
    }
    setExpandedSales(newExpanded);
  };

  const isExpanded = (saleId: number) => expandedSales.has(saleId);

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
    <div className="w-full max-w-full p-6 space-y-6">
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value
                                  ? clientsArray.find((client) => client.id === field.value)?.name
                                  : "Selecione um cliente"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Pesquisar cliente..." />
                              <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                              <CommandGroup>
                                <ScrollArea className="h-60">
                                  {clientsArray.map((client: Client) => (
                                    <CommandItem
                                      key={client.id}
                                      value={client.name}
                                      onSelect={() => {
                                        field.onChange(client.id)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === client.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {client.name}
                                    </CommandItem>
                                  ))}
                                </ScrollArea>
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Seção de Seleção de Produtos e Serviços */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Produtos e Serviços</h3>
                    <div className="flex gap-2">
                      <Popover open={productPopoverOpen} onOpenChange={setProductPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={productPopoverOpen}
                            className="w-[300px] justify-between"
                          >
                            Selecionar produto ou serviço
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Pesquisar produto ou serviço..." />
                            <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                            <CommandGroup heading="Produtos">
                              {Array.isArray(products) && products.map((product: any) => (
                                <CommandItem
                                  key={`product-${product.id}`}
                                  value={`${product.name} - ${formatCurrency(product.price)}`}
                                  onSelect={() => {
                                    addProductToSale(product.id);
                                    setProductPopoverOpen(false);
                                  }}
                                >
                                  <Check className="mr-2 h-4 w-4 opacity-0" />
                                  {product.name} - {formatCurrency(product.price)}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                            <CommandGroup heading="Serviços">
                              {Array.isArray(services) && services.map((service: any) => (
                                <CommandItem
                                  key={`service-${service.id}`}
                                  value={`${service.name} - ${formatCurrency(service.price)} ${service.duration ? `(${service.duration} ${service.durationType})` : ''}`}
                                  onSelect={() => {
                                    addServiceToSale(service.id);
                                    setProductPopoverOpen(false);
                                  }}
                                >
                                  <Check className="mr-2 h-4 w-4 opacity-0" />
                                  {service.name} - {formatCurrency(service.price)}
                                  {service.duration && ` (${service.duration} ${service.durationType})`}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  {/* Lista de itens selecionados */}
                  <div className="border rounded-md">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="px-4 py-2 text-left">Item</th>
                          <th className="px-4 py-2 text-center">Tipo</th>
                          <th className="px-4 py-2 text-center">Quantidade</th>
                          <th className="px-4 py-2 text-right">Preço Unit.</th>
                          <th className="px-4 py-2 text-right">Total</th>
                          <th className="px-4 py-2 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentSaleItems.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-4 text-center text-muted-foreground">
                              Nenhum item selecionado. Selecione produtos ou serviços para adicionar à venda.
                            </td>
                          </tr>
                        ) : (
                          currentSaleItems.map((item, index) => (
                            <tr key={`${item.type}-${item.productId || item.serviceId}-${index}`} className="border-b">
                              <td className="px-4 py-2">
                                {item.type === 'product' 
                                  ? (item.product?.name || `Produto #${item.productId}`)
                                  : (item.service?.name || `Serviço #${item.serviceId}`)
                                }
                              </td>
                              <td className="px-4 py-2 text-center">
                                <Badge variant={item.type === 'product' ? 'default' : 'secondary'}>
                                  {item.type === 'product' ? 'Produto' : 'Serviço'}
                                </Badge>
                              </td>
                              <td className="px-4 py-2 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Button 
                                    type="button"
                                    variant="outline" 
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => updateItemQuantity(index, Math.max(1, item.quantity - 1))}
                                  >
                                    -
                                  </Button>
                                  <Input
                                    type="number"
                                    className="w-16 text-center h-7"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                                  />
                                  <Button 
                                    type="button"
                                    variant="outline" 
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => updateItemQuantity(index, item.quantity + 1)}
                                  >
                                    +
                                  </Button>
                                </div>
                              </td>
                              <td className="px-4 py-2 text-right">
                                {formatCurrency(item.unitPrice)}
                              </td>
                              <td className="px-4 py-2 text-right">
                                {formatCurrency(item.totalPrice)}
                              </td>
                              <td className="px-4 py-2 text-center">
                                <Button 
                                  type="button"
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => removeItemFromSale(index)}
                                  className="h-8 w-8 p-0 text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {currentSaleItems.length > 0 && (
                        <tfoot>
                          <tr>
                            <td colSpan={4} className="px-4 py-2 text-right font-medium">
                              Total dos Itens:
                            </td>
                            <td className="px-4 py-2 text-right font-medium">
                              {formatCurrency(
                                currentSaleItems.reduce((acc, item) => acc + Number(item.totalPrice), 0).toFixed(2)
                              )}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
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
                        {appliedDiscount && (
                          <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-sm font-medium">Desconto Automático Aplicado!</span>
                            </div>
                            <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                              Plano {appliedDiscount.planName}: {appliedDiscount.discountType === 'percentage' ? `${appliedDiscount.discountValue}%` : `R$ ${appliedDiscount.discountValue.toFixed(2)}`} 
                              {' '}para {appliedDiscount.paymentMethod}
                            </div>
                          </div>
                        )}
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
      <div className="grid gap-3">
        {filteredSales.map((sale: Sale) => (
          <Card key={sale.id} className="overflow-hidden">
            {/* Versão Compacta - Sempre Visível */}
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Informações Básicas */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 flex-1 gap-2 sm:gap-0">
                  <div className="flex items-center space-x-3">
                    <ShoppingCart className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-semibold text-sm sm:text-base">{sale.saleNumber}</span>
                    <Badge className={statusColors[getLatestStatus(sale) as keyof typeof statusColors]}>
                      {getLatestStatus(sale).charAt(0).toUpperCase() + getLatestStatus(sale).slice(1)}
                    </Badge>
                    
                    {/* Indicador de integração com Asaas */}
                    {sale.asaasPaymentId && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                        <span className="text-xs text-blue-600 font-medium">Asaas</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status de pagamento */}
                    <Badge variant="outline" className={paymentStatusColors[sale.paymentStatus as keyof typeof paymentStatusColors]}>
                      {sale.paymentStatus ? sale.paymentStatus.charAt(0).toUpperCase() + sale.paymentStatus.slice(1) : '-'}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      {getClientName(sale.clientId)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(sale.saleDate)}
                    </div>
                    <div className="font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(sale.total)}
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex items-center space-x-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(sale.id)}
                    className="p-2"
                  >
                    {isExpanded(sale.id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
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
                  
                  {/* Botões de integração com Asaas */}
                  <div className="flex items-center gap-1 border-l pl-2">
                    {!sale.asaasPaymentId ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCreatePayment(sale)}
                        disabled={createPaymentMutation.isPending}
                        title="Criar cobrança no Asaas"
                      >
                        <CreditCard className="h-4 w-4" />
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSyncPayment(sale)}
                          disabled={syncPaymentMutation.isPending}
                          title="Sincronizar status do pagamento"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGetPaymentLink(sale)}
                          title="Obter link de pagamento"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>

            {/* Versão Expandida - Conditional */}
            {isExpanded(sale.id) && (
              <CardContent className="pt-0 pb-4 px-4">
                <Separator className="mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Informações Detalhadas da Venda */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Detalhes da Venda</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{getClientName(sale.clientId)}</p>
                          <p className="text-xs text-muted-foreground">Cliente</p>
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
                  </div>
                  
                  {/* Produtos Vendidos */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Produtos Vendidos</h4>
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
                    <Separator className="my-4" />
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
                    <Separator className="my-4" />
                    <div>
                      <p className="text-sm font-medium mb-1">Observações</p>
                      <p className="text-xs text-muted-foreground">{sale.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            )}
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