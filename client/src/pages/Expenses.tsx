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
import ServiceProvidersManager from "@/components/ServiceProvidersManager";
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
  Zap,
  Wifi,
  Shield,
  Coffee,
  Car,
  Home,
  Building,
  Smartphone,
  Bell,
  Settings,
  Tag
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
  
  // Converte para centavos
  const amount = parseFloat(numbers) / 100;
  
  if (isNaN(amount)) return '';
  
  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Função para converter valor formatado para decimal
const parseCurrencyInput = (value: string): string => {
  if (!value) return '';
  const numbers = value.replace(/\D/g, '');
  const amount = parseFloat(numbers) / 100;
  return isNaN(amount) ? '' : amount.toString();
};

// Esquema de validação
const expenseSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.string().min(1, "Valor é obrigatório"),
  category: z.string().min(1, "Categoria é obrigatória"),
  subcategory: z.string().optional(),
  date: z.date(),
  dueDate: z.date().optional(),
  scheduledDate: z.date().optional(),
  notes: z.string().optional(),
  paymentMethod: z.string().min(1, "Método de pagamento é obrigatório"),
  providerId: z.number().optional(),
  recurring: z.boolean().default(false),
  recurringPeriod: z.enum(["monthly", "yearly"]).optional(),
  reminderEnabled: z.boolean().default(false),
  reminderDaysBefore: z.number().min(1).max(30).default(3),
  status: z.enum(["pending", "paid", "overdue"]).default("pending"),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  subcategory?: string;
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

// Categorias e subcategorias
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

export default function Expenses() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
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

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const amount = parseFloat(data.amount);
      if (isNaN(amount) || amount < 0) {
        throw new Error("Valor inválido");
      }
      
      const response = await apiRequest("POST", "/api/expenses", {
        ...data,
        amount,
        providerId: data.providerId === "none" ? undefined : data.providerId,
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
      
      const response = await apiRequest("PUT", `/api/expenses/${id}`, {
        ...data,
        amount,
        providerId: data.providerId === "none" ? undefined : data.providerId,
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
      category: "",
      subcategory: "",
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
        amount: expense.amount?.toString() || "0",
        category: expense.category || "",
        subcategory: expense.subcategory || "",
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
      subcategory: "",
      date: new Date(),
      dueDate: undefined,
      scheduledDate: undefined,
      notes: "",
      paymentMethod: "",
      providerId: "none",
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getCategoryIcon = (category: string) => {
    const IconComponent = categoryIcons[category as keyof typeof categoryIcons] || FileText;
    return <IconComponent className="h-4 w-4" />;
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case "PIX": return "bg-green-100 text-green-800";
      case "Cartão de Crédito": return "bg-blue-100 text-blue-800";
      case "Cartão de Débito": return "bg-purple-100 text-purple-800";
      case "Dinheiro": return "bg-yellow-100 text-yellow-800";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Controle de Gastos</h1>
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
                          <FormLabel>Valor (R$)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="0,00" 
                              value={field.value ? formatCurrencyInput(field.value) : ''}
                              onChange={(e) => {
                                const formatted = formatCurrencyInput(e.target.value);
                                const parsed = parseCurrencyInput(formatted);
                                field.onChange(parsed);
                              }}
                            />
                          </FormControl>
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
                            form.setValue("subcategory", "");
                          }} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.keys(expenseCategories).map((category) => (
                                <SelectItem key={category} value={category}>
                                  <div className="flex items-center gap-2">
                                    {getCategoryIcon(category)}
                                    {category}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedCategory && (
                      <FormField
                        control={form.control}
                        name="subcategory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subcategoria</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma subcategoria" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {expenseCategories[selectedCategory as keyof typeof expenseCategories]?.map((subcategory) => (
                                  <SelectItem key={subcategory} value={subcategory}>
                                    {subcategory}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

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
                              {paymentMethods.map((method) => (
                                <SelectItem key={method} value={method}>
                                  {method}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.totalMonth || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              +2.5% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos do Ano</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.totalYear || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Meta anual: R$ 50.000,00
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorias Ativas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.byCategory?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredExpenses.length} despesas este mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="expenses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="expenses">Despesas</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="providers">Prestadores</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses">
          {/* Filters */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Filtros</CardTitle>
                <div className="flex gap-2">
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Categorias</SelectItem>
                      {Object.keys(expenseCategories).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterMonth} onValueChange={setFilterMonth}>
                    <SelectTrigger className="w-48">
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
          <Card>
            <CardHeader>
              <CardTitle>Despesas ({filteredExpenses.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Carregando despesas...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredExpenses.length > 0 ? (
                    filteredExpenses.map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-4 border-border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(expense.category)}
                            <div className="flex flex-col">
                              <div className="font-medium">{expense.description}</div>
                              <div className="text-sm text-gray-500">
                                {expense.subcategory && `${expense.subcategory} • `}
                                {format(new Date(expense.date), "dd/MM/yyyy", { locale: ptBR })}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="text-lg font-bold">
                              {formatCurrency(expense.amount)}
                            </div>
                            
                            <Badge className={getPaymentMethodColor(expense.paymentMethod)}>
                              {expense.paymentMethod}
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
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">Nenhuma despesa encontrada</p>
                      <p className="text-sm">Adicione uma nova despesa para começar o controle financeiro.</p>
                    </div>
                  )}
                </div>
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

        <TabsContent value="providers">
          <ServiceProvidersManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
