import { ConferenceRoom } from './ConferenceRoom';
import { MentorMessageComposer } from './MentorMessageComposer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap } from 'lucide-react';

interface ConferenceRoomWithMentorProps {
  projectId: string;
  mentors: Array<{
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    role: string;
  }>;
}

export const ConferenceRoomWithMentor = ({ projectId, mentors }: ConferenceRoomWithMentorProps) => {
  return (
    <div className="space-y-4">
      {/* Mentor Messaging Section */}
      {mentors.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                <div>
                  <h4 className="font-semibold text-sm">Need Mentor Guidance?</h4>
                  <p className="text-xs text-muted-foreground">
                    Send a direct message to your project mentor
                  </p>
                </div>
              </div>
              <MentorMessageComposer projectId={projectId} mentors={mentors} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regular Team Chat */}
      <ConferenceRoom projectId={projectId} />

      {/* Debug/Info Section */}
      {mentors.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h4 className="font-semibold mb-1">No Mentor Assigned Yet</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Request a mentor to get guidance on your project
            </p>
            <Button variant="outline" size="sm" disabled>
              <GraduationCap className="w-4 h-4 mr-2" />
              Mentor Messaging Available After Assignment
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

