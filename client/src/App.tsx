import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProviderSimple, useAuth } from "@/components/AuthProviderSimple";
import { useColorTheme } from "@/hooks/useColorTheme";
import { useScreenOrientation } from "@/hooks/useScreenOrientation";
import { RotateScreenOverlay } from "@/components/RotateScreenOverlay";
import { Switch, Route } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
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
import Banco from "@/pages/Banco";
import Services from "@/pages/Services";
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
          <Route path="/reminders" component={Reminders} />
          <Route path="/banco" component={Banco} />
          <Route path="/services" component={Services} />
          <Route path="/help" component={Help} />
          <Route path="/documentation" component={Documentation} />
          <Route component={NotFound} />
        </Switch>
      </MainLayout>
    </>
  );
}

function App() {
  console.log('App component rendering with auth routing...');

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProviderSimple>
            <AuthenticatedRouter />
            <Toaster />
          </AuthProviderSimple>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
