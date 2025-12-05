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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useProjectMentorRequests } from '@/hooks/useMentorRequests';
import { GraduationCap, Loader2, Mail, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface RequestMentorDialogProps {
  projectId: string;
}

export const RequestMentorDialog = ({ projectId }: RequestMentorDialogProps) => {
  const [open, setOpen] = useState(false);
  const [mentorEmail, setMentorEmail] = useState('');
  const [message, setMessage] = useState('');
  const { requests, createRequest, cancelRequest, createRequestMutation, cancelRequestMutation } =
    useProjectMentorRequests(projectId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentorEmail.trim()) return;

    try {
      await createRequest(mentorEmail.trim(), message.trim() || undefined);
      setMentorEmail('');
      setMessage('');
      // Keep dialog open to show the updated requests
    } catch (error) {
      // Error is handled by the hook's toast
    }
  };

  const handleCancel = async (requestId: string) => {
    try {
      await cancelRequest(requestId);
    } catch (error) {
      // Error is handled by the hook's toast
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-orange-500/10 text-orange-500';
      case 'ACCEPTED':
        return 'bg-green-500/10 text-green-500';
      case 'REJECTED':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-muted';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <GraduationCap className="w-4 h-4" />
          Request Mentor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Request Mentor Guidance
          </DialogTitle>
          <DialogDescription>
            Send a request to a professor or mentor to guide your project. They'll receive a notification
            and can accept or decline.
          </DialogDescription>
        </DialogHeader>

        {/* Existing Requests */}
        {requests.length > 0 && (
          <div className="space-y-3 py-4 border-t">
            <h4 className="text-sm font-semibold">Current Requests</h4>
            <div className="space-y-2">
              {requests.map((request) => (
                <Card key={request.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={request.mentor?.avatar_url} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {request.mentor?.name ? getInitials(request.mentor.name) : 'M'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{request.mentor?.name}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{request.mentor?.email}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                        {request.status === 'PENDING' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleCancel(request.id)}
                            disabled={cancelRequestMutation.isPending}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* New Request Form */}
        <form onSubmit={handleSubmit} className="space-y-4 py-4 border-t">
          <div className="space-y-2">
            <Label htmlFor="mentor-email">Mentor Email *</Label>
            <Input
              id="mentor-email"
              type="email"
              placeholder="professor@university.edu"
              value={mentorEmail}
              onChange={(e) => setMentorEmail(e.target.value)}
              required
              disabled={createRequestMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">
              Enter the email address of the mentor you want to request guidance from.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Explain why you'd like their guidance on this project..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              disabled={createRequestMutation.isPending}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createRequestMutation.isPending}
            >
              Close
            </Button>
            <Button type="submit" disabled={createRequestMutation.isPending || !mentorEmail.trim()}>
              {createRequestMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Request
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

