import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Crown, Sparkles, Check } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { Badge } from '@/components/ui/badge';

interface UpgradeDialogProps {
    children?: React.ReactNode;
}

export const UpgradeDialog = ({ children }: UpgradeDialogProps) => {
    const [open, setOpen] = useState(false);
    const [code, setCode] = useState('');
    const { redeemCode, isRedeeming, isPro } = useSubscription();

    const handleRedeem = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await redeemCode(code);
            setCode('');
            setOpen(false);
        } catch (error) {
            // Error handled by useSubscription hook
        }
    };

    if (isPro) {
        return null; // Don't show upgrade dialog for Pro users
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" size="sm">
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade to Pro
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Crown className="w-5 h-5 text-yellow-500" />
                        Upgrade to Pro
                    </DialogTitle>
                    <DialogDescription>
                        Unlock unlimited projects and premium features
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Pro Features */}
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-5 h-5 text-yellow-600" />
                            <h3 className="font-semibold">Pro Features</h3>
                        </div>
                        <ul className="space-y-2">
                            <li className="flex items-start gap-2 text-sm">
                                <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                                <span>Unlimited project creation</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm">
                                <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                                <span>Priority support</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm">
                                <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                                <span>Advanced collaboration tools</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm">
                                <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                                <span>Exclusive beta features</span>
                            </li>
                        </ul>
                    </div>

                    {/* Promo Code Input */}
                    <form onSubmit={handleRedeem} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="promo-code">Enter Promo Code</Label>
                            <Input
                                id="promo-code"
                                placeholder="e.g., BALLI200"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                className="font-mono"
                                disabled={isRedeeming}
                            />
                            <p className="text-xs text-muted-foreground">
                                Have a promo code? Enter it above to unlock Pro features.
                            </p>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={isRedeeming}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={!code || isRedeeming}>
                                {isRedeeming ? 'Redeeming...' : 'Redeem Code'}
                            </Button>
                        </DialogFooter>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
};
