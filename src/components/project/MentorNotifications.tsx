import { useState } from 'react';
import { useMentorMessages, useMessageThread } from '@/hooks/useMentorMessages';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Bell, MessageSquare, Send, ChevronRight, AlertCircle, FileText, Clock, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface MentorNotificationsProps {
  projectId: string;
}

export const MentorNotifications = ({ projectId }: MentorNotificationsProps) => {
  const { user } = useAuth();
  const { messages, unreadCount, isLoading, sendMessage, replyToMessage, markAsRead } =
    useMentorMessages(projectId);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const { data: threadMessages = [] } = useMessageThread(selectedMessage || undefined);

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'query':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'reminder':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'note':
        return <FileText className="w-4 h-4 text-green-500" />;
      case 'discussion':
        return <MessageCircle className="w-4 h-4 text-purple-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-500" />;
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

  const handleOpenMessage = async (messageId: string, isRead: boolean) => {
    setSelectedMessage(messageId);
    if (!isRead) {
      await markAsRead([messageId]);
    }
  };

  const handleReply = async () => {
    if (!selectedMessage || !replyContent.trim()) return;

    setIsReplying(true);
    try {
      await replyToMessage(selectedMessage, replyContent);
      setReplyContent('');
    } finally {
      setIsReplying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Mentor Communications
              </CardTitle>
              <CardDescription>
                Messages and queries from project members
              </CardDescription>
            </div>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-6">
                {unreadCount} New
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Messages List */}
      {messages.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No messages yet. Students can send you queries and updates here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    !message.is_read ? 'border-l-4 border-l-primary bg-primary/5' : ''
                  }`}
                  onClick={() => handleOpenMessage(message.id, message.is_read)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarImage src={message.sender.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(message.sender.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{message.sender.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {message.sender.role}
                          </Badge>
                          {getMessageIcon(message.message_type)}
                          <Badge variant="secondary" className="text-xs capitalize">
                            {message.message_type}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {message.content}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}</span>
                          {(message.reply_count || 0) > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              {message.reply_count} {message.reply_count === 1 ? 'reply' : 'replies'}
                            </span>
                          )}
                          {!message.is_read && (
                            <Badge variant="default" className="h-4 px-1.5 text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                      </div>

                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Message Thread Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Conversation Thread</DialogTitle>
            <DialogDescription>View and respond to this message</DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4">
              {/* Original Message */}
              {messages
                .filter((m) => m.id === selectedMessage)
                .map((message) => (
                  <Card key={message.id} className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarImage src={message.sender.avatar_url} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(message.sender.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium">{message.sender.name}</p>
                            <Badge variant="outline" className="text-xs">
                              {message.sender.role}
                            </Badge>
                            <Badge variant="secondary" className="text-xs capitalize">
                              {message.message_type}
                            </Badge>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

              {/* Replies */}
              {threadMessages.length > 0 && (
                <div className="space-y-3 pl-6 border-l-2 border-muted">
                  {threadMessages.map((reply: any) => (
                    <Card key={reply.id}>
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={reply.sender.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {getInitials(reply.sender.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium">{reply.sender.name}</p>
                              <Badge variant="outline" className="text-xs">
                                {reply.sender.role}
                              </Badge>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Reply Input */}
              <div className="space-y-2 pt-4 border-t">
                <Textarea
                  placeholder="Type your response..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={3}
                  disabled={isReplying}
                />
                <div className="flex justify-end">
                  <Button onClick={handleReply} disabled={isReplying || !replyContent.trim()}>
                    <Send className="w-4 h-4 mr-2" />
                    {isReplying ? 'Sending...' : 'Send Reply'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

