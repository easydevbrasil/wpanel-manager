import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TerminalModal } from "@/components/TerminalModal";
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
  Cloud,
  Package,
  ShoppingCart,
  Truck,
  Headphones,
  BarChart3,
  Activity,
  Wifi,
  Download,
  Upload,
  Shield,
  Monitor,
  Terminal,
  Server,
  Database,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
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
  pythonVersion: string;
  pythonAvailable: boolean;
  updates: {
    node: boolean;
    python: boolean;
  };
  timestamp: string;
}

interface ProtonDriveStatus {
  total: number;
  used: number;
  free: number;
  usagePercent: number;
}

interface ChartData {
  data: number[];
  labels: string[];
  current: number;
  details?: {
    cores?: number;
    model?: string;
    frequency?: string;
    minUsage?: string;
    maxUsage?: string;
    avgUsage?: string;
    architecture?: string;
    threads?: number;
    total?: string;
    used?: string;
    free?: string;
    totalBytes?: number;
    usedBytes?: number;
    freeBytes?: number;
    platform?: string;
    buffers?: string;
  };
}

interface NetworkChartData {
  data: { rx: number; tx: number }[];
  labels: string[];
  current: { rx: number; tx: number };
  totals: { rxTotal: number; txTotal: number };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatNetworkBytes(kb: number): string {
  if (kb === 0) return '0 KB';
  const sizes = ['KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let value = kb;

  while (value >= 1024 && i < sizes.length - 1) {
    value /= 1024;
    i++;
  }

  return parseFloat(value.toFixed(1)) + ' ' + sizes[i];
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Get OS information based on platform
const getOSInfo = (platform: string) => {
  const normalizedPlatform = platform.toLowerCase();

  if (normalizedPlatform.includes("ubuntu")) {
    return {
      name: "Ubuntu",
      logo: "/ubuntu.svg",
      icon: Monitor,
      color: "bg-orange-500"
    };
  }

  if (normalizedPlatform.includes("debian")) {
    return {
      name: "Debian",
      logo: "/debian.svg",
      icon: Server,
      color: "bg-red-600"
    };
  }

  // Fallback for other systems
  return {
    name: platform || "Linux",
    logo: null,
    icon: Terminal,
    color: "bg-blue-600"
  };
};

// Gauge Component Genérico
function SystemGauge({ usage, color }: { usage: number; color: string }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (usage / 100) * circumference;

  const getGaugeColor = (usage: number, baseColor: string) => {
    if (usage >= 80) return "#ef4444"; // red
    if (usage >= 60) return "#f59e0b"; // yellow
    return baseColor;
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
          stroke={getGaugeColor(usage, color)}
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-foreground">
          {usage}%
        </span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [terminalModal, setTerminalModal] = useState({
    open: false,
    title: "",
    updateType: 'all' as 'node' | 'python' | 'all'
  });

  const { data: statsData } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  // Fetch real system status from API (CPU, RAM, Disk - every 5 seconds)
  const { data: systemStatus, isLoading: isLoadingSystemStatus } = useQuery<SystemStatus>({
    queryKey: ["/api/system/status"],
    refetchInterval: 5000, // Update every 5 seconds
  });

  // Fetch Proton Drive status separately (every 30 seconds)
  const { data: protonStatus } = useQuery({
    queryKey: ["/api/proton/status"],
    refetchInterval: 30000, // Update every 30 seconds
  });

  // Fetch CPU chart data (every 2 seconds)
  const { data: cpuChartData } = useQuery<ChartData>({
    queryKey: ["/api/charts/cpu"],
    refetchInterval: 2000, // Update every 2 seconds
  });

  // Fetch RAM chart data (every 2 seconds)
  const { data: ramChartData } = useQuery<ChartData>({
    queryKey: ["/api/charts/ram"],
    refetchInterval: 2000, // Update every 2 seconds
  });

  // Fetch network chart data (every 2 seconds)
  const { data: networkChartData } = useQuery<NetworkChartData>({
    queryKey: ["/api/charts/network"],
    refetchInterval: 2000, // Update every 2 seconds
  });

  // Merge system status with Proton Drive data
  const mergedSystemStatus = systemStatus ? {
    ...systemStatus,
    swap: (protonStatus as ProtonDriveStatus) || {
      total: 0,
      used: 0,
      free: 0,
      usagePercent: 0
    }
  } : null;

  const stats = statsData as any;

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

  // Obter informações do sistema operacional
  const osInfo = mergedSystemStatus ? getOSInfo(mergedSystemStatus.platform) : null;

  // Debug: Log the platform and osInfo
  useEffect(() => {
    if (mergedSystemStatus) {
      console.log('Platform from API:', mergedSystemStatus.platform);
      console.log('OS Info:', osInfo);
      console.log('SVG Logo URL:', osInfo?.logo);
    }
  }, [mergedSystemStatus, osInfo]);

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Dashboard Overview
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back! Here's what's happening with your projects today.
        </p>
      </div>

      {/* System Information Banner */}
      <Card className="mb-6 md:mb-8 bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 dark:from-indigo-900/20 dark:via-blue-900/20 dark:to-cyan-900/20 border border-indigo-200/50 dark:border-indigo-700/50">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            {/* Logo e informações principais */}
            <div className="flex items-center gap-4">
              <div className="relative">
                {osInfo ? (
                  osInfo.logo ? (
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg p-2">
                      <img
                        src={osInfo.logo}
                        alt={`${osInfo.name} logo`}
                        className="w-12 h-12"
                      />
                    </div>
                  ) : (
                    <div className={`w-16 h-16 bg-gradient-to-br ${osInfo.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                      <osInfo.icon className="w-8 h-8 text-white" />
                    </div>
                  )
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                )}
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {osInfo ? osInfo.name : 'Sistema'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {mergedSystemStatus ? (() => {
                    // Extract version/codename from platform string like "debian bookworm"
                    const platformParts = mergedSystemStatus.platform.split(' ');
                    const codename = platformParts.length > 1 ? platformParts[1] : '';
                    return codename ? `${mergedSystemStatus.arch} • ${codename}` : `${mergedSystemStatus.arch} • wPanel Manager`;
                  })() : 'Sistema de Gerenciamento'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">Sistema Online</span>
                </div>
              </div>
            </div>

            {/* Informações do sistema em grid */}
            <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
              {mergedSystemStatus ? (
                <>
                  <div className="text-center lg:text-left">
                    <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Uptime</p>
                    <p className="text-lg font-bold text-foreground">{formatUptime(mergedSystemStatus.uptime)}</p>
                  </div>
                  <div className="text-center lg:text-left">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Node.js</p>
                      {mergedSystemStatus.updates.node && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs px-2"
                          onClick={() => setTerminalModal({
                            open: true,
                            title: "Update Node.js",
                            updateType: 'node'
                          })}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Update
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-foreground">{mergedSystemStatus.nodeVersion}</p>
                      {mergedSystemStatus.updates.node ? (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </div>
                  <div className="text-center lg:text-left">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Python</p>
                      {mergedSystemStatus.pythonAvailable && mergedSystemStatus.updates.python && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs px-2"
                          onClick={() => setTerminalModal({
                            open: true,
                            title: "Update Python",
                            updateType: 'python'
                          })}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Update
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-foreground">
                        {mergedSystemStatus.pythonAvailable ? mergedSystemStatus.pythonVersion : 'Not installed'}
                      </p>
                      {mergedSystemStatus.pythonAvailable ? (
                        mergedSystemStatus.updates.python ? (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )
                      ) : (
                        <div className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                  <div className="text-center lg:text-left">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">All Updates</p>
                      {(mergedSystemStatus.updates.node || mergedSystemStatus.updates.python) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs px-2"
                          onClick={() => setTerminalModal({
                            open: true,
                            title: "Update All Packages",
                            updateType: 'all'
                          })}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Update All
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {(mergedSystemStatus.updates.node || mergedSystemStatus.updates.python) ? (
                        <>
                          <p className="text-lg font-bold text-orange-600">Updates Available</p>
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        </>
                      ) : (
                        <>
                          <p className="text-lg font-bold text-green-600">Up to Date</p>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="text-center lg:text-left">
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mb-1"></div>
                      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Segunda linha de informações */}
            <div className="w-full lg:hidden">
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-indigo-200/50 dark:border-indigo-700/50">
                {mergedSystemStatus ? (
                  <>
                    <div className="text-center">
                      <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">CPU Cores</p>
                      <p className="text-lg font-bold text-foreground">{mergedSystemStatus.cpu.cores} cores</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">RAM Total</p>
                      <p className="text-lg font-bold text-foreground">{formatBytes(mergedSystemStatus.memory.total)}</p>
                    </div>
                  </>
                ) : (
                  <>
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="text-center">
                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mb-1"></div>
                        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Status indicators */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-700 dark:text-green-300">API Online</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Activity className="w-3 h-3 text-blue-600" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Monitorando</span>
              </div>
              {mergedSystemStatus && (
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <Cpu className="w-3 h-3 text-purple-600" />
                  <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                    CPU {Math.round(mergedSystemStatus.cpu.usage)}%
                  </span>
                </div>
              )}
              {mergedSystemStatus && (
                <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                  <MemoryStick className="w-3 h-3 text-yellow-600" />
                  <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                    RAM {mergedSystemStatus.memory.usagePercent}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Status Section - Moved to top */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Status do Sistema
        </h2>

        {!mergedSystemStatus ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-card shadow-sm border-border">
                <CardContent className="p-4 md:p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted rounded mb-3"></div>
                    <div className="h-8 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : mergedSystemStatus ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* CPU Card with Gauge */}
            <Card className="bg-card shadow-sm border-border">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      CPU
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {mergedSystemStatus.cpu.cores} cores
                    </p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 md:p-3 rounded-lg">
                    <Cpu className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <SystemGauge usage={Math.round(mergedSystemStatus.cpu.usage)} color="#3b82f6" />
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 text-center">
                  {mergedSystemStatus.cpu.model.substring(0, 30)}...
                </p>
              </CardContent>
            </Card>

            {/* Memory Card with Gauge */}
            <Card className="bg-card shadow-sm border-border">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Memória RAM
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {formatBytes(mergedSystemStatus.memory.total)}
                    </p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900 p-2 md:p-3 rounded-lg">
                    <MemoryStick className="w-5 h-5 md:w-6 md:h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <SystemGauge usage={mergedSystemStatus.memory.usagePercent} color="#10b981" />
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-2 text-center">
                  <span>{formatBytes(mergedSystemStatus.memory.used)}</span>
                  <span className="mx-1">/</span>
                  <span>{formatBytes(mergedSystemStatus.memory.total)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Storage Card with Gauge */}
            <Card className="bg-card shadow-sm border-border">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Armazenamento
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {formatBytes(mergedSystemStatus.disk.total)}
                    </p>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900 p-2 md:p-3 rounded-lg">
                    <HardDrive className="w-5 h-5 md:w-6 md:h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <SystemGauge usage={mergedSystemStatus.disk.usagePercent} color="#8b5cf6" />
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-2 text-center">
                  <span>{formatBytes(mergedSystemStatus.disk.used)}</span>
                  <span className="mx-1">/</span>
                  <span>{formatBytes(mergedSystemStatus.disk.total)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Proton Drive Card with Gauge */}
            <Card className="bg-card shadow-sm border-border">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Proton Drive
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {mergedSystemStatus.swap.total > 0 ? formatBytes(mergedSystemStatus.swap.total) : "N/A"}
                    </p>
                  </div>
                  <div className="bg-orange-100 dark:bg-orange-900 p-2 md:p-3 rounded-lg">
                    <Cloud className="w-5 h-5 md:w-6 md:h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <SystemGauge usage={mergedSystemStatus.swap.usagePercent} color="#f97316" />
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-2 text-center">
                  {mergedSystemStatus.swap.total > 0 ? (
                    <>
                      <span>{formatBytes(mergedSystemStatus.swap.used)}</span>
                      <span className="mx-1">/</span>
                      <span>{formatBytes(mergedSystemStatus.swap.total)}</span>
                    </>
                  ) : (
                    <span>Não disponível</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>

      {/* Real-time Charts Section */}
      <div className="mb-6 md:mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* CPU Chart */}
          {cpuChartData && (
            <Card className="bg-card shadow-sm border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  CPU
                  <div className="ml-auto flex flex-col gap-1">
                    <Badge variant="outline" className="text-xs">
                      {cpuChartData.current.toFixed(1)}%
                    </Badge>
                    {cpuChartData.details && (
                      <div className="flex gap-1 text-xs">
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                          {cpuChartData.details.cores} cores
                        </Badge>
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                          Avg: {cpuChartData.details.avgUsage}%
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cpuChartData.data.map((value, index) => ({
                      time: `${(cpuChartData.data.length - index - 1) * 2}s`,
                      value: value,
                      index: index
                    })).reverse()}>
                      <defs>
                        <linearGradient id="gradient-cpu" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
                      <XAxis
                        dataKey="time"
                        fontSize={10}
                        stroke="#6B7280"
                        tick={{ fill: '#6B7280' }}
                      />
                      <YAxis
                        fontSize={10}
                        stroke="#6B7280"
                        tick={{ fill: '#6B7280' }}
                        domain={[0, 100]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                        formatter={(value: any) => [`${value}%`, 'CPU']}
                        labelFormatter={(label) => `${label} atrás`}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#gradient-cpu)"
                        fillOpacity={1}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {cpuChartData.details && (
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <div>Min: {cpuChartData.details.minUsage}%</div>
                    <div>Max: {cpuChartData.details.maxUsage}%</div>
                    {cpuChartData.details.frequency && (
                      <div className="col-span-2 truncate" title={cpuChartData.details.model}>
                        {cpuChartData.details.frequency}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* RAM Chart */}
          {ramChartData && (
            <Card className="bg-card shadow-sm border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-green-600" />
                  RAM
                  <div className="ml-auto flex flex-col gap-1">
                    <Badge variant="outline" className="text-xs">
                      {ramChartData.current.toFixed(1)}%
                    </Badge>
                    {ramChartData.details && (
                      <div className="flex gap-1 text-xs">
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                          {ramChartData.details.used}
                        </Badge>
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                          Avg: {ramChartData.details.avgUsage}%
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ramChartData.data.map((value, index) => ({
                      time: `${(ramChartData.data.length - index - 1) * 2}s`,
                      value: value,
                      index: index
                    })).reverse()}>
                      <defs>
                        <linearGradient id="gradient-ram" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
                      <XAxis
                        dataKey="time"
                        fontSize={10}
                        stroke="#6B7280"
                        tick={{ fill: '#6B7280' }}
                      />
                      <YAxis
                        fontSize={10}
                        stroke="#6B7280"
                        tick={{ fill: '#6B7280' }}
                        domain={[0, 100]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                        formatter={(value: any) => [`${value}%`, 'RAM']}
                        labelFormatter={(label) => `${label} atrás`}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#gradient-ram)"
                        fillOpacity={1}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {ramChartData.details && (
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <div>Min: {ramChartData.details.minUsage}%</div>
                    <div>Max: {ramChartData.details.maxUsage}%</div>
                    <div>Free: {ramChartData.details.free}</div>
                    <div>Total: {ramChartData.details.total}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Network Chart */}
          {networkChartData && (
            <Card className="bg-card shadow-sm border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-purple-600" />
                  Rede
                  <div className="ml-auto flex flex-col gap-1">
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs">
                        <Download className="w-3 h-3 mr-1" />
                        {networkChartData.current.rx} KB/s
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Upload className="w-3 h-3 mr-1" />
                        {networkChartData.current.tx} KB/s
                      </Badge>
                    </div>
                    <div className="flex gap-1 text-xs">
                      <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                        ↓ Total: {formatNetworkBytes(networkChartData.totals.rxTotal)}
                      </Badge>
                      <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700">
                        ↑ Total: {formatNetworkBytes(networkChartData.totals.txTotal)}
                      </Badge>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={networkChartData.data.map((item, index) => ({
                      time: `${(networkChartData.data.length - index - 1) * 2}s`,
                      rx: item.rx,
                      tx: item.tx,
                      index: index
                    })).reverse()}>
                      <defs>
                        <linearGradient id="gradient-rx" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="gradient-tx" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
                      <XAxis
                        dataKey="time"
                        fontSize={10}
                        stroke="#6B7280"
                        tick={{ fill: '#6B7280' }}
                      />
                      <YAxis
                        fontSize={10}
                        stroke="#6B7280"
                        tick={{ fill: '#6B7280' }}
                        domain={[0, 'dataMax']}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                        formatter={(value: any, name: string) => [
                          `${value} KB/s`,
                          name === 'rx' ? 'Download' : 'Upload'
                        ]}
                        labelFormatter={(label) => `${label} atrás`}
                      />
                      <Legend
                        verticalAlign="top"
                        height={16}
                        iconType="line"
                        wrapperStyle={{
                          fontSize: '10px',
                          color: '#6B7280'
                        }}
                        formatter={(value: string) => value === 'rx' ? 'Download' : 'Upload'}
                      />
                      <Area
                        type="monotone"
                        dataKey="rx"
                        name="rx"
                        stackId="1"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        fill="url(#gradient-rx)"
                        fillOpacity={1}
                      />
                      <Area
                        type="monotone"
                        dataKey="tx"
                        name="tx"
                        stackId="2"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        fill="url(#gradient-tx)"
                        fillOpacity={1}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Data Counters Section */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Resumo dos Dados
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {/* Clients Counter */}
          <Card className="bg-card shadow-sm border-border">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 sm:p-3 rounded-lg mb-2 sm:mb-3 mx-auto w-fit">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-1">
                {stats?.clientsCount || 0}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Clientes
              </p>
            </CardContent>
          </Card>

          {/* Products Counter */}
          <Card className="bg-card shadow-sm border-border">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="bg-green-100 dark:bg-green-900 p-2 sm:p-3 rounded-lg mb-2 sm:mb-3 mx-auto w-fit">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-1">
                {stats?.productsCount || 0}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Produtos
              </p>
            </CardContent>
          </Card>

          {/* Sales Counter */}
          <Card className="bg-card shadow-sm border-border">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="bg-purple-100 dark:bg-purple-900 p-2 sm:p-3 rounded-lg mb-2 sm:mb-3 mx-auto w-fit">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-1">
                {stats?.salesCount || 0}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Vendas
              </p>
            </CardContent>
          </Card>

          {/* Suppliers Counter */}
          <Card className="bg-card shadow-sm border-border">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="bg-orange-100 dark:bg-orange-900 p-2 sm:p-3 rounded-lg mb-2 sm:mb-3 mx-auto w-fit">
                <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-1">
                {stats?.suppliersCount || 0}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Fornecedores
              </p>
            </CardContent>
          </Card>

          {/* Support Tickets Counter */}
          <Card className="bg-card shadow-sm border-border">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="bg-red-100 dark:bg-red-900 p-2 sm:p-3 rounded-lg mb-2 sm:mb-3 mx-auto w-fit">
                <Headphones className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-1">
                {stats?.supportTicketsCount || 0}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Tickets
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Projects */}
        <Card className="bg-card shadow-sm border-border">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="text-lg font-semibold text-foreground">
              Recent Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {recentProjects.map((project, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-muted rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${project.avatarBg} rounded-lg flex items-center justify-center`}>
                      <span className="text-white font-medium">
                        {project.avatar}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">
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
        <Card className="bg-card shadow-sm border-border">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="text-lg font-semibold text-foreground">
              Team Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {teamActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={activity.avatar} alt={activity.name} />
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      {activity.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
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

      {/* Terminal Modal */}
      <TerminalModal
        open={terminalModal.open}
        onOpenChange={(open) => setTerminalModal(prev => ({ ...prev, open }))}
        title={terminalModal.title}
        updateType={terminalModal.updateType}
      />
    </div>
  );
}
