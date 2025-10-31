'use client';

import { useState } from 'react';
import { Notification } from '@/types/dashboard';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  MessageCircle,
  FileText,
  AlertCircle,
  Trash2,
  X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface NotificationCenterProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (notificationId: string) => void;
  className?: string;
}

const notificationIcons = {
  mention: MessageCircle,
  task_assigned: FileText,
  task_completed: Check,
  comment: MessageCircle,
  system: AlertCircle,
};

const notificationColors = {
  mention: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950',
  task_assigned: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950',
  task_completed: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950',
  comment: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950',
  system: 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-950',
};

export function NotificationCenter({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  className,
}: NotificationCenterProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications =
    filter === 'unread'
      ? notifications.filter((n) => !n.read)
      : notifications;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn('relative', className)}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[400px] p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount}</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              <CheckCheck className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'flex-1 px-4 py-2 text-sm font-medium transition-colors',
              filter === 'all'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={cn(
              'flex-1 px-4 py-2 text-sm font-medium transition-colors',
              filter === 'unread'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BellOff className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map((notification) => {
                const Icon = notificationIcons[notification.type] || AlertCircle;
                const colorClass = notificationColors[notification.type] || 'text-gray-600 bg-gray-50';

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-4 transition-colors hover:bg-muted/50 cursor-pointer',
                      !notification.read && 'bg-muted/30'
                    )}
                    onClick={() => {
                      if (!notification.read) {
                        onMarkAsRead(notification.id);
                      }
                    }}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                          colorClass
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-1">
                              {notification.title}
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-blue-600 mt-1" />
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                          
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMarkAsRead(notification.id);
                                }}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                <span className="text-xs">Mark read</span>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(notification.id);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                // Clear all notifications
                notifications.forEach((n) => onDelete(n.id));
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear all
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
