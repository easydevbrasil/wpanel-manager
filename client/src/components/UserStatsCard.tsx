import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Target, 
  Clock, 
  TrendingUp, 
  Calendar,
  Zap,
  Award,
  Star
} from "lucide-react";

interface UserStats {
  level: number;
  xp: number;
  maxXp: number;
  streak: number;
  achievements: number;
  tasksCompleted: number;
  projectsCreated: number;
  lastActivity: string;
}

interface User {
  id?: string | number;
  name?: string;
  email?: string;
  avatar?: string;
}

interface UserStatsCardProps {
  stats?: UserStats;
  user?: User | null;
}

export function UserStatsCard({ stats, user }: UserStatsCardProps) {
  // Default stats if none provided
  const defaultStats: UserStats = {
    level: 12,
    xp: 2847,
    maxXp: 3000,
    streak: 15,
    achievements: 8,
    tasksCompleted: 142,
    projectsCreated: 23,
    lastActivity: new Date().toISOString()
  };

  const userStats = stats || defaultStats;
  const progressPercentage = (userStats.xp / userStats.maxXp) * 100;
  
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Estatísticas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Level & XP */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Nível {userStats.level}</span>
            <Badge variant="secondary" className="text-xs">
              {userStats.xp}/{userStats.maxXp} XP
            </Badge>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-500" />
            <div>
              <p className="font-medium">{userStats.streak}</p>
              <p className="text-xs text-muted-foreground">Dias seguidos</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-500" />
            <div>
              <p className="font-medium">{userStats.achievements}</p>
              <p className="text-xs text-muted-foreground">Conquistas</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-green-500" />
            <div>
              <p className="font-medium">{userStats.tasksCompleted}</p>
              <p className="text-xs text-muted-foreground">Tarefas</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <div>
              <p className="font-medium">{userStats.projectsCreated}</p>
              <p className="text-xs text-muted-foreground">Projetos</p>
            </div>
          </div>
        </div>

        {/* Last Activity */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            Última atividade: {userStats.lastActivity}
          </div>
        </div>

        {/* Achievement Preview */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Próxima conquista</span>
            <Star className="w-3 h-3 text-yellow-500" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Complete 5 projetos para desbloquear "Desenvolvedor Ativo"
          </p>
          <Progress value={60} className="h-1 mt-2" />
        </div>
      </CardContent>
    </Card>
  );
}

// Mock data generator
export function generateMockUserStats(): UserStats {
  return {
    level: 7,
    xp: 1350,
    maxXp: 2000,
    streak: 12,
    achievements: 8,
    tasksCompleted: 45,
    projectsCreated: 3,
    lastActivity: "2 horas atrás"
  };
}
