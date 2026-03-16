import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, MessageSquare, Plane, UtensilsCrossed, Image, Trash2, ChevronLeft, ChevronRight, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { ChatSession, ContextType } from '@/types/chat';

const CONTEXT_ICONS: Record<ContextType, React.ElementType> = {
  chat: MessageSquare,
  trip: Plane,
  booking: UtensilsCrossed,
  media: Image,
};

interface TaskRailProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onAuthClick: () => void;
}

export function TaskRail({
  sessions,
  activeSessionId,
  collapsed,
  onToggleCollapse,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onAuthClick,
}: TaskRailProps) {
  const [user, setUser] = useState<{ email?: string } | null>(null);

  useEffect(() => {
    supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  return (
    <motion.div
      className="bg-card border-r border-border flex flex-col shrink-0 overflow-hidden"
      animate={{ width: collapsed ? 48 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
    >
      {/* Header */}
      <div className="h-12 border-b border-border flex items-center justify-between px-3 shrink-0">
        {!collapsed && <span className="text-xs font-semibold text-muted-foreground tracking-wider">TASKS</span>}
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 ml-auto" onClick={onToggleCollapse}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* New Chat */}
      <div className="p-2 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 h-8 text-primary hover:bg-primary/10"
          onClick={() => onNewSession()}
        >
          <Plus className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="text-xs">New Chat</span>}
        </Button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {sessions.map(session => {
          const Icon = CONTEXT_ICONS[session.context_type] || MessageSquare;
          const isActive = session.id === activeSessionId;

          return (
            <motion.div
              key={session.id}
              className={`group flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer transition-colors ${
                isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
              onClick={() => onSelectSession(session.id)}
              whileHover={{ x: 2 }}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && (
                <>
                  <span className="text-xs truncate flex-1">{session.title}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={e => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Sign in / account — bottom of rail */}
      <div className="p-2 border-t border-border">
        {user ? (
          <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
            {!collapsed && (
              <span className="text-[10px] text-muted-foreground truncate flex-1">{user.email}</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 shrink-0"
              onClick={() => supabase.auth.signOut()}
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground ${collapsed ? 'w-full justify-center p-0' : 'w-full justify-start'}`}
            onClick={onAuthClick}
          >
            <LogIn className="h-3.5 w-3.5 shrink-0" />
            {!collapsed && <span>Sign In</span>}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
