import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
  ExternalLink, Award, Linkedin, Github, MapPin, Briefcase, GraduationCap,
  Code2, Star, Sparkles, TrendingUp, Globe, BadgeCheck, Plus, Pencil,
  Trash2, Save, Loader2, Copy, Check, Eye, X, Zap, Rocket, Calendar, Target
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

  // Profile state
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

  const gradients = [
    'from-blue-500 via-purple-500 to-pink-500',
    'from-green-500 via-teal-500 to-cyan-500',
    'from-orange-500 via-red-500 to-pink-500',
    'from-cyan-500 via-blue-500 to-purple-500',
    'from-violet-500 via-fuchsia-500 to-pink-500',
  ];

  if (isLoading) {
    return (
      <div className="flex h-screen bg-slate-950">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 flex items-center border-b border-slate-800 px-4 bg-slate-950/50 backdrop-blur-xl">
            <SidebarTrigger />
            <Skeleton className="ml-4 h-6 w-32 bg-slate-800" />
          </header>
          <main className="flex-1 overflow-y-auto p-6 space-y-8">
            <Skeleton className="h-64 w-full rounded-3xl bg-slate-800" />
            <Skeleton className="h-48 w-full rounded-2xl bg-slate-800" />
          </main>
        </div>
      </div>
    );
  }

  if (!hasPortfolio) {
    return (
      <div className="flex h-screen bg-slate-950">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 flex items-center border-b border-slate-800 px-4 bg-slate-950/50 backdrop-blur-xl">
            <SidebarTrigger />
            <h1 className="ml-4 font-bold text-white">My Portfolio</h1>
          </header>
          <main className="flex-1 flex items-center justify-center p-6">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
            </div>
            <Card className="relative max-w-lg text-center p-12 bg-slate-900/50 border-slate-800 backdrop-blur-xl shadow-2xl">
              <div className="space-y-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mx-auto ring-1 ring-blue-500/30">
                  <Rocket className="w-12 h-12 text-blue-400" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-4xl font-black text-white">Launch Your Brand</h2>
                  <p className="text-slate-400 text-lg">Create a professional showcase of your journey and impact.</p>
                </div>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
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
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="relative z-10 h-14 flex items-center justify-between border-b border-slate-800 px-4 bg-slate-950/80 backdrop-blur-xl sticky top-0">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              Creator Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={copyPublicUrl} className="text-slate-400 hover:text-white hover:bg-slate-800">
              {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copied' : 'Share Link'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => window.open(`/u/${user?.id}`, '_blank')} className="text-slate-400 hover:text-white hover:bg-slate-800">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          </div>
        </header>

        <main className="relative z-10 flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Hero Card - Optimized Alignment */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
              <div className="relative p-6 md:p-10">
                <div className="flex flex-col md:flex-row items-center md:items-center gap-8 text-center md:text-left">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-all duration-500" />
                    <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500">
                      <Avatar className="w-full h-full border-4 border-slate-900 shadow-2xl">
                        <AvatarFallback className="text-5xl bg-slate-900 text-white font-black">
                          {(portfolio?.display_name || user?.name)?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="space-y-1">
                      <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
                        {portfolio?.display_name || user?.name}
                      </h1>
                      {portfolio?.title ? (
                        <p className="text-xl md:text-2xl text-blue-400 font-bold flex items-center justify-center md:justify-start gap-2">
                          <Sparkles className="w-5 h-5" />
                          {portfolio.title}
                        </p>
                      ) : (
                        <p className="text-slate-500 text-lg">Set your professional title</p>
                      )}
                    </div>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                      {portfolio?.location && (
                        <Badge variant="outline" className="bg-slate-950/50 border-slate-800 text-slate-400 px-4 py-1.5 rounded-full">
                          <MapPin className="w-3.5 h-3.5 mr-2 text-blue-400" />
                          {portfolio.location}
                        </Badge>
                      )}
                      <Badge className={portfolio?.is_public ? "bg-green-500/10 text-green-400 border-green-500/20 px-4 py-1.5 rounded-full" : "bg-slate-800 text-slate-400 border-slate-700 px-4 py-1.5 rounded-full"}>
                        {portfolio?.is_public ? <Globe className="w-3 h-3 mr-2" /> : <Eye className="w-3 h-3 mr-2" />}
                        {portfolio?.is_public ? 'Active Portfolio' : 'Private Mode'}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setIsEditing(true)} className="border-slate-700 hover:bg-slate-800 text-slate-300 rounded-full px-6">
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </div>
            </div>

            {/* Content Sections Grid - Tighter Alignment */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Main Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* About Section */}
                <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl shadow-xl hover:border-slate-700 transition-all overflow-hidden rounded-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3 text-white text-xl font-bold">
                      <div className="p-2 rounded-xl bg-blue-500/10">
                        <Award className="w-5 h-5 text-blue-400" />
                      </div>
                      The Narrative
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {portfolio?.bio ? (
                      <p className="text-slate-300 text-lg leading-relaxed whitespace-pre-wrap">{portfolio.bio}</p>
                    ) : (
                      <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl">
                        <p className="text-slate-500">Your professional story goes here. Highlight your unique path.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Experience Section */}
                <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl shadow-xl rounded-2xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-6">
                    <CardTitle className="flex items-center gap-3 text-white text-xl font-bold">
                      <div className="p-2 rounded-xl bg-emerald-500/10">
                        <Briefcase className="w-5 h-5 text-emerald-400" />
                      </div>
                      Professional Journey
                    </CardTitle>
                    <AddExperienceDialog onAdd={addExperience} />
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {portfolio?.experience && portfolio.experience.length > 0 ? (
                      portfolio.experience.map((exp, index) => (
                        <div key={exp.id} className="relative group p-4 rounded-xl hover:bg-slate-800/30 transition-all border border-transparent hover:border-slate-700/50">
                          <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="space-y-2">
                              <h4 className="text-xl font-bold text-white flex items-center gap-2">
                                {exp.role}
                                {exp.is_current && <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] uppercase px-2 py-0">Active</Badge>}
                              </h4>
                              <p className="text-slate-400 font-semibold">{exp.company}</p>
                              {exp.description && <p className="text-slate-400 mt-2 text-sm">{exp.description}</p>}
                            </div>
                            <div className="flex flex-col md:items-end gap-3 shrink-0">
                              <Badge variant="outline" className="border-slate-800 bg-slate-950/50 text-slate-400 px-3 py-1 text-xs">
                                <Calendar className="w-3 h-3 mr-2" />
                                {exp.period}
                              </Badge>
                              <Button
                                variant="ghost" size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-400"
                                onClick={() => deleteExperience(exp.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-12 text-center bg-slate-800/20 rounded-2xl border border-dashed border-slate-800">
                        <Briefcase className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                        <p className="text-slate-500">Record your career milestones.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Projects Section */}
                <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl shadow-xl rounded-2xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-6">
                    <CardTitle className="flex items-center gap-3 text-white text-xl font-bold">
                      <div className="p-2 rounded-xl bg-orange-500/10">
                        <Star className="w-5 h-5 text-orange-400" />
                      </div>
                      Flagship Projects
                    </CardTitle>
                    <AddProjectDialog onAdd={addProject} />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {portfolio?.projects && portfolio.projects.length > 0 ? (
                      portfolio.projects.map((project, index) => (
                        <div key={project.id} className="group relative overflow-hidden rounded-2xl bg-slate-950/40 border border-slate-800 hover:border-slate-700 transition-all p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-3 flex-1">
                              <div className="flex items-center gap-3">
                                <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{project.title}</h4>
                                {project.featured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                              </div>
                              <p className="text-slate-400 text-sm leading-normal">{project.description}</p>
                              <div className="flex flex-wrap gap-2">
                                {project.technologies.map(t => (
                                  <Badge key={t} variant="secondary" className="bg-slate-900 text-blue-300 border-slate-800 text-[10px]">{t}</Badge>
                                ))}
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400" onClick={() => deleteProject(project.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 bg-slate-800/10 rounded-2xl border border-dashed border-slate-800">
                        <p className="text-slate-500">Add projects from your dashboard to showcase results.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Sidebar Style Details */}
              <div className="lg:col-span-1 space-y-6">
                {/* Generalized Skills Component */}
                <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl shadow-xl rounded-2xl overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-sm text-slate-300 font-bold flex items-center gap-2 uppercase tracking-widest">
                      <Code2 className="w-4 h-4 text-purple-400" /> Skills & Expertise
                    </CardTitle>
                    <AddSkillDialog onAdd={addSkill} />
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {portfolio?.skills && portfolio.skills.length > 0 ? (
                      portfolio.skills.map((skillGroup, index) => (
                        <div key={skillGroup.id} className="space-y-2.5 group p-2 rounded-lg hover:bg-slate-800/30 transition-all">
                          <div className="flex items-center justify-between">
                            <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{skillGroup.category}</h5>
                            <button onClick={() => deleteSkill(skillGroup.id)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-500 transition-opacity p-1">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {skillGroup.skills.map(s => (
                              <Badge key={s} className="bg-slate-800/60 hover:bg-slate-700 text-slate-300 border-slate-700/50 text-[10px] px-2 py-0.5">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center border border-dashed border-slate-800 rounded-xl">
                        <p className="text-slate-600 text-xs">No expertise areas defined yet.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Education Component */}
                <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl shadow-xl rounded-2xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-sm text-slate-300 font-bold flex items-center gap-2 uppercase tracking-widest">
                      <GraduationCap className="w-4 h-4 text-blue-400" /> Academic Path
                    </CardTitle>
                    <AddEducationDialog onAdd={addEducation} />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {portfolio?.education && portfolio.education.length > 0 ? (
                      portfolio.education.map(edu => (
                        <div key={edu.id} className="relative group p-3 rounded-xl hover:bg-slate-800/30 transition-all border border-transparent hover:border-slate-800">
                          <div className="flex justify-between gap-2">
                            <div className="space-y-1">
                              <h5 className="text-white font-bold text-sm leading-tight">{edu.degree}</h5>
                              <p className="text-slate-400 text-xs font-medium">{edu.institution}</p>
                              <p className="text-slate-600 text-[10px] mt-1">{edu.period}</p>
                            </div>
                            <button onClick={() => deleteEducation(edu.id)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-500 transition-opacity">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-600 text-xs text-center py-4">No records listed.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Certifications Component */}
                <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl shadow-xl rounded-2xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-sm text-slate-300 font-bold flex items-center gap-2 uppercase tracking-widest">
                      <BadgeCheck className="w-4 h-4 text-cyan-400" /> Verifications
                    </CardTitle>
                    <AddCertificationDialog onAdd={addCertification} />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {portfolio?.certifications && portfolio.certifications.length > 0 ? (
                      portfolio.certifications.map(cert => (
                        <div key={cert.id} className="group p-3 rounded-xl bg-slate-950/40 border border-slate-800 hover:border-cyan-500/30 transition-all flex justify-between items-center">
                          <div className="space-y-0.5">
                            <h5 className="text-white font-bold text-xs">{cert.name}</h5>
                            <p className="text-slate-500 text-[10px] uppercase font-medium">{cert.issuer}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {cert.credential_url && <a href={cert.credential_url} target="_blank" className="text-slate-500 hover:text-white transition-colors"><ExternalLink className="w-3.5 h-3.5" /></a>}
                            <button onClick={() => deleteCertification(cert.id)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-500 transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-600 text-xs text-center py-4">Awaiting valid certifications.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>


        {/* Global Dialogs */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="sm:max-w-2xl bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Core Identity</DialogTitle>
              <DialogDescription className="text-slate-400">Define how the world sees your digital representative.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="space-y-2">
                <Label className="text-slate-400 uppercase text-[10px] tracking-widest">Public Alias</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-slate-950 border-slate-800 focus:border-blue-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 uppercase text-[10px] tracking-widest">Global Rank / Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Full-Stack Dev / Architect" className="bg-slate-950 border-slate-800 focus:border-blue-500" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-400 uppercase text-[10px] tracking-widest">Primary Origin / Location</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} className="bg-slate-950 border-slate-800 focus:border-blue-500" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-400 uppercase text-[10px] tracking-widest">Manifesto / Bio</Label>
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="bg-slate-950 border-slate-800 focus:border-blue-500" />
              </div>
              <div className="space-y-2"><Label className="text-slate-400 text-[10px]">GitHub</Label><Input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} className="bg-slate-950 border-slate-800" /></div>
              <div className="space-y-2"><Label className="text-slate-400 text-[10px]">LinkedIn</Label><Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className="bg-slate-950 border-slate-800" /></div>
              <div className="space-y-2"><Label className="text-slate-400 text-[10px]">Website</Label><Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="bg-slate-950 border-slate-800" /></div>
              <div className="flex items-center justify-between border border-slate-800 p-4 rounded-xl bg-slate-950/50">
                <div className="space-y-1">
                  <Label className="text-white text-xs">Public Access</Label>
                  <p className="text-[10px] text-slate-500 uppercase">Indexing in global results</p>
                </div>
                <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white">Cancel</Button>
              <Button onClick={handleSaveProfile} disabled={isUpdatingPortfolio} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isUpdatingPortfolio ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Sync Profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

// --- Sub-components (Restoring all the Add Dialogs) ---

function AddSkillDialog({ onAdd }: { onAdd: (category: string, skills: string[]) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async () => {
    if (!category.trim() || !skillsInput.trim()) return;
    setIsSubmitting(true);
    try {
      const skillsArray = skillsInput.split(',').map((s) => s.trim()).filter(Boolean);
      await onAdd(category.trim(), skillsArray);
      setOpen(false); setCategory(''); setSkillsInput('');
    } finally { setIsSubmitting(false); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"><Plus className="w-4 h-4" /></Button></DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-800 text-white">
        <DialogHeader><DialogTitle>Categorize Stack</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2"><Label className="text-slate-400 text-xs uppercase">Cluster Name (e.g. Frontend)</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} className="bg-slate-950 border-slate-800" /></div>
          <div className="space-y-2"><Label className="text-slate-400 text-xs uppercase">Entities (comma-separated)</Label><Input value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} className="bg-slate-950 border-slate-800" /></div>
        </div>
        <DialogFooter><Button onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">Commit Entities</Button></DialogFooter>
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
      <DialogTrigger asChild><Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6">Record Benchmark</Button></DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-xl">
        <DialogHeader><DialogTitle className="text-2xl font-black uppercase tracking-tighter">Experience Entry</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2"><Label className="text-slate-400 text-xs">ROLE</Label><Input value={role} onChange={(e) => setRole(e.target.value)} className="bg-slate-950 border-slate-800" /></div>
          <div className="space-y-2"><Label className="text-slate-400 text-xs">ENTITY / COMPANY</Label><Input value={company} onChange={(e) => setCompany(e.target.value)} className="bg-slate-950 border-slate-800" /></div>
          <div className="space-y-2 col-span-2"><Label className="text-slate-400 text-xs">TEMPORAL RANGE (e.g. Jan 2022 - Present)</Label><Input value={period} onChange={(e) => setPeriod(e.target.value)} className="bg-slate-950 border-slate-800" /></div>
          <div className="space-y-2 col-span-2"><Label className="text-slate-400 text-xs">DETAILS & IMPACT</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="bg-slate-950 border-slate-800" /></div>
          <div className="flex items-center gap-3 col-span-2"><Switch checked={isCurrent} onCheckedChange={setIsCurrent} /><Label>Active Engagement</Label></div>
        </div>
        <DialogFooter><Button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700">Sync Entry</Button></DialogFooter>
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
      <DialogTrigger asChild><Button variant="ghost" size="icon" className="text-slate-400"><Plus className="w-4 h-4" /></Button></DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-800 text-white">
        <DialogHeader><DialogTitle>Academic Milestone</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <Input placeholder="CREDENTIAL / DEGREE" value={degree} onChange={(e) => setDegree(e.target.value)} className="bg-slate-950 border-slate-800" />
          <Input placeholder="INSTITUTION" value={institution} onChange={(e) => setInstitution(e.target.value)} className="bg-slate-950 border-slate-800" />
          <Input placeholder="PERIOD" value={period} onChange={(e) => setPeriod(e.target.value)} className="bg-slate-950 border-slate-800" />
        </div>
        <DialogFooter><Button onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600">Sync Record</Button></DialogFooter>
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
      <DialogTrigger asChild><Button variant="ghost" size="icon" className="text-slate-400"><Plus className="w-4 h-4" /></Button></DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-800 text-white">
        <DialogHeader><DialogTitle>Validation Entry</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <Input placeholder="CERTIFICATION NAME" value={name} onChange={(e) => setName(e.target.value)} className="bg-slate-950 border-slate-800" />
          <Input placeholder="ISSUING ENTITY" value={issuer} onChange={(e) => setIssuer(e.target.value)} className="bg-slate-950 border-slate-800" />
        </div>
        <DialogFooter><Button onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600 uppercase text-xs font-black">Verify Record</Button></DialogFooter>
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
      <DialogTrigger asChild><Button className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 px-4 font-bold uppercase text-[10px] tracking-widest">Manual Influx</Button></DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-800 text-white">
        <DialogHeader><DialogTitle>Manual Deployment</DialogTitle><DialogDescription>Add a non-system project to your showcase.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-4">
          <Input placeholder="MANIFEST NAME" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-slate-950 border-slate-800" />
          <Textarea placeholder="IMPACT DESCRIPTION" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="bg-slate-950 border-slate-800" />
        </div>
        <DialogFooter><Button onClick={handleSubmit} disabled={isSubmitting} className="bg-orange-600 hover:bg-orange-700">Deploy record</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default Portfolio;
