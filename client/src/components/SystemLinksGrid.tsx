import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Server, 
  Database, 
  Shield, 
  Monitor,
  Terminal,
  FileText,
  Users,
  Activity,
  BarChart3,
  Cpu,
  HardDrive,
  Network,
  Lock
} from "lucide-react";
import { Link } from "wouter";

interface SystemLink {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  status?: 'online' | 'offline' | 'warning';
  badge?: string;
}

const systemLinks: SystemLink[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Visão geral do sistema",
    href: "/",
    icon: <Monitor className="w-5 h-5" />,
    status: "online"
  },
  {
    id: "docker",
    title: "Docker",
    description: "Gerenciar containers",
    href: "/docker-containers", 
    icon: <Server className="w-5 h-5" />,
    status: "online",
    badge: "12 ativos"
  },
  {
    id: "database",
    title: "Banco de Dados",
    description: "PostgreSQL Admin",
    href: "/database-admin",
    icon: <Database className="w-5 h-5" />,
    status: "online"
  },
  {
    id: "nginx",
    title: "Nginx Hosts",
    description: "Configurar hosts",
    href: "/nginx-hosts",
    icon: <Network className="w-5 h-5" />,
    status: "online",
    badge: "8 hosts"
  },
  {
    id: "firewall",
    title: "Firewall",
    description: "Regras de segurança",
    href: "/firewall",
    icon: <Shield className="w-5 h-5" />,
    status: "online"
  },
  {
    id: "users",
    title: "Usuários",
    description: "Gerenciar permissões",
    href: "/user-permissions",
    icon: <Users className="w-5 h-5" />,
    status: "online"
  },
  {
    id: "monitoring",
    title: "Monitoramento",
    description: "Métricas do sistema",
    href: "/monitoring",
    icon: <Activity className="w-5 h-5" />,
    status: "online"
  },
  {
    id: "logs",
    title: "Logs",
    description: "Logs do sistema",
    href: "/logs",
    icon: <FileText className="w-5 h-5" />,
    status: "online"
  }
];

export function SystemLinksGrid() {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'warning':
        return 'Atenção';
      case 'offline':
        return 'Offline';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <div className="w-full max-w-4xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {systemLinks.map((link) => (
          <Link key={link.id} href={link.href}>
            <div className="group relative p-4 bg-card hover:bg-accent/50 border rounded-lg transition-all duration-200 hover:shadow-md cursor-pointer">
              {/* Status Indicator */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(link.status)}`} />
                {link.badge && (
                  <Badge variant="secondary" className="text-xs px-2 py-0">
                    {link.badge}
                  </Badge>
                )}
              </div>

              {/* Icon */}
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-3 group-hover:bg-primary/20 transition-colors">
                <div className="text-primary">
                  {link.icon}
                </div>
              </div>

              {/* Content */}
              <div className="space-y-1">
                <h3 className="font-semibold text-sm">{link.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {link.description}
                </p>
              </div>

              {/* Status Text */}
              <div className="mt-3 flex items-center justify-between">
                <span className={`text-xs font-medium ${
                  link.status === 'online' ? 'text-green-600' :
                  link.status === 'warning' ? 'text-yellow-600' :
                  link.status === 'offline' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {getStatusText(link.status)}
                </span>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                    Acessar
                  </Button>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">CPU</p>
              <p className="text-sm font-semibold">23%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">RAM</p>
              <p className="text-sm font-semibold">4.2 GB</p>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-purple-500" />
            <div>
              <p className="text-xs text-muted-foreground">Rede</p>
              <p className="text-sm font-semibold">↑2.1MB</p>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">Uptime</p>
              <p className="text-sm font-semibold">7d 14h</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
