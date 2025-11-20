import { Sidebar } from '@/components/Sidebar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Eye } from 'lucide-react';

const Reports = () => {
  const reports = [
    {
      id: 1,
      studentName: 'John Doe',
      projectTitle: 'Mobile App Development',
      submittedDate: '2025-11-01',
      status: 'reviewed',
      grade: 'A',
    },
    {
      id: 2,
      studentName: 'Sarah Smith',
      projectTitle: 'AI Research Project',
      submittedDate: '2025-11-03',
      status: 'pending',
      grade: null,
    },
    {
      id: 3,
      studentName: 'Mike Johnson',
      projectTitle: 'Web Portfolio',
      submittedDate: '2025-10-28',
      status: 'reviewed',
      grade: 'B+',
    },
  ];

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-14 flex items-center border-b px-4 gap-2">
          <SidebarTrigger />
          <h2 className="text-lg font-semibold">Student Reports</h2>
        </header>
        
        <main className="flex-1 p-6 bg-background overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-1">Project Reports</h3>
            <p className="text-muted-foreground">
              Review and download student project reports
            </p>
          </div>

          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{report.projectTitle}</CardTitle>
                      <CardDescription>
                        Submitted by {report.studentName} on {new Date(report.submittedDate).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {report.grade && (
                        <Badge className="bg-success text-white">Grade: {report.grade}</Badge>
                      )}
                      <Badge variant={report.status === 'reviewed' ? 'default' : 'secondary'}>
                        {report.status === 'reviewed' ? 'Reviewed' : 'Pending Review'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View Report
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </>
  );
};

export default Reports;
