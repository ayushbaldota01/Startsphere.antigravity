import { useState, useEffect } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useToast } from '@/hooks/use-toast';
import {
  ExternalLink, Award, MapPin, Briefcase, GraduationCap,
  Code2, Star, Sparkles, Globe, BadgeCheck, Plus, Pencil,
  Trash2, Save, Loader2, Copy, Check, Eye, X, Zap, Rocket, Calendar
} from 'lucide-react';

const Portfolio = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    portfolio, isLoading, hasPortfolio, createOrUpdatePortfolio, isUpdatingPortfolio,
    addSkill, deleteSkill, addExperience, deleteExperience, addEducation, deleteEducation,
    addProject, deleteProject, addCertification, deleteCertification,
  } = usePortfolio();

  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (portfolio) {
      setDisplayName(portfolio.display_name || user?.name || '');
      setTitle(portfolio.title || '');
      setBio(portfolio.bio || '');
      setLocation(portfolio.location || '');
      setGithubUrl(portfolio.github_url || '');
      setLinkedinUrl(portfolio.linkedin_url || '');
      setWebsiteUrl(portfolio.website_url || '');
      setIsPublic(portfolio.is_public !== false);
    } else if (user) {
      setDisplayName(user.name || '');
    }
  }, [portfolio, user]);

  const copyPublicUrl = () => {
    const url = `${window.location.origin}/u/${user?.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied!', description: 'Portfolio URL copied to clipboard.' });
  };

  const handleSaveProfile = async () => {
    try {
      await createOrUpdatePortfolio({
        display_name: displayName.trim() || user?.name || 'My Portfolio',
        title: title.trim() || undefined,
        bio: bio.trim() || undefined,
        location: location.trim() || undefined,
        github_url: githubUrl.trim() || undefined,
        linkedin_url: linkedinUrl.trim() || undefined,
        website_url: websiteUrl.trim() || undefined,
        is_public: isPublic,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        <header className="h-14 flex items-center border-b px-4 bg-background/80 backdrop-blur-xl">
          <SidebarTrigger />
          <Skeleton className="ml-4 h-6 w-32" />
        </header>
        <main className="flex-1 overflow-y-auto p-6 space-y-8">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </main>
      </div>
    );
  }

  if (!hasPortfolio) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        <header className="h-14 flex items-center border-b px-4 bg-background/80 backdrop-blur-xl">
          <SidebarTrigger />
          <h1 className="ml-4 font-bold text-foreground">My Portfolio</h1>
        </header>
        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-lg text-center p-12 backdrop-blur-xl shadow-2xl">
            <div className="space-y-6">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto ring-1 ring-primary/30">
                <Rocket className="w-12 h-12 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-foreground">Launch Your Brand</h2>
                <p className="text-muted-foreground text-lg">Create a professional showcase of your journey.</p>
              </div>
              <Button
                size="lg"
                onClick={() => createOrUpdatePortfolio({ display_name: user?.name || 'My Portfolio' })}
                disabled={isUpdatingPortfolio}
              >
                {isUpdatingPortfolio ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Zap className="mr-2 h-5 w-5" />}
                Create Portfolio
              </Button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <header className="relative z-50 h-14 flex items-center justify-between border-b px-4 bg-background/80 backdrop-blur-xl sticky top-0">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <div className="p-1 rounded-lg bg-primary/10">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            Portfolio Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyPublicUrl} className="rounded-full bg-background/50 backdrop-blur-sm border-primary/20 hover:border-primary/50">
            {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copied' : 'Share Link'}
          </Button>
          <Button variant="default" size="sm" onClick={() => window.open(`/u/${user?.id}`, '_blank')} className="rounded-full shadow-lg shadow-primary/20">
            <Eye className="w-4 h-4 mr-2" />
            Live Preview
          </Button>
        </div>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto p-4 md:p-8 bg-gradient-to-br from-background via-background to-muted/20">
        {/* Animated Background Element */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto space-y-8">
          {/* Hero Card */}
          <Card className="overflow-hidden border-primary/10 bg-card/50 backdrop-blur-2xl shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500 opacity-50" />
            <div className="relative p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center gap-10">
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all" />
                  <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full p-1.5 bg-gradient-to-tr from-primary via-purple-500 to-pink-500 ring-4 ring-background/50">
                    <Avatar className="w-full h-full border-4 border-background shadow-2xl">
                      <AvatarFallback className="text-5xl bg-gradient-to-br from-card to-muted text-foreground font-black">
                        {(portfolio?.display_name || user?.name)?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <div className="flex-1 space-y-4 text-center md:text-left">
                  <div className="space-y-2">
                    <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tight leading-none bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      {portfolio?.display_name || user?.name}
                    </h1>
                    {portfolio?.title ? (
                      <p className="text-2xl md:text-3xl text-primary font-bold flex items-center justify-center md:justify-start gap-3">
                        <Rocket className="w-6 h-6" />
                        {portfolio.title}
                      </p>
                    ) : (
                      <p className="text-muted-foreground text-xl font-medium">Set your professional title</p>
                    )}
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    {portfolio?.location && (
                      <Badge variant="outline" className="px-5 py-2 rounded-full border-primary/20 bg-primary/5 backdrop-blur-sm text-foreground/80 font-medium">
                        <MapPin className="w-4 h-4 mr-2 text-primary" />
                        {portfolio.location}
                      </Badge>
                    )}
                    <Badge variant={portfolio?.is_public ? "default" : "secondary"} className="px-5 py-2 rounded-full shadow-lg shadow-primary/10">
                      {portfolio?.is_public ? <Globe className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                      {portfolio?.is_public ? 'Portfolio Live' : 'Private Draft'}
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setIsEditing(true)} className="rounded-2xl px-8 h-12 border-primary/20 bg-background/50 hover:bg-primary hover:text-white transition-all">
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Layout
                </Button>
              </div>
            </div>
          </Card>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* About */}
              <Card className="border-primary/10 bg-card/40 backdrop-blur-xl shadow-xl hover:border-primary/30 transition-all duration-300">
                <CardHeader className="pb-4 border-b border-primary/5">
                  <CardTitle className="flex items-center gap-4 text-2xl">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                      <Award className="w-6 h-6" />
                    </div>
                    The Narrative
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {portfolio?.bio ? (
                    <p className="text-muted-foreground text-xl leading-relaxed whitespace-pre-wrap font-medium">{portfolio.bio}</p>
                  ) : (
                    <div className="p-12 text-center border-2 border-dashed border-primary/10 rounded-3xl bg-primary/5">
                      <p className="text-muted-foreground font-medium">Your professional story goes here. Tell the world who you are.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Experience */}
              <Card className="border-primary/10 bg-card/40 backdrop-blur-xl shadow-xl hover:border-primary/30 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-primary/5">
                  <CardTitle className="flex items-center gap-4 text-2xl">
                    <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    Professional Journey
                  </CardTitle>
                  <AddExperienceDialog onAdd={addExperience} />
                </CardHeader>
                <CardContent className="pt-8 space-y-8">
                  {portfolio?.experience && portfolio.experience.length > 0 ? (
                    portfolio.experience.map((exp, idx) => (
                      <div key={exp.id} className="relative group p-6 rounded-3xl border border-transparent hover:border-primary/10 hover:bg-primary/5 transition-all duration-300">
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                          <div className="space-y-3">
                            <h4 className="text-2xl font-black text-foreground flex items-center gap-3">
                              {exp.role}
                              {exp.is_current && <Badge className="bg-emerald-500 text-white border-0 text-[10px] px-3 py-1 uppercase tracking-tighter shadow-lg shadow-emerald-500/20">Current</Badge>}
                            </h4>
                            <p className="text-primary font-bold text-lg">{exp.company}</p>
                            {exp.description && <p className="text-muted-foreground/80 mt-3 text-base leading-relaxed max-w-2xl">{exp.description}</p>}
                          </div>
                          <div className="flex flex-col md:items-end gap-4 shrink-0">
                            <Badge variant="outline" className="px-4 py-2 text-sm border-primary/20 bg-background/50 rounded-xl font-bold">
                              <Calendar className="w-4 h-4 mr-2 text-primary" />
                              {exp.period}
                            </Badge>
                            <Button variant="ghost" size="icon" className="h-10 w-10 md:opacity-0 group-hover:opacity-100 transition-all rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => deleteExperience(exp.id)}>
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>
                        {idx !== portfolio.experience.length - 1 && <div className="mt-8 border-b border-primary/5 w-full" />}
                      </div>
                    ))
                  ) : (
                    <div className="p-16 text-center border-2 border-dashed border-primary/10 rounded-3xl bg-primary/5">
                      <Briefcase className="w-12 h-12 text-primary/30 mx-auto mb-4" />
                      <p className="text-muted-foreground font-medium">Record your professional milestones to showcase your expertise.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Projects */}
              <Card className="border-primary/10 bg-card/40 backdrop-blur-xl shadow-xl hover:border-primary/30 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-primary/5">
                  <CardTitle className="flex items-center gap-4 text-2xl">
                    <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500">
                      <Star className="w-6 h-6" />
                    </div>
                    Flagship Projects
                  </CardTitle>
                  <AddProjectDialog onAdd={addProject} />
                </CardHeader>
                <CardContent className="pt-8 grid grid-cols-1 md:grid-cols-1 gap-6">
                  {portfolio?.projects && portfolio.projects.length > 0 ? (
                    portfolio.projects.map((project) => (
                      <div key={project.id} className="group relative overflow-hidden rounded-3xl border border-primary/5 bg-background/30 hover:bg-background/60 hover:border-primary/30 transition-all duration-500 p-8 shadow-sm hover:shadow-2xl">
                        <div className="absolute top-0 right-0 p-4">
                          <Button variant="ghost" size="icon" className="h-10 w-10 opacity-0 group-hover:opacity-100 transition-all rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => deleteProject(project.id)}>
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                        <div className="space-y-5">
                          <div className="flex items-center gap-4">
                            <h4 className="text-3xl font-black text-foreground group-hover:text-primary transition-colors tracking-tight uppercase">{project.title}</h4>
                            {project.featured && <Star className="w-6 h-6 text-yellow-500 fill-yellow-500 animate-pulse" />}
                          </div>
                          <p className="text-muted-foreground text-lg leading-relaxed max-w-3xl font-medium">{project.description}</p>
                          <div className="flex flex-wrap gap-2.5">
                            {project.technologies.map(t => (
                              <Badge key={t} variant="secondary" className="text-xs px-4 py-1.5 rounded-full border-primary/10 bg-primary/10 text-primary font-bold">{t}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 border-2 border-dashed border-primary/10 rounded-3xl bg-primary/5">
                      <p className="text-muted-foreground font-medium">Bring your projects to life. Add your best work here.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-1 space-y-8">
              {/* Skills */}
              <Card className="border-primary/10 bg-card/40 backdrop-blur-xl shadow-xl hover:border-primary/30 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-primary/5">
                  <CardTitle className="text-sm font-black flex items-center gap-3 uppercase tracking-[0.2em] text-primary">
                    <Code2 className="w-5 h-5 text-purple-500" /> Skills & Expertise
                  </CardTitle>
                  <AddSkillDialog onAdd={addSkill} />
                </CardHeader>
                <CardContent className="pt-6 space-y-8">
                  {portfolio?.skills && portfolio.skills.length > 0 ? (
                    portfolio.skills.map((skillGroup) => (
                      <div key={skillGroup.id} className="space-y-4 group p-4 rounded-3xl border border-transparent hover:border-primary/5 hover:bg-primary/5 transition-all">
                        <div className="flex items-center justify-between">
                          <h5 className="text-[11px] font-black text-foreground/60 uppercase tracking-[0.25em]">{skillGroup.category}</h5>
                          <button onClick={() => deleteSkill(skillGroup.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-2 rounded-xl hover:bg-destructive/10">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                          {skillGroup.skills.map(s => (
                            <Badge key={s} variant="secondary" className="text-[11px] px-4 py-2 rounded-xl border-primary/5 bg-background shadow-sm hover:shadow-md transition-all font-bold">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center border-2 border-dashed border-primary/10 rounded-2xl bg-primary/5">
                      <p className="text-muted-foreground text-sm font-medium">Define your technical arsenal.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Education */}
              <Card className="border-primary/10 bg-card/40 backdrop-blur-xl shadow-xl hover:border-primary/30 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-primary/5">
                  <CardTitle className="text-sm font-black flex items-center gap-3 uppercase tracking-[0.2em] text-primary">
                    <GraduationCap className="w-5 h-5 text-primary" /> Academic Path
                  </CardTitle>
                  <AddEducationDialog onAdd={addEducation} />
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {portfolio?.education && portfolio.education.length > 0 ? (
                    portfolio.education.map(edu => (
                      <div key={edu.id} className="relative group p-5 rounded-3xl border border-transparent hover:border-primary/5 hover:bg-primary/5 transition-all">
                        <div className="flex justify-between gap-4">
                          <div className="space-y-2">
                            <h5 className="text-foreground font-black text-lg tracking-tight leading-tight">{edu.degree}</h5>
                            <p className="text-primary font-bold text-sm tracking-wide">{edu.institution}</p>
                            <Badge variant="outline" className="text-[10px] mt-2 border-primary/10 font-bold px-3 py-0.5 rounded-full">{edu.period}</Badge>
                          </div>
                          <button onClick={() => deleteEducation(edu.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all h-10 w-10 flex items-center justify-center rounded-xl hover:bg-destructive/10 shrink-0">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-10 font-medium">Documentation of academic excellence.</p>
                  )}
                </CardContent>
              </Card>

              {/* Certifications */}
              <Card className="border-primary/10 bg-card/40 backdrop-blur-xl shadow-xl hover:border-primary/30 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-primary/5">
                  <CardTitle className="text-sm font-black flex items-center gap-3 uppercase tracking-[0.2em] text-primary">
                    <BadgeCheck className="w-5 h-5 text-cyan-500" /> Verifications
                  </CardTitle>
                  <AddCertificationDialog onAdd={addCertification} />
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {portfolio?.certifications && portfolio.certifications.length > 0 ? (
                    portfolio.certifications.map(cert => (
                      <div key={cert.id} className="group p-5 rounded-3xl border border-primary/5 bg-background shadow-sm hover:border-primary/30 hover:shadow-lg transition-all flex justify-between items-center">
                        <div className="space-y-1">
                          <h5 className="text-foreground font-black text-sm tracking-tight">{cert.name}</h5>
                          <p className="text-primary text-[11px] uppercase font-black tracking-widest">{cert.issuer}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {cert.credential_url && <a href={cert.credential_url} target="_blank" className="text-muted-foreground hover:text-primary transition-all p-2 rounded-xl hover:bg-primary/10"><ExternalLink className="w-4 h-4" /></a>}
                          <button onClick={() => deleteCertification(cert.id)} className="md:opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-2 rounded-xl hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-10 font-medium">Awaiting valid certifications.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Edit Profile</DialogTitle>
            <DialogDescription>Update your portfolio information.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Full-Stack Developer" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
            </div>
            <div className="space-y-2"><Label>GitHub</Label><Input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} /></div>
            <div className="space-y-2"><Label>LinkedIn</Label><Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} /></div>
            <div className="space-y-2"><Label>Website</Label><Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} /></div>
            <div className="flex items-center justify-between border p-4 rounded-xl">
              <div className="space-y-1">
                <Label>Public Portfolio</Label>
                <p className="text-xs text-muted-foreground">Allow others to view your portfolio</p>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSaveProfile} disabled={isUpdatingPortfolio}>
              {isUpdatingPortfolio ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Sub-components
function AddSkillDialog({ onAdd }: { onAdd: (category: string, skills: string[]) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async () => {
    if (!category.trim() || !skillsInput.trim()) return;
    setIsSubmitting(true);
    try {
      await onAdd(category.trim(), skillsInput.split(',').map(s => s.trim()).filter(Boolean));
      setOpen(false); setCategory(''); setSkillsInput('');
    } finally { setIsSubmitting(false); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Plus className="w-4 h-4" /></Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Skills</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2"><Label>Category (e.g. Frontend)</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} /></div>
          <div className="space-y-2"><Label>Skills (comma-separated)</Label><Input value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} /></div>
        </div>
        <DialogFooter><Button onClick={handleSubmit} disabled={isSubmitting}>Add Skills</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddExperienceDialog({ onAdd }: { onAdd: (data: any) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [period, setPeriod] = useState('');
  const [description, setDescription] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async () => {
    if (!role.trim() || !company.trim()) return;
    setIsSubmitting(true);
    try {
      await onAdd({ role: role.trim(), company: company.trim(), period: period.trim(), description: description.trim(), is_current: isCurrent });
      setOpen(false); setRole(''); setCompany(''); setPeriod(''); setDescription(''); setIsCurrent(false);
    } finally { setIsSubmitting(false); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>Record Benchmark</Button></DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Add Experience</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2"><Label>Role</Label><Input value={role} onChange={(e) => setRole(e.target.value)} /></div>
          <div className="space-y-2"><Label>Company</Label><Input value={company} onChange={(e) => setCompany(e.target.value)} /></div>
          <div className="space-y-2 col-span-2"><Label>Period (e.g. Jan 2022 - Present)</Label><Input value={period} onChange={(e) => setPeriod(e.target.value)} /></div>
          <div className="space-y-2 col-span-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
          <div className="flex items-center gap-3 col-span-2"><Switch checked={isCurrent} onCheckedChange={setIsCurrent} /><Label>Current Position</Label></div>
        </div>
        <DialogFooter><Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">Add Experience</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddEducationDialog({ onAdd }: { onAdd: (data: any) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [degree, setDegree] = useState('');
  const [institution, setInstitution] = useState('');
  const [period, setPeriod] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async () => {
    if (!degree.trim() || !institution.trim()) return;
    setIsSubmitting(true);
    try { await onAdd({ degree, institution, period }); setOpen(false); setDegree(''); setInstitution(''); setPeriod(''); } finally { setIsSubmitting(false); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="ghost" size="icon"><Plus className="w-4 h-4" /></Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Education</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <Input placeholder="Degree" value={degree} onChange={(e) => setDegree(e.target.value)} />
          <Input placeholder="Institution" value={institution} onChange={(e) => setInstitution(e.target.value)} />
          <Input placeholder="Period" value={period} onChange={(e) => setPeriod(e.target.value)} />
        </div>
        <DialogFooter><Button onClick={handleSubmit} disabled={isSubmitting}>Add Education</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddCertificationDialog({ onAdd }: { onAdd: (data: any) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async () => {
    if (!name.trim() || !issuer.trim()) return;
    setIsSubmitting(true);
    try { await onAdd({ name, issuer }); setOpen(false); setName(''); setIssuer(''); } finally { setIsSubmitting(false); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="ghost" size="icon"><Plus className="w-4 h-4" /></Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Certification</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <Input placeholder="Certification Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Issuing Organization" value={issuer} onChange={(e) => setIssuer(e.target.value)} />
        </div>
        <DialogFooter><Button onClick={handleSubmit} disabled={isSubmitting}>Add Certification</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddProjectDialog({ onAdd }: { onAdd: (data: any) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;
    setIsSubmitting(true);
    try { await onAdd({ title, description, technologies: [] }); setOpen(false); setTitle(''); setDescription(''); } finally { setIsSubmitting(false); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline">Add Project</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Project</DialogTitle><DialogDescription>Add a project to your showcase.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-4">
          <Input placeholder="Project Name" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        </div>
        <DialogFooter><Button onClick={handleSubmit} disabled={isSubmitting}>Add Project</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default Portfolio;
