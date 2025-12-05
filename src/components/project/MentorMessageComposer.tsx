import { useState } from 'react';
import { useMentorMessages } from '@/hooks/useMentorMessages';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GraduationCap, Send, AlertCircle, Clock, FileText, MessageCircle } from 'lucide-react';

interface MentorMessageComposerProps {
  projectId: string;
  mentors: Array<{
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    role: string;
  }>;
}

export const MentorMessageComposer = ({ projectId, mentors }: MentorMessageComposerProps) => {
  const { user } = useAuth();
  const { sendMessage, sendMessageMutation } = useMentorMessages(projectId);
  const [open, setOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<string>('');
  const [messageType, setMessageType] = useState<'query' | 'reminder' | 'note' | 'discussion'>('query');
  const [content, setContent] = useState('');

  const handleSend = async () => {
    if (!content.trim() || !selectedMentor) return;

    console.log('[MentorMessageComposer] Sending message:', {
      projectId,
      selectedMentor,
      mentorEmail: mentors.find(m => m.id === selectedMentor)?.email,
      messageType,
      contentLength: content.length,
    });

    try {
      await sendMessage(content, {
        messageType,
        recipientId: selectedMentor,
      });
      setContent('');
      setSelectedMentor('');
      setOpen(false);
    } catch (error: any) {
      console.error('[MentorMessageComposer] Send failed:', error);
      // Error is handled by the hook
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'query':
        return <AlertCircle className="w-4 h-4" />;
      case 'reminder':
        return <Clock className="w-4 h-4" />;
      case 'note':
        return <FileText className="w-4 h-4" />;
      case 'discussion':
        return <MessageCircle className="w-4 h-4" />;
      default:
        return null;
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

  if (mentors.length === 0) {
    return null; // Don't show button if no mentors
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <GraduationCap className="w-4 h-4" />
          Message Mentor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Send Message to Mentor
          </DialogTitle>
          <DialogDescription>
            Send a query, reminder, or note to your project mentor for guidance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Select Mentor */}
          <div className="space-y-2">
            <Label htmlFor="mentor">Select Mentor *</Label>
            <Select value={selectedMentor} onValueChange={setSelectedMentor}>
              <SelectTrigger id="mentor">
                <SelectValue placeholder="Choose a mentor..." />
              </SelectTrigger>
              <SelectContent>
                {mentors.map((mentor) => (
                  <SelectItem key={mentor.id} value={mentor.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={mentor.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {getInitials(mentor.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{mentor.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {mentor.role}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message Type */}
          <div className="space-y-2">
            <Label htmlFor="message-type">Message Type *</Label>
            <Select value={messageType} onValueChange={(v: any) => setMessageType(v)}>
              <SelectTrigger id="message-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="query">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    <span>Query / Question</span>
                  </div>
                </SelectItem>
                <SelectItem value="reminder">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span>Reminder</span>
                  </div>
                </SelectItem>
                <SelectItem value="note">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-500" />
                    <span>Note / Update</span>
                  </div>
                </SelectItem>
                <SelectItem value="discussion">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-purple-500" />
                    <span>Discussion</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Message Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Message *</Label>
            <Textarea
              id="content"
              placeholder="Type your message here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              disabled={sendMessageMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">
              Your mentor will be notified and can respond to your message.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={sendMessageMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={sendMessageMutation.isPending || !content.trim() || !selectedMentor}
          >
            <Send className="w-4 h-4 mr-2" />
            {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

