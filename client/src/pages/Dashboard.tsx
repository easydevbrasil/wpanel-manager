import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  FolderOpen,
  CheckCircle,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Cpu,
  HardDrive,
  MemoryStick,
  Activity,
  Package,
  ShoppingCart,
  Truck,
  Headphones,
} from "lucide-react";
import type { DashboardStats } from "@shared/schema";

interface SystemStatus {
  cpu: {
    usage: number;
    cores: number;
    model: string;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  swap: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  uptime: number;
  platform: string;
  arch: string;
  nodeVersion: string;
  timestamp: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// CPU Gauge Component
function CPUGauge({ usage }: { usage: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (usage / 100) * circumference;
  
  const getColor = (usage: number) => {
    if (usage >= 80) return "#ef4444"; // red
    if (usage >= 60) return "#f59e0b"; // yellow
    return "#10b981"; // green
  };

  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke={getColor(usage)}
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-gray-900 dark:text-white">
          {usage}%
        </span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: statsData } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  // Mock system status with realistic data that updates periodically
  const generateSystemStatus = (): SystemStatus => ({
    cpu: {
      usage: Math.floor(Math.random() * 30) + 20, // 20-50%
      cores: 4,
      model: "Intel(R) Core(TM) i5-9400F CPU @ 2.90GHz"
    },
    memory: {
      total: 8 * 1024 * 1024 * 1024, // 8GB
      used: 3.2 * 1024 * 1024 * 1024, // 3.2GB
      free: 4.8 * 1024 * 1024 * 1024, // 4.8GB
      usagePercent: 40 + Math.floor(Math.random() * 20) // 40-60%
    },
    disk: {
      total: 20 * 1024 * 1024 * 1024, // 20GB
      used: 8 * 1024 * 1024 * 1024,   // 8GB
      free: 12 * 1024 * 1024 * 1024,  // 12GB
      usagePercent: 40
    },
    swap: {
      total: 2 * 1024 * 1024 * 1024, // 2GB
      used: 256 * 1024 * 1024,       // 256MB
      free: 1.75 * 1024 * 1024 * 1024, // 1.75GB
      usagePercent: 12
    },
    uptime: 86400 * 3, // 3 days
    platform: "linux",
    arch: "x64",
    nodeVersion: "v20.18.1",
    timestamp: new Date().toISOString()
  });

  const [systemStatus, setSystemStatus] = useState<SystemStatus>(generateSystemStatus());
  
  // Update system status every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStatus(generateSystemStatus());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const stats = statsData?.stats as any;

  const statItems = [
    {
      title: "Total Projects",
      value: stats?.totalProjects || 0,
      change: "+12%",
      trend: "up",
      icon: FolderOpen,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Active Tasks",
      value: stats?.activeTasks || 0,
      change: "+8%",
      trend: "up",
      icon: CheckCircle,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Team Members",
      value: stats?.teamMembers || 0,
      change: "+2",
      trend: "up",
      icon: Users,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      title: "Revenue",
      value: `$${((stats?.revenue || 0) / 1000).toFixed(1)}k`,
      change: "+23%",
      trend: "up",
      icon: DollarSign,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
  ];

  const recentProjects = [
    {
      name: "Project Alpha",
      status: "Active",
      statusColor: "bg-green-100 text-green-700",
      avatar: "P",
      avatarBg: "bg-blue-500",
      lastUpdate: "2 hours ago",
    },
    {
      name: "Design System",
      status: "In Review",
      statusColor: "bg-yellow-100 text-yellow-700",
      avatar: "D",
      avatarBg: "bg-purple-500",
      lastUpdate: "1 day ago",
    },
  ];

  const teamActivity = [
    {
      name: "Sarah Chen",
      action: "completed the wireframes",
      time: "2 hours ago",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?ixlib=rb-4.0.3&w=40&h=40&fit=crop&crop=face",
    },
    {
      name: "Mike Rodriguez",
      action: "pushed new commits",
      time: "4 hours ago",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&w=40&h=40&fit=crop&crop=face",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard Overview
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back! Here's what's happening with your projects today.
        </p>
      </div>

      {/* System Status Section - Moved to top */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Status do Sistema
        </h2>
        
        {!systemStatus ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
                <CardContent className="p-4 md:p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-3"></div>
                    <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : systemStatus ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* CPU Card with Gauge */}
            <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      CPU
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {systemStatus.cpu.cores} cores
                    </p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 md:p-3 rounded-lg">
                    <Cpu className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <CPUGauge usage={systemStatus.cpu.usage} />
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 text-center">
                  {systemStatus.cpu.model.substring(0, 30)}...
                </p>
              </CardContent>
            </Card>

            {/* Memory Card */}
            <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Memória RAM
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {systemStatus.memory.usagePercent}%
                    </p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900 p-2 md:p-3 rounded-lg">
                    <MemoryStick className="w-5 h-5 md:w-6 md:h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <Progress 
                  value={systemStatus.memory.usagePercent} 
                  className="mb-2" 
                />
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  <span>{formatBytes(systemStatus.memory.used)}</span>
                  <span className="mx-1">/</span>
                  <span>{formatBytes(systemStatus.memory.total)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Storage Card */}
            <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Armazenamento
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {systemStatus.disk.usagePercent}%
                    </p>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900 p-2 md:p-3 rounded-lg">
                    <HardDrive className="w-5 h-5 md:w-6 md:h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <Progress 
                  value={systemStatus.disk.usagePercent} 
                  className="mb-2" 
                />
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  <span>{formatBytes(systemStatus.disk.used)}</span>
                  <span className="mx-1">/</span>
                  <span>{formatBytes(systemStatus.disk.total)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Swap Card */}
            <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Swap
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {systemStatus.swap.usagePercent}%
                    </p>
                  </div>
                  <div className="bg-orange-100 dark:bg-orange-900 p-2 md:p-3 rounded-lg">
                    <Activity className="w-5 h-5 md:w-6 md:h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <Progress 
                  value={systemStatus.swap.usagePercent} 
                  className="mb-2" 
                />
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  {systemStatus.swap.total > 0 ? (
                    <>
                      <span>{formatBytes(systemStatus.swap.used)}</span>
                      <span className="mx-1">/</span>
                      <span>{formatBytes(systemStatus.swap.total)}</span>
                    </>
                  ) : (
                    <span>Não disponível</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
        
        {/* System Info */}
        {systemStatus && (
          <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 mt-4">
            <CardContent className="p-4 md:p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Uptime</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatUptime(systemStatus.uptime)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Plataforma</p>
                  <p className="font-semibold text-gray-900 dark:text-white capitalize">
                    {systemStatus.platform} {systemStatus.arch}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Node.js</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {systemStatus.nodeVersion}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Atualizado</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {new Date(systemStatus.timestamp).toLocaleTimeString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Data Counters Section */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Resumo dos Dados
        </h2>
        
        <div className="grid grid-cols-5 gap-4 md:gap-6">
          {/* Clients Counter */}
          <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg mb-3 mx-auto w-fit">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stats?.clientsCount || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Clientes
              </p>
            </CardContent>
          </Card>

          {/* Products Counter */}
          <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg mb-3 mx-auto w-fit">
                <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stats?.productsCount || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Produtos
              </p>
            </CardContent>
          </Card>

          {/* Sales Counter */}
          <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg mb-3 mx-auto w-fit">
                <ShoppingCart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stats?.salesCount || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Vendas
              </p>
            </CardContent>
          </Card>

          {/* Suppliers Counter */}
          <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-lg mb-3 mx-auto w-fit">
                <Truck className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stats?.suppliersCount || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Fornecedores
              </p>
            </CardContent>
          </Card>

          {/* Support Tickets Counter */}
          <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="bg-red-100 dark:bg-red-900 p-3 rounded-lg mb-3 mx-auto w-fit">
                <Headphones className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stats?.supportTicketsCount || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tickets
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Projects */}
        <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {recentProjects.map((project, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${project.avatarBg} rounded-lg flex items-center justify-center`}>
                      <span className="text-white font-medium">
                        {project.avatar}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {project.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Updated {project.lastUpdate}
                      </p>
                    </div>
                  </div>
                  <Badge className={`${project.statusColor} dark:bg-green-900 dark:text-green-300 font-medium`}>
                    {project.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team Activity */}
        <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Team Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {teamActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={activity.avatar} alt={activity.name} />
                    <AvatarFallback className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                      {activity.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">{activity.name}</span>{" "}
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
