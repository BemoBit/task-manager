'use client';

import { DashboardLayout } from '@/components/layout';
import { NotificationCenter } from '@/components/dashboard';
import { useDashboardStore } from '@/store/dashboardStore';
import { Button } from '@/components/ui/button';
import { CheckCheck } from 'lucide-react';

export default function NotificationsPage() {
  const { notifications, unreadNotificationCount, markAllNotificationsAsRead } = useDashboardStore();

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground mt-1">
              {unreadNotificationCount > 0 
                ? `You have ${unreadNotificationCount} unread notification${unreadNotificationCount > 1 ? 's' : ''}`
                : 'All caught up!'}
            </p>
          </div>
          {unreadNotificationCount > 0 && (
            <Button variant="outline" onClick={markAllNotificationsAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All as Read
            </Button>
          )}
        </div>

        {/* Notifications */}
        <div className="max-w-4xl">
          <NotificationCenter
            notifications={notifications}
            unreadCount={unreadNotificationCount}
            onMarkAsRead={(id) => console.log('Mark as read:', id)}
            onMarkAllAsRead={markAllNotificationsAsRead}
            onDelete={(id) => console.log('Delete:', id)}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
