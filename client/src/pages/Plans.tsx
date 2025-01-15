import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Link } from "wouter";
import {
  Plus,
  Edit,
  Trash2,
  Crown,
  Star,
  Gem,
  Award,
  Diamond,
  Zap,
  X,
  Settings,
  Check,
  Loader2,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Plan, InsertPlan, PlanPaymentDiscount, PlanSubscriptionDiscount, PlanResourceAssignment, PlanResource } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { formatBRL, parseBRLToNumber, formatBRLInput, parseBRLInputToCents, formatCentsToDisplay } from "@/lib/utils";

// Predefined color options for plans
const planColors = [
  { name: "Carbon", color: "#1f2937", gradient: "linear-gradient(135deg, #1f2937 0%, #111827 100%)" },
  { name: "Bronze", color: "#8b5a2b", gradient: "linear-gradient(135deg, #cd7f32 0%, #8b5a2b 100%)" },
  { name: "Silver", color: "#9ca3af", gradient: "linear-gradient(135deg, #c0c0c0 0%, #9ca3af 100%)" },
  { name: "Gold", color: "#fbbf24", gradient: "linear-gradient(135deg, #ffd700 0%, #fbbf24 100%)" },
  { name: "Platinum", color: "#e5e7eb", gradient: "linear-gradient(135deg, #f7fafc 0%, #e5e7eb 100%)" },
  { name: "Diamond", color: "#3b82f6", gradient: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)" },
  { name: "Emerald", color: "#10b981", gradient: "linear-gradient(135deg, #34d399 0%, #10b981 100%)" },
  { name: "Ruby", color: "#ef4444", gradient: "linear-gradient(135deg, #f87171 0%, #ef4444 100%)" },
  { name: "Sapphire", color: "#8b5cf6", gradient: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)" },
  { name: "Onyx", color: "#000000", gradient: "linear-gradient(135deg, #374151 0%, #000000 100%)" },
  { name: "Pearl", color: "#f8fafc", gradient: "linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)" },
  { name: "Titanium", color: "#64748b", gradient: "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)" },
];

const paymentMethods = [
  { value: "PIX", label: "PIX" },
  { value: "cartao_credito", label: "Cartão de Crédito" },
  { value: "cartao_debito", label: "Cartão de Débito" },
  { value: "boleto", label: "Boleto Bancário" },
  { value: "dinheiro", label: "Dinheiro" },
];

const subscriptionPeriods = [
  { value: "3_months", label: "3 Meses" },
  { value: "6_months", label: "6 Meses" },
  { value: "12_months", label: "12 Meses" },
  { value: "24_months", label: "24 Meses" },
];

const billingPeriods = [
  { value: "monthly", label: "Mensal" },
  { value: "quarterly", label: "Trimestral" },
  { value: "biannual", label: "Semestral" },
  { value: "annual", label: "Anual" },
];

const planFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  price: z.string().min(1, "Preço é obrigatório"),
  currency: z.string().default("BRL"),
  billingPeriod: z.string().default("monthly"),
  limitations: z.string().optional(),
  color: z.string().min(1, "Cor é obrigatória"),
  gradient: z.string().min(1, "Gradiente é obrigatório"),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
  isDefault: z.boolean().default(false),
});

type PlanFormData = z.infer<typeof planFormSchema>;

export default function Plans() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedResources, setSelectedResources] = useState<Array<{
    resourceId: number;
    isEnabled: boolean;
    customValue: string;
  }>>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ["/api/plans"],
  });

  const { data: planResources = [] } = useQuery<(PlanResourceAssignment & { resource: PlanResource })[]>({
    queryKey: ["/api/plan-resource-assignments"],
    enabled: true, // Always try to fetch
    retry: 1, // Only retry once
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: availableResources = [] } = useQuery<PlanResource[]>({
    queryKey: ["/api/plan-resources"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Initialize selectedResources when availableResources loads
  useEffect(() => {
    if (availableResources.length > 0 && selectedResources.length === 0 && !editingPlan) {
      const initialResources = availableResources.map(resource => ({
        resourceId: resource.id,
        isEnabled: false,
        customValue: resource.value || "",
      }));
      setSelectedResources(initialResources);
    }
  }, [availableResources, editingPlan]);

  // Function to get resources for a specific plan (first 5)
  const getPlanResources = (planId: number) => {
    if (!planResources || planResources.length === 0) {
      return [];
    }
    return planResources
      .filter(assignment => assignment.planId === planId && assignment.isEnabled && assignment.resource?.isActive)
      .sort((a, b) => (a.resource?.sortOrder || 0) - (b.resource?.sortOrder || 0))
      .slice(0, 5);
  };

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "0.00",
      currency: "BRL",
      billingPeriod: "monthly",
      limitations: "",
      color: planColors[0].color,
      gradient: planColors[0].gradient,
      isActive: true,
      sortOrder: 0,
      isDefault: false,
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: (data: Partial<InsertPlan>) => apiRequest("POST", "/api/plans", data),
    onSuccess: async (newPlan: any) => {
      // Save resources after plan creation
      if (newPlan && newPlan.id && selectedResources.some(r => r.isEnabled)) {
        try {
          await savePlanResources(newPlan.id);
        } catch (error) {
          console.error("Error saving plan resources:", error);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/plan-resource-assignments"] });
      setIsDialogOpen(false);
      setEditingPlan(null);
      form.reset();
      setSelectedResources([]);
      
      toast({
        title: "Plano criado",
        description: "Plano foi criado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar plano.",
        variant: "destructive",
      });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertPlan> }) =>
      apiRequest("PUT", `/api/plans/${id}`, data),
    onSuccess: async (updatedPlan: any, variables) => {
      // Save resources after plan update
      if (selectedResources.some(r => r.isEnabled)) {
        try {
          await savePlanResources(variables.id);
        } catch (error) {
          console.error("Error saving plan resources:", error);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/plan-resource-assignments"] });
      setIsDialogOpen(false);
      setEditingPlan(null);
      form.reset();
      setSelectedResources([]);
      
      toast({
        title: "Plano atualizado",
        description: "Plano foi atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar plano.",
        variant: "destructive",
      });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/plans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      toast({
        title: "Plano excluído",
        description: "Plano foi excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao excluir plano.",
        variant: "destructive",
      });
    },
  });

  // Resource management functions
  const calculateTotalPrice = () => {
    const enabledResources = selectedResources.filter(r => r.isEnabled);
    let total = 0;
    
    enabledResources.forEach(resource => {
      const value = resource.customValue || "0";
      // Extract numeric value from string (e.g., "5GB" -> 5, "R$ 10,99" -> 10.99)
      const numericValue = parseFloat(value.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
      total += numericValue;
    });
    
    return total.toFixed(2);
  };

  const handleResourceToggle = (resourceId: number, isEnabled: boolean) => {
    setSelectedResources(prev => {
      const existing = prev.find(r => r.resourceId === resourceId);
      let newResources;
      
      if (existing) {
        newResources = prev.map(r => 
          r.resourceId === resourceId 
            ? { ...r, isEnabled }
            : r
        );
      } else {
        const resource = availableResources.find(r => r.id === resourceId);
        newResources = [...prev, { 
          resourceId, 
          isEnabled, 
          customValue: resource?.value || "" 
        }];
      }
      
      // Recalculate total price and update form if not editing
      if (!editingPlan) {
        const total = calculateTotalPriceFromResources(newResources);
        form.setValue('price', total);
      }
      
      return newResources;
    });
  };

  const handleResourceValueChange = (resourceId: number, customValue: string) => {
    setSelectedResources(prev => {
      const newResources = prev.map(r => 
        r.resourceId === resourceId 
          ? { ...r, customValue }
          : r
      );
      
      // Recalculate total price and update form if not editing
      if (!editingPlan) {
        const total = calculateTotalPriceFromResources(newResources);
        form.setValue('price', total);
      }
      
      return newResources;
    });
  };

  const calculateTotalPriceFromResources = (resources: typeof selectedResources) => {
    const enabledResources = resources.filter(r => r.isEnabled);
    let total = 0;
    
    enabledResources.forEach(resource => {
      const value = resource.customValue || "0";
      // Convert cents value to decimal (e.g., "5000" -> 50.00)
      const numericValue = parseFloat(value) / 100 || 0;
      total += numericValue;
    });
    
    return total.toFixed(2);
  };

  const loadPlanResources = (planId: number) => {
    const planAssignments = planResources.filter(pr => pr.planId === planId);
    const resourcesState = availableResources.map(resource => {
      const assignment = planAssignments.find(pa => pa.resourceId === resource.id);
      return {
        resourceId: resource.id,
        isEnabled: assignment?.isEnabled || false,
        customValue: assignment?.customValue || resource.value || "",
      };
    });
    setSelectedResources(resourcesState);
  };

  const savePlanResources = async (planId: number) => {
    // Delete existing assignments
    const existingAssignments = planResources.filter(pr => pr.planId === planId);
    for (const assignment of existingAssignments) {
      await apiRequest("DELETE", `/api/plan-resource-assignments/${assignment.id}`);
    }

    // Create new assignments for enabled resources
    const enabledResources = selectedResources.filter(r => r.isEnabled);
    for (const resource of enabledResources) {
      await apiRequest("POST", `/api/plans/${planId}/resources`, {
        resourceId: resource.resourceId,
        isEnabled: true,
        customValue: resource.customValue || null,
      });
    }
  };

  const onSubmit = (data: PlanFormData) => {
    if (editingPlan) {
      // When editing, send all form data with calculated price
      const calculatedPrice = calculateTotalPrice();
      const editData = {
        ...data,
        price: calculatedPrice,
        limitations: data.limitations ? JSON.parse(data.limitations) : null,
      };
      updatePlanMutation.mutate({ id: editingPlan.id, data: editData });
    } else {
      // When creating, send all data with calculated price
      const calculatedPrice = calculateTotalPrice();
      const planData = {
        ...data,
        price: calculatedPrice,
        limitations: data.limitations ? JSON.parse(data.limitations) : null,
      };
      createPlanMutation.mutate(planData);
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    
    // Load all plan data for editing
    form.reset({
      name: plan.name,
      description: plan.description || "",
      price: plan.price.toString(),
      currency: plan.currency,
      billingPeriod: plan.billingPeriod,
      limitations: plan.limitations ? JSON.stringify(plan.limitations) : "",
      color: plan.color,
      gradient: plan.gradient,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
      isDefault: plan.isDefault,
    });
    
    // Find and set the color index
    const colorIndex = planColors.findIndex(color => color.gradient === plan.gradient);
    if (colorIndex !== -1) {
      setSelectedColorIndex(colorIndex);
    }
    
    // Load plan resources for editing
    if (availableResources.length > 0) {
      loadPlanResources(plan.id);
    }
    
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deletePlanMutation.mutate(id);
  };

  const handleNewPlan = () => {
    setEditingPlan(null);
    setSelectedColorIndex(0);
    form.reset({
      color: planColors[0].color,
      gradient: planColors[0].gradient,
    });
    
    // Initialize with all resources disabled for new plan
    const initialResources = availableResources.map(resource => ({
      resourceId: resource.id,
      isEnabled: false,
      customValue: resource.value || "",
    }));
    setSelectedResources(initialResources);
    
    setIsDialogOpen(true);
  };

  const handleColorSelect = (index: number) => {
    setSelectedColorIndex(index);
    form.setValue("color", planColors[index].color);
    form.setValue("gradient", planColors[index].gradient);
  };

  const filteredPlans = plans
    .filter((plan) =>
      plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const getPlanIcon = (name: string) => {
    const lowercaseName = name.toLowerCase();
    if (lowercaseName.includes("carbon")) return <Zap className="w-5 h-5" />;
    if (lowercaseName.includes("bronze")) return <Award className="w-5 h-5" />;
    if (lowercaseName.includes("silver")) return <Star className="w-5 h-5" />;
    if (lowercaseName.includes("gold")) return <Crown className="w-5 h-5" />;
    if (lowercaseName.includes("platinum")) return <Gem className="w-5 h-5" />;
    if (lowercaseName.includes("diamond")) return <Diamond className="w-5 h-5" />;
    return <Star className="w-5 h-5" />;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Planos de Assinatura
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie os planos de assinatura e suas configurações de desconto.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/plan-resources">
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Gerenciar Recursos
              </Button>
            </Link>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleNewPlan} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Novo Plano
                </Button>
              </DialogTrigger>

            <DialogContent className="w-[95vw] max-w-[900px] lg:max-w-[1000px] bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-white">
                  {editingPlan ? "Editar Plano" : "Novo Plano"}
                </DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400">
                  {editingPlan 
                    ? "Atualize as informações do plano."
                    : "Adicione um novo plano de assinatura."
                  }
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {editingPlan ? (
                    // Mode: Edit existing plan - all fields with resources and calculated price
                    <div>
                      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          Editando: {editingPlan.name}
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Atualize as informações do plano. O preço será calculado automaticamente com base nos recursos habilitados.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-900 dark:text-white">Nome</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Nome do plano" 
                                  {...field} 
                                  className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-900 dark:text-white">
                                Preço Calculado (R$)
                                <span className="text-xs text-gray-500 ml-2">(baseado nos recursos)</span>
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00" 
                                  {...field}
                                  value={calculateTotalPrice()}
                                  readOnly
                                  className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-900 dark:text-white">Descrição</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Descrição do plano" 
                                {...field} 
                                className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Color Selection */}
                      <div className="space-y-3">
                        <Label className="text-gray-900 dark:text-white">Esquema de Cores</Label>
                        <div className="grid grid-cols-6 gap-2">
                          {planColors.map((colorOption, index) => (
                            <div
                              key={index}
                              className={`cursor-pointer rounded-lg p-3 border-2 transition-all ${
                                selectedColorIndex === index
                                  ? "border-blue-500 scale-105"
                                  : "border-gray-200 dark:border-gray-600 hover:scale-102"
                              }`}
                              onClick={() => handleColorSelect(index)}
                              style={{ background: colorOption.gradient }}
                            >
                              <div className="text-white text-center text-xs font-medium">
                                {colorOption.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="billingPeriod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-900 dark:text-white">Período de Cobrança</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                    <SelectValue placeholder="Selecione o período" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {billingPeriods.map((period) => (
                                    <SelectItem key={period.value} value={period.value}>
                                      {period.label}
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
                          name="sortOrder"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-900 dark:text-white">Ordem</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  placeholder="0" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="isActive"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-gray-900 dark:text-white">Plano Ativo</FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="isDefault"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-gray-900 dark:text-white">Plano Padrão</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Resources Section for Edit Mode */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <Label className="text-gray-900 dark:text-white font-medium">Recursos do Plano</Label>
                        </div>
                        
                        <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3">
                          {availableResources.map((resource) => {
                            const selectedResource = selectedResources.find(r => r.resourceId === resource.id);
                            const isEnabled = selectedResource?.isEnabled || false;
                            const customValue = selectedResource?.customValue || resource.value || "";
                            
                            return (
                              <div key={resource.id} className="flex items-center gap-3 p-3 border border-gray-100 dark:border-gray-700 rounded-lg">
                                <Switch
                                  checked={isEnabled}
                                  onCheckedChange={(checked) => handleResourceToggle(resource.id, checked)}
                                />
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    {resource.image && (
                                      <img 
                                        src={resource.image} 
                                        alt={resource.name}
                                        className="w-4 h-4 object-cover rounded"
                                      />
                                    )}
                                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                                      {resource.name}
                                    </span>
                                  </div>
                                  
                                  {isEnabled && (
                                    <Input
                                      value={customValue ? formatCentsToDisplay(customValue) : ''}
                                      onChange={(e) => {
                                        const formatted = formatBRLInput(e.target.value);
                                        const centsValue = parseBRLInputToCents(formatted);
                                        handleResourceValueChange(resource.id, centsValue);
                                      }}
                                      placeholder={resource.value ? formatCentsToDisplay(resource.value) : "Valor personalizado"}
                                      className="mt-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                  )}
                                  
                                  {!isEnabled && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      Padrão: {formatCentsToDisplay(resource.value)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          
                          {availableResources.length === 0 && (
                            <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                              Nenhum recurso disponível. Crie recursos na seção "Gerenciar Recursos".
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Mode: Create new plan - all fields
                    <div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-900 dark:text-white">Nome</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Nome do plano" 
                                  {...field} 
                                  className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-900 dark:text-white">Preço (R$)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00" 
                                  {...field} 
                                  className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-900 dark:text-white">Descrição</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Descrição do plano" 
                                {...field} 
                                className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Color Selection */}
                      <div className="space-y-3">
                        <Label className="text-gray-900 dark:text-white">Esquema de Cores</Label>
                        <div className="grid grid-cols-6 gap-2">
                          {planColors.map((colorOption, index) => (
                            <div
                              key={index}
                              className={`cursor-pointer rounded-lg p-3 border-2 transition-all ${
                                selectedColorIndex === index
                                  ? "border-blue-500 scale-105"
                                  : "border-gray-200 dark:border-gray-600 hover:scale-102"
                              }`}
                              onClick={() => handleColorSelect(index)}
                              style={{ background: colorOption.gradient }}
                            >
                              <div className="text-white text-center text-xs font-medium">
                                {colorOption.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="billingPeriod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-900 dark:text-white">Período de Cobrança</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                    <SelectValue placeholder="Selecione o período" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-white dark:bg-gray-800">
                                  {billingPeriods.map((period) => (
                                    <SelectItem key={period.value} value={period.value}>
                                      {period.label}
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
                          name="sortOrder"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-900 dark:text-white">Ordem de Exibição</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  placeholder="0" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex items-center gap-4">
                        <FormField
                          control={form.control}
                          name="isActive"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-gray-900 dark:text-white">Plano Ativo</FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="isDefault"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-gray-900 dark:text-white">Plano Padrão</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Resources Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <Label className="text-gray-900 dark:text-white font-medium">Recursos do Plano</Label>
                        </div>
                        
                        <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3">
                          {availableResources.map((resource) => {
                            const selectedResource = selectedResources.find(r => r.resourceId === resource.id);
                            const isEnabled = selectedResource?.isEnabled || false;
                            const customValue = selectedResource?.customValue || resource.value || "";
                            
                            return (
                              <div key={resource.id} className="flex items-center gap-3 p-3 border border-gray-100 dark:border-gray-700 rounded-lg">
                                <Switch
                                  checked={isEnabled}
                                  onCheckedChange={(checked) => handleResourceToggle(resource.id, checked)}
                                />
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    {resource.image && (
                                      <img 
                                        src={resource.image} 
                                        alt={resource.name}
                                        className="w-4 h-4 object-cover rounded"
                                      />
                                    )}
                                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                                      {resource.name}
                                    </span>
                                  </div>
                                  
                                  {isEnabled && (
                                    <Input
                                      value={customValue ? formatCentsToDisplay(customValue) : ''}
                                      onChange={(e) => {
                                        const formatted = formatBRLInput(e.target.value);
                                        const centsValue = parseBRLInputToCents(formatted);
                                        handleResourceValueChange(resource.id, centsValue);
                                      }}
                                      placeholder={resource.value ? formatCentsToDisplay(resource.value) : "Valor personalizado"}
                                      className="mt-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                  )}
                                  
                                  {!isEnabled && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      Padrão: {formatCentsToDisplay(resource.value)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          
                          {availableResources.length === 0 && (
                            <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                              Nenhum recurso disponível. Crie recursos na seção "Gerenciar Recursos".
                            </div>
                          )}
                        </div>
                      </div>

                      <Separator />
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsDialogOpen(false);
                        setEditingPlan(null);
                        form.reset();
                        setSelectedResources([]);
                      }}
                      className="border-gray-300 dark:border-gray-600"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                    >
                      {createPlanMutation.isPending || updatePlanMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {editingPlan ? 'Atualizando...' : 'Criando...'}
                        </>
                      ) : (
                        `${editingPlan ? "Atualizar" : "Criar"} Plano`
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Input
            type="text"
            placeholder="Buscar planos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredPlans.map((plan) => (
          <Card key={plan.id} className="relative overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            {/* Plan Header with Gradient */}
            <div 
              className="h-24 relative"
              style={{ background: plan.gradient }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-20"></div>
              <div className="relative p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getPlanIcon(plan.name)}
                    <h3 className="font-bold text-lg">{plan.name}</h3>
                  </div>
                  {plan.isDefault && (
                    <Badge variant="secondary" className="bg-white bg-opacity-20 text-white border-white border-opacity-30">
                      Padrão
                    </Badge>
                  )}
                </div>
                <p className="text-2xl font-bold mt-1">
                  {formatCentsToDisplay(plan.price.toString())}
                  <span className="text-sm font-normal opacity-80">/{plan.billingPeriod === 'monthly' ? 'mês' : plan.billingPeriod}</span>
                </p>
              </div>
            </div>

            <CardContent className="p-4">
              {plan.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {plan.description}
                </p>
              )}

              {/* Plan Resources */}
              {(() => {
                const resources = getPlanResources(plan.id);
                return resources.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Recursos Inclusos:</h4>
                    <div className="space-y-1">
                      {resources.map((assignment) => (
                        <div key={assignment.id} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <span className="truncate">
                            <span className="font-medium">{assignment.resource.name}:</span> {formatCentsToDisplay(assignment.customValue || assignment.resource.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Badge variant={plan.isActive ? "default" : "secondary"}>
                    {plan.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(plan)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white dark:bg-gray-800">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900 dark:text-white">
                          Excluir Plano
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                          Tem certeza de que deseja excluir o plano "{plan.name}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-gray-300 dark:border-gray-600">
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(plan.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPlans.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Nenhum plano encontrado.
          </p>
        </div>
      )}
    </div>
    </div>
  );
}
