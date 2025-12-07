import { ProjectReport } from '@/hooks/useProjectReport';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { FileText, Users, GraduationCap, Calendar, FolderOpen } from 'lucide-react';
import { forwardRef } from 'react';

interface ReportPreviewProps {
  report: ProjectReport;
}

export const ReportPreview = forwardRef<HTMLDivElement, ReportPreviewProps>(
  ({ report }, ref) => {
    return (
      <div ref={ref} className="bg-white text-black p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 border-b-4 border-primary pb-6">
          <h1 className="text-4xl font-bold mb-2 text-primary">
            {report.project_name}
          </h1>
          {report.domain && (
            <p className="text-xl text-gray-600 mb-4">{report.domain}</p>
          )}
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Generated: {format(new Date(), 'MMMM dd, yyyy')}</span>
            </div>
          </div>
        </div>

        {/* Table of Contents */}
        <Card className="mb-8 bg-gray-50">
          <CardHeader>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Table of Contents
            </h2>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="grid grid-cols-2 gap-2">
              <a href="#basic-info" className="text-blue-600 hover:underline">
                1. Basic Information
              </a>
              {report.abstract && (
                <a href="#abstract" className="text-blue-600 hover:underline">
                  2. Abstract
                </a>
              )}
              {(report.problem_statement || report.solution_approach) && (
                <a href="#problem-solution" className="text-blue-600 hover:underline">
                  3. Problem & Solution
                </a>
              )}
              {report.objectives && (
                <a href="#objectives" className="text-blue-600 hover:underline">
                  4. Objectives
                </a>
              )}
              {report.methodology && (
                <a href="#methodology" className="text-blue-600 hover:underline">
                  5. Methodology
                </a>
              )}
              {report.tech_stack && report.tech_stack.length > 0 && (
                <a href="#tech-stack" className="text-blue-600 hover:underline">
                  6. Technology Stack
                </a>
              )}
              {report.outcomes && (
                <a href="#outcomes" className="text-blue-600 hover:underline">
                  7. Outcomes & Results
                </a>
              )}
              {report.file_references && report.file_references.length > 0 && (
                <a href="#files" className="text-blue-600 hover:underline">
                  8. Files & Documentation
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 1. Basic Information */}
        <section id="basic-info" className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 border-b-2 border-gray-300 pb-2">
            <FolderOpen className="w-6 h-6" />
            1. Basic Information
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Project Name</h3>
              <p className="text-gray-700">{report.project_name}</p>
            </div>
            {report.domain && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Domain</h3>
                <Badge variant="secondary" className="text-sm">
                  {report.domain}
                </Badge>
              </div>
            )}
            {report.team_members && report.team_members.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Members
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {report.team_members.map((member, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-gray-600">{member.email}</p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {member.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {report.mentor_name && (
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Project Guide/Mentor
                </h3>
                <div className="bg-primary/5 p-3 rounded-lg">
                  <p className="font-medium">{report.mentor_name}</p>
                  {report.mentor_email && (
                    <p className="text-sm text-gray-600">{report.mentor_email}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 2. Abstract */}
        {report.abstract && (
          <section id="abstract" className="mb-8">
            <h2 className="text-2xl font-bold mb-4 border-b-2 border-gray-300 pb-2">
              2. Abstract
            </h2>
            <div className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
              {report.abstract}
            </div>
          </section>
        )}

        {/* 3. Problem Statement & Solution */}
        {(report.problem_statement || report.solution_approach) && (
          <section id="problem-solution" className="mb-8">
            <h2 className="text-2xl font-bold mb-4 border-b-2 border-gray-300 pb-2">
              3. Problem Statement & Solution Approach
            </h2>
            {report.problem_statement && (
              <div className="mb-4">
                <h3 className="font-semibold text-lg mb-2 text-red-700">
                  Problem Statement
                </h3>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {report.problem_statement}
                  </p>
                </div>
              </div>
            )}
            {report.solution_approach && (
              <div>
                <h3 className="font-semibold text-lg mb-2 text-green-700">
                  Solution Approach
                </h3>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {report.solution_approach}
                  </p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* 4. Objectives */}
        {report.objectives && (
          <section id="objectives" className="mb-8">
            <h2 className="text-2xl font-bold mb-4 border-b-2 border-gray-300 pb-2">
              4. Objectives & Goals
            </h2>
            <div className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
              {report.objectives}
            </div>
          </section>
        )}

        {/* 5. Methodology */}
        {report.methodology && (
          <section id="methodology" className="mb-8">
            <h2 className="text-2xl font-bold mb-4 border-b-2 border-gray-300 pb-2">
              5. Methodology & Implementation
            </h2>
            <div className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
              {report.methodology}
            </div>
          </section>
        )}

        {/* 6. Technology Stack */}
        {report.tech_stack && report.tech_stack.length > 0 && (
          <section id="tech-stack" className="mb-8">
            <h2 className="text-2xl font-bold mb-4 border-b-2 border-gray-300 pb-2">
              6. Technology Stack
            </h2>
            <div className="flex flex-wrap gap-2">
              {report.tech_stack.map((tech, idx) => (
                <Badge key={idx} variant="secondary" className="text-sm px-3 py-1">
                  {tech}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* 7. Outcomes & Results */}
        {report.outcomes && (
          <section id="outcomes" className="mb-8">
            <h2 className="text-2xl font-bold mb-4 border-b-2 border-gray-300 pb-2">
              7. Outcomes & Results
            </h2>
            <div className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
              {report.outcomes}
            </div>
          </section>
        )}

        {/* 8. Files & Documentation */}
        {report.file_references && report.file_references.length > 0 && (
          <section id="files" className="mb-8">
            <h2 className="text-2xl font-bold mb-4 border-b-2 border-gray-300 pb-2">
              8. Files & Documentation
            </h2>
            <div className="space-y-2">
              {report.file_references.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{file.name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {file.type}
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <Separator className="my-8" />
        <div className="text-center text-sm text-gray-500">
          <p>Project Report - {report.project_name}</p>
          <p>
            Generated on {format(new Date(report.created_at), 'MMMM dd, yyyy')}
          </p>
          {report.updated_at !== report.created_at && (
            <p className="mt-1">
              Last updated: {format(new Date(report.updated_at), 'MMMM dd, yyyy')}
            </p>
          )}
        </div>
      </div>
    );
  }
);

ReportPreview.displayName = 'ReportPreview';

