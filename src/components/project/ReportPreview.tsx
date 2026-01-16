import { ProjectReport } from '@/hooks/useProjectReport';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { FileText, Users, GraduationCap, Calendar, Zap, Target, BookOpen, Layers, CheckCircle } from 'lucide-react';
import { forwardRef } from 'react';

interface ReportPreviewProps {
  report: ProjectReport;
}

export const ReportPreview = forwardRef<HTMLDivElement, ReportPreviewProps>(
  ({ report }, ref) => {
    const today = new Date();

    return (
      <div ref={ref} className="bg-white text-slate-900 font-sans leading-relaxed selection:bg-indigo-50">

        {/* ================= COVER PAGE ================= */}
        <div className="min-h-[1100px] flex flex-col justify-between p-16 border-b print:border-none print:break-after-page relative overflow-hidden bg-gradient-to-br from-white to-slate-50">

          {/* Decorative Corner */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-bl-[100px] -z-10 opacity-60" />

          {/* Top Meta */}
          <div className="w-full flex justify-between items-start text-sm text-slate-500 uppercase tracking-widest font-semibold">
            <span>Project Report</span>
            <span>{format(today, 'MMMM yyyy')}</span>
          </div>

          {/* Center Content */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="space-y-6">
              <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider rounded-full mb-4">
                {report.domain || 'Engineering Project'}
              </div>

              <h1 className="text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                {report.project_name}
              </h1>

              <div className="w-24 h-2 bg-indigo-600 rounded-full mt-8" />
            </div>
          </div>

          {/* Bottom Info: Team & Mentor */}
          <div className="grid grid-cols-2 gap-12 mt-auto">

            {/* Team Members */}
            <div>
              <h3 className="text-sm uppercase tracking-widest text-slate-400 font-bold mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" /> Team Members
              </h3>
              <ul className="space-y-4">
                {report.team_members && report.team_members.map((member, idx) => (
                  <li key={idx} className="group">
                    <div className="font-semibold text-lg text-slate-800">{member.name}</div>
                    <div className="text-slate-500 text-sm font-light">{member.role}</div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mentor Info */}
            {report.mentor_name && (
              <div>
                <h3 className="text-sm uppercase tracking-widest text-slate-400 font-bold mb-4 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" /> Mentor
                </h3>
                <div className="font-semibold text-lg text-slate-800">{report.mentor_name}</div>
                <div className="text-slate-500 text-sm font-light">{report.mentor_email}</div>
              </div>
            )}
          </div>
        </div>

        {/* ================= CONTENT PAGES ================= */}
        <div className="p-16 max-w-5xl mx-auto space-y-12">

          {/* 1. Abstract */}
          {report.abstract && (
            <section className="scroll-mt-20">
              <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
                <span className="text-indigo-600">01.</span> Abstract
              </h2>
              <div className="text-lg text-slate-600 text-justify leading-8">
                {report.abstract}
              </div>
            </section>
          )}

          {/* 2. Problem & Solution */}
          {(report.problem_statement || report.solution_approach) && (
            <section className="scroll-mt-20">
              <h2 className="text-3xl font-bold text-slate-800 mb-8 flex items-center gap-3 border-b border-slate-200 pb-4">
                <span className="text-indigo-600">02.</span> Problem & Solution
              </h2>

              <div className="grid gap-8">
                {report.problem_statement && (
                  <div className="relative pl-8 border-l-4 border-rose-500">
                    <h3 className="text-xl font-semibold text-rose-700 mb-3 flex items-center gap-2">
                      <Zap className="w-5 h-5" /> Problem Statement
                    </h3>
                    <p className="text-slate-600 text-lg leading-7">
                      {report.problem_statement}
                    </p>
                  </div>
                )}

                {report.solution_approach && (
                  <div className="relative pl-8 border-l-4 border-emerald-500">
                    <h3 className="text-xl font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                      <Target className="w-5 h-5" /> Solution Approach
                    </h3>
                    <p className="text-slate-600 text-lg leading-7">
                      {report.solution_approach}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* 3. Objectives */}
          {report.objectives && (
            <section className="scroll-mt-20">
              <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
                <span className="text-indigo-600">03.</span> Objectives
              </h2>
              <div className="text-lg text-slate-600 leading-8 prose prose-slate max-w-none">
                {report.objectives}
              </div>
            </section>
          )}

          {/* 4. Methodology */}
          {report.methodology && (
            <section className="scroll-mt-20">
              <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
                <span className="text-indigo-600">04.</span> Methodology
              </h2>
              <div className="text-lg text-slate-600 leading-8 prose prose-slate max-w-none">
                {report.methodology}
              </div>
            </section>
          )}

          {/* 5. Tech Stack */}
          {report.tech_stack && report.tech_stack.length > 0 && (
            <section className="scroll-mt-20">
              <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
                <span className="text-indigo-600">05.</span> Technology Stack
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {report.tech_stack.map((tech, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-4 rounded-lg border border-slate-100 bg-slate-50">
                    <Layers className="w-5 h-5 text-indigo-500" />
                    <span className="font-semibold text-slate-700">{tech}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 6. Outcomes */}
          {report.outcomes && (
            <section className="scroll-mt-20">
              <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
                <span className="text-indigo-600">06.</span> Outcomes & Results
              </h2>
              <div className="text-lg text-slate-600 leading-8 prose prose-slate max-w-none" style={{ pageBreakInside: 'auto' }}>
                {report.outcomes}
              </div>
            </section>
          )}

          {/* 7. Custom Sections */}
          {report.custom_sections?.map((section, index) => (
            <section key={section.id} className="scroll-mt-20">
              <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
                <span className="text-indigo-600">{String(7 + index).padStart(2, '0')}.</span> {section.title}
              </h2>
              <div className="text-lg text-slate-600 leading-8 prose prose-slate max-w-none" style={{ pageBreakInside: 'auto' }}>
                <div dangerouslySetInnerHTML={{ __html: section.content }} />
              </div>
            </section>
          ))}

          {/* 8. Files */}
          {report.file_references && report.file_references.length > 0 && (
            <section className="scroll-mt-20">
              <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
                <span className="text-indigo-600">{String(7 + (report.custom_sections?.length || 0)).padStart(2, '0')}.</span> Referenced Files
              </h2>
              <div className="bg-slate-50 rounded-xl p-6">
                <ul className="space-y-4">
                  {report.file_references.map((file, idx) => (
                    <li key={idx} className="flex items-center gap-4 text-slate-700">
                      <div className="p-2 bg-white rounded-md shadow-sm">
                        <FileText className="w-5 h-5 text-indigo-500" />
                      </div>
                      <span className="font-medium">{file.name}</span>
                      <span className="ml-auto text-xs uppercase font-bold text-slate-400 bg-slate-200 px-2 py-1 rounded">{file.type}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="text-center py-12 text-slate-400 text-sm border-t border-slate-100 mt-12 bg-slate-50">
          <p>Generated by Project Collaboration Platform</p>
          <p className="mt-1 font-mono text-xs">{report.id}</p>
        </div>

      </div>
    );
  }
);

ReportPreview.displayName = 'ReportPreview';

