import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useUIStore } from '@/lib/store';

const INITIAL_NOTIFICATIONS = [
  { id: 'n-1', message: 'Discovery run completed — 28 resources found', type: 'success' as const, timestamp: new Date(Date.now() - 5 * 60e3).toISOString(), link: '/discovery' },
  { id: 'n-2', message: 'Payment Service degraded — circuit breaker tripped', type: 'error' as const, timestamp: new Date(Date.now() - 15 * 60e3).toISOString(), link: '/runbooks/rb-1' },
  { id: 'n-3', message: 'New documentation generated for web-gateway', type: 'info' as const, timestamp: new Date(Date.now() - 30 * 60e3).toISOString(), link: '/docs/web-gateway' },
  { id: 'n-4', message: 'orders-postgres CPU spike to 89%', type: 'warning' as const, timestamp: new Date(Date.now() - 45 * 60e3).toISOString(), link: '/resources/orders-postgres' },
];

const ICONS = {
  success: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  error: <XCircle className="h-4 w-4 text-red-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  info: <Info className="h-4 w-4 text-blue-500" />,
};

const BG_COLORS = {
  success: 'bg-green-50 dark:bg-green-950/20',
  error: 'bg-red-50 dark:bg-red-950/20',
  warning: 'bg-yellow-50 dark:bg-yellow-950/20',
  info: 'bg-blue-50 dark:bg-blue-950/20',
};

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { notifications, addNotification, removeNotification, clearNotifications } = useUIStore();

  // Seed initial notifications once
  useEffect(() => {
    if (notifications.length === 0) {
      INITIAL_NOTIFICATIONS.forEach((n) => addNotification({ message: n.message, type: n.type }));
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const unreadCount = notifications.length;

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(!open)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -right-1 -top-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-md border bg-popover shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <span className="text-sm font-medium">Notifications</span>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearNotifications}>
                Clear all
              </Button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    'flex items-start gap-2 px-3 py-2.5 border-b last:border-0 hover:bg-accent/50 cursor-pointer transition-colors',
                    BG_COLORS[n.type]
                  )}
                  onClick={() => {
                    setOpen(false);
                    const match = INITIAL_NOTIFICATIONS.find((i) => i.id === n.id);
                    if (match?.link) navigate(match.link);
                  }}
                >
                  <div className="shrink-0 mt-0.5">{ICONS[n.type]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatRelativeTime(n.timestamp)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0 -mr-1 -mt-0.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(n.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
