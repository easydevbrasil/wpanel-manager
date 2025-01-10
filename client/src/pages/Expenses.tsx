import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { ExpenseCategoriesManager } from "@/components/ExpenseCategoriesManager";
import { PaymentMethodsManager } from "@/components/PaymentMethodsManager";
import ServiceProvidersManager from "@/components/ServiceProvidersManager";
import ExpenseCard from "@/components/ExpenseCard";
import {
  CreditCard,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Calendar as CalendarIcon,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  FileText,
  FileCheck,
  Zap,
  ArrowLeftRight,
  Wallet,
  Wifi,
  Shield,
  Coffee,
  Car,
  Home,
  Building,
  Smartphone,
  Bell,
  Settings,
  Tag,
  Grid3X3,
  List
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Função para formatação de valores monetários
const formatCurrency = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numValue || 0);
};

// Função para formatar input de valor monetário
const formatCurrencyInput = (value: string): string => {
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '');

  if (!numbers) return '';

  // Converte para centavos
  const amount = parseFloat(numbers) / 100;

  if (isNaN(amount)) return '';

  // Formatar no padrão brasileiro (1.234,56)
  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Função para converter valor formatado para decimal
const parseCurrencyInput = (value: string): string => {
  if (!value) return '0';

  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '');

  if (!numbers) return '0';

  // Converte de centavos para reais
  const amount = parseFloat(numbers) / 100;

  // Retorna no formato decimal para o banco (12.34)
  return isNaN(amount) ? '0' : amount.toFixed(2);
};

// Esquema de validação
const expenseSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.string().min(1, "Valor é obrigatório"),
  currency: z.enum(["BRL", "USD", "EUR"]).default("BRL"),
  originalAmount: z.string().optional(),
  category: z.string().min(1, "Categoria é obrigatória"),
  date: z.date(),
  dueDate: z.date().optional(),
  scheduledDate: z.date().optional(),
  notes: z.string().optional(),
  paymentMethod: z.string().min(1, "Método de pagamento é obrigatório"),
  providerId: z.union([z.string(), z.number()]).optional(),
  recurring: z.boolean().default(false),
  recurringPeriod: z.enum(["monthly", "yearly"]).optional(),
  reminderEnabled: z.boolean().default(false),
  reminderDaysBefore: z.number().min(1).max(30).default(3),
  status: z.enum(["pending", "paid", "overdue"]).default("pending"),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface Category {
  id: number;
  name: string;
  icon: string;
  isActive: boolean;
}

interface PaymentMethod {
  id: number;
  name: string;
  icon: string;
  isActive: boolean;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  amountConverted?: number; // Valor sempre em BRL
  currency?: string;
  originalAmount?: number;
  category: string;
  date: string;
  dueDate?: string;
  scheduledDate?: string;
  notes?: string;
  paymentMethod: string;
  providerId?: number;
  providerName?: string;
  recurring: boolean;
  recurringPeriod?: string;
  reminderEnabled: boolean;
  reminderDaysBefore?: number;
  status: "pending" | "paid" | "overdue";
  createdAt: string;
  updatedAt: string;
}

interface ExpenseStats {
  totalMonth: number;
  totalYear: number;
  byCategory: Array<{ category: string; total: number; count: number }>;
  monthlyTrend: Array<{ month: string; total: number }>;
}

// Hook para buscar categorias do banco de dados
const useExpenseCategories = () => {
  return useQuery<Category[]>({
    queryKey: ['/api/expense-categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/expense-categories');
      return response.json();
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
};

// Tipo local para PaymentMethod
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

// Hook para buscar métodos de pagamento do banco de dados
const usePaymentMethods = () => {
  return useQuery<PaymentMethod[]>({
    queryKey: ['/api/payment-methods'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/payment-methods');
      return response.json();
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
};

// Categorias e subcategorias (DEPRECATED - mantido para compatibilidade)
const expenseCategories = {
  "Serviços": ["Hospedagem", "Domain", "SSL", "CDN", "Email", "Backup", "Monitoramento"],
  "Infraestrutura": ["Servidor", "VPS", "Cloud Storage", "Bandwidth", "Database"],
  "Software": ["Licenças", "SaaS", "Ferramentas", "Plugins", "Templates"],
  "Marketing": ["Publicidade", "SEO Tools", "Analytics", "Social Media", "Email Marketing"],
  "Operacional": ["Internet", "Energia", "Escritório", "Telefone", "Transporte"],
  "Pessoal": ["Salários", "Freelancers", "Consultoria", "Treinamento", "Benefícios"],
  "Legal": ["Contabilidade", "Jurídico", "Taxas", "Impostos", "Documentação"],
  "Outros": ["Diversos", "Emergência", "Equipamentos", "Manutenção"]
};

const paymentMethods = [
  "Cartão de Crédito",
  "Cartão de Débito",
  "PIX",
  "Transferência",
  "Dinheiro",
  "Boleto",
  "PayPal",
  "Stripe"
];

const categoryIcons = {
  "Serviços": Zap,
  "Infraestrutura": Building,
  "Software": Smartphone,
  "Marketing": TrendingUp,
  "Operacional": Wifi,
  "Pessoal": Coffee,
  "Legal": Shield,
  "Outros": FileText
};

// Hook para buscar taxas de câmbio da tabela (mantido para compatibilidade futura)
const useExchangeRates = () => {
  return useQuery({
    queryKey: ['/api/exchange-rates'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/exchange-rates');
      return response.json();
    },
    staleTime: 1000 * 60 * 30, // 30 minutos - dados são atualizados a cada hora
    refetchInterval: 1000 * 60 * 60, // Refetch a cada hora
  });
};

// Hook para converter valores de moeda estrangeira para BRL (DEPRECIADO - mantido para compatibilidade)
const useConvertToBRL = (amount: number, currency: string) => {
  return useQuery({
    queryKey: ['/api/convert', amount, currency, 'BRL'],
    queryFn: async () => {
      if (currency === 'BRL') return { convertedAmount: amount, rate: 1 };
      const response = await apiRequest('GET', `/api/convert/${amount}/${currency}/BRL`);
      return response.json();
    },
    enabled: currency !== 'BRL',
    staleTime: 1000 * 60 * 30, // 30 minutos
  });
};

// Componente para mostrar valor usando amountConverted (sempre BRL)
const ExpenseAmount = ({ expense }: { expense: Expense }) => {
  const currency = expense.currency || 'BRL';

  // Se for BRL, mostrar amount normalmente
  if (currency === 'BRL') {
    return (
      <div className="text-lg font-bold">
        {formatCurrency(Number(expense.amount))}
      </div>
    );
  }

  // Para moedas estrangeiras, usar amountConverted (já em BRL) e mostrar valor original
  const convertedAmount = Number(expense.amountConverted || expense.amount);
  const originalAmount = Number(expense.originalAmount || expense.amount);
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '';

  return (
    <div className="text-right">
      <div className="text-lg font-bold text-green-600">
        {formatCurrency(convertedAmount)}
      </div>
      <div className="text-sm text-muted-foreground">
        Original: {currencySymbol}{originalAmount.toFixed(2)} {currency}
      </div>
    </div>
  );
};

export default function Expenses() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>(new Date().getMonth() + "-" + new Date().getFullYear());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar despesas
  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/expenses");
      return response.json();
    }
  });

  // Buscar estatísticas
  const { data: stats } = useQuery<ExpenseStats>({
    queryKey: ["/api/expenses/stats"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/expenses/stats");
      return response.json();
    }
  });

  // Buscar prestadores
  const { data: providers = [] } = useQuery({
    queryKey: ["/api/providers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/providers");
      return response.json();
    }
  });

  // Buscar categorias e métodos de pagamento do banco
  const { data: dbCategories = [] } = useExpenseCategories();
  const { data: dbPaymentMethods = [] } = usePaymentMethods();

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const amount = parseFloat(data.amount);
      if (isNaN(amount) || amount < 0) {
        throw new Error("Valor inválido");
      }

      let finalAmount = amount;
      let originalAmount = undefined;

      // If currency is not BRL, convert to BRL
      if (data.currency && data.currency !== 'BRL') {
        try {
          const conversionResponse = await apiRequest('GET', `/api/convert/${amount}/${data.currency}/BRL`);
          const conversionData = await conversionResponse.json();
          finalAmount = conversionData.convertedAmount;
          originalAmount = amount;
        } catch (error) {
          // If conversion fails, use original amount and warn user
          console.warn("Currency conversion failed, using original amount");
          toast({
            title: "⚠️ Aviso",
            description: `Conversão de ${data.currency} para BRL não disponível. Valor salvo como ${data.currency}.`,
            variant: "destructive"
          });
        }
      }

      const response = await apiRequest("POST", "/api/expenses", {
        ...data,
        amount: finalAmount,
        originalAmount,
        currency: data.currency || 'BRL',
        providerId: data.providerId === "none" || !data.providerId ? undefined :
          typeof data.providerId === 'string' ? parseInt(data.providerId) : data.providerId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses/stats"] });
      setIsDialogOpen(false);
      toast({
        title: "✅ Sucesso",
        description: "Despesa criada com sucesso",
      });
    },
    onError: (error) => {
      console.error("Create expense error:", error);
      toast({
        title: "❌ Erro",
        description: error instanceof Error ? error.message : "Erro ao criar despesa",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: ExpenseFormData & { id: string }) => {
      const amount = parseFloat(data.amount);
      if (isNaN(amount) || amount < 0) {
        throw new Error("Valor inválido");
      }

      let finalAmount = amount;
      let originalAmount = undefined;

      // If currency is not BRL, convert to BRL
      if (data.currency && data.currency !== 'BRL') {
        try {
          const conversionResponse = await apiRequest('GET', `/api/convert/${amount}/${data.currency}/BRL`);
          const conversionData = await conversionResponse.json();
          finalAmount = conversionData.convertedAmount;
          originalAmount = amount;
        } catch (error) {
          console.warn("Currency conversion failed, using original amount");
          toast({
            title: "⚠️ Aviso",
            description: `Conversão de ${data.currency} para BRL não disponível. Valor salvo como ${data.currency}.`,
            variant: "destructive"
          });
        }
      }

      const response = await apiRequest("PUT", `/api/expenses/${id}`, {
        ...data,
        amount: finalAmount,
        originalAmount,
        currency: data.currency || 'BRL',
        providerId: data.providerId === "none" || !data.providerId ? undefined :
          typeof data.providerId === 'string' ? parseInt(data.providerId) : data.providerId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses/stats"] });
      setIsDialogOpen(false);
      setEditingExpense(null);
      toast({
        title: "✅ Sucesso",
        description: "Despesa atualizada com sucesso",
      });
    },
    onError: (error) => {
      console.error("Update expense error:", error);
      toast({
        title: "❌ Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar despesa",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/expenses/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses/stats"] });
      toast({
        title: "✅ Sucesso",
        description: "Despesa excluída com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "❌ Erro",
        description: "Erro ao excluir despesa",
        variant: "destructive",
      });
    },
  });

  // Form setup
  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: "",
      currency: "BRL",
      originalAmount: "",
      category: "",
      date: new Date(),
      dueDate: undefined,
      scheduledDate: undefined,
      notes: "",
      paymentMethod: "",
      providerId: undefined,
      recurring: false,
      recurringPeriod: undefined,
      reminderEnabled: false,
      reminderDaysBefore: 3,
      status: "pending"
    },
  });

  const onSubmit = (data: ExpenseFormData) => {
    try {
      if (editingExpense) {
        updateMutation.mutate({ id: editingExpense.id, ...data });
      } else {
        createMutation.mutate(data);
      }
    } catch (error) {
      console.error("Error submitting expense form:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar despesa. Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (expense: Expense) => {
    try {
      console.log("Editing expense:", expense);
      setEditingExpense(expense);
      setSelectedCategory(expense.category);

      // Validar e formatar datas com fallback
      const parseDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return undefined;
        const parsed = new Date(dateStr);
        return isNaN(parsed.getTime()) ? undefined : parsed;
      };

      const formData = {
        description: expense.description || "",
        amount: expense.originalAmount
          ? parseFloat(expense.originalAmount.toString()).toFixed(2)
          : expense.amount
            ? parseFloat(expense.amount.toString()).toFixed(2)
            : "0.00",
        currency: (expense as any).currency || "BRL",
        originalAmount: expense.originalAmount?.toString(),
        category: expense.category || "",
        date: parseDate(expense.date) || new Date(),
        dueDate: parseDate(expense.dueDate),
        scheduledDate: parseDate(expense.scheduledDate),
        notes: expense.notes || "",
        paymentMethod: expense.paymentMethod || "cash",
        providerId: expense.providerId ? expense.providerId.toString() : "none",
        recurring: expense.recurring || false,
        recurringPeriod: (expense.recurringPeriod as "monthly" | "yearly") || undefined,
        reminderEnabled: expense.reminderEnabled || false,
        reminderDaysBefore: expense.reminderDaysBefore || 3,
        status: expense.status || "pending"
      };

      console.log("Form data to reset:", formData);
      form.reset(formData);
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Error editing expense:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da despesa. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (id: string, description: string) => {
    if (confirm(`Tem certeza que deseja excluir a despesa "${description}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const openNewExpenseDialog = () => {
    setEditingExpense(null);
    setSelectedCategory("");
    form.reset({
      description: "",
      amount: "",
      category: "",
      date: new Date(),
      dueDate: undefined,
      scheduledDate: undefined,
      notes: "",
      paymentMethod: "",
      providerId: undefined,
      recurring: false,
      recurringPeriod: undefined,
      reminderEnabled: false,
      reminderDaysBefore: 3,
      status: "pending"
    });
    setIsDialogOpen(true);
  };

  // Filtrar despesas
  const filteredExpenses = expenses.filter(expense => {
    if (filterCategory !== "all" && expense.category !== filterCategory) {
      return false;
    }

    const expenseDate = new Date(expense.date);
    const [month, year] = filterMonth.split("-").map(Number);

    return expenseDate.getMonth() === month && expenseDate.getFullYear() === year;
  });

  const getCategoryIcon = (category: string) => {
    const IconComponent = categoryIcons[category as keyof typeof categoryIcons] || FileText;
    return <IconComponent className="h-4 w-4" />;
  };

  const getPaymentMethodData = (methodName: string) => {
    const method = dbPaymentMethods.find(m => m.name === methodName);
    return method || null;
  };

  const getPaymentMethodColor = (method: string) => {
    const paymentMethod = getPaymentMethodData(method) as PaymentMethod | null;
    if (paymentMethod && paymentMethod.color) {
      // Converte cor hex para classes CSS
      const colorMap: { [key: string]: string } = {
        '#00BC7E': 'bg-green-100 text-green-800',
        '#3B82F6': 'bg-blue-100 text-blue-800',
        '#10B981': 'bg-emerald-100 text-emerald-800',
        '#F59E0B': 'bg-amber-100 text-amber-800',
        '#8B5CF6': 'bg-violet-100 text-violet-800',
        '#22C55E': 'bg-green-100 text-green-800',
        '#6B7280': 'bg-gray-100 text-gray-800',
        '#0070BA': 'bg-blue-100 text-blue-800',
        '#009EE3': 'bg-cyan-100 text-cyan-800',
        '#F7941E': 'bg-orange-100 text-orange-800',
      };
      return colorMap[paymentMethod.color] || 'bg-muted text-muted-foreground';
    }
    
    // Fallback para métodos antigos
    switch (method) {
      case "PIX": return "bg-green-100 text-green-800";
      case "Cartão de Crédito": return "bg-blue-100 text-blue-800";
      case "Cartão de Débito": return "bg-purple-100 text-purple-800";
      case "Dinheiro": return "bg-yellow-100 text-yellow-800";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPaymentMethodIcon = (methodName: string) => {
    const method = getPaymentMethodData(methodName) as PaymentMethod | null;
    if (method) {
      const iconMap: { [key: string]: any } = {
        'Zap': Zap,
        'CreditCard': CreditCard,
        'DollarSign': DollarSign,
        'FileText': FileText,
        'ArrowLeftRight': ArrowLeftRight,
        'FileCheck': FileCheck,
        'Wallet': Wallet,
        'Smartphone': Smartphone,
        'Shield': Shield,
      };
      const IconComponent = iconMap[method.icon];
      return IconComponent ? <IconComponent className="h-4 w-4" style={{ color: method.color }} /> : <CreditCard className="h-4 w-4" />;
    }
    return <CreditCard className="h-4 w-4" />;
  };

  const getPaymentMethodName = (method: string) => {
    const methodMap: { [key: string]: string } = {
      "pix": "PIX",
      "PIX": "PIX",
      "credit": "Cartão de Crédito",
      "credit_card": "Cartão de Crédito",
      "Cartão de Crédito": "Cartão de Crédito",
      "debit": "Cartão de Débito",
      "debit_card": "Cartão de Débito",
      "Cartão de Débito": "Cartão de Débito",
      "cash": "Dinheiro",
      "Dinheiro": "Dinheiro",
      "bank_transfer": "Transferência Bancária",
      "Transferência": "Transferência Bancária",
      "boleto": "Boleto Bancário",
      "Boleto": "Boleto Bancário",
      "paypal": "PayPal",
      "PayPal": "PayPal",
      "stripe": "Stripe",
      "Stripe": "Stripe"
    };
    return methodMap[method] || method;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Controle de Gastos</h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Gerencie suas despesas e acompanhe seus gastos</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewExpenseDialog} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Despesa
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle>
                    {editingExpense ? "Editar Despesa" : "Nova Despesa"}
                  </DialogTitle>
                </DialogHeader>

                <div className="overflow-y-auto flex-1 pr-2">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>Descrição</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: Hospedagem VPS Digital Ocean" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Valor {form.watch("currency") === "USD" ? "($)" : form.watch("currency") === "EUR" ? "(€)" : "(R$)"}
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    placeholder="0,00"
                                    className="text-right pl-10"
                                    value={field.value && field.value !== '0' ? formatCurrencyInput(field.value) : ''}
                                    onChange={(e) => {
                                      const rawValue = e.target.value;
                                      const formatted = formatCurrencyInput(rawValue);
                                      const parsed = parseCurrencyInput(rawValue);
                                      field.onChange(parsed);
                                    }}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="currency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Moeda</FormLabel>
                              <Select value={field.value} onValueChange={(value) => {
                                field.onChange(value);
                                // Reset originalAmount when currency changes
                                if (value === 'BRL') {
                                  form.setValue('originalAmount', undefined);
                                }
                              }}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione a moeda" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="BRL">🇧🇷 Real (BRL)</SelectItem>
                                  <SelectItem value="USD">🇺🇸 Dólar (USD)</SelectItem>
                                  <SelectItem value="EUR">🇪🇺 Euro (EUR)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                      ) : (
                                        <span>Selecione a data</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                      date < new Date("1900-01-01")
                                    }
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="dueDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data de Vencimento</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                      ) : (
                                        <span>Selecione uma data</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="scheduledDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data Agendada</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                      ) : (
                                        <span>Selecione uma data</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Categoria</FormLabel>
                              <Select onValueChange={(value) => {
                                field.onChange(value);
                                setSelectedCategory(value);
                              }} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma categoria" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {dbCategories.map((category) => (
                                    <SelectItem key={category.id} value={category.name}>
                                      <div className="flex items-center gap-2">
                                        {getCategoryIcon(category.name)}
                                        {category.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="paymentMethod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Método de Pagamento</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o método" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {dbPaymentMethods.map((method) => (
                                    <SelectItem key={method.id} value={method.name}>
                                      <div className="flex items-center gap-2">
                                        {getPaymentMethodIcon(method.name)}
                                        {method.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="providerId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prestador</FormLabel>
                              <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um prestador" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="none">Nenhum prestador</SelectItem>
                                  {providers.map((provider: any) => (
                                    <SelectItem key={provider.id} value={provider.id.toString()}>
                                      {provider.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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
                                    <SelectValue placeholder="Selecione o status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="pending">Pendente</SelectItem>
                                  <SelectItem value="paid">Pago</SelectItem>
                                  <SelectItem value="overdue">Atrasado</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="recurring"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Despesa Recorrente</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  Marque se esta despesa se repete regularmente
                                </div>
                              </div>
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {form.watch("recurring") && (
                          <FormField
                            control={form.control}
                            name="recurringPeriod"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Período de Recorrência</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o período" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="monthly">Mensal</SelectItem>
                                    <SelectItem value="yearly">Anual</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        <FormField
                          control={form.control}
                          name="reminderEnabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Habilitar Lembretes</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  Receba notificações antes do vencimento
                                </div>
                              </div>
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {form.watch("reminderEnabled") && (
                          <FormField
                            control={form.control}
                            name="reminderDaysBefore"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Lembrar quantos dias antes?</FormLabel>
                                <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione os dias" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="1">1 dia antes</SelectItem>
                                    <SelectItem value="3">3 dias antes</SelectItem>
                                    <SelectItem value="7">7 dias antes</SelectItem>
                                    <SelectItem value="15">15 dias antes</SelectItem>
                                    <SelectItem value="30">30 dias antes</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>Observações</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Informações adicionais sobre a despesa..."
                                  className="resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          disabled={createMutation.isPending || updateMutation.isPending}
                          className="flex-1"
                        >
                          {createMutation.isPending || updateMutation.isPending ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              {editingExpense ? "Atualizando..." : "Criando..."}
                            </>
                          ) : editingExpense ? (
                            "Atualizar"
                          ) : (
                            "Criar Despesa"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 hover:shadow-lg transition-shadow h-[120px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Gastos do Mês</CardTitle>
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {formatCurrency(stats?.totalMonth || 0)}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                +2.5% em relação ao mês anterior
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 hover:shadow-lg transition-shadow h-[120px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Gastos do Ano</CardTitle>
              <div className="p-1.5 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {formatCurrency(stats?.totalYear || 0)}
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                Meta anual: R$ 50.000,00
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 hover:shadow-lg transition-shadow h-[120px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Categorias Ativas</CardTitle>
              <div className="p-1.5 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {stats?.byCategory?.length || 0}
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                {filteredExpenses.length} despesas este mês
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="expenses" className="space-y-4">
          <TabsList className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <TabsTrigger value="expenses" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Despesas</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700">Análises</TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">Categorias</TabsTrigger>
            <TabsTrigger value="payment-methods" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">Métodos de Pagamento</TabsTrigger>
            <TabsTrigger value="providers" className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">Prestadores</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses">
            {/* Filters */}
            <Card className="border-0 shadow-md bg-white dark:bg-slate-800">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    <CardTitle className="text-slate-900 dark:text-white">Filtros</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="w-48 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as Categorias</SelectItem>
                        {dbCategories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={filterMonth} onValueChange={setFilterMonth}>
                      <SelectTrigger className="w-48 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => {
                          const date = new Date();
                          date.setMonth(i);
                          const monthValue = i + "-" + date.getFullYear();
                          return (
                            <SelectItem key={monthValue} value={monthValue}>
                              {format(date, "MMMM yyyy", { locale: ptBR })}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Expenses List */}
            <Card className="border-0 shadow-md bg-white dark:bg-slate-800">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    <CardTitle className="text-slate-900 dark:text-white">Despesas ({filteredExpenses.length})</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                      <Button
                        variant={viewMode === 'cards' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('cards')}
                        className={`h-8 px-3 ${viewMode === 'cards' ? 'bg-white dark:bg-slate-600 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className={`h-8 px-3 ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {/* TODO: Export functionality */ }}
                      className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-200 border-t-blue-600 mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">Carregando despesas...</p>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Aguarde um momento</p>
                  </div>
                ) : (
                  <>
                    {filteredExpenses.length > 0 ? (
                      <>
                        {viewMode === 'cards' ? (
                          <div className="grid grid-cols-1 gap-4 p-1">
                            {filteredExpenses.map((expense) => (
                              <div key={expense.id} className="h-[280px] transform transition-all duration-200 hover:scale-[1.01] hover:shadow-md">
                                <ExpenseCard
                                  expense={expense}
                                  onEdit={handleEdit}
                                  onDelete={handleDelete}
                                  getCategoryIcon={getCategoryIcon}
                                  getPaymentMethodColor={getPaymentMethodColor}
                                  getPaymentMethodName={getPaymentMethodName}
                                  formatCurrency={formatCurrency}
                                  isDeleting={deleteMutation.isPending}
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {filteredExpenses.map((expense) => (
                              <div key={expense.id} className="flex items-center justify-between p-4 border-border rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    {getCategoryIcon(expense.category)}
                                    <div className="flex flex-col">
                                      <div className="font-medium">{expense.description}</div>
                                      <div className="text-sm text-gray-500">
                                        {format(new Date(expense.date), "dd/MM/yyyy", { locale: ptBR })}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <ExpenseAmount expense={expense} />

                                    <Badge className={getPaymentMethodColor(expense.paymentMethod)}>
                                      {getPaymentMethodName(expense.paymentMethod)}
                                    </Badge>

                                    <Badge variant="outline">
                                      {expense.category}
                                    </Badge>

                                    {expense.recurring && (
                                      <Badge variant="secondary">
                                        Recorrente
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(expense)}
                                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(expense.id, expense.description)}
                                    disabled={deleteMutation.isPending}
                                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium mb-2">Nenhuma despesa encontrada</p>
                        <p className="text-sm">Adicione uma nova despesa para começar o controle financeiro.</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gastos por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.byCategory?.map((item) => (
                      <div key={item.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(item.category)}
                          <span className="font-medium">{item.category}</span>
                          <Badge variant="outline">{item.count}</Badge>
                        </div>
                        <div className="font-bold">{formatCurrency(item.total)}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tendência Mensal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                    <p>Gráfico de tendência será implementado em breve</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="categories">
            <ExpenseCategoriesManager />
          </TabsContent>

          <TabsContent value="payment-methods">
            <PaymentMethodsManager />
          </TabsContent>

          <TabsContent value="providers">
            <ServiceProvidersManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
