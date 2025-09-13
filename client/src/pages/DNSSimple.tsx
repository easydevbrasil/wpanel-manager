import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RefreshCw, Globe, Plus, Edit, Trash2, Shield, ShieldOff, AlertCircle, CheckCircle } from "lucide-react";

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

interface ConnectionTest {
  connected: boolean;
  message: string;
  timestamp?: string;
}

const dnsRecordSchema = z.object({
  type: z.enum(["A", "AAAA", "CNAME", "MX", "TXT", "SRV", "NS", "PTR"]),
  name: z.string().min(1, "Nome é obrigatório"),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  ttl: z.string().min(1, "TTL é obrigatório"),
  priority: z.string().optional(),
  proxied: z.boolean().default(false),
});

type DNSRecordFormData = z.infer<typeof dnsRecordSchema>;

// Ícones SVG inline para proxy
const ProxyActiveIcon = () => (
  <img 
    src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDQgMzkuNSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiM5OTk7fS5jbHMtMntmaWxsOiNmNjhhMWQ7fS5jbHMtM3tmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5Bc3NldCAxPC90aXRsZT48ZyBpZD0iTGF5ZXJfMiIgZGF0YS1uYW1lPSJMYXllciAyIj48ZyBpZD0iTGF5ZXJfMS0yIiBkYXRhLW5hbWU9IkxheWVyIDEiPjxwb2x5Z29uIGNsYXNzPSJjbHMtMSIgcG9pbnRzPSIxMDQgMjAuMTIgOTQgMTAuNjIgOTQgMTYuMTIgMCAxNi4xMiAwIDI0LjEyIDk0IDI0LjEyIDk0IDI5LjYyIDEwNCAyMC4xMiIvPjxwYXRoIGNsYXNzPSJjbHMtMiIgZD0iTTc0LjUsMzljLTIuMDgsMC0xNS40My0uMTMtMjguMzQtLjI1LTEyLjYyLS4xMi0yNS42OC0uMjUtMjcuNjYtLjI1YTgsOCwwLDAsMS0xLTE1LjkzYzAtLjE5LDAtLjM4LDAtLjU3YTkuNDksOS40OSwwLDAsMSwxNC45LTcuODEsMTkuNDgsMTkuNDgsMCwwLDEsMzguMDUsNC42M0ExMC41LDEwLjUsMCwxLDEsNzQuNSwzOVoiLz48cGF0aCBjbGFzcz0iY2xzLTMiIGQ9Ik01MSwxQTE5LDE5LDAsMCwxLDcwLDE5LjU5LDEwLDEwLDAsMSwxLDc0LjUsMzguNWMtNC4xMSwwLTUyLS41LTU2LS41YTcuNSw3LjUsMCwwLDEtLjQ0LTE1QTguNDcsOC40NywwLDAsMSwxOCwyMmE5LDksMCwwLDEsMTQuNjgtN0ExOSwxOSwwLDAsMSw1MSwxbTAtMUEyMCwyMCwwLDAsMCwzMi4xMywxMy40MiwxMCwxMCwwLDAsMCwxNywyMnYuMTRBOC41LDguNSwwLDAsMCwxOC41LDM5YzIsMCwxNSwuMTMsMjcuNjYuMjUsMTIuOTEuMTIsMjYuMjYuMjUsMjguMzQuMjVhMTEsMTEsMCwxLDAtMy42MS0yMS4zOUEyMC4xLDIwLjEsMCwwLDAsNTEsMFoiLz48L2c+PC9nPjwvc3ZnPg=="
    className="w-5 h-5"
    alt="Proxy Ativo"
    title="Proxy Ativo (Cloudflare)"
  />
);

const ProxyInactiveIcon = () => (
  <img 
    src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA5MC41IDU5Ij48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6IzkyOTc5Yjt9PC9zdHlsZT48L2RlZnM+PHRpdGxlPkFzc2V0IDI8L3RpdGxlPjxnIGlkPSJMYXllcl8yIiBkYXRhLW5hbWU9IkxheWVyIDIiPjxnIGlkPSJMYXllcl8xLTIiIGRhdGEtbmFtZT0iTGF5ZXIgMSI+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNNDksMTMuNVYxOUw1OSw5LjUsNDksMFY1LjVINDAuNzhhMTIuNDMsMTIuNDMsMCwwLDAtOS41LDQuNDJMMTcuNjUsMjcuMTZhOC44Myw4LjgzLDAsMCwxLTYuOTEsMy4zNEg1bC01LDhIMTMuMzlhMTEuMjcsMTEuMjcsMCwwLDAsOS00LjQ4TDM1LjA1LDE3LjE4YTkuODEsOS44MSwwLDAsMSw3LjY2LTMuNjhaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNODAuNSwzOUExMCwxMCwwLDAsMCw3Niw0MC4wOWExOSwxOSwwLDAsMC0zNy4zLTQuNTdBOSw5LDAsMCwwLDI0LDQyLjVhOC40Nyw4LjQ3LDAsMCwwLC4wNiwxLDcuNSw3LjUsMCwwLDAsLjQ0LDE1YzQsMCw1MS44OS41LDU2LC41YTEwLDEwLDAsMCwwLDAtMjBaIi8+PC9nPjwvZz48L3N2Zz4="
    className="w-5 h-5"
    alt="Proxy Desativado"
    title="Proxy Desativado"
  />
);

// Função para obter o ícone do tipo de registro
const getRecordTypeIcon = (type: string) => {
  switch (type) {
    case 'A':
    case 'AAAA':
      return <Globe className="w-4 h-4 text-blue-500" />;
    case 'CNAME':
      return <Shield className="w-4 h-4 text-purple-500" />;
    case 'MX':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'TXT':
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    default:
      return <Globe className="w-4 h-4 text-gray-500" />;
  }
};

export default function DNSSimple() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DNSRecord | null>(null);
  const queryClient = useQueryClient();

  // Test connection
  const { data: connectionTest, isLoading: connectionLoading } = useQuery<ConnectionTest>({
    queryKey: ["/api/dns/test"],
  });

  // Fetch DNS records
  const { data: records = [], isLoading: recordsLoading, refetch } = useQuery<DNSRecord[]>({
    queryKey: ["/api/dns/records"],
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
      ttl: data.ttl === "1" ? "1" : data.ttl,
      priority: data.priority || undefined,
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

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir o registro DNS "${name}"?`)) {
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

  if (connectionLoading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Testando conexão...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Gerenciamento DNS</h1>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewRecordDialog} className="bg-blue-600 hover:bg-blue-700">
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
                            <SelectItem value="A">A (IPv4)</SelectItem>
                            <SelectItem value="AAAA">AAAA (IPv6)</SelectItem>
                            <SelectItem value="CNAME">CNAME (Alias)</SelectItem>
                            <SelectItem value="MX">MX (Email)</SelectItem>
                            <SelectItem value="TXT">TXT (Texto)</SelectItem>
                            <SelectItem value="SRV">SRV (Serviço)</SelectItem>
                            <SelectItem value="NS">NS (Name Server)</SelectItem>
                            <SelectItem value="PTR">PTR (Reverso)</SelectItem>
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
                          <Input placeholder="exemplo.dominio.com" {...field} />
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
                          <Input placeholder="192.168.1.1" {...field} />
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
                                <SelectValue placeholder="TTL" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">Auto</SelectItem>
                              <SelectItem value="300">5 min</SelectItem>
                              <SelectItem value="1800">30 min</SelectItem>
                              <SelectItem value="3600">1 hora</SelectItem>
                              <SelectItem value="14400">4 horas</SelectItem>
                              <SelectItem value="86400">1 dia</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("type") === "MX" && (
                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prioridade</FormLabel>
                            <FormControl>
                              <Input placeholder="10" {...field} />
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
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Proxy Cloudflare</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Ativar proxy da Cloudflare para este registro
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
                          Salvando...
                        </>
                      ) : editingRecord ? (
                        "Atualizar"
                      ) : (
                        "Criar"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <Button
            onClick={() => refetch()}
            disabled={recordsLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${recordsLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status da Conexão</CardTitle>
        </CardHeader>
        <CardContent>
          {connectionTest ? (
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${connectionTest.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={connectionTest.connected ? 'text-green-600' : 'text-red-600'}>
                {connectionTest.message}
              </span>
            </div>
          ) : (
            <div className="text-gray-500">Carregando status...</div>
          )}
        </CardContent>
      </Card>

      {/* DNS Records */}
      <Card>
        <CardHeader>
          <CardTitle>Registros DNS ({Array.isArray(records) ? records.length : 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {recordsLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Carregando registros...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {Array.isArray(records) && records.length > 0 ? (
                records.map((record: DNSRecord) => (
                  <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getRecordTypeIcon(record.type)}
                        <Badge variant="secondary" className="font-mono text-xs">
                          {record.type}
                        </Badge>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{record.name}</div>
                        <div className="text-sm text-gray-600 truncate">{record.content}</div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>TTL: {record.ttl === 1 ? 'Auto' : record.ttl}</span>
                        {record.priority && <span>Prioridade: {record.priority}</span>}
                        <div className="flex items-center">
                          {record.proxied ? <ProxyActiveIcon /> : <ProxyInactiveIcon />}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(record)}
                        className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(record.id, record.name)}
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
                  <Globe className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Nenhum registro DNS encontrado</p>
                  <p className="text-sm">Clique em "Novo Registro" para adicionar seu primeiro registro DNS.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
