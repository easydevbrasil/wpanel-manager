import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Database,
  Table,
  Edit,
  Trash2,
  Plus,
  Download,
  Upload,
  RefreshCw,
  Search,
  Filter,
  Save,
  X,
  Eye,
  Copy,
  FileText,
  Zap,
  Settings,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

interface TableInfo {
  name: string;
  label: string;
  icon: any;
  endpoint: string;
  fields: FieldInfo[];
}

interface FieldInfo {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'date' | 'boolean' | 'textarea' | 'select';
  required?: boolean;
  options?: string[];
}

// Table configurations
const tableConfigs: TableInfo[] = [
  {
    name: 'users',
    label: 'Usuários',
    icon: Database,
    endpoint: '/api/users',
    fields: [
      { name: 'username', label: 'Nome de usuário', type: 'text', required: true },
      { name: 'name', label: 'Nome completo', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'role', label: 'Função', type: 'select', options: ['admin', 'user', 'manager'] },
      { name: 'avatar', label: 'Avatar URL', type: 'text' },
    ]
  },
  {
    name: 'clients',
    label: 'Clientes',
    icon: Database,
    endpoint: '/api/clients',
    fields: [
      { name: 'name', label: 'Nome', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', label: 'Telefone', type: 'text' },
      { name: 'company', label: 'Empresa', type: 'text' },
      { name: 'position', label: 'Cargo', type: 'text' },
      { name: 'address', label: 'Endereço', type: 'text' },
      { name: 'city', label: 'Cidade', type: 'text' },
      { name: 'state', label: 'Estado', type: 'text' },
      { name: 'zipCode', label: 'CEP', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
      { name: 'notes', label: 'Observações', type: 'textarea' },
    ]
  },
  {
    name: 'products',
    label: 'Produtos',
    icon: Database,
    endpoint: '/api/products',
    fields: [
      { name: 'name', label: 'Nome', type: 'text', required: true },
      { name: 'sku', label: 'SKU', type: 'text', required: true },
      { name: 'description', label: 'Descrição', type: 'textarea' },
      { name: 'price', label: 'Preço', type: 'number', required: true },
      { name: 'cost', label: 'Custo', type: 'number' },
      { name: 'stock', label: 'Estoque', type: 'number' },
      { name: 'categoryId', label: 'Categoria ID', type: 'number' },
      { name: 'manufacturerId', label: 'Fabricante ID', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'discontinued'] },
    ]
  },
  {
    name: 'sales',
    label: 'Vendas',
    icon: Database,
    endpoint: '/api/sales',
    fields: [
      { name: 'saleNumber', label: 'Número da venda', type: 'text', required: true },
      { name: 'clientId', label: 'Cliente ID', type: 'number' },
      { name: 'saleDate', label: 'Data da venda', type: 'date', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['pendente', 'confirmada', 'enviada', 'entregue', 'cancelada'] },
      { name: 'paymentMethod', label: 'Método de pagamento', type: 'select', options: ['dinheiro', 'cartao', 'pix', 'boleto', 'credito'] },
      { name: 'paymentStatus', label: 'Status pagamento', type: 'select', options: ['pendente', 'pago', 'atrasado'] },
      { name: 'subtotal', label: 'Subtotal', type: 'number' },
      { name: 'taxes', label: 'Impostos', type: 'number' },
      { name: 'shipping', label: 'Frete', type: 'number' },
      { name: 'total', label: 'Total', type: 'number' },
    ]
  },
  {
    name: 'suppliers',
    label: 'Fornecedores',
    icon: Database,
    endpoint: '/api/suppliers',
    fields: [
      { name: 'name', label: 'Nome', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', label: 'Telefone', type: 'text' },
      { name: 'website', label: 'Website', type: 'text' },
      { name: 'address', label: 'Endereço', type: 'text' },
      { name: 'city', label: 'Cidade', type: 'text' },
      { name: 'state', label: 'Estado', type: 'text' },
      { name: 'zipCode', label: 'CEP', type: 'text' },
      { name: 'contactPerson', label: 'Pessoa de contato', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
      { name: 'rating', label: 'Avaliação', type: 'number' },
    ]
  },
  {
    name: 'support/tickets',
    label: 'Tickets de Suporte',
    icon: Database,
    endpoint: '/api/support/tickets',
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true },
      { name: 'description', label: 'Descrição', type: 'textarea', required: true },
      { name: 'clientId', label: 'Cliente ID', type: 'number' },
      { name: 'priority', label: 'Prioridade', type: 'select', options: ['baixa', 'media', 'alta', 'critica'] },
      { name: 'status', label: 'Status', type: 'select', options: ['aberto', 'em_andamento', 'aguardando_cliente', 'resolvido', 'fechado'] },
      { name: 'categoryId', label: 'Categoria ID', type: 'number' },
      { name: 'assignedTo', label: 'Atribuído para', type: 'text' },
    ]
  },
];

// Record editor component
function RecordEditor({ 
  table, 
  record, 
  onSave, 
  onCancel 
}: { 
  table: TableInfo; 
  record?: any; 
  onSave: (data: any) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState(record || {});

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev: Record<string, any>) => ({ ...prev, [fieldName]: value }));
  };

  const renderField = (field: FieldInfo) => {
    const value = formData[field.name] || '';

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.label}
            className="min-h-[80px]"
          />
        );

      case 'select':
        return (
          <Select value={value} onValueChange={(val) => handleFieldChange(field.name, val)}>
            <SelectTrigger>
              <SelectValue placeholder={`Selecione ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'boolean':
        return (
          <Switch
            checked={value}
            onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
          />
        );

      default:
        return (
          <Input
            type={field.type}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.label}
            required={field.required}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {table.fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {renderField(field)}
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button onClick={() => onSave(formData)}>
          <Save className="w-4 h-4 mr-2" />
          Salvar
        </Button>
      </div>
    </div>
  );
}

// Data table component
function DataTable({ table }: { table: TableInfo }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<number[]>([]);
  const [expandedRecord, setExpandedRecord] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch data
  const { data: records = [], isLoading, refetch } = useQuery({
    queryKey: [table.endpoint],
    queryFn: async () => {
      const response = await fetch(table.endpoint);
      if (!response.ok) throw new Error('Failed to fetch data');
      return response.json();
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', table.endpoint, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [table.endpoint] });
      setShowCreateDialog(false);
      toast({
        title: "Sucesso",
        description: "Registro criado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao criar registro: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest('PUT', `${table.endpoint}/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [table.endpoint] });
      setEditingRecord(null);
      toast({
        title: "Sucesso",
        description: "Registro atualizado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao atualizar registro: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `${table.endpoint}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [table.endpoint] });
      toast({
        title: "Sucesso",
        description: "Registro excluído com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao excluir registro: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filter records based on search
  const filteredRecords = records.filter((record: any) =>
    Object.values(record).some((value: any) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Export to CSV
  const exportToCSV = () => {
    const headers = table.fields.map(field => field.label).join(',');
    const rows = filteredRecords.map((record: any) =>
      table.fields.map(field => record[field.name] || '').join(',')
    );
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${table.name}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export to JSON
  const exportToJSON = () => {
    const json = JSON.stringify(filteredRecords, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${table.name}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Bulk delete
  const bulkDelete = async () => {
    for (const id of selectedRecords) {
      await deleteMutation.mutateAsync(id);
    }
    setSelectedRecords([]);
  };

  const toggleRecordSelection = (id: number) => {
    setSelectedRecords(prev =>
      prev.includes(id)
        ? prev.filter(recordId => recordId !== id)
        : [...prev, id]
    );
  };

  const toggleExpandRecord = (id: number) => {
    setExpandedRecord(expandedRecord === id ? null : id);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={`Buscar em ${table.label.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          {selectedRecords.length > 0 && (
            <Button variant="destructive" onClick={bulkDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir ({selectedRecords.length})
            </Button>
          )}
          
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          
          <Button variant="outline" onClick={exportToJSON}>
            <FileText className="w-4 h-4 mr-2" />
            JSON
          </Button>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Criar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar novo registro em {table.label}</DialogTitle>
              </DialogHeader>
              <RecordEditor
                table={table}
                onSave={(data) => createMutation.mutate(data)}
                onCancel={() => setShowCreateDialog(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Enhanced Stats for Current Table */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <table.icon className="w-4 h-4" />
          Estatísticas de {table.label}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-blue-100 dark:border-blue-800">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{records.length}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Total de registros</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-green-100 dark:border-green-800">
            <div className="flex items-center space-x-2">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                <Filter className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-xl font-bold text-green-600 dark:text-green-400">{filteredRecords.length}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Filtrados</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-purple-100 dark:border-purple-800">
            <div className="flex items-center space-x-2">
              <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{selectedRecords.length}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Selecionados</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-orange-100 dark:border-orange-800">
            <div className="flex items-center space-x-2">
              <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded-lg">
                <Settings className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-xl font-bold text-orange-600 dark:text-orange-400">{table.fields.length}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Campos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="space-y-2 p-4">
                {filteredRecords.map((record: any) => (
                  <div key={record.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedRecords.includes(record.id)}
                          onChange={() => toggleRecordSelection(record.id)}
                          className="rounded"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpandRecord(record.id)}
                        >
                          {expandedRecord === record.id ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                        <Badge variant="outline">ID: {record.id}</Badge>
                        <span className="font-medium">
                          {record.name || record.title || record.username || `Registro #${record.id}`}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingRecord(record)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteMutation.mutate(record.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {expandedRecord === record.id && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pt-2 border-t">
                        {table.fields.map((field) => (
                          <div key={field.name} className="text-sm">
                            <span className="font-medium text-gray-600">{field.label}:</span>
                            <span className="ml-2">
                              {field.type === 'boolean' 
                                ? (record[field.name] ? 'Sim' : 'Não')
                                : (record[field.name] || '-')
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={editingRecord !== null} onOpenChange={() => setEditingRecord(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar registro em {table.label}</DialogTitle>
          </DialogHeader>
          {editingRecord && (
            <RecordEditor
              table={table}
              record={editingRecord}
              onSave={(data) => updateMutation.mutate({ id: editingRecord.id, data })}
              onCancel={() => setEditingRecord(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DatabaseAdmin() {
  const [selectedTable, setSelectedTable] = useState(tableConfigs[0]);
  const { toast } = useToast();

  // Fetch overview statistics
  const { data: overviewStats, isLoading: overviewLoading } = useQuery({
    queryKey: ['database-overview'],
    queryFn: async () => {
      try {
        const [
          usersRes,
          clientsRes,
          productsRes,
          salesRes,
          suppliersRes,
          ticketsRes
        ] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/clients'),
          fetch('/api/products'),
          fetch('/api/sales'),
          fetch('/api/suppliers'),
          fetch('/api/support/tickets')
        ]);

        const [users, clients, products, sales, suppliers, tickets] = await Promise.all([
          usersRes.ok ? usersRes.json() : [],
          clientsRes.ok ? clientsRes.json() : [],
          productsRes.ok ? productsRes.json() : [],
          salesRes.ok ? salesRes.json() : [],
          suppliersRes.ok ? suppliersRes.json() : [],
          ticketsRes.ok ? ticketsRes.json() : []
        ]);

        return {
          users: users.length || 0,
          clients: clients.length || 0,
          products: products.length || 0,
          sales: sales.length || 0,
          suppliers: suppliers.length || 0,
          tickets: tickets.length || 0,
          total: (users.length || 0) + (clients.length || 0) + (products.length || 0) + 
                 (sales.length || 0) + (suppliers.length || 0) + (tickets.length || 0)
        };
      } catch (error) {
        console.error('Error fetching overview stats:', error);
        return {
          users: 0, clients: 0, products: 0, sales: 0, suppliers: 0, tickets: 0, total: 0
        };
      }
    },
  });

  return (
    <div className="w-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Administração do Banco de Dados
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie todos os dados do sistema com funcionalidades completas CRUD
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center space-x-1">
          <Database className="w-4 h-4" />
          <span>PostgreSQL</span>
        </Badge>
      </div>

      {/* Database Overview Statistics */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
            <Zap className="w-5 h-5" />
            <span>Visão Geral do Sistema</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {overviewLoading ? (
            <div className="flex justify-center items-center h-24">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {overviewStats?.total || 0}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    Total de Registros
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {overviewStats?.users || 0}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    Usuários
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {overviewStats?.clients || 0}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    Clientes
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600 mb-1">
                    {overviewStats?.products || 0}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    Produtos
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-1">
                    {overviewStats?.sales || 0}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    Vendas
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-teal-600 mb-1">
                    {overviewStats?.suppliers || 0}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    Fornecedores
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600 mb-1">
                    {overviewStats?.tickets || 0}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    Tickets
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Table className="w-5 h-5" />
              <span>Tabelas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="space-y-1 p-4">
                {tableConfigs.map((table) => (
                  <button
                    key={table.name}
                    onClick={() => setSelectedTable(table)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedTable.name === table.name
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-muted/50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <table.icon className="w-5 h-5" />
                      <div>
                        <div className="font-medium">{table.label}</div>
                        <div className="text-xs text-gray-500">{table.fields.length} campos</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <selectedTable.icon className="w-5 h-5" />
                <span>{selectedTable.label}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable table={selectedTable} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}