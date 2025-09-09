import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ShieldX, ShieldOff, RotateCcw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FirewallServiceStatus {
  service_status: string;
  is_active: boolean;
  rule_count: number;
  timestamp: string;
}

export default function Firewall() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch firewall service status
  const { data: serviceStatus, isLoading: isLoadingServiceStatus } = useQuery<FirewallServiceStatus>({
    queryKey: ["/api/firewall/status"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Enable firewall mutation
  const enableFirewallMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/firewall/enable"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/firewall/status"] });
      toast({
        title: "Firewall ativado",
        description: "O firewall foi ativado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao ativar firewall.",
        variant: "destructive",
      });
    },
  });

  // Disable firewall mutation
  const disableFirewallMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/firewall/disable"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/firewall/status"] });
      toast({
        title: "Firewall desativado",
        description: "O firewall foi desativado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao desativar firewall.",
        variant: "destructive",
      });
    },
  });

  // Restart firewall mutation
  const restartFirewallMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/firewall/restart"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/firewall/status"] });
      toast({
        title: "Firewall reiniciado",
        description: "O firewall foi reiniciado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao reiniciar firewall.",
        variant: "destructive",
      });
    },
  });

  if (isLoadingServiceStatus) {
    return (
      <div className="w-full max-w-full p-6 space-y-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Firewall Controller
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie regras de iptables e controle o tráfego de rede
          </p>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Status do Firewall</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {serviceStatus?.is_active ? (
                  <span className="text-green-500">Ativo</span>
                ) : (
                  <span className="text-red-500">Inativo</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                Serviço: {serviceStatus?.service_status || "Desconhecido"}
              </p>
            </div>
            <div className={`p-2 rounded-lg ${serviceStatus?.is_active ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
              {serviceStatus?.is_active ? 
                <Shield className="w-6 h-6 text-green-600 dark:text-green-400" /> :
                <ShieldX className="w-6 h-6 text-red-600 dark:text-red-400" />
              }
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={serviceStatus?.is_active ? "secondary" : "default"}
              onClick={() => enableFirewallMutation.mutate()}
              disabled={enableFirewallMutation.isPending || serviceStatus?.is_active}
            >
              {enableFirewallMutation.isPending ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Ativando...
                </>
              ) : (
                <>
                  <Shield className="h-3 w-3 mr-1" />
                  Ativar
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant={serviceStatus?.is_active ? "destructive" : "secondary"}
              onClick={() => disableFirewallMutation.mutate()}
              disabled={disableFirewallMutation.isPending || !serviceStatus?.is_active}
            >
              {disableFirewallMutation.isPending ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Desativando...
                </>
              ) : (
                <>
                  <ShieldOff className="h-3 w-3 mr-1" />
                  Desativar
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => restartFirewallMutation.mutate()}
              disabled={restartFirewallMutation.isPending}
            >
              {restartFirewallMutation.isPending ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Reiniciando...
                </>
              ) : (
                <>
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reiniciar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
