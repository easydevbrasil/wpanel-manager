import React from 'react';
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    // Você pode logar o erro em algum serviço externo aqui
    console.error('ErrorBoundary:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, color: 'red', background: '#fff', fontFamily: 'monospace' }}>
          <h1>Erro na aplicação</h1>
          <pre>{this.state.error && this.state.error.toString()}</pre>
          <p>Verifique os imports, exports e dependências dos componentes.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProviderSimple, useAuth } from "@/components/AuthProviderSimple";
import { useColorTheme } from "@/hooks/useColorTheme";
import { useScreenOrientation } from "@/hooks/useScreenOrientation";
import { RotateScreenOverlay } from "@/components/RotateScreenOverlay";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { Switch, Route } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import IntegracoesVisaoGeral from "@/pages/IntegracoesVisaoGeral";
import IntegracoesAPI from "@/pages/IntegracoesAPI";
import IntegracoesWebhooks from "@/pages/IntegracoesWebhooks";
import Dashboard from "@/pages/Dashboard";
import Documentation from "@/pages/Documentation";
import Clients from "@/pages/Clients";
import Products from "@/pages/Products";
import Suppliers from "@/pages/Suppliers";
import Sales from "@/pages/Sales";
import Support from "@/pages/Support";
import Help from "@/pages/Help";
import EmailAccounts from "@/pages/EmailAccounts";
import DatabaseAdmin from "@/pages/DatabaseAdmin";
import UserProfile from "@/pages/UserProfile";
import DockerContainers from "@/pages/DockerContainers";
import TaskScheduler from "@/pages/TaskScheduler";
import Firewall from "@/pages/Firewall";
import DNSSimple from "@/pages/DNSSimple";
import NginxHosts from "@/pages/NginxHosts";
import Expenses from "@/pages/Expenses";
import Reminders from "@/pages/Reminders";
import Plans from "@/pages/Plans";
import PlanResources from "@/pages/PlanResources";

import Services from "@/pages/Services";
import ActivityLogs from "@/pages/ActivityLogs";
import EvolutionPage from "@/pages/EvolutionPage";
import TestMinioUpload from "@/pages/TestMinioUpload";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

function AuthenticatedRouter() {
  const { isAuthenticated, isLoading } = useAuth();
  const { shouldRotate } = useScreenOrientation();
  useColorTheme(); // Apply color theme based on user preferences

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <>
      <RotateScreenOverlay isVisible={shouldRotate} />
      <MainLayout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/clients" component={Clients} />
          <Route path="/products" component={Products} />
          <Route path="/suppliers" component={Suppliers} />
          <Route path="/sales" component={Sales} />
          <Route path="/support" component={Support} />
          <Route path="/email-accounts" component={EmailAccounts} />
          <Route path="/database-admin" component={DatabaseAdmin} />
          <Route path="/user-profile" component={UserProfile} />
          <Route path="/docker-containers" component={DockerContainers} />
          <Route path="/task-scheduler" component={TaskScheduler} />
          <Route path="/firewall" component={Firewall} />
          <Route path="/dns" component={DNSSimple} />
          <Route path="/nginx-hosts" component={NginxHosts} />
          <Route path="/expenses" component={Expenses} />
          <Route path="/plans" component={Plans} />
          <Route path="/plan-resources" component={PlanResources} />
          <Route path="/reminders" component={Reminders} />

          <Route path="/services" component={Services} />
          <Route path="/activity-logs" component={ActivityLogs} />
          <Route path="/help" component={Help} />
          <Route path="/documentation" component={Documentation} />
          <Route path="/integracoes-visao-geral" component={IntegracoesVisaoGeral} />
          <Route path="/integracoes-api" component={IntegracoesAPI} />
          <Route path="/integracoes-webhook" component={IntegracoesWebhooks} />
          <Route path="/evolution" component={EvolutionPage} />
          <Route path="/test-minio" component={TestMinioUpload} />
          <Route component={NotFound} />
        </Switch>
      </MainLayout>
      <PWAInstallPrompt />
    </>
  );
}

function App() {
  console.log('App component rendering with auth routing...');

  // Register service worker for PWA
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('PWA SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('PWA SW registration failed: ', registrationError);
        });
    });
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProviderSimple>
            <ErrorBoundary>
              <AuthenticatedRouter />
              <Toaster />
            </ErrorBoundary>
          </AuthProviderSimple>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
