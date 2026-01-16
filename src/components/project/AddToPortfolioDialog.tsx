import { useState, useEffect } from 'react';
import { Briefcase, Github, ExternalLink, Star, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAuth } from '@/contexts/AuthContext';

interface AddToPortfolioDialogProps {
    project: {
        id: string;
        name: string;
        description?: string;
        domain?: string;
    };
    trigger?: React.ReactNode;
}

export function AddToPortfolioDialog({ project, trigger }: AddToPortfolioDialogProps) {
    const { user } = useAuth();
    const {
        portfolio,
        hasPortfolio,
        addProject,
        isProjectInPortfolio,
        createOrUpdatePortfolio,
        isUpdatingPortfolio
    } = usePortfolio();

    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [techInput, setTechInput] = useState('');

    // Form state
    const [title, setTitle] = useState(project.name);
    const [description, setDescription] = useState(project.description || '');
    const [technologies, setTechnologies] = useState<string[]>([]);
    const [githubUrl, setGithubUrl] = useState('');
    const [demoUrl, setDemoUrl] = useState('');
    const [status, setStatus] = useState<'completed' | 'in-progress'>('completed');
    const [featured, setFeatured] = useState(false);

    // Check if already in portfolio
    const alreadyInPortfolio = isProjectInPortfolio(project.id);

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            setTitle(project.name);
            setDescription(project.description || '');
            setTechnologies([]);
            setGithubUrl('');
            setDemoUrl('');
            setStatus('completed');
            setFeatured(false);
        }
    }, [open, project]);

    const handleAddTech = () => {
        const tech = techInput.trim();
        if (tech && !technologies.includes(tech)) {
            setTechnologies([...technologies, tech]);
            setTechInput('');
        }
    };

    const handleRemoveTech = (tech: string) => {
        setTechnologies(technologies.filter((t) => t !== tech));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            handleAddTech();
        }
    };

    const handleSubmit = async () => {
        if (!title.trim()) return;

        setIsSubmitting(true);
        try {
            // If user doesn't have a portfolio yet, create one first
            if (!hasPortfolio) {
                await createOrUpdatePortfolio({
                    display_name: user?.name || 'My Portfolio',
                    title: 'Developer',
                    bio: '',
                });
                // Wait for the portfolio to be created and cache to refresh
                await new Promise(resolve => setTimeout(resolve, 1000));
                // The mutation will invalidate the query, but we need to wait for refetch
            }

            // Add the project - ensure description is not empty
            await addProject({
                title: title.trim(),
                description: description.trim() || 'No description provided',
                technologies: technologies.length > 0 ? technologies : [],
                github_url: githubUrl.trim() || undefined,
                demo_url: demoUrl.trim() || undefined,
                status,
                featured,
                source_project_id: project.id,
            });

            setOpen(false);
        } catch (error) {
            console.error('Failed to add project to portfolio:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Default trigger button
    const defaultTrigger = (
        <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={alreadyInPortfolio}
        >
            {alreadyInPortfolio ? (
                <>
                    <Check className="h-4 w-4 text-green-500" />
                    In Portfolio
                </>
            ) : (
                <>
                    <Briefcase className="h-4 w-4" />
                    Add to Portfolio
                </>
            )}
        </Button>
    );

    if (alreadyInPortfolio) {
        return defaultTrigger;
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || defaultTrigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        Add to Portfolio
                    </DialogTitle>
                    <DialogDescription>
                        Showcase this project on your portfolio. Customize how it appears to visitors.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Project Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter project title"
                            className="font-medium"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe what this project does and your role in it..."
                            rows={3}
                        />
                        <p className="text-xs text-muted-foreground">
                            Write a compelling description that highlights the project's impact.
                        </p>
                    </div>

                    {/* Technologies */}
                    <div className="space-y-2">
                        <Label htmlFor="technologies">Technologies Used</Label>
                        <div className="flex gap-2">
                            <Input
                                id="technologies"
                                value={techInput}
                                onChange={(e) => setTechInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type and press Enter (e.g., React, Node.js)"
                                className="flex-1"
                            />
                            <Button type="button" variant="secondary" onClick={handleAddTech} size="sm">
                                Add
                            </Button>
                        </div>
                        {technologies.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {technologies.map((tech) => (
                                    <Badge
                                        key={tech}
                                        variant="secondary"
                                        className="gap-1 cursor-pointer hover:bg-destructive/20"
                                        onClick={() => handleRemoveTech(tech)}
                                    >
                                        {tech}
                                        <X className="h-3 w-3" />
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Links */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="github" className="flex items-center gap-1">
                                <Github className="h-4 w-4" />
                                GitHub URL
                            </Label>
                            <Input
                                id="github"
                                value={githubUrl}
                                onChange={(e) => setGithubUrl(e.target.value)}
                                placeholder="https://github.com/..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="demo" className="flex items-center gap-1">
                                <ExternalLink className="h-4 w-4" />
                                Live Demo URL
                            </Label>
                            <Input
                                id="demo"
                                value={demoUrl}
                                onChange={(e) => setDemoUrl(e.target.value)}
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    {/* Status and Featured */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="completed">✓ Completed</SelectItem>
                                    <SelectItem value="in-progress">⏳ In Progress</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500" />
                                Featured Project
                            </Label>
                            <div className="flex items-center gap-2 h-10">
                                <Switch
                                    checked={featured}
                                    onCheckedChange={setFeatured}
                                />
                                <span className="text-sm text-muted-foreground">
                                    {featured ? 'Will appear first' : 'Normal order'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !title.trim()}
                        className="gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Adding...
                            </>
                        ) : (
                            <>
                                <Briefcase className="h-4 w-4" />
                                Add to Portfolio
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
