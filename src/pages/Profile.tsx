import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { User, Mail, MapPin, GraduationCap, Briefcase, Edit3, Save, X } from 'lucide-react';

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    university: '',
    major: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        university: user.university || '',
        major: user.major || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          bio: formData.bio,
          university: formData.university,
          major: formData.major,
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshUser();

      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-14 flex items-center border-b px-4 gap-2 bg-gradient-to-r from-background to-muted/20">
          <SidebarTrigger />
          <h2 className="text-lg font-semibold">Profile</h2>
          <div className="flex-1" />
          {isEditing ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  if (user) {
                    setFormData({
                      name: user.name || '',
                      email: user.email || '',
                      bio: user.bio || '',
                      university: user.university || '',
                      major: user.major || '',
                    });
                  }
                }}
                disabled={isSaving}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => setIsEditing(true)}>
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </header>

        <main className="flex-1 p-6 bg-gradient-to-br from-background via-background to-muted/10 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Profile Header Card */}
            <Card className="border-2 bg-gradient-to-br from-card to-muted/20 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-start gap-6">
                  <Avatar className="w-24 h-24 border-4 border-primary/20 shadow-xl">
                    <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                        {user?.name || 'User Name'}
                      </h1>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={user?.role === 'student' ? 'default' : 'secondary'} className="text-sm">
                          {user?.role === 'student' ? '🎓 Student' : '👨‍🏫 Mentor'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {user?.email}
                      </span>
                      {user?.university && (
                        <span className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {user.university}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="settings" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-12">
                <TabsTrigger value="settings" className="text-base">
                  <User className="w-4 h-4 mr-2" />
                  Settings
                </TabsTrigger>
                <TabsTrigger value="portfolio" onClick={() => navigate('/profile/portfolio')} className="text-base">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Portfolio
                </TabsTrigger>
              </TabsList>

              <TabsContent value="settings" className="space-y-6 mt-6">
                <Card className="border-2 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/20">
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Personal Information
                    </CardTitle>
                    <CardDescription>Manage your account details and preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-semibold">Full Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          disabled={!isEditing}
                          className={isEditing ? 'border-primary/50' : ''}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          disabled
                          className="bg-muted/50"
                        />
                        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-sm font-semibold">Bio</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        disabled={!isEditing}
                        rows={4}
                        placeholder="Tell us about yourself..."
                        className={isEditing ? 'border-primary/50' : ''}
                      />
                    </div>

                    {user?.role === 'student' && (
                      <div className="grid gap-6 md:grid-cols-2 pt-4 border-t">
                        <div className="space-y-2">
                          <Label htmlFor="university" className="text-sm font-semibold flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" />
                            University
                          </Label>
                          <Input
                            id="university"
                            value={formData.university}
                            onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                            disabled={!isEditing}
                            placeholder="Your university name"
                            className={isEditing ? 'border-primary/50' : ''}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="major" className="text-sm font-semibold">Major / Field of Study</Label>
                          <Input
                            id="major"
                            value={formData.major}
                            onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                            disabled={!isEditing}
                            placeholder="e.g., Computer Science"
                            className={isEditing ? 'border-primary/50' : ''}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </>
  );
};

export default Profile;
