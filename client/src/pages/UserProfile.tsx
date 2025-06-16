import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, MapPin, Shield, Save, Camera, Mail, Phone, Calendar, MapPin as MapPinIcon } from "lucide-react";

interface UserAddress {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface UserPermission {
  id: number;
  userId: number;
  module: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const moduleLabels = {
  dashboard: "Dashboard",
  clients: "Clientes",
  products: "Produtos",
  suppliers: "Fornecedores",
  sales: "Vendas",
  support: "Suporte",
  email: "Email",
  admin: "Administração"
};

export default function UserProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    bio: "",
    avatar: ""
  });

  // Address form state
  const [addressData, setAddressData] = useState<UserAddress>({
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Brasil"
  });

  // Fetch user address
  const { data: address, isLoading: addressLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/address`],
    enabled: !!user?.id
  });

  // Fetch user permissions
  const { data: permissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/permissions`],
    enabled: !!user?.id
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/users/${user?.id}`, "PUT", data);
    },
    onSuccess: () => {
      toast({
        title: "✅ Perfil atualizado",
        description: "Suas informações foram salvas com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: () => {
      toast({
        title: "❌ Erro",
        description: "Falha ao atualizar o perfil. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Update address mutation
  const updateAddressMutation = useMutation({
    mutationFn: async (data: UserAddress) => {
      return await apiRequest(`/api/users/${user?.id}/address`, "PUT", data);
    },
    onSuccess: () => {
      toast({
        title: "🏠 Endereço atualizado",
        description: "Suas informações de endereço foram salvas!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/address`] });
    },
    onError: () => {
      toast({
        title: "❌ Erro",
        description: "Falha ao atualizar o endereço. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const handleProfileSave = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleAddressSave = () => {
    updateAddressMutation.mutate(addressData);
  };

  // Initialize address data when loaded
  if (address && !addressData.street && typeof address === 'object') {
    setAddressData(address as UserAddress);
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Perfil do Usuário</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie suas informações pessoais e configurações</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{user?.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.username}</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="address" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Endereço
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Permissões
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informações Pessoais
              </CardTitle>
              <CardDescription>
                Atualize suas informações básicas do perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    placeholder="Seu nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    placeholder="seu@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar">URL do Avatar</Label>
                  <Input
                    id="avatar"
                    value={profileData.avatar}
                    onChange={(e) => setProfileData({ ...profileData, avatar: e.target.value })}
                    placeholder="https://exemplo.com/avatar.jpg"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  placeholder="Conte um pouco sobre você..."
                  rows={3}
                />
              </div>
              <Button 
                onClick={handleProfileSave}
                disabled={updateProfileMutation.isPending}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {updateProfileMutation.isPending ? "Salvando..." : "Salvar Perfil"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Address Tab */}
        <TabsContent value="address" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPinIcon className="w-5 h-5" />
                Endereço Residencial
              </CardTitle>
              <CardDescription>
                Mantenha seu endereço atualizado para entregas e correspondências
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="street">Rua/Avenida</Label>
                  <Input
                    id="street"
                    value={addressData.street}
                    onChange={(e) => setAddressData({ ...addressData, street: e.target.value })}
                    placeholder="Nome da rua ou avenida"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    value={addressData.number}
                    onChange={(e) => setAddressData({ ...addressData, number: e.target.value })}
                    placeholder="123"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    value={addressData.complement}
                    onChange={(e) => setAddressData({ ...addressData, complement: e.target.value })}
                    placeholder="Apto, Bloco, Casa..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={addressData.neighborhood}
                    onChange={(e) => setAddressData({ ...addressData, neighborhood: e.target.value })}
                    placeholder="Nome do bairro"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={addressData.city}
                    onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                    placeholder="São Paulo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={addressData.state}
                    onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                    placeholder="SP"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input
                    id="zipCode"
                    value={addressData.zipCode}
                    onChange={(e) => setAddressData({ ...addressData, zipCode: e.target.value })}
                    placeholder="01234-567"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input
                  id="country"
                  value={addressData.country}
                  onChange={(e) => setAddressData({ ...addressData, country: e.target.value })}
                  placeholder="Brasil"
                />
              </div>
              <Button 
                onClick={handleAddressSave}
                disabled={updateAddressMutation.isPending}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {updateAddressMutation.isPending ? "Salvando..." : "Salvar Endereço"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Permissões do Sistema
              </CardTitle>
              <CardDescription>
                Visualize suas permissões de acesso aos módulos do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {permissionsLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                      <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : !Array.isArray(permissions) || permissions.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Nenhuma permissão configurada</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(moduleLabels).map(([module, label]) => {
                    const modulePermissions = Array.isArray(permissions) ? 
                      permissions.find((p: any) => p.module === module) : null;
                    return (
                      <div key={module} className="space-y-3">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{label}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <span className="text-sm">Visualizar</span>
                            <Badge variant={modulePermissions?.canView ? "default" : "secondary"}>
                              {modulePermissions?.canView ? "Permitido" : "Negado"}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <span className="text-sm">Criar</span>
                            <Badge variant={modulePermissions?.canCreate ? "default" : "secondary"}>
                              {modulePermissions?.canCreate ? "Permitido" : "Negado"}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <span className="text-sm">Editar</span>
                            <Badge variant={modulePermissions?.canEdit ? "default" : "secondary"}>
                              {modulePermissions?.canEdit ? "Permitido" : "Negado"}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <span className="text-sm">Excluir</span>
                            <Badge variant={modulePermissions?.canDelete ? "default" : "secondary"}>
                              {modulePermissions?.canDelete ? "Permitido" : "Negado"}
                            </Badge>
                          </div>
                        </div>
                        <Separator />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}