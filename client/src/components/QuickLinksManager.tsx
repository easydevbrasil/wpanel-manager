import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Globe,
  Star,
  Heart,
  Bookmark,
  Shield,
  Zap,
  Users,
  TrendingUp,
  Settings,
  Filter,
  Search,
  Grid3X3,
  List,
  Save,
  Link as LinkIcon,
  CheckCircle2
} from "lucide-react";
import { SiGithub, SiDocker, SiNginx, SiPostgresql, SiSlack, SiDiscord, SiTelegram } from "react-icons/si";
import { cn } from "@/lib/utils";

interface QuickLink {
  id: string;
  title: string;
  url: string;
  icon: string;
  category: string;
  description?: string;
  isActive: boolean;
  isFavorite?: boolean;
  openInNewTab?: boolean;
  sortOrder?: number;
}

interface QuickLinksManagerProps {
  links: QuickLink[];
  onUpdate: (id: string, link: Partial<QuickLink>) => void;
  onCreate: (link: Omit<QuickLink, 'id'>) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  className?: string;
  isGridView?: boolean;
}

// Icon mapping
const iconMap: Record<string, any> = {
  github: SiGithub,
  docker: SiDocker,
  nginx: SiNginx,
  database: SiPostgresql,
  postgresql: SiPostgresql,
  slack: SiSlack,
  discord: SiDiscord,
  telegram: SiTelegram,
  shield: Shield,
  globe: Globe,
  zap: Zap,
  star: Star,
  heart: Heart,
  bookmark: Bookmark,
  users: Users,
  trending: TrendingUp,
  settings: Settings,
  link: LinkIcon,
  external: ExternalLink
};

function getQuickLinkIcon(iconName: string, className: string = "w-4 h-4") {
  const IconComponent = iconMap[iconName] || Globe;
  return <IconComponent className={className} />;
}

const categories = [
  { value: 'development', label: 'Desenvolvimento' },
  { value: 'monitoring', label: 'Monitoramento' },
  { value: 'documentation', label: 'Documentação' },
  { value: 'tools', label: 'Ferramentas' },
  { value: 'social', label: 'Social' },
  { value: 'admin', label: 'Administração' },
  { value: 'external', label: 'Externos' },
  { value: 'favorite', label: 'Favoritos' }
];

const availableIcons = Object.keys(iconMap);

export function QuickLinksManager({
  links,
  onUpdate,
  onCreate,
  onDelete,
  onToggleFavorite,
  className,
  isGridView = true
}: QuickLinksManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [editingLink, setEditingLink] = useState<QuickLink | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(isGridView ? 'grid' : 'list');
  const [linkForm, setLinkForm] = useState({
    title: '',
    url: '',
    icon: 'globe',
    category: 'development',
    description: '',
    isActive: true,
    isFavorite: false,
    openInNewTab: true
  });

  const filteredLinks = links.filter(link => {
    const matchesSearch = link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         link.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         link.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || link.category === filterCategory;
    
    return matchesSearch && matchesCategory && link.isActive;
  });

  const groupedLinks = filteredLinks.reduce((acc, link) => {
    if (!acc[link.category]) {
      acc[link.category] = [];
    }
    acc[link.category].push(link);
    return acc;
  }, {} as Record<string, QuickLink[]>);

  const favoriteLinks = filteredLinks.filter(link => link.isFavorite);

  const handleSubmit = () => {
    if (!linkForm.title || !linkForm.url) return;

    const linkData = {
      ...linkForm,
      url: linkForm.url.startsWith('http') ? linkForm.url : `https://${linkForm.url}`
    };

    if (editingLink) {
      onUpdate(editingLink.id, linkData);
      setEditingLink(null);
    } else {
      onCreate(linkData);
    }

    setLinkForm({
      title: '',
      url: '',
      icon: 'globe',
      category: 'development',
      description: '',
      isActive: true,
      isFavorite: false,
      openInNewTab: true
    });
    setIsCreateDialogOpen(false);
  };

  const startEdit = (link: QuickLink) => {
    setEditingLink(link);
    setLinkForm({
      title: link.title,
      url: link.url,
      icon: link.icon,
      category: link.category,
      description: link.description || '',
      isActive: link.isActive,
      isFavorite: link.isFavorite || false,
      openInNewTab: link.openInNewTab !== false
    });
    setIsCreateDialogOpen(true);
  };

  const cancelEdit = () => {
    setEditingLink(null);
    setLinkForm({
      title: '',
      url: '',
      icon: 'globe',
      category: 'development',
      description: '',
      isActive: true,
      isFavorite: false,
      openInNewTab: true
    });
    setIsCreateDialogOpen(false);
  };

  const handleLinkClick = (link: QuickLink) => {
    if (link.openInNewTab !== false) {
      window.open(link.url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = link.url;
    }
  };

  const getCategoryLabel = (category: string) => {
    return categories.find(c => c.value === category)?.label || category;
  };

  const renderLinkCard = (link: QuickLink) => (
    <div
      key={link.id}
      className="group relative bg-card hover:bg-accent/50 border rounded-lg transition-all duration-200 hover:shadow-md cursor-pointer"
    >
      {/* Favorite indicator */}
      {link.isFavorite && (
        <div className="absolute top-2 right-2">
          <Star className="w-3 h-3 text-yellow-500 fill-current" />
        </div>
      )}

      <div className="p-4" onClick={() => handleLinkClick(link)}>
        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-3 group-hover:bg-primary/20 transition-colors">
          <div className="text-primary">
            {getQuickLinkIcon(link.icon, "w-5 h-5")}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-1 mb-3">
          <h3 className="font-semibold text-sm line-clamp-1">{link.title}</h3>
          {link.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {link.description}
            </p>
          )}
        </div>

        {/* URL and Category */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground truncate">
            {link.url}
          </p>
          <Badge variant="outline" className="text-xs">
            {getCategoryLabel(link.category)}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(link.id);
            }}
          >
            <Heart className={cn(
              "w-3 h-3",
              link.isFavorite ? "text-red-500 fill-current" : "text-muted-foreground"
            )} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              startEdit(link);
            }}
          >
            <Edit className="w-3 h-3" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir o link "{link.title}"? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(link.id)}>
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );

  const renderListItem = (link: QuickLink) => (
    <div
      key={link.id}
      className="group flex items-center gap-3 p-3 bg-card hover:bg-accent/50 border rounded-lg transition-all duration-200 hover:shadow-sm cursor-pointer"
      onClick={() => handleLinkClick(link)}
    >
      {/* Icon */}
      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-md flex-shrink-0">
        <div className="text-primary">
          {getQuickLinkIcon(link.icon, "w-4 h-4")}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-sm truncate">{link.title}</h4>
          {link.isFavorite && (
            <Star className="w-3 h-3 text-yellow-500 fill-current flex-shrink-0" />
          )}
          <Badge variant="outline" className="text-xs flex-shrink-0">
            {getCategoryLabel(link.category)}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {link.description || link.url}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(link.id);
          }}
        >
          <Heart className={cn(
            "w-3 h-3",
            link.isFavorite ? "text-red-500 fill-current" : "text-muted-foreground"
          )} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={(e) => {
            e.stopPropagation();
            startEdit(link);
          }}
        >
          <Edit className="w-3 h-3" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o link "{link.title}"? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(link.id)}>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );

  return (
    <div className={cn("w-full max-w-6xl", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Grid3X3 className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Links Rápidos</h2>
            <p className="text-sm text-muted-foreground">
              {links.length} links • {favoriteLinks.length} favoritos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-3 h-3" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode('list')}
            >
              <List className="w-3 h-3" />
            </Button>
          </div>

          {/* Create Dialog */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Link
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingLink ? 'Editar Link' : 'Novo Link Rápido'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Título</Label>
                  <Input
                    value={linkForm.title}
                    onChange={(e) => setLinkForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Nome do link"
                  />
                </div>
                <div>
                  <Label>URL</Label>
                  <Input
                    value={linkForm.url}
                    onChange={(e) => setLinkForm(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://exemplo.com"
                  />
                </div>
                <div>
                  <Label>Descrição (opcional)</Label>
                  <Textarea
                    value={linkForm.description}
                    onChange={(e) => setLinkForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Breve descrição do link"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Categoria</Label>
                    <Select value={linkForm.category} onValueChange={(value) => setLinkForm(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Ícone</Label>
                    <Select value={linkForm.icon} onValueChange={(value) => setLinkForm(prev => ({ ...prev, icon: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {availableIcons.map(icon => (
                          <SelectItem key={icon} value={icon}>
                            <div className="flex items-center gap-2">
                              {getQuickLinkIcon(icon, "w-3 h-3")}
                              <span className="capitalize">{icon}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Abrir em nova aba</Label>
                    <Switch
                      checked={linkForm.openInNewTab}
                      onCheckedChange={(checked) => setLinkForm(prev => ({ ...prev, openInNewTab: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Marcar como favorito</Label>
                    <Switch
                      checked={linkForm.isFavorite}
                      onCheckedChange={(checked) => setLinkForm(prev => ({ ...prev, isFavorite: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Link ativo</Label>
                    <Switch
                      checked={linkForm.isActive}
                      onCheckedChange={(checked) => setLinkForm(prev => ({ ...prev, isActive: checked }))}
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSubmit} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    {editingLink ? 'Atualizar' : 'Criar'}
                  </Button>
                  <Button variant="outline" onClick={cancelEdit}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar links..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map(category => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Favorites Section */}
      {favoriteLinks.length > 0 && filterCategory === "all" && !searchTerm && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Favoritos
          </h3>
          <div className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              : "space-y-2"
          )}>
            {favoriteLinks.map(link => viewMode === 'grid' ? renderLinkCard(link) : renderListItem(link))}
          </div>
        </div>
      )}

      {/* Links by Category */}
      <div className="space-y-6">
        {Object.entries(groupedLinks).map(([category, categoryLinks]) => {
          if (categoryLinks.length === 0) return null;
          
          return (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-4">
                {getCategoryLabel(category)}
                <Badge variant="outline" className="ml-2">
                  {categoryLinks.length}
                </Badge>
              </h3>
              <div className={cn(
                viewMode === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  : "space-y-2"
              )}>
                {categoryLinks.map(link => viewMode === 'grid' ? renderLinkCard(link) : renderListItem(link))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredLinks.length === 0 && (
        <div className="text-center py-12">
          <LinkIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            Nenhum link encontrado
          </h3>
          <p className="text-sm text-muted-foreground">
            {searchTerm || filterCategory !== "all" 
              ? "Tente ajustar os filtros de busca"
              : "Crie seu primeiro link rápido"}
          </p>
        </div>
      )}
    </div>
  );
}
