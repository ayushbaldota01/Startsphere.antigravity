import { Sidebar } from '@/components/Sidebar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { ExternalLink, Award, Mail, Linkedin, Github, MapPin, Briefcase, GraduationCap, Code2, Star, ArrowLeft, Sparkles, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Portfolio = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Dynamic portfolio data - uses real user data where available
  const portfolioData = {
    bio: user?.bio || "Passionate software engineering student with a focus on building scalable web applications and AI-driven solutions. Currently pursuing B.Tech in Computer Science with hands-on experience in full-stack development.",
    location: user?.university || "University",
    email: user?.email || "user@example.com",
    github: "github.com/johndoe",
    linkedin: "linkedin.com/in/johndoe",

    skills: [
      { category: "Frontend", items: ["React", "TypeScript", "Tailwind CSS", "Next.js"], color: "from-blue-500 to-cyan-500" },
      { category: "Backend", items: ["Node.js", "Python", "PostgreSQL", "MongoDB"], color: "from-green-500 to-emerald-500" },
      { category: "Tools", items: ["Git", "Docker", "AWS", "Firebase"], color: "from-purple-500 to-pink-500" },
      { category: "AI/ML", items: ["TensorFlow", "PyTorch", "scikit-learn"], color: "from-orange-500 to-red-500" },
    ],

    experience: [
      {
        id: 1,
        role: "Software Engineering Intern",
        company: "Tech Startup Inc.",
        period: "June 2024 - Aug 2024",
        description: "Developed and deployed microservices using Node.js and Docker, reducing API response time by 40%",
        achievements: ["40% faster API", "Microservices architecture", "Docker deployment"],
      },
      {
        id: 2,
        role: "Research Assistant",
        company: "University AI Lab",
        period: "Jan 2024 - Present",
        description: "Working on machine learning models for educational technology, published 2 research papers",
        achievements: ["2 research papers", "ML model development", "EdTech innovation"],
      },
    ],

    education: [
      {
        id: 1,
        degree: user?.major || "B.Tech in Computer Science",
        institution: user?.university || "Stanford University",
        period: "2022 - 2026",
        gpa: "3.8/4.0",
      },
    ],

    projects: [
      {
        id: 1,
        title: 'Mobile App Development',
        description: 'Cross-platform mobile application for student collaboration with real-time features',
        technologies: ['React Native', 'Firebase', 'Node.js'],
        status: 'completed',
        github: 'github.com/project1',
        demo: 'demo.com/project1',
        gradient: 'from-blue-600 to-purple-600',
      },
      {
        id: 2,
        title: 'AI Research Project',
        description: 'Machine learning application for educational technology improvement',
        technologies: ['Python', 'TensorFlow', 'Flask'],
        status: 'in-progress',
        github: 'github.com/project2',
        gradient: 'from-green-600 to-teal-600',
      },
      {
        id: 3,
        title: 'E-commerce Platform',
        description: 'Full-stack e-commerce solution with payment integration and inventory management',
        technologies: ['React', 'Node.js', 'PostgreSQL', 'Stripe'],
        status: 'completed',
        github: 'github.com/project3',
        demo: 'demo.com/project3',
        gradient: 'from-orange-600 to-pink-600',
      },
    ],
  };

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-14 flex items-center border-b px-4 gap-2 bg-gradient-to-r from-background via-muted/20 to-background">
          <SidebarTrigger />
          <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
          <div className="flex-1" />
          <Button size="sm" variant="outline" className="gap-2">
            <ExternalLink className="w-4 h-4" />
            View Public Profile
          </Button>
        </header>

        <main className="flex-1 p-6 bg-gradient-to-br from-background via-muted/5 to-background overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Hero Header Card */}
            <Card className="relative overflow-hidden border-2 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5" />
              <CardHeader className="relative">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-6">
                    <Avatar className="w-24 h-24 border-4 border-background shadow-2xl ring-4 ring-primary/20">
                      <AvatarFallback className="text-4xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 text-primary-foreground font-bold">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text mb-2">
                        {user?.name || 'John Doe'}
                      </CardTitle>
                      <CardDescription className="text-lg font-medium flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Software Engineering Student | Full-Stack Developer
                      </CardDescription>
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          {portfolioData.location}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-4 h-4" />
                          {portfolioData.email}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" className="gap-2 hover:bg-primary/10">
                    <Github className="w-4 h-4" />
                    GitHub
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2 hover:bg-primary/10">
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* About Section */}
            <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/20">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Award className="w-6 h-6 text-primary" />
                  About Me
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-muted-foreground leading-relaxed text-lg">
                  {portfolioData.bio}
                </p>
              </CardContent>
            </Card>

            {/* Skills Section */}
            <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/20">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Code2 className="w-6 h-6 text-primary" />
                  Skills & Technologies
                </CardTitle>
                <CardDescription>Technical expertise and proficiencies</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {portfolioData.skills.map((skillGroup) => (
                  <div key={skillGroup.category} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className={`h-1 w-12 rounded-full bg-gradient-to-r ${skillGroup.color}`} />
                      <h4 className="font-bold text-lg">{skillGroup.category}</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {skillGroup.items.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="px-4 py-1.5 text-sm font-medium hover:scale-105 transition-transform cursor-default"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Experience Section */}
            <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/20">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Briefcase className="w-6 h-6 text-primary" />
                  Experience
                </CardTitle>
                <CardDescription>Professional journey and achievements</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {portfolioData.experience.map((exp, index) => (
                  <div key={exp.id}>
                    {index > 0 && <Separator className="my-6" />}
                    <div className="space-y-4">
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div className="space-y-1">
                          <h4 className="font-bold text-xl">{exp.role}</h4>
                          <p className="text-muted-foreground font-medium">{exp.company}</p>
                        </div>
                        <Badge variant="outline" className="text-sm px-3 py-1">{exp.period}</Badge>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {exp.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {exp.achievements.map((achievement) => (
                          <Badge key={achievement} className="gap-1.5">
                            <TrendingUp className="w-3 h-3" />
                            {achievement}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Education Section */}
            <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/20">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <GraduationCap className="w-6 h-6 text-primary" />
                  Education
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {portfolioData.education.map((edu) => (
                  <div key={edu.id} className="flex items-start justify-between flex-wrap gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-xl">{edu.degree}</h4>
                      <p className="text-muted-foreground font-medium">{edu.institution}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge variant="outline" className="text-sm px-3 py-1">{edu.period}</Badge>
                      <p className="text-sm font-semibold text-primary">GPA: {edu.gpa}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Projects Section */}
            <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/20">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Star className="w-6 h-6 text-primary" />
                      Featured Projects
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Showcase of my best work and contributions
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage Projects
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {portfolioData.projects.map((project) => (
                  <Card
                    key={project.id}
                    className="border-2 hover:shadow-lg transition-all duration-300 overflow-hidden group"
                  >
                    <div className={`h-2 bg-gradient-to-r ${project.gradient}`} />
                    <CardHeader>
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div className="flex-1 space-y-2">
                          <CardTitle className="text-xl group-hover:text-primary transition-colors">
                            {project.title}
                          </CardTitle>
                          <CardDescription className="text-base">{project.description}</CardDescription>
                        </div>
                        <Badge
                          variant={project.status === 'completed' ? 'default' : 'secondary'}
                          className="px-3 py-1"
                        >
                          {project.status === 'completed' ? '✓ Completed' : '⏳ In Progress'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {project.technologies.map((tech) => (
                            <Badge key={tech} variant="outline" className="font-medium">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          {project.github && (
                            <Button variant="outline" size="sm" className="gap-2">
                              <Github className="w-4 h-4" />
                              View Code
                            </Button>
                          )}
                          {project.demo && (
                            <Button variant="outline" size="sm" className="gap-2">
                              <ExternalLink className="w-4 h-4" />
                              Live Demo
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
};

export default Portfolio;
