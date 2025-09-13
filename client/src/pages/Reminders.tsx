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
import { Switch } from "@/components/ui/switch";
import { format, addDays, addWeeks, addMonths, addYears, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Bell,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Calendar as CalendarIcon,
  Clock,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  Archive,
  Filter,
  Search,
  User,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Repeat
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Esquema de validação
const reminderSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  date: z.date(),
  time: z.string().min(1, "Horário é obrigatório"),
  category: z.string().min(1, "Categoria é obrigatória"),
  priority: z.enum(["low", "medium", "high"]),
  recurring: z.boolean().default(false),
  recurringType: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(),
  reminderMinutes: z.string().default("15"),
  location: z.string().optional(),
  attendees: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
});

type ReminderFormData = z.infer<typeof reminderSchema>;

interface Reminder {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  category: string;
  priority: "low" | "medium" | "high";
  recurring: boolean;
  recurringType?: string;
  reminderMinutes: number;
  location?: string;
  attendees?: string;
  phone?: string;
  email?: string;
  notes?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

// Categorias de lembrete
const reminderCategories = [
  "Pessoal",
  "Trabalho", 
  "Reunião",
  "Consulta",
  "Compromisso",
  "Aniversário",
  "Pagamento",
  "Tarefa",
  "Evento",
  "Outros"
];

const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800", 
  high: "bg-red-100 text-red-800"
};

const priorityLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta"
};

export default function Reminders() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar lembretes
  const { data: reminders = [], isLoading } = useQuery<Reminder[]>({
    queryKey: ["/api/reminders"],
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: ReminderFormData) =>
      fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      setIsDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Lembrete criado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar lembrete",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: ReminderFormData & { id: string }) =>
      fetch(`/api/reminders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      setIsDialogOpen(false);
      setEditingReminder(null);
      toast({
        title: "Sucesso",
        description: "Lembrete atualizado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar lembrete",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/reminders/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({
        title: "Sucesso",
        description: "Lembrete excluído com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir lembrete",
        variant: "destructive",
      });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/reminders/${id}/complete`, {
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({
        title: "Sucesso",
        description: "Status do lembrete atualizado",
      });
    },
  });

  // Form setup
  const form = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      title: "",
      description: "",
      date: new Date(),
      time: "09:00",
      category: "",
      priority: "medium",
      recurring: false,
      reminderMinutes: "15",
      location: "",
      attendees: "",
      phone: "",
      email: "",
      notes: "",
    },
  });

  const onSubmit = (data: ReminderFormData) => {
    if (editingReminder) {
      updateMutation.mutate({ id: editingReminder.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    form.reset({
      title: reminder.title,
      description: reminder.description || "",
      date: parseISO(reminder.date),
      time: reminder.time,
      category: reminder.category,
      priority: reminder.priority,
      recurring: reminder.recurring,
      recurringType: reminder.recurringType as any,
      reminderMinutes: reminder.reminderMinutes.toString(),
      location: reminder.location || "",
      attendees: reminder.attendees || "",
      phone: reminder.phone || "",
      email: reminder.email || "",
      notes: reminder.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Tem certeza que deseja excluir o lembrete "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const openNewReminderDialog = () => {
    setEditingReminder(null);
    form.reset({
      title: "",
      description: "",
      date: new Date(),
      time: "09:00",
      category: "",
      priority: "medium",
      recurring: false,
      reminderMinutes: "15",
      location: "",
      attendees: "",
      phone: "",
      email: "",
      notes: "",
    });
    setIsDialogOpen(true);
  };

  // Função para exportar todos os lembretes para VCF
  const exportToVCF = () => {
    const filteredReminders = getFilteredReminders();
    if (filteredReminders.length === 0) {
      toast({
        title: "Aviso",
        description: "Nenhum lembrete para exportar",
        variant: "destructive",
      });
      return;
    }

    let vcfContent = "";
    
    filteredReminders.forEach((reminder) => {
      const dateTime = new Date(`${reminder.date}T${reminder.time}`);
      const endDateTime = new Date(dateTime.getTime() + 60 * 60 * 1000); // +1 hora
      
      // Formato de data para VCF (YYYYMMDDTHHMMSS)
      const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      vcfContent += `BEGIN:VCALENDAR\r\n`;
      vcfContent += `VERSION:2.0\r\n`;
      vcfContent += `PRODID:-//wPanel//Reminders//EN\r\n`;
      vcfContent += `BEGIN:VEVENT\r\n`;
      vcfContent += `UID:${reminder.id}@wpanel.com\r\n`;
      vcfContent += `DTSTART:${formatDate(dateTime)}\r\n`;
      vcfContent += `DTEND:${formatDate(endDateTime)}\r\n`;
      vcfContent += `SUMMARY:${reminder.title}\r\n`;
      
      if (reminder.description) {
        vcfContent += `DESCRIPTION:${reminder.description.replace(/\n/g, '\\n')}\r\n`;
      }
      
      if (reminder.location) {
        vcfContent += `LOCATION:${reminder.location}\r\n`;
      }

      // Adicionar alarme
      vcfContent += `BEGIN:VALARM\r\n`;
      vcfContent += `TRIGGER:-PT${reminder.reminderMinutes}M\r\n`;
      vcfContent += `ACTION:DISPLAY\r\n`;
      vcfContent += `DESCRIPTION:${reminder.title}\r\n`;
      vcfContent += `END:VALARM\r\n`;

      // Recorrência
      if (reminder.recurring && reminder.recurringType) {
        const freqMap = {
          daily: 'DAILY',
          weekly: 'WEEKLY', 
          monthly: 'MONTHLY',
          yearly: 'YEARLY'
        };
        vcfContent += `RRULE:FREQ=${freqMap[reminder.recurringType as keyof typeof freqMap]}\r\n`;
      }

      vcfContent += `PRIORITY:${reminder.priority === 'high' ? '1' : reminder.priority === 'medium' ? '5' : '9'}\r\n`;
      vcfContent += `CATEGORIES:${reminder.category}\r\n`;
      vcfContent += `END:VEVENT\r\n`;
      vcfContent += `END:VCALENDAR\r\n\r\n`;
    });

    // Criar e fazer download do arquivo
    const blob = new Blob([vcfContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lembretes-${format(new Date(), 'yyyy-MM-dd')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Sucesso",
      description: `${filteredReminders.length} lembretes exportados para arquivo ICS/VCF`,
    });
  };

  // Função para exportar contatos dos lembretes
  const exportContactsToVCF = () => {
    const remindersWithContacts = reminders.filter(r => r.email || r.phone || r.attendees);
    
    if (remindersWithContacts.length === 0) {
      toast({
        title: "Aviso", 
        description: "Nenhum contato encontrado nos lembretes",
        variant: "destructive",
      });
      return;
    }

    let vcfContent = "";
    
    remindersWithContacts.forEach((reminder, index) => {
      vcfContent += `BEGIN:VCARD\r\n`;
      vcfContent += `VERSION:3.0\r\n`;
      vcfContent += `FN:${reminder.attendees || reminder.title}\r\n`;
      vcfContent += `ORG:${reminder.category}\r\n`;
      
      if (reminder.email) {
        vcfContent += `EMAIL:${reminder.email}\r\n`;
      }
      
      if (reminder.phone) {
        vcfContent += `TEL:${reminder.phone}\r\n`;
      }
      
      if (reminder.location) {
        vcfContent += `ADR:;;${reminder.location};;;;\r\n`;
      }
      
      if (reminder.notes) {
        vcfContent += `NOTE:${reminder.notes.replace(/\n/g, '\\n')}\r\n`;
      }
      
      vcfContent += `END:VCARD\r\n`;
    });

    const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `contatos-lembretes-${format(new Date(), 'yyyy-MM-dd')}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Sucesso",
      description: `${remindersWithContacts.length} contatos exportados para VCF`,
    });
  };

  // Filtrar lembretes
  const getFilteredReminders = () => {
    return reminders.filter(reminder => {
      if (filterCategory !== "all" && reminder.category !== filterCategory) {
        return false;
      }
      if (filterPriority !== "all" && reminder.priority !== filterPriority) {
        return false;
      }
      if (searchTerm && !reminder.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !reminder.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    });
  };

  const filteredReminders = getFilteredReminders();

  const formatDateTime = (date: string, time: string) => {
    const dateObj = parseISO(date);
    return format(dateObj, "dd/MM/yyyy", { locale: ptBR }) + " às " + time;
  };

  const isOverdue = (date: string, time: string) => {
    const reminderDate = new Date(`${date}T${time}`);
    return reminderDate < new Date();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Lembretes</h1>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewReminderDialog} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo Lembrete
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingReminder ? "Editar Lembrete" : "Novo Lembrete"}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input placeholder="Digite o título do lembrete" {...field} />
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
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horário</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
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
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {reminderCategories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
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
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prioridade</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Baixa</SelectItem>
                              <SelectItem value="medium">Média</SelectItem>
                              <SelectItem value="high">Alta</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="reminderMinutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lembrar antes (minutos)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="5">5 minutos</SelectItem>
                              <SelectItem value="15">15 minutos</SelectItem>
                              <SelectItem value="30">30 minutos</SelectItem>
                              <SelectItem value="60">1 hora</SelectItem>
                              <SelectItem value="1440">1 dia</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Local</FormLabel>
                          <FormControl>
                            <Input placeholder="Endereço ou local do evento" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="attendees"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Participantes</FormLabel>
                          <FormControl>
                            <Input placeholder="Nomes dos participantes" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input placeholder="(11) 99999-9999" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@exemplo.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Detalhes adicionais do lembrete..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="col-span-2 space-y-4">
                      <FormField
                        control={form.control}
                        name="recurring"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Lembrete Recorrente</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Repetir este lembrete periodicamente
                              </div>
                            </div>
                            <FormControl>
                              <Switch
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
                          name="recurringType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Recorrência</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo de repetição" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="daily">Diário</SelectItem>
                                  <SelectItem value="weekly">Semanal</SelectItem>
                                  <SelectItem value="monthly">Mensal</SelectItem>
                                  <SelectItem value="yearly">Anual</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Notas adicionais..."
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
                          {editingReminder ? "Atualizando..." : "Criando..."}
                        </>
                      ) : editingReminder ? (
                        "Atualizar"
                      ) : (
                        "Criar Lembrete"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={exportToVCF}>
            <Download className="h-4 w-4 mr-2" />
            Exportar ICS
          </Button>
          <Button variant="outline" onClick={exportContactsToVCF}>
            <User className="h-4 w-4 mr-2" />
            Exportar Contatos VCF
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar lembretes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                {reminderCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Prioridades</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Lembretes */}
      <Card>
        <CardHeader>
          <CardTitle>Lembretes ({filteredReminders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Carregando lembretes...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReminders.length > 0 ? (
                filteredReminders.map((reminder) => (
                  <div 
                    key={reminder.id} 
                    className={cn(
                      "flex items-center justify-between p-4 border rounded-lg transition-colors",
                      reminder.completed ? "bg-gray-50" : "hover:bg-muted/50",
                      isOverdue(reminder.date, reminder.time) && !reminder.completed ? "border-red-200 bg-red-50" : ""
                    )}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {reminder.completed ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : isOverdue(reminder.date, reminder.time) ? (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <Bell className="w-5 h-5 text-blue-500" />
                        )}
                        
                        <div className="flex flex-col">
                          <div className={cn("font-medium", reminder.completed ? "line-through text-gray-500" : "")}>
                            {reminder.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDateTime(reminder.date, reminder.time)}
                            {reminder.location && (
                              <>
                                <span className="mx-1">•</span>
                                <MapPin className="inline w-3 h-3 mr-1" />
                                {reminder.location}
                              </>
                            )}
                          </div>
                          {reminder.description && (
                            <div className="text-xs text-gray-400 mt-1">
                              {reminder.description}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={priorityColors[reminder.priority]}>
                          {priorityLabels[reminder.priority]}
                        </Badge>
                        
                        <Badge variant="outline">
                          {reminder.category}
                        </Badge>

                        {reminder.recurring && (
                          <Badge variant="secondary">
                            <Repeat className="w-3 h-3 mr-1" />
                            Recorrente
                          </Badge>
                        )}

                        {(reminder.phone || reminder.email) && (
                          <div className="flex gap-1">
                            {reminder.phone && (
                              <Phone className="w-4 h-4 text-gray-400" />
                            )}
                            {reminder.email && (
                              <Mail className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => completeMutation.mutate(reminder.id)}
                        className={cn(
                          "h-8 w-8 p-0",
                          reminder.completed 
                            ? "hover:bg-yellow-100 hover:text-yellow-600" 
                            : "hover:bg-green-100 hover:text-green-600"
                        )}
                        title={reminder.completed ? "Marcar como pendente" : "Marcar como concluído"}
                      >
                        {reminder.completed ? (
                          <Archive className="h-4 w-4" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(reminder)}
                        className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                        title="Editar lembrete"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(reminder.id, reminder.title)}
                        disabled={deleteMutation.isPending}
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        title="Excluir lembrete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Nenhum lembrete encontrado</p>
                  <p className="text-sm">Crie um novo lembrete para começar a organizar seus compromissos.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card de Informações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Sobre Exportação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-gray-600">
            <strong>Exportar ICS:</strong>
            <ul className="mt-1 ml-4 space-y-1">
              <li>• Exporta lembretes como eventos de calendário</li>
              <li>• Compatível com Google Calendar, Outlook, Apple Calendar</li>
              <li>• Inclui alarmes, recorrência e localização</li>
              <li>• Formato padrão para calendários (RFC 5545)</li>
            </ul>
          </div>
          
          <div className="text-sm text-gray-600">
            <strong>Exportar Contatos VCF:</strong>
            <ul className="mt-1 ml-4 space-y-1">
              <li>• Exporta informações de contato dos lembretes</li>
              <li>• Compatível com agenda telefônica, Outlook, Gmail</li>
              <li>• Inclui nome, telefone, email e endereço</li>
              <li>• Formato vCard padrão (RFC 6350)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
