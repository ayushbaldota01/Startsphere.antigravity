import { useState, useEffect, useMemo } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { User, Mail, MapPin, GraduationCap, Edit3, Save, X, AlertCircle, CheckCircle2 } from 'lucide-react';

const Profile = () => {
  const { user, refreshUser, isProfileLoading } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    university: '',
    major: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if profile is complete
  const isProfileComplete = useMemo(() => {
    if (!user) return false;

    const hasName = !!user.name?.trim();
    const hasEmail = !!user.email?.trim();
    const hasBio = !!user.bio?.trim();

    if (user.role === 'student') {
      const hasUniversity = !!user.university?.trim();
      const hasMajor = !!user.major?.trim();
      return hasName && hasEmail && hasBio && hasUniversity && hasMajor;
    }

    return hasName && hasEmail && hasBio;
  }, [user]);

  // Get missing fields
  const missingFields = useMemo(() => {
    if (!user) return [];

    const missing: string[] = [];
    if (!user.name?.trim()) missing.push('Full Name');
    if (!user.email?.trim()) missing.push('Email');
    if (!user.bio?.trim()) missing.push('Bio');

    if (user.role === 'student') {
      if (!user.university?.trim()) missing.push('University');
      if (!user.major?.trim()) missing.push('Major/Field of Study');
    }

    return missing;
  }, [user]);

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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.bio?.trim()) {
      newErrors.bio = 'Bio is required';
    } else if (formData.bio.trim().length < 10) {
      newErrors.bio = 'Bio must be at least 10 characters';
    }

    if (user?.role === 'student') {
      if (!formData.university?.trim()) {
        newErrors.university = 'University is required';
      }
      if (!formData.major?.trim()) {
        newErrors.major = 'Major/Field of Study is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate form
    if (!validateForm()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all required fields correctly.',
      });
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name.trim(),
          bio: formData.bio.trim(),
          university: formData.university?.trim() || null,
          major: formData.major?.trim() || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshUser();

      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
      });
      setIsEditing(false);
    } catch (error: any) {
      logger.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update profile. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <header className="h-14 flex items-center border-b px-4 gap-2 bg-gradient-to-r from-background to-muted/20">
        <SidebarTrigger />
        <h2 className="text-lg font-semibold">Profile</h2>
        <div className="flex-1" />
        <ThemeToggle />
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
          {/* Profile Completion Alert */}
          {!isProfileLoading && user && !isProfileComplete && (
            <Alert variant="destructive" className="border-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Complete Your Profile</AlertTitle>
              <AlertDescription>
                Please fill in all required fields to complete your profile. Missing fields: {missingFields.join(', ')}
                {!isEditing && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-4 mt-2"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 className="w-3 h-3 mr-2" />
                    Edit Now
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Profile Complete Success */}
          {!isProfileLoading && user && isProfileComplete && !isEditing && (
            <Alert className="border-2 border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-700 dark:text-green-400">Profile Complete</AlertTitle>
              <AlertDescription className="text-green-600 dark:text-green-300">
                Your profile is complete! All required information has been filled.
              </AlertDescription>
            </Alert>
          )}

          {/* Profile Header Card */}
          {isProfileLoading ? (
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              </CardContent>
            </Card>
          ) : user ? (
            <Card className="border-2 bg-gradient-to-br from-card to-muted/20 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-start gap-6">
                  <Avatar className="w-24 h-24 border-4 border-primary/20 shadow-xl">
                    <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                        {user.name || 'User Name'}
                      </h1>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={user.role === 'student' ? 'default' : 'secondary'} className="text-sm">
                          {user.role === 'student' ? '🎓 Student' : '👨‍🏫 Mentor'}
                        </Badge>
                        {isProfileComplete && (
                          <Badge variant="outline" className="text-sm border-green-500 text-green-700 dark:text-green-400">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Complete
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {user.email}
                      </span>
                      {user.university && (
                        <span className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {user.university}
                        </span>
                      )}
                      {user.major && (
                        <span className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4" />
                          {user.major}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Profile Settings */}
          {user && (
            <div className="space-y-6">
              <Card className="border-2 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/20">
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>Manage your account details and preferences. Fields marked with * are required.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-semibold">
                        Full Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          if (errors.name) setErrors({ ...errors, name: '' });
                        }}
                        disabled={!isEditing}
                        className={isEditing ? (errors.name ? 'border-destructive' : 'border-primary/50') : ''}
                        placeholder="Enter your full name"
                      />
                      {errors.name && (
                        <p className="text-xs text-destructive">{errors.name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold">
                        Email <span className="text-destructive">*</span>
                      </Label>
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
                    <Label htmlFor="bio" className="text-sm font-semibold">
                      Bio <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => {
                        setFormData({ ...formData, bio: e.target.value });
                        if (errors.bio) setErrors({ ...errors, bio: '' });
                      }}
                      disabled={!isEditing}
                      rows={4}
                      placeholder="Tell us about yourself (minimum 10 characters)..."
                      className={isEditing ? (errors.bio ? 'border-destructive' : 'border-primary/50') : ''}
                    />
                    {errors.bio && (
                      <p className="text-xs text-destructive">{errors.bio}</p>
                    )}
                    {isEditing && !errors.bio && (
                      <p className="text-xs text-muted-foreground">
                        {formData.bio.length}/10 minimum characters
                      </p>
                    )}
                  </div>

                  {user.role === 'student' && (
                    <div className="grid gap-6 md:grid-cols-2 pt-4 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="university" className="text-sm font-semibold flex items-center gap-2">
                          <GraduationCap className="w-4 h-4" />
                          University <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="university"
                          value={formData.university}
                          onChange={(e) => {
                            setFormData({ ...formData, university: e.target.value });
                            if (errors.university) setErrors({ ...errors, university: '' });
                          }}
                          disabled={!isEditing}
                          placeholder="Your university name"
                          className={isEditing ? (errors.university ? 'border-destructive' : 'border-primary/50') : ''}
                        />
                        {errors.university && (
                          <p className="text-xs text-destructive">{errors.university}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="major" className="text-sm font-semibold">
                          Major / Field of Study <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="major"
                          value={formData.major}
                          onChange={(e) => {
                            setFormData({ ...formData, major: e.target.value });
                            if (errors.major) setErrors({ ...errors, major: '' });
                          }}
                          disabled={!isEditing}
                          placeholder="e.g., Computer Science"
                          className={isEditing ? (errors.major ? 'border-destructive' : 'border-primary/50') : ''}
                        />
                        {errors.major && (
                          <p className="text-xs text-destructive">{errors.major}</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
