import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    monitor,
    Layout,
    CheckSquare,
    MessageSquare,
    FileText,
    Settings,
    Bell,
    Search,
    Plus,
    Users,
    Folder
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

type Theme = 'neo-glass' | 'academic' | 'gamified';

export default function DesignExploration() {
    const [currentTheme, setCurrentTheme] = useState<Theme>('neo-glass');

    const themes = {
        'neo-glass': {
            name: 'Neo-Glass (Startup)',
            bg: 'bg-zinc-950',
            text: 'text-zinc-100',
            accent: 'text-cyan-400',
            card: 'bg-zinc-900/40 backdrop-blur-xl border-zinc-800/50 border',
            sidebar: 'bg-zinc-900/30 backdrop-blur-2xl border-r border-zinc-800/50',
            button: 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)]',
            gradient: 'bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-transparent',
            font: 'font-sans'
        },
        'academic': {
            name: 'Academic (Clean)',
            bg: 'bg-slate-50',
            text: 'text-slate-900',
            accent: 'text-blue-600',
            card: 'bg-white border-slate-200 border shadow-sm',
            sidebar: 'bg-white border-r border-slate-200',
            button: 'bg-blue-600 hover:bg-blue-700 text-white',
            gradient: 'bg-gradient-to-b from-slate-100 to-slate-50',
            font: 'font-serif'
        },
        'gamified': {
            name: 'Gamified (Playful)',
            bg: 'bg-[#1e1e2e]',
            text: 'text-[#cdd6f4]',
            accent: 'text-[#f9e2af]',
            card: 'bg-[#313244] border-0 rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]',
            sidebar: 'bg-[#181825] border-r-0',
            button: 'bg-[#a6e3a1] hover:bg-[#94e2d5] text-[#1e1e2e] font-bold rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-none transition-all',
            gradient: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#f5c2e7]/20 via-[#1e1e2e] to-[#1e1e2e]',
            font: 'font-mono'
        }
    };

    const t = themes[currentTheme];

    const MockProjectCard = ({ title, desc, progress, members }: any) => (
        <motion.div
            whileHover={{ y: -5 }}
            className={`p-6 rounded-xl ${t.card} transition-all duration-300 group cursor-pointer relative overflow-hidden`}
        >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-current opacity-5 rounded-bl-full ${t.accent}`} />
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${currentTheme === 'gamified' ? 'bg-[#45475a]' : 'bg-primary/10'}`}>
                    <Folder className={`w-6 h-6 ${t.accent}`} />
                </div>
                <Badge variant="outline" className={`${t.text} border-current opacity-50`}>Active</Badge>
            </div>
            <h3 className={`text-xl font-bold mb-2 ${t.text}`}>{title}</h3>
            <p className={`text-sm mb-4 opacity-70 ${t.text}`}>{desc}</p>
            <div className="flex items-center justify-between mt-auto">
                <div className="flex -space-x-2">
                    {[...Array(members)].map((_, i) => (
                        <div key={i} className={`w-8 h-8 rounded-full border-2 ${currentTheme === 'neo-glass' ? 'border-zinc-900' : 'border-white'} bg-gray-300`} />
                    ))}
                </div>
                <span className={`text-xs font-medium ${t.accent}`}>{progress}% Complete</span>
            </div>
            <div className="w-full bg-gray-200/20 h-1.5 mt-4 rounded-full overflow-hidden">
                <div className={`h-full ${currentTheme === 'gamified' ? 'bg-[#fab387]' : 'bg-primary'} w-[${progress}%]`} style={{ width: `${progress}%` }} />
            </div>
        </motion.div>
    );

    return (
        <div className={`min-h-screen flex ${t.bg} ${t.font} transition-colors duration-500 overflow-hidden`}>
            {/* Sidebar Mockup */}
            <motion.aside
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className={`w-64 p-6 hidden md:flex flex-col ${t.sidebar} z-20`}
            >
                <div className="flex items-center gap-2 mb-10">
                    <div className={`w-8 h-8 rounded-full ${currentTheme === 'gamified' ? 'bg-[#f38ba8]' : 'bg-primary'} animate-pulse`} />
                    <h1 className={`text-xl font-bold tracking-tight ${t.text}`}>StartSphere</h1>
                </div>

                <nav className="space-y-2 flex-1">
                    {['Dashboard', 'Projects', 'Tasks', 'Messages', 'Reports'].map((item, i) => (
                        <div key={item}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer ${i === 0 ? `${t.accent} bg-current/10 font-semibold` : `${t.text} opacity-60 hover:opacity-100 hover:bg-current/5`}`}
                        >
                            {[Layout, Folder, CheckSquare, MessageSquare, FileText][i] && React.createElement([Layout, Folder, CheckSquare, MessageSquare, FileText][i], { size: 20 })}
                            {item}
                        </div>
                    ))}
                </nav>

                <div className={`p-4 rounded-xl mt-auto ${currentTheme === 'neo-glass' ? 'bg-zinc-800/50' : currentTheme === 'gamified' ? 'bg-[#313244]' : 'bg-slate-100'}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500" />
                        <div>
                            <p className={`text-sm font-medium ${t.text}`}>John Doe</p>
                            <p className="text-xs opacity-60">Pro Plan</p>
                        </div>
                    </div>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative">
                <div className={`absolute inset-0 ${t.gradient} pointer-events-none`} />

                {/* Header */}
                <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 z-10">
                    <div className="flex items-center gap-4">
                        <h2 className={`text-2xl font-bold ${t.text}`}>Dashboard</h2>
                        <div className={`h-6 w-[1px] ${currentTheme === 'academic' ? 'bg-slate-300' : 'bg-white/10'}`} />
                        <div className="flex gap-2">
                            {(Object.keys(themes) as Theme[]).map((theme) => (
                                <button
                                    key={theme}
                                    onClick={() => setCurrentTheme(theme)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${currentTheme === theme ? t.button : `${t.text} opacity-50 hover:opacity-100 border border-current`}`}
                                >
                                    {themes[theme].name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full hover:bg-current/10 cursor-pointer ${t.text}`}>
                            <Search size={20} />
                        </div>
                        <div className={`p-2 rounded-full hover:bg-current/10 cursor-pointer ${t.text}`}>
                            <Bell size={20} />
                        </div>
                        <Button className={t.button}>
                            <Plus size={16} className="mr-2" /> New Project
                        </Button>
                    </div>
                </header>

                {/* Dashboard Content */}
                <ScrollArea className="flex-1 p-8 z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <MockProjectCard
                            title="Space Elevator AI"
                            desc="Developing a reinforcement learning model for cable tension."
                            progress={75}
                            members={4}
                        />
                        <MockProjectCard
                            title="Eco-City Planner"
                            desc="Urban planning simulations with sustainable focus."
                            progress={30}
                            members={2}
                        />
                        <MockProjectCard
                            title="Mars Colony V2"
                            desc="Architectural blueprints for the first settlement."
                            progress={90}
                            members={6}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className={`lg:col-span-2 p-6 rounded-xl ${t.card}`}>
                            <h3 className={`text-lg font-semibold mb-4 ${t.text}`}>Project Activity</h3>
                            <div className="space-y-4">
                                {[1, 2, 3].map((_, i) => (
                                    <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-current/5 transition-colors">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentTheme === 'gamified' ? 'bg-[#f5c2e7]' : 'bg-primary/10'}`}>
                                            <FileText size={18} className={t.accent} />
                                        </div>
                                        <div>
                                            <p className={`text-sm font-medium ${t.text}`}>Updated the documentation for <span className="opacity-70">Space Elevator AI</span></p>
                                            <p className="text-xs opacity-50">2 hours ago</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={`p-6 rounded-xl ${t.card}`}>
                            <h3 className={`text-lg font-semibold mb-4 ${t.text}`}>Team Online</h3>
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map((_, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-8 h-8 rounded-full bg-gray-400" />
                                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-transparent" />
                                            </div>
                                            <span className={`text-sm ${t.text}`}>Dev Team Member {i}</span>
                                        </div>
                                        <Button variant="ghost" size="icon" className={`opacity-50 hover:opacity-100 ${t.text}`}>
                                            <MessageSquare size={16} />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </main>
        </div>
    );
}
