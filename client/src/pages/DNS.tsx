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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Plus, Edit, Trash2, Search, Filter, Globe, Shield, AlertCircle, CheckCircle, Server, Database, Mail, FileText, ExternalLink, Cloud } from "lucide-react";

interface DNSRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
  priority?: number;
  proxied: boolean;
  zone_id: string;
  zone_name: string;
  created_on: string;
  modified_on: string;
}

interface Zone {
  id: string;
  name: string;
  status: string;
  paused: boolean;
  type: string;
  development_mode: number;
  name_servers: string[];
  original_name_servers: string[];
  original_registrar: string;
  original_dnshost: string;
  modified_on: string;
  created_on: string;
  activated_on: string;
}

const dnsRecordSchema = z.object({
  type: z.enum(["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV", "PTR"]),
  name: z.string().min(1, "Nome é obrigatório"),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  ttl: z.string().default("1"),
  priority: z.string().optional(),
  proxied: z.boolean().default(false),
});

type DNSRecordFormData = z.infer<typeof dnsRecordSchema>;

const typeColors = {
  A: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  AAAA: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  CNAME: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  MX: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  TXT: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  NS: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  SRV: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  PTR: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
};

const typeIcons = {
  A: Server,
  AAAA: Database,
  CNAME: ExternalLink,
  MX: Mail,
  TXT: FileText,
  NS: Globe,
  SRV: Server,
  PTR: Server,
};

export default function DNS() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DNSRecord | null>(null);
  const queryClient = useQueryClient();

  // Fetch zone information
  const { data: zone, isLoading: zoneLoading } = useQuery({
    queryKey: ["/api/dns/zone"],
    queryFn: () => apiRequest("GET", "/api/dns/zone"),
  });

  // Fetch DNS records
  const { data: records = [], isLoading: recordsLoading, refetch: refetchRecords } = useQuery({
    queryKey: ["/api/dns/records"],
    queryFn: () => apiRequest("GET", "/api/dns/records"),
  });

  // Test connection
  const { data: connectionTest } = useQuery({
    queryKey: ["/api/dns/test"],
    queryFn: () => apiRequest("GET", "/api/dns/test"),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: DNSRecordFormData) => apiRequest("POST", "/api/dns/records", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dns/records"] });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DNSRecordFormData> }) =>
      apiRequest("PUT", `/api/dns/records/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dns/records"] });
      setIsDialogOpen(false);
      setEditingRecord(null);
      form.reset();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/dns/records/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dns/records"] });
    },
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: (types?: string[]) => apiRequest("POST", "/api/dns/sync", { types }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dns/records"] });
    },
  });

  const form = useForm<DNSRecordFormData>({
    resolver: zodResolver(dnsRecordSchema),
    defaultValues: {
      type: "A",
      name: "",
      content: "",
      ttl: "1",
      priority: "",
      proxied: false,
    },
  });

  const onSubmit = (data: DNSRecordFormData) => {
    const formattedData = {
      ...data,
      ttl: data.ttl === "1" ? undefined : parseInt(data.ttl),
      priority: data.priority ? parseInt(data.priority) : undefined,
    };

    if (editingRecord) {
      updateMutation.mutate({ id: editingRecord.id, data: formattedData });
    } else {
      createMutation.mutate(formattedData);
    }
  };

  const handleEdit = (record: DNSRecord) => {
    setEditingRecord(record);
    form.reset({
      type: record.type as any,
      name: record.name,
      content: record.content,
      ttl: record.ttl.toString(),
      priority: record.priority?.toString() || "",
      proxied: record.proxied,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este registro DNS?")) {
      deleteMutation.mutate(id);
    }
  };

  const openNewRecordDialog = () => {
    setEditingRecord(null);
    form.reset({
      type: "A",
      name: "",
      content: "",
      ttl: "1",
      priority: "",
      proxied: false,
    });
    setIsDialogOpen(true);
  };

  const handleSync = () => {
    if (confirm("Deseja sincronizar todos os registros DNS?")) {
      syncMutation.mutate();
    }
  };

  const recordsArray = Array.isArray(records) ? records : [];
  
  const filteredRecords = recordsArray.filter((record: DNSRecord) => {
    const matchesSearch = 
      record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || record.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const formatTTL = (ttl: number) => {
    if (ttl === 1) return "Auto";
    if (ttl < 60) return `${ttl}s`;
    if (ttl < 3600) return `${Math.floor(ttl / 60)}m`;
    if (ttl < 86400) return `${Math.floor(ttl / 3600)}h`;
    return `${Math.floor(ttl / 86400)}d`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRecordStats = () => {
    const stats = recordsArray.reduce((acc: Record<string, number>, record: DNSRecord) => {
      acc[record.type] = (acc[record.type] || 0) + 1;
      return acc;
    }, {});
    return stats;
  };

  const recordStats = getRecordStats();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento DNS</h1>
          <p className="text-muted-foreground">
            Gerencie registros DNS com integração Cloudflare
          </p>
        </div>
        <div className="flex items-center gap-2">
          {connectionTest && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm ${
              connectionTest.connected 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
            }`}>
              {connectionTest.connected ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span>{connectionTest.connected ? 'Conectado' : 'Desconectado'}</span>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="records" className="space-y-6">
        <TabsList>
          <TabsTrigger value="records">Registros DNS</TabsTrigger>
          <TabsTrigger value="zone">Informações da Zona</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-6">
          {/* Controls */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar registros..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-[300px]"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="AAAA">AAAA</SelectItem>
                  <SelectItem value="CNAME">CNAME</SelectItem>
                  <SelectItem value="MX">MX</SelectItem>
                  <SelectItem value="TXT">TXT</SelectItem>
                  <SelectItem value="NS">NS</SelectItem>
                  <SelectItem value="SRV">SRV</SelectItem>
                  <SelectItem value="PTR">PTR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleSync}
                disabled={syncMutation.isPending}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                Sincronizar
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openNewRecordDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Registro
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingRecord ? "Editar Registro DNS" : "Novo Registro DNS"}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="A">A - IPv4 Address</SelectItem>
                                <SelectItem value="AAAA">AAAA - IPv6 Address</SelectItem>
                                <SelectItem value="CNAME">CNAME - Canonical Name</SelectItem>
                                <SelectItem value="MX">MX - Mail Exchange</SelectItem>
                                <SelectItem value="TXT">TXT - Text Record</SelectItem>
                                <SelectItem value="NS">NS - Name Server</SelectItem>
                                <SelectItem value="SRV">SRV - Service Record</SelectItem>
                                <SelectItem value="PTR">PTR - Pointer Record</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input placeholder="example.com ou @" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Conteúdo</FormLabel>
                            <FormControl>
                              <Input placeholder="IP, domínio ou valor" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="ttl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>TTL</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="1">Auto</SelectItem>
                                  <SelectItem value="300">5 min</SelectItem>
                                  <SelectItem value="900">15 min</SelectItem>
                                  <SelectItem value="1800">30 min</SelectItem>
                                  <SelectItem value="3600">1 hora</SelectItem>
                                  <SelectItem value="7200">2 horas</SelectItem>
                                  <SelectItem value="18000">5 horas</SelectItem>
                                  <SelectItem value="43200">12 horas</SelectItem>
                                  <SelectItem value="86400">1 dia</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {(form.watch("type") === "MX" || form.watch("type") === "SRV") && (
                          <FormField
                            control={form.control}
                            name="priority"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Prioridade</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="0-65535" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                      {(form.watch("type") === "A" || form.watch("type") === "AAAA" || form.watch("type") === "CNAME") && (
                        <FormField
                          control={form.control}
                          name="proxied"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Proxied</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  Ativar proxy da Cloudflare
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
                      )}
                      <div className="flex justify-end gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createMutation.isPending || updateMutation.isPending}
                        >
                          {editingRecord ? "Atualizar" : "Criar"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* DNS Records List */}
          <div className="grid gap-3">
            {recordsLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>Carregando registros DNS...</span>
              </div>
            ) : filteredRecords.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum registro encontrado</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || typeFilter !== "all" 
                        ? "Tente ajustar os filtros de busca" 
                        : "Crie seu primeiro registro DNS"}
                    </p>
                    {!searchTerm && typeFilter === "all" && (
                      <Button onClick={openNewRecordDialog}>
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Registro
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredRecords.map((record: DNSRecord) => {
                const TypeIcon = typeIcons[record.type as keyof typeof typeIcons] || Server;
                return (
                  <Card key={record.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex items-center gap-2">
                            <TypeIcon className="h-4 w-4 text-muted-foreground" />
                            <Badge className={typeColors[record.type as keyof typeof typeColors]}>
                              {record.type}
                            </Badge>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{record.name}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {record.content}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            TTL: {formatTTL(record.ttl)}
                          </div>
                          {record.proxied && (
                            <div className="flex items-center gap-1">
                              <Shield className="h-4 w-4 text-orange-500" />
                              <span className="text-xs text-orange-600">Proxied</span>
                            </div>
                          )}
                          {record.priority && (
                            <div className="text-sm text-muted-foreground">
                              Pri: {record.priority}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(record)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(record.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Modificado: {formatDate(record.modified_on)}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="zone" className="space-y-6">
          {zoneLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Carregando informações da zona...</span>
            </div>
          ) : zone ? (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Informações da Zona
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nome</label>
                      <div className="text-lg font-semibold">{zone.name}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="flex items-center gap-2">
                        <Badge className={zone.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {zone.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                      <div className="font-medium">{zone.type}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Pausado</label>
                      <div className="font-medium">{zone.paused ? 'Sim' : 'Não'}</div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Criado em</label>
                    <div className="font-medium">{formatDate(zone.created_on)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Ativado em</label>
                    <div className="font-medium">{formatDate(zone.activated_on)}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Name Servers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Cloudflare Name Servers</label>
                      <div className="space-y-1 mt-1">
                        {zone.name_servers.map((ns: string, index: number) => (
                          <div key={index} className="text-sm font-mono bg-muted p-2 rounded">
                            {ns}
                          </div>
                        ))}
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Name Servers Originais</label>
                      <div className="space-y-1 mt-1">
                        {zone.original_name_servers.map((ns: string, index: number) => (
                          <div key={index} className="text-sm font-mono bg-muted p-2 rounded">
                            {ns}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cloud className="h-5 w-5" />
                    Informações Adicionais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Registrar Original</label>
                      <div className="font-medium">{zone.original_registrar || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">DNS Host Original</label>
                      <div className="font-medium">{zone.original_dnshost || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Modo de Desenvolvimento</label>
                      <div className="font-medium">{zone.development_mode ? 'Ativo' : 'Inativo'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Erro ao carregar zona</h3>
                  <p className="text-muted-foreground">
                    Verifique as configurações da Cloudflare
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recordsArray.length}</div>
                <p className="text-xs text-muted-foreground">
                  Registros DNS configurados
                </p>
              </CardContent>
            </Card>

            {Object.entries(recordStats).map(([type, count]) => {
              const TypeIcon = typeIcons[type as keyof typeof typeIcons] || Server;
              return (
                <Card key={type}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Registros {type}</CardTitle>
                    <TypeIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{count}</div>
                    <p className="text-xs text-muted-foreground">
                      Registros do tipo {type}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {connectionTest && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5" />
                  Status da Conexão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm ${
                      connectionTest.connected 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {connectionTest.connected ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <span>{connectionTest.connected ? 'Conectado' : 'Desconectado'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Última Verificação</span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(connectionTest.timestamp)}
                    </span>
                  </div>
                  {connectionTest.accountInfo && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Email</span>
                        <span className="text-sm text-muted-foreground">
                          {connectionTest.accountInfo.email}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Zone ID</span>
                        <span className="text-sm text-muted-foreground font-mono">
                          {connectionTest.accountInfo.zoneId.slice(0, 8)}...
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
