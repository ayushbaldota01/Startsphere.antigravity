import { useState, useRef, useEffect } from 'react';
import { useProjectReport, CreateReportData } from '@/hooks/useProjectReport';
import { ReportPreview } from './ReportPreview';
import { SimpleTextEditor } from './SimpleTextEditor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { generatePDF, generatePDFAdvanced } from '@/lib/pdfGenerator';
import {
  FileText,
  Download,
  Save,
  Eye,
  Edit,
  Plus,
  X,
  Loader2,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProjectReportProps {
  projectId: string;
  project: any;
  members: any[];
  isAdmin: boolean;
}

export const ProjectReport = ({
  projectId,
  project,
  members,
  isAdmin,
}: ProjectReportProps) => {
  const { toast } = useToast();
  const {
    report,
    isLoading,
    createReport,
    updateReport,
    prefillFromProject,
    createReportMutation,
    updateReportMutation,
  } = useProjectReport(projectId);

  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [formData, setFormData] = useState<CreateReportData>({
    project_id: projectId,
    project_name: project.name,
    domain: project.domain || '',
    team_members: [],
    mentor_name: '',
    mentor_email: '',
    abstract: '',
    problem_statement: '',
    solution_approach: '',
    objectives: '',
    methodology: '',
    tech_stack: [],
    outcomes: '',
    file_references: [],
  });
  const [newTech, setNewTech] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Initialize form data from report or prefill from project
  useEffect(() => {
    if (report) {
      setFormData({
        project_id: report.project_id,
        project_name: report.project_name,
        domain: report.domain || '',
        team_members: report.team_members || [],
        mentor_name: report.mentor_name || '',
        mentor_email: report.mentor_email || '',
        abstract: report.abstract || '',
        problem_statement: report.problem_statement || '',
        solution_approach: report.solution_approach || '',
        objectives: report.objectives || '',
        methodology: report.methodology || '',
        tech_stack: report.tech_stack || [],
        outcomes: report.outcomes || '',
        file_references: report.file_references || [],
        custom_sections: report.custom_sections || [],
      });
    } else if (project) {
      // Prefill from project data
      const prefilled = prefillFromProject(project, members, []);
      setFormData(prefilled);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report?.id, project?.id, members?.length]);

  const handleInputChange = (
    field: keyof CreateReportData,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddTech = () => {
    if (newTech.trim()) {
      setFormData((prev) => ({
        ...prev,
        tech_stack: [...(prev.tech_stack || []), newTech.trim()],
      }));
      setNewTech('');
    }
  };

  const handleRemoveTech = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tech_stack: (prev.tech_stack || []).filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    try {
      if (report) {
        await updateReport(formData);
      } else {
        await createReport(formData);
      }
    } catch (error) {
      console.error('Error saving report:', error);
    }
  };

  const handleGeneratePDF = async () => {
    if (!previewRef.current) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Report preview not found',
      });
      return;
    }

    setIsGeneratingPDF(true);
    try {
      const filename = `${formData.project_name.replace(/\s+/g, '-')}-Report.pdf`;
      await generatePDFAdvanced(previewRef.current, { filename });
      toast({
        title: 'PDF Generated',
        description: 'Report has been downloaded successfully.',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Project Report
              </CardTitle>
              <CardDescription>
                {report
                  ? 'Edit and update your project report'
                  : 'Generate a comprehensive report for your project'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {report && (
                <Badge variant="outline" className="gap-1">
                  <FileCheck className="w-3 h-3" />
                  Report Exists
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Mode Toggle */}
      <div className="flex justify-between items-center">
        <Tabs value={mode} onValueChange={(v) => setMode(v as 'edit' | 'preview')}>
          <TabsList>
            <TabsTrigger value="edit" className="gap-2">
              <Edit className="w-4 h-4" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          {mode === 'edit' && (
            <Button
              onClick={handleSave}
              disabled={createReportMutation.isPending || updateReportMutation.isPending}
            >
              {createReportMutation.isPending || updateReportMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {report ? 'Update Report' : 'Save Report'}
                </>
              )}
            </Button>
          )}
          {mode === 'preview' && (
            <Button onClick={handleGeneratePDF} disabled={isGeneratingPDF}>
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {mode === 'edit' ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Auto-populated from project data (read-only)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Project Name</Label>
                    <Input value={formData.project_name} disabled />
                  </div>
                  <div>
                    <Label>Domain</Label>
                    <Input
                      value={formData.domain}
                      onChange={(e) => handleInputChange('domain', e.target.value)}
                      disabled={false}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Mentor Name</Label>
                    <Input
                      value={formData.mentor_name}
                      onChange={(e) => handleInputChange('mentor_name', e.target.value)}
                      disabled={false}
                    />
                  </div>
                  <div>
                    <Label>Mentor Email</Label>
                    <Input
                      value={formData.mentor_email}
                      onChange={(e) => handleInputChange('mentor_email', e.target.value)}
                      disabled={false}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Abstract */}
            <Card>
              <CardHeader>
                <CardTitle>Abstract</CardTitle>
                <CardDescription>
                  Comprehensive project summary (150-300 words recommended)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleTextEditor
                  value={formData.abstract || ''}
                  onChange={(value) => handleInputChange('abstract', value)}
                  placeholder="Provide a comprehensive summary of your project..."
                  disabled={false}
                  minHeight="250px"
                />
              </CardContent>
            </Card>

            {/* Problem Statement & Solution */}
            <Card>
              <CardHeader>
                <CardTitle>Problem Statement & Solution</CardTitle>
                <CardDescription>
                  Describe the problem and your solution approach
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <SimpleTextEditor
                  value={formData.problem_statement || ''}
                  onChange={(value) => handleInputChange('problem_statement', value)}
                  placeholder="Describe the problem your project addresses..."
                  disabled={false}
                  minHeight="200px"
                  label="Problem Statement"
                />
                <Separator />
                <SimpleTextEditor
                  value={formData.solution_approach || ''}
                  onChange={(value) => handleInputChange('solution_approach', value)}
                  placeholder="Explain your approach to solving the problem..."
                  disabled={false}
                  minHeight="200px"
                  label="Solution Approach"
                />
              </CardContent>
            </Card>

            {/* Objectives */}
            <Card>
              <CardHeader>
                <CardTitle>Objectives & Goals</CardTitle>
                <CardDescription>
                  List the main objectives and goals of your project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleTextEditor
                  value={formData.objectives || ''}
                  onChange={(value) => handleInputChange('objectives', value)}
                  placeholder="List the main objectives and goals of your project..."
                  disabled={false}
                  minHeight="250px"
                />
              </CardContent>
            </Card>

            {/* Methodology */}
            <Card>
              <CardHeader>
                <CardTitle>Methodology & Implementation</CardTitle>
                <CardDescription>
                  Document your development process and methodology
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleTextEditor
                  value={formData.methodology || ''}
                  onChange={(value) => handleInputChange('methodology', value)}
                  placeholder="Describe your implementation approach, development process, testing strategy, and more..."
                  disabled={false}
                  minHeight="300px"
                />
              </CardContent>
            </Card>

            {/* Technology Stack */}
            <Card>
              <CardHeader>
                <CardTitle>Technology Stack</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isAdmin && (
                  <div className="flex gap-2">
                    <Input
                      value={newTech}
                      onChange={(e) => setNewTech(e.target.value)}
                      placeholder="Enter technology (e.g., React, Node.js)"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTech();
                        }
                      }}
                    />
                    <Button onClick={handleAddTech} size="icon">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {formData.tech_stack?.map((tech, index) => (
                    <Badge key={index} variant="secondary" className="gap-1 px-3 py-1">
                      {tech}
                      {isAdmin && (
                        <button
                          onClick={() => handleRemoveTech(index)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                  {(!formData.tech_stack || formData.tech_stack.length === 0) && (
                    <p className="text-sm text-muted-foreground">
                      No technologies added yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Outcomes */}
            <Card>
              <CardHeader>
                <CardTitle>Outcomes & Results</CardTitle>
                <CardDescription>
                  Document achievements, results, and future work
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleTextEditor
                  value={formData.outcomes || ''}
                  onChange={(value) => handleInputChange('outcomes', value)}
                  placeholder="Describe what was achieved, key deliverables, challenges overcome, and future scope..."
                  disabled={false}
                  minHeight="250px"
                />
              </CardContent>
            </Card>

            {/* Custom Sections */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Custom Sections</h3>
                <Button
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      custom_sections: [
                        ...(prev.custom_sections || []),
                        { id: crypto.randomUUID(), title: 'New Section', content: '' }
                      ]
                    }))
                  }}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Section
                </Button>
              </div>

              {formData.custom_sections?.map((section, index) => (
                <Card key={section.id} className="relative group">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label className="sr-only">Section Title</Label>
                        <Input
                          value={section.title}
                          onChange={(e) => {
                            const newSections = [...(formData.custom_sections || [])];
                            newSections[index].title = e.target.value;
                            setFormData(prev => ({ ...prev, custom_sections: newSections }));
                          }}
                          className="font-semibold text-lg border-transparent hover:border-input focus:border-input px-0 h-auto py-1"
                          placeholder="Section Title"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          const newSections = (formData.custom_sections || []).filter((_, i) => i !== index);
                          setFormData(prev => ({ ...prev, custom_sections: newSections }));
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <SimpleTextEditor
                      value={section.content}
                      onChange={(value) => {
                        const newSections = [...(formData.custom_sections || [])];
                        newSections[index].content = value;
                        setFormData(prev => ({ ...prev, custom_sections: newSections }));
                      }}
                      placeholder="Enter section content..."
                      disabled={false}
                      minHeight="200px"
                    />
                  </CardContent>
                </Card>
              ))}

              {(!formData.custom_sections || formData.custom_sections.length === 0) && (
                <p className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                  Add custom sections to tailor the report to your specific needs.
                </p>
              )}
            </div>

          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardContent className="p-0">
                {report || formData.abstract ? (
                  <ReportPreview
                    ref={previewRef}
                    report={
                      report || {
                        ...formData,
                        id: '',
                        created_by: '',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                      }
                    }
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-2xl font-semibold mb-2">No Report Data</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      Fill in the report sections in Edit mode to see the preview.
                    </p>
                    <Button onClick={() => setMode('edit')} variant="outline">
                      <Edit className="w-4 h-4 mr-2" />
                      Go to Edit Mode
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Read-only notice for non-admins */}
      {!isAdmin && (
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            You are viewing this report in read-only mode. Only project admins can edit reports.
          </AlertDescription>
        </Alert>
      )}

      {/* Editing hint for admins */}
      {isAdmin && mode === 'edit' && !report && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            Fill in all sections below and click "Save Report" to save your work. You can preview and download as PDF anytime.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

