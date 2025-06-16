import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  Eye, 
  Plus, 
  Edit, 
  Trash2, 
  Settings,
  Shield,
  Search,
  Save,
  RotateCcw,
  LayoutDashboard,
  Package,
  Truck,
  ShoppingCart,
  Headphones,
  Mail,
  Database,
  HelpCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface UserPermission {
  id: number;
  userId: number;
  module: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface PermissionModule {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
}

const PERMISSION_MODULES: PermissionModule[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    description: "Visualização do painel principal e estatísticas do sistema",
    icon: LayoutDashboard,
    color: "bg-blue-500"
  },
  {
    id: "clients",
    name: "Clientes",
    description: "Gestão de clientes, cadastros e informações comerciais",
    icon: Users,
    color: "bg-green-500"
  },
  {
    id: "products",
    name: "Produtos",
    description: "Catálogo de produtos, categorias e inventário",
    icon: Package,
    color: "bg-purple-500"
  },
  {
    id: "suppliers",
    name: "Fornecedores",
    description: "Gestão de fornecedores e relacionamento comercial",
    icon: Truck,
    color: "bg-orange-500"
  },
  {
    id: "sales",
    name: "Vendas",
    description: "Processamento de vendas, cupons e relatórios financeiros",
    icon: ShoppingCart,
    color: "bg-red-500"
  },
  {
    id: "support",
    name: "Suporte",
    description: "Sistema de tickets e atendimento ao cliente",
    icon: Headphones,
    color: "bg-yellow-500"
  },
  {
    id: "email",
    name: "E-mails",
    description: "Contas de email e configurações SMTP/IMAP",
    icon: Mail,
    color: "bg-cyan-500"
  },
  {
    id: "admin",
    name: "Administração",
    description: "Configurações avançadas e gestão do banco de dados",
    icon: Database,
    color: "bg-gray-700"
  }
];

export default function UserPermissions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, Partial<UserPermission>>>({});

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: permissions = [] } = useQuery<UserPermission[]>({
    queryKey: ["/api/permissions"],
    enabled: selectedUser !== null,
  });

  const updatePermissions = useMutation({
    mutationFn: (data: { userId: number; permissions: Partial<UserPermission>[] }) =>
      apiRequest("PUT", `/api/users/${data.userId}/permissions`, data.permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permissions"] });
      toast({
        title: "✅ Permissões atualizadas",
        description: "As permissões do usuário foram salvas com sucesso",
      });
      setIsEditing(false);
      setPendingChanges({});
    },
    onError: () => {
      toast({
        title: "❌ Erro ao salvar",
        description: "Não foi possível atualizar as permissões",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUserData = selectedUser ? users.find(u => u.id === selectedUser) : null;

  const getUserPermission = (moduleId: string): UserPermission => {
    const existing = permissions.find(p => p.module === moduleId);
    const pending = pendingChanges[moduleId];
    
    return {
      id: existing?.id || 0,
      userId: selectedUser || 0,
      module: moduleId,
      canView: pending?.canView ?? existing?.canView ?? false,
      canCreate: pending?.canCreate ?? existing?.canCreate ?? false,
      canEdit: pending?.canEdit ?? existing?.canEdit ?? false,
      canDelete: pending?.canDelete ?? existing?.canDelete ?? false,
    };
  };

  const updatePermission = (moduleId: string, field: keyof UserPermission, value: boolean) => {
    setPendingChanges(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [field]: value,
      }
    }));
  };

  const handleSaveChanges = () => {
    if (!selectedUser) return;

    const permissionsList = Object.entries(pendingChanges).map(([moduleId, changes]) => {
      const current = getUserPermission(moduleId);
      return {
        module: moduleId,
        canView: changes.canView ?? current.canView,
        canCreate: changes.canCreate ?? current.canCreate,
        canEdit: changes.canEdit ?? current.canEdit,
        canDelete: changes.canDelete ?? current.canDelete,
      };
    });

    updatePermissions.mutate({
      userId: selectedUser,
      permissions: permissionsList,
    });
  };

  const handleDiscardChanges = () => {
    setPendingChanges({});
    setIsEditing(false);
  };

  const getPermissionsSummary = (user: User): { total: number; active: number } => {
    const userPermissions = permissions.filter(p => p.userId === user.id);
    const total = PERMISSION_MODULES.length * 4; // 4 tipos de permissão por módulo
    const active = userPermissions.reduce((count, p) => 
      count + (p.canView ? 1 : 0) + (p.canCreate ? 1 : 0) + (p.canEdit ? 1 : 0) + (p.canDelete ? 1 : 0), 0
    );
    return { total, active };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Permissões de Usuários
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Configure as permissões de acesso para cada usuário do sistema
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          {users.length} usuários cadastrados
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Usuários */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Usuários do Sistema
            </CardTitle>
            <CardDescription>
              Selecione um usuário para gerenciar suas permissões
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Lista de usuários */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredUsers.map((user) => {
                const summary = getPermissionsSummary(user);
                return (
                  <div
                    key={user.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedUser === user.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => {
                      setSelectedUser(user.id);
                      setIsEditing(false);
                      setPendingChanges({});
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          @{user.username} • {user.role}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {summary.active}/{summary.total}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Configuração de Permissões */}
        <div className="lg:col-span-2 space-y-6">
          {selectedUserData ? (
            <>
              {/* Header do usuário selecionado */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                          {selectedUserData.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <CardTitle>{selectedUserData.name}</CardTitle>
                        <CardDescription>
                          @{selectedUserData.username} • {selectedUserData.role}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDiscardChanges}
                            disabled={updatePermissions.isPending}
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveChanges}
                            disabled={updatePermissions.isPending || Object.keys(pendingChanges).length === 0}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Alterações
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => setIsEditing(true)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar Permissões
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Cards de Permissões por Módulo */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {PERMISSION_MODULES.map((module) => {
                  const permission = getUserPermission(module.id);
                  const hasChanges = pendingChanges[module.id];
                  const IconComponent = module.icon;

                  return (
                    <Card key={module.id} className={hasChanges ? "border-orange-200 bg-orange-50/30 dark:border-orange-800 dark:bg-orange-900/10" : ""}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${module.color} flex items-center justify-center`}>
                            <IconComponent className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-sm">{module.name}</CardTitle>
                            <CardDescription className="text-xs">
                              {module.description}
                            </CardDescription>
                          </div>
                          {hasChanges && (
                            <Badge variant="outline" className="text-xs">
                              Modificado
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Visualizar */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-gray-500" />
                            <Label className="text-sm">Visualizar</Label>
                          </div>
                          <Switch
                            checked={permission.canView}
                            onCheckedChange={(checked) => 
                              isEditing && updatePermission(module.id, 'canView', checked)
                            }
                            disabled={!isEditing}
                          />
                        </div>

                        {/* Criar */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Plus className="w-4 h-4 text-gray-500" />
                            <Label className="text-sm">Criar</Label>
                          </div>
                          <Switch
                            checked={permission.canCreate}
                            onCheckedChange={(checked) => 
                              isEditing && updatePermission(module.id, 'canCreate', checked)
                            }
                            disabled={!isEditing}
                          />
                        </div>

                        {/* Editar */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Edit className="w-4 h-4 text-gray-500" />
                            <Label className="text-sm">Editar</Label>
                          </div>
                          <Switch
                            checked={permission.canEdit}
                            onCheckedChange={(checked) => 
                              isEditing && updatePermission(module.id, 'canEdit', checked)
                            }
                            disabled={!isEditing}
                          />
                        </div>

                        {/* Excluir */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Trash2 className="w-4 h-4 text-gray-500" />
                            <Label className="text-sm">Excluir</Label>
                          </div>
                          <Switch
                            checked={permission.canDelete}
                            onCheckedChange={(checked) => 
                              isEditing && updatePermission(module.id, 'canDelete', checked)
                            }
                            disabled={!isEditing}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {Object.keys(pendingChanges).length > 0 && (
                <Alert>
                  <Settings className="w-4 h-4" />
                  <AlertDescription>
                    Você tem {Object.keys(pendingChanges).length} módulo(s) com alterações pendentes. 
                    Clique em "Salvar Alterações" para aplicar as modificações.
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <HelpCircle className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Selecione um usuário
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
                  Escolha um usuário da lista à esquerda para visualizar e editar suas permissões do sistema.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}