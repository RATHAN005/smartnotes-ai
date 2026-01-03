import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  FileText,
  FolderOpen,
  Tag,
  Settings,
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const navItems = [
  { icon: Home, label: 'Dashboard', path: '/dashboard' },
  { icon: Sparkles, label: 'New Note', path: '/new' },
  { icon: FileText, label: 'My Notes', path: '/notes' },
  { icon: FolderOpen, label: 'Folders', path: '/folders' },
  { icon: Tag, label: 'Tags', path: '/tags' },
];

const bottomItems = [
  { icon: User, label: 'Profile', path: '/profile' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { signOut, user } = useAuth();

  const NavItem = ({ item }: { item: typeof navItems[0] }) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;

    const content = (
      <NavLink
        to={item.path}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
          'hover:bg-sidebar-accent group',
          isActive && 'bg-sidebar-accent text-sidebar-primary'
        )}
      >
        <Icon className={cn(
          'h-5 w-5 shrink-0 transition-colors',
          isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/70 group-hover:text-sidebar-foreground'
        )} />
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              'text-sm font-medium',
              isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/70 group-hover:text-sidebar-foreground'
            )}
          >
            {item.label}
          </motion.span>
        )}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="h-screen bg-sidebar border-r border-sidebar-border flex flex-col shrink-0"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sidebar-foreground">SmartNotes</span>
          </motion.div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem key={item.path} item={item} />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        {bottomItems.map((item) => (
          <NavItem key={item.path} item={item} />
        ))}
        
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={signOut}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-all duration-200 hover:bg-destructive/10 group"
              >
                <LogOut className="h-5 w-5 text-sidebar-foreground/70 group-hover:text-destructive" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              Sign Out
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-all duration-200 hover:bg-destructive/10 group"
          >
            <LogOut className="h-5 w-5 text-sidebar-foreground/70 group-hover:text-destructive" />
            <span className="text-sm font-medium text-sidebar-foreground/70 group-hover:text-destructive">
              Sign Out
            </span>
          </button>
        )}
      </div>
    </motion.aside>
  );
}
