import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { useAuth } from "@/hooks/useAuth";
import { useColorTheme } from "@/hooks/useColorTheme";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "@/pages/Dashboard";
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
import Firewall from "@/pages/Firewall";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

function AuthenticatedRouter() {
  const { isAuthenticated, isLoading } = useAuth();
  useColorTheme(); // Apply color theme based on user preferences

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
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
        <Route path="/firewall" component={Firewall} />
        <Route path="/help" component={Help} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <AuthenticatedRouter />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
