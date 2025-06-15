import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  FolderOpen,
  Users,
  Settings,
  Eye,
  BarChart3,
  FileText,
  Folder,
  User,
  Copy,
  Sliders,
  Shield,
  Bell,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { NavigationItem } from "@shared/schema";

const iconMap = {
  LayoutDashboard,
  FolderOpen,
  Users,
  Settings,
  Eye,
  BarChart3,
  FileText,
  Folder,
  User,
  Copy,
  Sliders,
  Shield,
  Bell,
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [location] = useLocation();
  const [openItems, setOpenItems] = useState<Set<number>>(new Set([1])); // Dashboard open by default

  const { data: navigationItems = [] } = useQuery<NavigationItem[]>({
    queryKey: ["/api/navigation"],
  });

  // Group items by parent
  const parentItems = navigationItems.filter(item => !item.parentId);
  const childItems = navigationItems.filter(item => item.parentId);
  const childrenByParent = childItems.reduce((acc, item) => {
    if (!item.parentId) return acc;
    if (!acc[item.parentId]) acc[item.parentId] = [];
    acc[item.parentId].push(item);
    return acc;
  }, {} as Record<number, NavigationItem[]>);

  const toggleItem = (itemId: number) => {
    if (collapsed) return;
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(itemId)) {
      newOpenItems.delete(itemId);
    } else {
      newOpenItems.add(itemId);
    }
    setOpenItems(newOpenItems);
  };

  const renderIcon = (iconName: string) => {
    const Icon = iconMap[iconName as keyof typeof iconMap];
    return Icon ? <Icon className="w-5 h-5" /> : <LayoutDashboard className="w-5 h-5" />;
  };

  const isActive = (href: string | null) => {
    if (!href) return false;
    return location === href || (href !== "/" && location.startsWith(href));
  };

  return (
    <>
      <aside
        className={cn(
          "bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex-shrink-0",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <div className="p-6">
          <nav className="space-y-2">
            {parentItems.map((item) => {
              const children = childrenByParent[item.id] || [];
              const hasChildren = children.length > 0;
              const isOpen = openItems.has(item.id);

              if (hasChildren) {
                return (
                  <Collapsible
                    key={item.id}
                    open={!collapsed && isOpen}
                    onOpenChange={() => toggleItem(item.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-between px-3 py-2 text-gray-700 hover:bg-gray-100",
                          collapsed && "justify-center"
                        )}
                      >
                        <div className="flex items-center">
                          {renderIcon(item.icon)}
                          {!collapsed && (
                            <span className="ml-3">{item.label}</span>
                          )}
                        </div>
                        {!collapsed && hasChildren && (
                          <ChevronDown
                            className={cn(
                              "w-4 h-4 transition-transform",
                              isOpen && "rotate-180"
                            )}
                          />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1">
                      {children.map((child) => (
                        <Link key={child.id} href={child.href || "#"}>
                          <a
                            className={cn(
                              "block ml-8 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors",
                              isActive(child.href) && "bg-gray-100 text-gray-900"
                            )}
                          >
                            {child.label}
                          </a>
                        </Link>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              } else {
                return (
                  <Link key={item.id} href={item.href || "#"}>
                    <a
                      className={cn(
                        "flex items-center px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors",
                        isActive(item.href) && "bg-gray-100 text-gray-900",
                        collapsed && "justify-center"
                      )}
                    >
                      {renderIcon(item.icon)}
                      {!collapsed && (
                        <span className="ml-3">{item.label}</span>
                      )}
                    </a>
                  </Link>
                );
              }
            })}
          </nav>
        </div>
      </aside>

      {/* Toggle Button */}
      <Button
        onClick={onToggle}
        size="sm"
        className={cn(
          "fixed top-1/2 transform -translate-y-1/2 bg-white border border-gray-200 rounded-lg p-2 shadow-lg hover:shadow-xl transition-all duration-200 z-30",
          collapsed ? "left-24" : "left-68"
        )}
      >
        {collapsed ? (
          <ChevronRight className="w-5 h-5 text-gray-600" />
        ) : (
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        )}
      </Button>
    </>
  );
}
