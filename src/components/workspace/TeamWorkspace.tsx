import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EngineeringZone } from './EngineeringZone';
import { CodingZone } from './CodingZone';
import { ThePulse } from './ThePulse';
import { useAuth } from '@/contexts/AuthContext';

interface TeamWorkspaceProps {
    projectId: string;
}

export const TeamWorkspace = ({ projectId }: TeamWorkspaceProps) => {
    const { user } = useAuth();
    const [activeZone, setActiveZone] = useState('engineering');

    return (
        <div className="flex h-[calc(100vh-12rem)] gap-4">
            {/* Main Workspace Area (Left - 75%) */}
            <div className="flex-1 flex flex-col min-w-0">
                <Tabs value={activeZone} onValueChange={setActiveZone} className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <TabsList>
                            <TabsTrigger value="engineering">Engineering Zone</TabsTrigger>
                            <TabsTrigger value="coding">Coding Zone</TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-hidden border rounded-lg bg-background">
                        <TabsContent value="engineering" className="h-full m-0 p-0 border-0">
                            <EngineeringZone projectId={projectId} />
                        </TabsContent>

                        <TabsContent value="coding" className="h-full m-0 p-0 border-0">
                            <CodingZone projectId={projectId} />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>

            {/* The Pulse (Right - 25%) */}
            <div className="w-80 flex-shrink-0 border-l pl-4">
                <ThePulse projectId={projectId} />
            </div>
        </div>
    );
};
