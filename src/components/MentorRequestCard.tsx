import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Check, X, FolderOpen, Mail, MessageSquare } from 'lucide-react';
import { useMentorRequests, type MentorRequest } from '@/hooks/useMentorRequests';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface MentorRequestCardProps {
  request: MentorRequest;
}

export const MentorRequestCard = ({ request }: MentorRequestCardProps) => {
  const { acceptRequest, rejectRequest } = useMentorRequests();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await acceptRequest(request.id);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await rejectRequest(request.id);
    } finally {
      setIsRejecting(false);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <FolderOpen className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">{request.project?.name || 'Unknown Project'}</CardTitle>
                <Badge variant="secondary" className="bg-orange-500/10 text-orange-500">
                  Pending
                </Badge>
              </div>
              {request.project?.description && (
                <CardDescription className="line-clamp-2">
                  {request.project.description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Requester Info */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Avatar className="w-10 h-10">
              <AvatarImage src={request.requester?.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {request.requester?.name ? getInitials(request.requester.name) : 'ST'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{request.requester?.name || 'Unknown Student'}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Mail className="w-3 h-3" />
                <span className="truncate">{request.requester?.email}</span>
              </div>
            </div>
          </div>

          {/* Optional Message */}
          {request.message && (
            <div className="p-3 bg-muted/30 rounded-lg border border-muted">
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Message</p>
                  <p className="text-sm">{request.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Time */}
          <p className="text-xs text-muted-foreground">
            Requested {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
          </p>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleAccept}
              disabled={isAccepting || isRejecting}
              className="flex-1 gap-2"
              variant="default"
            >
              <Check className="w-4 h-4" />
              {isAccepting ? 'Accepting...' : 'Accept'}
            </Button>
            <Button
              onClick={handleReject}
              disabled={isAccepting || isRejecting}
              className="flex-1 gap-2"
              variant="outline"
            >
              <X className="w-4 h-4" />
              {isRejecting ? 'Rejecting...' : 'Reject'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

