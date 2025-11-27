import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Activity, FileText, Lock, Unlock, GitCommit, Upload } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ThePulseProps {
    projectId: string;
}

interface ActivityLog {
    id: string;
    action_type: string;
    entity_type: string;
    details: any;
    created_at: string;
    user: {
        name: string;
        email: string;
    };
}

export const ThePulse = ({ projectId }: ThePulseProps) => {
    const [activities, setActivities] = useState<ActivityLog[]>([]);

    useEffect(() => {
        fetchActivities();

        // Subscribe to realtime changes
        const subscription = supabase
            .channel(`activity:${projectId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'activity_logs',
                filter: `project_id=eq.${projectId}`
            }, (payload) => {
                // Fetch the full activity with user details
                fetchNewActivity(payload.new.id);
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [projectId]);

    const fetchActivities = async () => {
        const { data, error } = await supabase
            .from('activity_logs')
            .select(`
        *,
        user:users(name, email)
      `)
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (data) setActivities(data);
    };

    const fetchNewActivity = async (id: string) => {
        const { data } = await supabase
            .from('activity_logs')
            .select(`
        *,
        user:users(name, email)
      `)
            .eq('id', id)
            .single();

        if (data) {
            setActivities(prev => [data, ...prev]);
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'FILE_UPLOAD': return <Upload className="h-4 w-4 text-blue-500" />;
            case 'FILE_LOCK': return <Lock className="h-4 w-4 text-amber-500" />;
            case 'FILE_UNLOCK': return <Unlock className="h-4 w-4 text-green-500" />;
            case 'CODE_PUSH': return <GitCommit className="h-4 w-4 text-purple-500" />;
            default: return <Activity className="h-4 w-4 text-gray-500" />;
        }
    };

    const getActivityMessage = (activity: ActivityLog) => {
        const { user, action_type, details } = activity;
        const name = user?.name || 'Unknown User';

        switch (action_type) {
            case 'FILE_UPLOAD':
                return (
                    <span>
                        <span className="font-semibold">{name}</span> uploaded{' '}
                        <span className="font-medium text-foreground">{details.file_name}</span>
                        {details.version > 1 && <span className="text-muted-foreground"> (v{details.version})</span>}
                    </span>
                );
            case 'FILE_LOCK':
                return (
                    <span>
                        <span className="font-semibold">{name}</span> locked{' '}
                        <span className="font-medium text-foreground">{details.file_name}</span>
                    </span>
                );
            case 'FILE_UNLOCK':
                return (
                    <span>
                        <span className="font-semibold">{name}</span> unlocked{' '}
                        <span className="font-medium text-foreground">{details.file_name}</span>
                    </span>
                );
            case 'CODE_PUSH':
                return (
                    <span>
                        <span className="font-semibold">{name}</span> pushed updates to{' '}
                        <span className="font-medium text-foreground">{details.file_path}</span>
                    </span>
                );
            default:
                return <span>{name} performed an action</span>;
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b">
                <h3 className="font-semibold flex items-center">
                    <Activity className="h-4 w-4 mr-2 text-primary" />
                    The Pulse
                </h3>
                <p className="text-xs text-muted-foreground">Real-time workspace activity</p>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                    {activities.length === 0 ? (
                        <p className="text-sm text-center text-muted-foreground py-4">
                            No recent activity
                        </p>
                    ) : (
                        activities.map((activity) => (
                            <div key={activity.id} className="flex gap-3 relative">
                                {/* Timeline line */}
                                <div className="absolute left-[11px] top-8 bottom-[-24px] w-px bg-border last:hidden" />

                                <div className="mt-1 relative z-10 bg-background rounded-full p-1 border">
                                    {getActivityIcon(activity.action_type)}
                                </div>

                                <div className="flex-1 space-y-1 pb-2">
                                    <div className="text-sm leading-none">
                                        {getActivityMessage(activity)}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};
