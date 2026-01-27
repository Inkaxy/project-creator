import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { Clock, User, AlertCircle } from 'lucide-react';
import { useConversationActions, useUpdateActionStatus } from '@/hooks/useConversationActions';
import type { ActionStatus, ActionPriority } from '@/types/conversations';

interface ActionItemsListProps {
  conversationId: string;
  canManage: boolean;
}

const priorityColors: Record<ActionPriority, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-yellow-500/10 text-yellow-600',
  high: 'bg-red-500/10 text-red-600',
};

const priorityLabels: Record<ActionPriority, string> = {
  low: 'Lav',
  medium: 'Medium',
  high: 'Høy',
};

export function ActionItemsList({ conversationId, canManage }: ActionItemsListProps) {
  const { data: actions, isLoading } = useConversationActions(conversationId);
  const updateStatus = useUpdateActionStatus();

  const handleToggleStatus = async (id: string, currentStatus: ActionStatus) => {
    const newStatus: ActionStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    await updateStatus.mutateAsync({ id, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!actions || actions.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Ingen handlingspunkter ennå
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {actions.map(action => {
        const isOverdue = action.due_date && new Date(action.due_date) < new Date() && action.status !== 'completed';
        
        return (
          <div
            key={action.id}
            className={`rounded-lg border p-3 transition-opacity ${
              action.status === 'completed' ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={action.status === 'completed'}
                onCheckedChange={() => handleToggleStatus(action.id, action.status)}
                disabled={!canManage && action.responsible_id !== action.id}
              />
              <div className="flex-1 space-y-1">
                <p className={`text-sm font-medium ${action.status === 'completed' ? 'line-through' : ''}`}>
                  {action.title}
                </p>
                {action.description && (
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={priorityColors[action.priority as ActionPriority]}>
                    {priorityLabels[action.priority as ActionPriority]}
                  </Badge>
                  {action.responsible && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      {action.responsible.full_name}
                    </span>
                  )}
                  {action.due_date && (
                    <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {isOverdue && <AlertCircle className="h-3 w-3" />}
                      <Clock className="h-3 w-3" />
                      {format(new Date(action.due_date), 'dd.MM.yyyy', { locale: nb })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
