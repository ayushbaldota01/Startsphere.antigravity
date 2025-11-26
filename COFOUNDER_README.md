# StartSphere - Project Collaboration Platform

## 🎯 Project Overview

**StartSphere** is a comprehensive project management and collaboration platform designed specifically for students and teams to organize, collaborate, and showcase their projects. Think of it as a combination of Slack, Trello, and GitHub, but tailored for academic and startup projects.

The platform provides a structured workspace where teams can manage everything from initial project planning to final portfolio presentation - all in one place.

---

## 🚀 What Problem Are We Solving?

Students and startup teams often struggle with:
- **Scattered tools**: Using multiple platforms (Discord for chat, Google Drive for files, Trello for tasks)
- **Poor organization**: Losing track of project details, team members, and progress
- **No portfolio**: Difficulty showcasing completed projects professionally
- **Collaboration chaos**: No centralized space for real-time team collaboration

**Our Solution**: A unified platform that brings all project collaboration needs under one roof with a clean, intuitive interface.

---

## 🏗️ Technology Stack

### Frontend
- **React 18** with **TypeScript** - Type-safe, modern UI development
- **Vite** - Lightning-fast build tool and dev server
- **React Router** - Client-side routing for SPA navigation
- **TanStack Query** - Powerful data fetching and caching
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **Radix UI** - Accessible, unstyled component primitives
- **Shadcn/ui** - Beautiful, customizable component library built on Radix

### Backend & Database
- **Supabase** - Complete backend solution providing:
  - **PostgreSQL Database** - Robust relational database
  - **Authentication** - Secure user auth with JWT tokens
  - **Storage** - Cloud file storage for project files
  - **Real-time Subscriptions** - Live updates for chat and collaboration
  - **Row Level Security (RLS)** - Database-level security policies

### Key Libraries
- **React Hook Form** + **Zod** - Form handling with validation
- **Lucide React** - Beautiful icon library
- **date-fns** - Modern date utility library
- **Sonner** - Toast notifications
- **cmdk** - Command palette component

---

## ✨ Core Features

### 1. 🔐 User Authentication & Profiles
- **Secure Registration/Login** using Supabase Auth
- **User Roles**: Student or Mentor
- **Profile Management**: Bio, university, major, avatar
- **Session Management**: Secure JWT-based authentication

### 2. 📁 Project Management
Each project is like a virtual "office" with multiple rooms:

#### **📊 Office Overview**
- Complete project information dashboard
- Team member roster with roles (Admin/Member)
- Project statistics and progress tracking
- Quick access to all project sections

#### **🪑 Work Table (Task Management)**
- Create and assign tasks to team members
- Task status tracking (TODO, IN_PROGRESS, DONE)
- Due date management
- Real-time task updates across all team members

#### **🏛️ Conference Room (Team Chat)**
- Real-time messaging for team communication
- Message history persistence
- Instant message delivery to all online members
- Clean, modern chat interface

#### **📝 Scratch Pad (Shared Notes)**
- Collaborative note-taking space
- Quick idea capture and brainstorming
- Real-time note synchronization
- Organized note history

#### **📚 File Shelf (File Management)**
- Upload and store project files securely
- Support for all file types
- File metadata tracking (name, size, type, uploader, date)
- Download files anytime
- Cloud storage via Supabase Storage

### 3. 👥 Team Collaboration
- **Add/Remove Members**: Admins can manage team composition
- **Role-Based Access Control**: 
  - **Admin**: Full project control, can add/remove members
  - **Member**: Can collaborate but limited admin functions
- **Real-time Presence**: See who's active in the project
- **Email-based Invitations**: Add members by email address

### 4. 🎨 Portfolio Showcase
- **Personal Portfolio Creation**: Showcase your completed projects
- **Custom Profile**: Display name, title, bio, location
- **Social Links**: GitHub, LinkedIn, personal website
- **Project Showcase**: Add projects with descriptions and details
- **Skills & Experience**: Highlight your expertise
- **Education**: Display academic background
- **Public Sharing**: Share your portfolio URL with anyone

### 5. 📄 Report Generation (Planned)
- Professional PDF report generation
- Auto-populated project information
- Team member details inclusion
- Export and download capabilities

---

## 🤖 How We Use AI in This App

Currently, the application **does not have AI features implemented**, but here are the planned AI integrations:

### Planned AI Features:

1. **Smart Task Suggestions**
   - AI analyzes project description and suggests relevant tasks
   - Automatically breaks down complex goals into actionable items
   - Recommends task priorities based on project timeline

2. **Intelligent Chat Assistant**
   - AI-powered chatbot in the Conference Room
   - Answers project-related questions
   - Suggests solutions to common problems
   - Summarizes long chat conversations

3. **Automated Report Generation**
   - AI generates professional project reports
   - Automatically extracts key information from project data
   - Creates executive summaries
   - Suggests improvements and next steps

4. **Smart File Organization**
   - AI categorizes uploaded files automatically
   - Suggests folder structures
   - Identifies duplicate or similar files

5. **Portfolio Enhancement**
   - AI suggests improvements to portfolio descriptions
   - Generates professional project summaries
   - Recommends skills to highlight based on projects

6. **Meeting Summarization**
   - AI summarizes chat conversations into action items
   - Generates meeting notes from Conference Room discussions
   - Identifies key decisions and deadlines

**Note**: These AI features are in the planning phase and will be implemented using services like OpenAI GPT-4, Google Gemini, or similar AI APIs.

---

## 🗄️ Database Architecture

### Core Tables:

1. **users** - User profiles and authentication
   - id, email, name, bio, avatar_url, role, university, major

2. **projects** - Project information
   - id, name, domain, description, abstract, problem_statement, solution_approach, created_by

3. **project_members** - Team memberships
   - id, project_id, user_id, role (ADMIN/MEMBER)

4. **tasks** - Work table tasks
   - id, project_id, title, description, status, assignee_id, due_date

5. **chat_messages** - Conference room messages
   - id, project_id, user_id, content, created_at

6. **notes** - Scratch pad notes
   - id, project_id, user_id, content

7. **files** - File shelf storage
   - id, project_id, file_name, file_path, file_size, mime_type, uploaded_by

8. **portfolios** - User portfolios
   - id, user_id, display_name, title, bio, location, social links

9. **portfolio_projects** - Portfolio project showcases
   - id, portfolio_id, title, description, technologies, github_url, demo_url

10. **portfolio_skills** - Portfolio skills
11. **portfolio_experience** - Work experience
12. **portfolio_education** - Educational background

### Security Features:

- **Row Level Security (RLS)**: Database-level access control
- **Project Isolation**: Users can only access projects they're members of
- **Role-Based Permissions**: Admins have additional privileges
- **Secure Authentication**: JWT tokens with Supabase Auth
- **Data Encryption**: All data encrypted at rest and in transit

---

## 🔄 Real-Time Features

We use **Supabase Real-time Subscriptions** for instant updates:

- **Chat Messages**: Instant delivery to all team members
- **Task Updates**: Live task status changes
- **Notes**: Real-time note synchronization
- **Member Activity**: Live member join/leave notifications
- **File Uploads**: Instant file list updates

**How it works**:
1. Client subscribes to project-specific channels
2. Database changes trigger real-time events
3. All connected clients receive updates instantly
4. No page refresh needed - everything updates live

---

## 📂 Project Structure

```
Phase 1.2/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Shadcn/ui components
│   │   ├── project/        # Project-specific components
│   │   ├── Sidebar.tsx     # Main navigation sidebar
│   │   ├── ProjectCard.tsx # Project card component
│   │   └── ...
│   ├── pages/              # Page components
│   │   ├── Dashboard.tsx   # Main dashboard
│   │   ├── ProjectDetail.tsx # Project workspace
│   │   ├── Login.tsx       # Authentication pages
│   │   ├── Profile.tsx     # User profile
│   │   └── Portfolio.tsx   # Portfolio showcase
│   ├── hooks/              # Custom React hooks
│   │   ├── useProjects.ts  # Project data management
│   │   ├── useTasks.ts     # Task management
│   │   └── ...
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx # Authentication context
│   ├── lib/                # Utility libraries
│   │   └── supabase.ts     # Supabase client
│   └── services/           # API services
│       └── api.ts          # API utilities
├── public/                 # Static assets
├── supabase-schema.sql     # Database schema
├── package.json            # Dependencies
└── vite.config.ts          # Vite configuration
```

---

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or pnpm package manager
- Supabase account (free tier works)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "Phase 1.2"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL schema from `supabase-schema.sql` in Supabase SQL Editor
   - Create a storage bucket named `project-files`

4. **Configure environment variables**
   Create a `.env` file in the root:
   ```env
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open the app**
   Navigate to `http://localhost:5173`

---

## 🎯 User Workflows

### Creating a New Project
1. Register/Login to the platform
2. Click "Create New Project" from dashboard
3. Fill in project details (name, domain, description, etc.)
4. Project is created with you as Admin
5. Add team members by email
6. Start collaborating!

### Daily Collaboration
1. Login and view all your projects on dashboard
2. Click on a project to enter the workspace
3. Use different tabs:
   - **Overview**: See project info and team
   - **Work Table**: Manage tasks
   - **Conference Room**: Chat with team
   - **Scratch Pad**: Take quick notes
   - **File Shelf**: Upload/download files

### Building Your Portfolio
1. Navigate to Profile → Portfolio
2. Create your portfolio with personal info
3. Add completed projects with descriptions
4. Add skills, experience, and education
5. Share your portfolio URL publicly

---

## 🔒 Security & Data Isolation

### Project Containerization
Each project operates in complete isolation:

- **Database Level**: All queries filtered by `project_id`
- **Row Level Security**: Supabase RLS policies enforce access control
- **Membership Verification**: Every request checks project membership
- **Real-time Isolation**: Messages only sent to project members
- **File Storage**: Files organized by project with access control

### Authentication Flow
1. User registers with email/password
2. Supabase creates auth user and sends verification email
3. User profile created in `users` table
4. JWT token issued for session management
5. Token validated on every request
6. Protected routes require valid authentication

---

## 🎨 Design Philosophy

- **Clean & Modern**: Minimalist interface with focus on usability
- **Responsive**: Works seamlessly on desktop, tablet, and mobile
- **Accessible**: Built with Radix UI for WCAG compliance
- **Dark Mode Ready**: Theme support built-in
- **Intuitive Navigation**: Clear hierarchy and easy-to-find features

---

## 📊 Current Status

### ✅ Completed Features
- User authentication and profiles
- Project creation and management
- Team member management with roles
- Task management (Work Table)
- Real-time chat (Conference Room)
- Shared notes (Scratch Pad)
- File upload/download (File Shelf)
- Portfolio creation and showcase
- Responsive UI with Tailwind CSS
- Database schema with RLS policies
- Real-time subscriptions

### 🚧 In Progress
- Report generation (PDF export)
- Advanced task filtering and sorting
- File versioning
- Project templates
- Activity feed/notifications

### 📋 Planned Features
- AI-powered features (as listed above)
- Video conferencing integration
- Calendar and deadline tracking
- Project analytics and insights
- Mobile app (React Native)
- Integration with GitHub, Jira, etc.
- Advanced search functionality
- Project archiving

---

## 🐛 Known Issues

1. **Project Creation**: Fixed in recent deployment (was having RLS policy issues)
2. **File Upload**: Large files (>50MB) may timeout - need to implement chunked uploads
3. **Real-time**: Occasional reconnection needed after long idle periods

---

## 🚀 Deployment

### Current Deployment
- **Platform**: Vercel
- **Database**: Supabase (hosted PostgreSQL)
- **Storage**: Supabase Storage
- **Domain**: [Your production URL]

### Deployment Process
1. Push code to GitHub
2. Vercel auto-deploys from main branch
3. Environment variables configured in Vercel dashboard
4. Database migrations run manually in Supabase

---

## 📈 Future Roadmap

### Phase 1 (Current) - MVP ✅
- Core project management features
- Basic collaboration tools
- Portfolio showcase

### Phase 2 (Next 3 months)
- AI integration for smart suggestions
- Advanced reporting and analytics
- Mobile responsiveness improvements
- Performance optimizations

### Phase 3 (6 months)
- Mobile app development
- Third-party integrations
- Advanced AI features
- Enterprise features (SSO, custom domains)

### Phase 4 (1 year)
- Marketplace for project templates
- Community features
- Monetization (premium plans)
- API for developers

---

## 🤝 Contributing

This is a private project currently in development. If you want to contribute:

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request with detailed description

---

## 📞 Contact & Support

- **Project Lead**: [Your Name]
- **Co-Founder**: [Co-founder Name]
- **Email**: [Contact Email]
- **GitHub**: [Repository URL]

---

## 📝 License

[Specify your license here - MIT, Proprietary, etc.]

---

## 🙏 Acknowledgments

- **Supabase** - For the amazing backend platform
- **Shadcn/ui** - For the beautiful component library
- **Vercel** - For seamless deployment
- **React Community** - For the incredible ecosystem

---

## 💡 Key Differentiators

What makes StartSphere unique:

1. **All-in-One Solution**: No need for multiple tools
2. **Student-Focused**: Designed specifically for academic and startup projects
3. **Portfolio Integration**: Seamlessly showcase your work
4. **Real-time Collaboration**: Instant updates across all features
5. **Clean UX**: Simple, intuitive interface that doesn't overwhelm
6. **Secure by Default**: Database-level security with RLS
7. **Free to Start**: Generous free tier for students

---

## 🎓 Target Audience

- **University Students**: Working on group projects and assignments
- **Startup Teams**: Early-stage teams building MVPs
- **Bootcamp Students**: Collaborative learning projects
- **Research Groups**: Academic research collaboration
- **Freelancers**: Managing client projects and portfolios

---

## 📊 Metrics & Goals

### Current Metrics
- Projects Created: [Track this]
- Active Users: [Track this]
- Files Uploaded: [Track this]
- Messages Sent: [Track this]

### Goals for Next Quarter
- 100 active users
- 50 projects created
- 90% user retention rate
- <2s average page load time

---

**Last Updated**: November 26, 2024

**Version**: 1.0.0 (Phase 1.2)
