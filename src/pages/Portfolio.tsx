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
      <header className="relative z-10 h-14 flex items-center justify-between border-b px-4 bg-background/80 backdrop-blur-xl sticky top-0">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Creator Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={copyPublicUrl}>
            {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copied' : 'Share Link'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => window.open(`/u/${user?.id}`, '_blank')}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
        </div>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Hero Card */}
          <Card className="overflow-hidden">
            <div className="relative p-6 md:p-10">
              <div className="flex flex-col md:flex-row items-center md:items-center gap-8 text-center md:text-left">
                <div className="relative group">
                  <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-tr from-primary via-purple-500 to-pink-500">
                    <Avatar className="w-full h-full border-4 border-background shadow-2xl">
                      <AvatarFallback className="text-5xl bg-background text-foreground font-black">
                        {(portfolio?.display_name || user?.name)?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="space-y-1">
                    <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tight">
                      {portfolio?.display_name || user?.name}
                    </h1>
                    {portfolio?.title ? (
                      <p className="text-xl md:text-2xl text-primary font-bold flex items-center justify-center md:justify-start gap-2">
                        <Sparkles className="w-5 h-5" />
                        {portfolio.title}
                      </p>
                    ) : (
                      <p className="text-muted-foreground text-lg">Set your professional title</p>
                    )}
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    {portfolio?.location && (
                      <Badge variant="outline" className="px-4 py-1.5 rounded-full">
                        <MapPin className="w-3.5 h-3.5 mr-2 text-primary" />
                        {portfolio.location}
                      </Badge>
                    )}
                    <Badge variant={portfolio?.is_public ? "default" : "secondary"} className="px-4 py-1.5 rounded-full">
                      {portfolio?.is_public ? <Globe className="w-3 h-3 mr-2" /> : <Eye className="w-3 h-3 mr-2" />}
                      {portfolio?.is_public ? 'Active Portfolio' : 'Private Mode'}
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setIsEditing(true)} className="rounded-full px-6">
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </Card>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* About */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Award className="w-5 h-5 text-primary" />
                    </div>
                    The Narrative
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {portfolio?.bio ? (
                    <p className="text-muted-foreground text-lg leading-relaxed whitespace-pre-wrap">{portfolio.bio}</p>
                  ) : (
                    <div className="p-8 text-center border border-dashed rounded-xl">
                      <p className="text-muted-foreground">Your professional story goes here.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Experience */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-6">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10">
                      <Briefcase className="w-5 h-5 text-emerald-500" />
                    </div>
                    Professional Journey
                  </CardTitle>
                  <AddExperienceDialog onAdd={addExperience} />
                </CardHeader>
                <CardContent className="space-y-6">
                  {portfolio?.experience && portfolio.experience.length > 0 ? (
                    portfolio.experience.map((exp) => (
                      <div key={exp.id} className="relative group p-4 rounded-xl hover:bg-muted/50 transition-all">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div className="space-y-2">
                            <h4 className="text-xl font-bold text-foreground flex items-center gap-2">
                              {exp.role}
                              {exp.is_current && <Badge className="text-[10px] uppercase px-2 py-0">Active</Badge>}
                            </h4>
                            <p className="text-muted-foreground font-semibold">{exp.company}</p>
                            {exp.description && <p className="text-muted-foreground mt-2 text-sm">{exp.description}</p>}
                          </div>
                          <div className="flex flex-col md:items-end gap-3 shrink-0">
                            <Badge variant="outline" className="px-3 py-1 text-xs">
                              <Calendar className="w-3 h-3 mr-2" />
                              {exp.period}
                            </Badge>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive" onClick={() => deleteExperience(exp.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center border border-dashed rounded-2xl">
                      <Briefcase className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">Record your career milestones.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Projects */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-6">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-orange-500/10">
                      <Star className="w-5 h-5 text-orange-500" />
                    </div>
                    Flagship Projects
                  </CardTitle>
                  <AddProjectDialog onAdd={addProject} />
                </CardHeader>
                <CardContent className="space-y-4">
                  {portfolio?.projects && portfolio.projects.length > 0 ? (
                    portfolio.projects.map((project) => (
                      <div key={project.id} className="group relative overflow-hidden rounded-2xl border hover:border-primary/50 transition-all p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-3">
                              <h4 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors uppercase tracking-tight">{project.title}</h4>
                              {project.featured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                            </div>
                            <p className="text-muted-foreground text-sm leading-normal">{project.description}</p>
                            <div className="flex flex-wrap gap-2">
                              {project.technologies.map(t => (
                                <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                              ))}
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => deleteProject(project.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 border border-dashed rounded-2xl">
                      <p className="text-muted-foreground">Add projects to showcase your work.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-1 space-y-6">
              {/* Skills */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest">
                    <Code2 className="w-4 h-4 text-purple-500" /> Skills & Expertise
                  </CardTitle>
                  <AddSkillDialog onAdd={addSkill} />
                </CardHeader>
                <CardContent className="space-y-6">
                  {portfolio?.skills && portfolio.skills.length > 0 ? (
                    portfolio.skills.map((skillGroup) => (
                      <div key={skillGroup.id} className="space-y-2.5 group p-2 rounded-lg hover:bg-muted/50 transition-all">
                        <div className="flex items-center justify-between">
                          <h5 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{skillGroup.category}</h5>
                          <button onClick={() => deleteSkill(skillGroup.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity p-1">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {skillGroup.skills.map(s => (
                            <Badge key={s} variant="secondary" className="text-[10px] px-2 py-0.5">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center border border-dashed rounded-xl">
                      <p className="text-muted-foreground text-xs">No expertise areas defined yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Education */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest">
                    <GraduationCap className="w-4 h-4 text-primary" /> Academic Path
                  </CardTitle>
                  <AddEducationDialog onAdd={addEducation} />
                </CardHeader>
                <CardContent className="space-y-4">
                  {portfolio?.education && portfolio.education.length > 0 ? (
                    portfolio.education.map(edu => (
                      <div key={edu.id} className="relative group p-3 rounded-xl hover:bg-muted/50 transition-all">
                        <div className="flex justify-between gap-2">
                          <div className="space-y-1">
                            <h5 className="text-foreground font-bold text-sm leading-tight">{edu.degree}</h5>
                            <p className="text-muted-foreground text-xs font-medium">{edu.institution}</p>
                            <p className="text-muted-foreground text-[10px] mt-1">{edu.period}</p>
                          </div>
                          <button onClick={() => deleteEducation(edu.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-xs text-center py-4">No records listed.</p>
                  )}
                </CardContent>
              </Card>

              {/* Certifications */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest">
                    <BadgeCheck className="w-4 h-4 text-cyan-500" /> Verifications
                  </CardTitle>
                  <AddCertificationDialog onAdd={addCertification} />
                </CardHeader>
                <CardContent className="space-y-3">
                  {portfolio?.certifications && portfolio.certifications.length > 0 ? (
                    portfolio.certifications.map(cert => (
                      <div key={cert.id} className="group p-3 rounded-xl border hover:border-primary/50 transition-all flex justify-between items-center">
                        <div className="space-y-0.5">
                          <h5 className="text-foreground font-bold text-xs">{cert.name}</h5>
                          <p className="text-muted-foreground text-[10px] uppercase font-medium">{cert.issuer}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {cert.credential_url && <a href={cert.credential_url} target="_blank" className="text-muted-foreground hover:text-foreground transition-colors"><ExternalLink className="w-3.5 h-3.5" /></a>}
                          <button onClick={() => deleteCertification(cert.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-xs text-center py-4">Awaiting valid certifications.</p>
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
