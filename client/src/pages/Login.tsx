import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Lock, User, Shield } from "lucide-react";

interface LoginFormData {
  username: string;
  password: string;
}

export default function Login() {
  const [formData, setFormData] = useState<LoginFormData>({
    username: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Login realizado com sucesso! 🎉",
          description: `Bem-vindo de volta, ${data.user.name}!`,
        });

        // The server sets HTTP-only cookies, so we just need to trigger a page reload
        // to let the AuthProvider pick up the new authentication state
        window.location.reload();
      } else {
        setError(data.message || "Erro ao fazer login");
        toast({
          title: "Erro no login ❌",
          description: data.message || "Credenciais inválidas",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = "Erro de conexão com o servidor";
      setError(errorMessage);
      toast({
        title: "Erro de conexão ❌",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-32 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute bottom-20 left-32 w-80 h-80 bg-gradient-to-r from-indigo-400/20 to-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Login Card */}
        <Card className="bg-white/10 dark:bg-gray-800/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden">
          {/* Logo/Header */}
          <div className="text-center mb-8 mt-8">
            <div className="relative mx-auto mb-6 w-20 h-20 group">
              <div className="bg-gradient-to-br from-white/30 to-white/10 w-20 h-20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-2xl group-hover:scale-105 transition-all duration-300">
                <Shield className="w-10 h-10 text-white drop-shadow-lg" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full border-2 border-white/50 animate-pulse shadow-lg"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
              wPanel
            </h1>
          </div>

          <CardContent className="px-8 pb-8">
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
                  <AlertDescription className="text-red-200">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <Label htmlFor="username" className="text-sm font-semibold text-white/90">
                  Usuário
                </Label>
                <div className="relative group">
                  <User className="absolute left-4 top-4 h-5 w-5 text-white/60 group-focus-within:text-white/90 transition-colors" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Digite seu usuário"
                    value={formData.username}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    className="pl-12 h-12 bg-white/10 border border-white/20 text-white placeholder:text-white/50 rounded-xl focus:bg-white/20 focus:border-white/40 transition-all duration-200"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-semibold text-white/90">
                  Senha
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-4 h-5 w-5 text-white/60 group-focus-within:text-white/90 transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite sua senha"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-12 h-12 bg-white/10 border border-white/20 text-white placeholder:text-white/50 rounded-xl focus:bg-white/20 focus:border-white/40 transition-all duration-200"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white py-4 text-lg font-semibold rounded-xl shadow-2xl border border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Entrando...</span>
                  </div>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-white/70 font-medium backdrop-blur-sm bg-white/5 rounded-2xl p-4 border border-white/10">
          <p>© 2025 wPanel Enterprise Suite</p>
          <p className="text-xs text-white/50 mt-1">Sistema seguro de gerenciamento empresarial</p>
        </div>
      </div>
    </div>
  );
}