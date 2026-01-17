import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { usePublicPortfolio } from '@/hooks/usePortfolio';
import {
    ExternalLink,
    Award,
    Linkedin,
    Github,
    MapPin,
    Briefcase,
    GraduationCap,
    Code2,
    Star,
    Sparkles,
    TrendingUp,
    Globe,
    BadgeCheck,
    ArrowLeft,
    Mail,
    Calendar,
    Zap,
    Target,
    Rocket
} from 'lucide-react';

const PublicPortfolio = () => {
    const { identifier } = useParams<{ identifier: string }>();
    const { portfolio, isLoading, error } = usePublicPortfolio(identifier || '');

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                {/* Animated background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                    <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>

                <div className="relative max-w-6xl mx-auto p-6 space-y-8">
                    <Skeleton className="h-64 w-full rounded-2xl" />
                    <Skeleton className="h-48 w-full rounded-2xl" />
                    <Skeleton className="h-96 w-full rounded-2xl" />
                </div>
            </div>
        );
    }

    if (error || !portfolio) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
                <Card className="max-w-md w-full text-center p-12 bg-slate-900/50 backdrop-blur-xl border-slate-800">
                    <div className="space-y-6">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center mx-auto">
                            <Briefcase className="w-10 h-10 text-red-400" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold text-white">Portfolio Not Found</h2>
                            <p className="text-slate-400 text-lg">
                                This portfolio doesn't exist or is set to private.
                            </p>
                        </div>
                        <Button asChild variant="outline" className="border-slate-700 hover:bg-slate-800">
                            <Link to="/">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Go Home
                            </Link>
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    const gradients = [
        'from-blue-500 via-purple-500 to-pink-500',
        'from-green-500 via-teal-500 to-cyan-500',
        'from-orange-500 via-red-500 to-pink-500',
        'from-cyan-500 via-blue-500 to-purple-500',
        'from-violet-500 via-fuchsia-500 to-pink-500',
    ];

    return (
        <div className="dark min-h-screen bg-slate-950 text-white selection:bg-primary/30">
            {/* Animated background blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
            </div>

            {/* Minimal Header */}
            <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
                            S
                        </div>
                        <span className="font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            StartSphere
                        </span>
                    </Link>
                    <Badge variant="secondary" className="gap-2 bg-slate-800/50 border-slate-700 text-slate-300">
                        <Globe className="w-3 h-3" />
                        Public Portfolio
                    </Badge>
                </div>
            </header>

            <main className="relative p-6 pb-20">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Hero Section with Glassmorphism */}
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-slate-700/50 shadow-2xl">
                        {/* Decorative gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>

                        <div className="relative p-8 md:p-12">
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                                {/* Avatar with glow effect */}
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                                    <Avatar className="relative w-32 h-32 border-4 border-slate-800 shadow-2xl">
                                        <AvatarFallback className="text-5xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white font-bold">
                                            {portfolio.display_name?.charAt(0).toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>

                                {/* Info */}
                                <div className="flex-1 space-y-4">
                                    <div className="space-y-2">
                                        <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent leading-tight">
                                            {portfolio.display_name}
                                        </h1>
                                        {portfolio.title && (
                                            <div className="flex items-center gap-2 text-xl text-slate-300">
                                                <Sparkles className="w-5 h-5 text-yellow-400" />
                                                <span className="font-medium">{portfolio.title}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 text-slate-400">
                                        {portfolio.location && (
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50">
                                                <MapPin className="w-4 h-4" />
                                                <span>{portfolio.location}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30">
                                            <Zap className="w-4 h-4" />
                                            <span className="font-medium">Available for opportunities</span>
                                        </div>
                                    </div>

                                    {/* Social Links */}
                                    <div className="flex flex-wrap gap-3 pt-2">
                                        {portfolio.github_url && (
                                            <Button variant="outline" size="sm" className="gap-2 bg-slate-800/40 border-slate-700 hover:bg-slate-700/60 text-white border-white/10" asChild>
                                                <a href={portfolio.github_url} target="_blank" rel="noopener noreferrer">
                                                    <Github className="w-4 h-4" />
                                                    GitHub
                                                </a>
                                            </Button>
                                        )}
                                        {portfolio.linkedin_url && (
                                            <Button variant="outline" size="sm" className="gap-2 bg-slate-800/40 border-slate-700 hover:bg-slate-700/60 text-white border-white/10" asChild>
                                                <a href={portfolio.linkedin_url} target="_blank" rel="noopener noreferrer">
                                                    <Linkedin className="w-4 h-4" />
                                                    LinkedIn
                                                </a>
                                            </Button>
                                        )}
                                        {portfolio.website_url && (
                                            <Button variant="outline" size="sm" className="gap-2 bg-slate-800/40 border-slate-700 hover:bg-slate-700/60 text-white border-white/10" asChild>
                                                <a href={portfolio.website_url} target="_blank" rel="noopener noreferrer">
                                                    <Globe className="w-4 h-4" />
                                                    Website
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* About Section */}
                    {portfolio.bio && (
                        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 group">
                            <CardHeader className="bg-gradient-to-r from-slate-800/50 to-slate-900/50">
                                <CardTitle className="flex items-center gap-3 text-2xl">
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                                        <Award className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">About Me</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <p className="text-slate-300 leading-relaxed text-lg whitespace-pre-wrap">
                                    {portfolio.bio}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Skills Section with animated cards */}
                    {portfolio.skills && portfolio.skills.length > 0 && (
                        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-slate-800/50 to-slate-900/50">
                                <CardTitle className="flex items-center gap-3 text-2xl">
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                                        <Code2 className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Skills & Expertise</span>
                                </CardTitle>
                                <CardDescription className="text-slate-400">Technical expertise and proficiencies</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                {portfolio.skills.map((skillGroup, index) => (
                                    <div key={skillGroup.id || index} className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-1 w-16 rounded-full bg-gradient-to-r ${gradients[index % gradients.length]}`} />
                                            <h4 className="font-bold text-xl text-white">{skillGroup.category}</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {skillGroup.skills.map((skill) => (
                                                <Badge
                                                    key={skill}
                                                    variant="secondary"
                                                    className="px-4 py-2 text-sm font-medium bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 hover:scale-105 transition-all cursor-default"
                                                >
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Experience Section with timeline */}
                    {portfolio.experience && portfolio.experience.length > 0 && (
                        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
                            <CardHeader className="bg-gradient-to-r from-slate-800/50 to-slate-900/50">
                                <CardTitle className="flex items-center gap-3 text-2xl">
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                                        <Briefcase className="w-6 h-6 text-green-400" />
                                    </div>
                                    <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Experience</span>
                                </CardTitle>
                                <CardDescription className="text-slate-400">Professional journey and achievements</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-8">
                                {portfolio.experience.map((exp, index) => (
                                    <div key={exp.id || index} className="relative pl-8 border-l-2 border-slate-700">
                                        {/* Timeline dot */}
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/50"></div>

                                        {index > 0 && <Separator className="my-8 bg-slate-800" />}
                                        <div className="space-y-4">
                                            <div className="flex items-start justify-between flex-wrap gap-4">
                                                <div className="space-y-2">
                                                    <h4 className="font-bold text-2xl text-white flex items-center gap-3">
                                                        {exp.role}
                                                        {exp.is_current && (
                                                            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                                                                <Rocket className="w-3 h-3 mr-1" />
                                                                Current
                                                            </Badge>
                                                        )}
                                                    </h4>
                                                    <p className="text-slate-300 font-medium text-lg">{exp.company}</p>
                                                </div>
                                                <Badge variant="outline" className="border-slate-700 text-slate-300 px-4 py-1.5">
                                                    <Calendar className="w-3 h-3 mr-2" />
                                                    {exp.period}
                                                </Badge>
                                            </div>
                                            {exp.description && (
                                                <p className="text-slate-400 leading-relaxed text-base">
                                                    {exp.description}
                                                </p>
                                            )}
                                            {exp.achievements && exp.achievements.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {exp.achievements.map((achievement) => (
                                                        <Badge key={achievement} className="gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30 text-blue-300">
                                                            <TrendingUp className="w-3 h-3" />
                                                            {achievement}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Education Section */}
                    {portfolio.education && portfolio.education.length > 0 && (
                        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
                            <CardHeader className="bg-gradient-to-r from-slate-800/50 to-slate-900/50">
                                <CardTitle className="flex items-center gap-3 text-2xl">
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                                        <GraduationCap className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Education</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                {portfolio.education.map((edu, index) => (
                                    <div key={edu.id || index} className="flex items-start justify-between flex-wrap gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                                        <div className="space-y-2">
                                            <h4 className="font-bold text-xl text-white">{edu.degree}</h4>
                                            <p className="text-slate-300 font-medium">{edu.institution}</p>
                                            {edu.description && (
                                                <p className="text-sm text-slate-400">{edu.description}</p>
                                            )}
                                        </div>
                                        <div className="text-right space-y-2">
                                            <Badge variant="outline" className="border-slate-700 text-slate-300">
                                                {edu.period}
                                            </Badge>
                                            {edu.gpa && (
                                                <p className="text-sm font-semibold text-blue-400">GPA: {edu.gpa}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Certifications Grid */}
                    {portfolio.certifications && portfolio.certifications.length > 0 && (
                        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
                            <CardHeader className="bg-gradient-to-r from-slate-800/50 to-slate-900/50">
                                <CardTitle className="flex items-center gap-3 text-2xl">
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                                        <BadgeCheck className="w-6 h-6 text-cyan-400" />
                                    </div>
                                    <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Certifications</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    {portfolio.certifications.map((cert, index) => (
                                        <div
                                            key={cert.id || index}
                                            className="p-5 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-cyan-500/50 transition-all group"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">{cert.name}</h4>
                                                    <p className="text-sm text-slate-400 mt-1">{cert.issuer}</p>
                                                    {cert.issue_date && (
                                                        <p className="text-xs text-slate-500 mt-2">{cert.issue_date}</p>
                                                    )}
                                                </div>
                                                {cert.credential_url && (
                                                    <Button variant="ghost" size="icon" className="hover:bg-slate-700" asChild>
                                                        <a href={cert.credential_url} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Projects Showcase */}
                    {portfolio.projects && portfolio.projects.length > 0 && (
                        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
                            <CardHeader className="bg-gradient-to-r from-slate-800/50 to-slate-900/50">
                                <CardTitle className="flex items-center gap-3 text-2xl">
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
                                        <Star className="w-6 h-6 text-yellow-400" />
                                    </div>
                                    <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Featured Projects</span>
                                </CardTitle>
                                <CardDescription className="text-slate-400">Showcase of work and contributions</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                {portfolio.projects.map((project, index) => (
                                    <div
                                        key={project.id || index}
                                        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 group"
                                    >
                                        {/* Gradient top bar */}
                                        <div className={`h-2 bg-gradient-to-r ${gradients[index % gradients.length]}`} />

                                        <div className="p-6 space-y-4">
                                            <div className="flex items-start justify-between flex-wrap gap-4">
                                                <div className="flex-1 space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                                                            {project.title}
                                                        </h3>
                                                        {project.featured && (
                                                            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 animate-pulse" />
                                                        )}
                                                    </div>
                                                    <p className="text-slate-300 text-base leading-relaxed">{project.description}</p>
                                                </div>
                                                <Badge
                                                    variant={project.status === 'completed' ? 'default' : 'secondary'}
                                                    className={project.status === 'completed'
                                                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0'
                                                        : 'bg-slate-800 border-slate-700 text-slate-300'
                                                    }
                                                >
                                                    {project.status === 'completed' ? '✓ Completed' : '⏳ In Progress'}
                                                </Badge>
                                            </div>

                                            {/* Technologies */}
                                            <div className="flex flex-wrap gap-2">
                                                {project.technologies.map((tech) => (
                                                    <Badge
                                                        key={tech}
                                                        variant="outline"
                                                        className="border-slate-700 bg-slate-800/30 text-slate-300 font-medium hover:bg-slate-700/50 transition-colors"
                                                    >
                                                        {tech}
                                                    </Badge>
                                                ))}
                                            </div>

                                            {/* Links */}
                                            <div className="flex gap-3 pt-2">
                                                {project.github_url && (
                                                    <Button variant="outline" size="sm" className="gap-2 border-slate-700 hover:bg-slate-800" asChild>
                                                        <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                                                            <Github className="w-4 h-4" />
                                                            View Code
                                                        </a>
                                                    </Button>
                                                )}
                                                {project.demo_url && (
                                                    <Button size="sm" className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0" asChild>
                                                        <a href={project.demo_url} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="w-4 h-4" />
                                                            Live Demo
                                                        </a>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Footer */}
                    <div className="text-center py-12 space-y-4">
                        <p className="text-slate-500">
                            Portfolio powered by{' '}
                            <span className="font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                StartSphere
                            </span>
                        </p>
                        <p className="text-xs text-slate-600">
                            Built with passion • Designed for impact
                        </p>
                    </div>
                </div>
            </main>

            <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
        </div>
    );
};

export default PublicPortfolio;
