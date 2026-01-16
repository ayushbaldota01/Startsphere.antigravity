import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface UserLimits {
    tier: 'FREE' | 'PRO';
    max_projects: number;
    current_projects: number;
    can_create: boolean;
}

export const useSubscription = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch user limits
    const { data: limits, isLoading } = useQuery({
        queryKey: ['user-limits', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_user_limits');

            if (error) throw error;
            return data as UserLimits;
        },
        enabled: !!user?.id,
        staleTime: 60 * 1000, // 1 minute
    });

    // Redeem promo code mutation
    const redeemCodeMutation = useMutation({
        mutationFn: async (code: string) => {
            const { data, error } = await supabase.rpc('redeem_promo_code', {
                code_text: code,
            });

            if (error) throw error;
            return data as { success: boolean; message: string };
        },
        onSuccess: (data) => {
            if (data.success) {
                // Invalidate limits and user profile
                queryClient.invalidateQueries({ queryKey: ['user-limits'] });
                queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });

                toast({
                    title: 'Success!',
                    description: data.message,
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: data.message,
                });
            }
        },
        onError: (error: Error) => {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to redeem code',
            });
        },
    });

    return {
        limits: limits || {
            tier: 'FREE',
            max_projects: 3,
            current_projects: 0,
            can_create: false,
        },
        isLoading,
        isPro: limits?.tier === 'PRO',
        canCreateProject: limits?.can_create ?? true,
        redeemCode: redeemCodeMutation.mutateAsync,
        isRedeeming: redeemCodeMutation.isPending,
    };
};
