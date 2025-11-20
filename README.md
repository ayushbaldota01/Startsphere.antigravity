# StartSphere - Project Management & Collaboration Platform

## Overview

StartSphere is a comprehensive project management and collaboration platform designed to help teams organize, collaborate, and showcase their work. The platform provides a structured workspace for each project with real-time collaboration features, file management, report generation, and portfolio showcase capabilities.

## Table of Contents

- [Product Vision](#product-vision)
- [Core Features](#core-features)
- [User Personas](#user-personas)
- [User Workflows](#user-workflows)
- [Feature Details](#feature-details)
- [Technology Stack](#technology-stack)
- [Data Architecture](#data-architecture)
- [Security & Data Isolation](#security--data-isolation)
- [Getting Started](#getting-started)

---

## Product Vision

StartSphere aims to provide a unified workspace where teams can:
- **Organize** projects with structured information
- **Collaborate** in real-time with team members
- **Store** and manage project files securely
- **Generate** professional reports and documentation
- **Showcase** completed work through personal portfolios

The platform emphasizes **proper data containerization** to ensure each project operates in complete isolation, preventing any data mixing or overlap between projects.

---

## Core Features

### 1. Project Management
- Create and manage multiple projects
- Structured project information (name, domain, description, abstract, problem statement, solution approach)
- Project dashboard with overview and statistics
- Role-based access control (Admin/Member)

### 2. Team Collaboration
- Add/remove team members
- Role assignment (Admin/Member)
- Real-time member presence
- Team activity tracking

### 3. Real-Time Communication
- **Conference Room (Chat)**: Real-time team chat with message history
- **Scratch Pad (Notes)**: Shared note-taking space for quick ideas
- Real-time updates using WebSocket (Socket.IO)
- Message persistence and history

### 4. Task Management
- **Work Table**: Organize project tasks
- Task assignment to team members
- Task status tracking
- Real-time task updates

### 5. File Management
- **File Shelf**: Upload and store project files
- Version control for files
- Support for multiple file types
- Cloud storage integration (Supabase Storage)
- File download and sharing
- File metadata tracking (size, type, upload date, uploader)

### 6. Report Generation
- Professional PDF report generation
- Auto-populated project information
- Customizable report templates
- Team member details inclusion
- Export and download capabilities

### 7. Portfolio Showcase
- Personal portfolio creation
- Project showcase with descriptions
- Custom profile with bio and links
- Public portfolio URL for sharing

### 8. User Management
- Secure authentication (Supabase Auth)
- User profiles with bio
- Email-based registration
- Session management

---

## User Personas

### 1. Project Creator / Admin
- Creates and manages projects
- Adds/removes team members
- Has full access to all project features
- Generates reports
- Configures project settings

### 2. Team Member
- Collaborates on assigned projects
- Participates in chat and notes
- Uploads and downloads files
- Manages assigned tasks
- Views project information

### 3. Portfolio User
- Creates personal portfolio
- Showcases completed projects
- Shares portfolio link publicly
- Updates profile information

---

## User Workflows

### Workflow 1: Creating and Setting Up a New Project

1. **User Authentication**
   - User registers/logs in to the platform
   - System validates credentials and creates session

2. **Project Creation**
   - User clicks "Create New Project" from dashboard
   - System displays project creation form
   - User fills in project details:
     - **Name**: Project title (required)
     - **Domain**: Project category/domain (optional)
     - **Description**: Brief project description (optional)
     - **Abstract**: Detailed project abstract (optional)
     - **Problem Statement**: Problem being solved (optional)
     - **Solution Approach**: Proposed solution (optional)
   - User submits the form
   - System creates project with unique ID
   - System adds creator as project Admin
   - System displays success message
   - User is redirected to project overview

3. **Initial Project Configuration**
   - User reviews project overview
   - User adds team members (optional):
     - Click "Add Member" button
     - Enter team member email
     - Select role (Admin/Member)
     - System sends invitation/adds member
   - User can now start using project features

### Workflow 2: Daily Project Collaboration

1. **Accessing Project**
   - User logs in to platform
   - Dashboard displays all projects user is member of
   - User clicks on desired project card
   - System loads project workspace

2. **Project Overview (Office Overview)**
   - View project details and information
   - See team members and their roles
   - Quick access to project statistics
   - Recent activity feed

3. **Task Management (Work Table)**
   - View all project tasks
   - Create new tasks
   - Assign tasks to team members
   - Update task status
   - Real-time task updates visible to all members

4. **Team Communication (Conference Room)**
   - Open chat interface
   - Send messages to team
   - View message history
   - See real-time messages from other members
   - Messages persist in database

5. **Note Taking (Scratch Pad)**
   - Add quick notes and ideas
   - View team notes
   - Real-time note updates
   - Organized note history

6. **File Management (File Shelf)**
   - Upload project files:
     - Click "Upload File" button
     - Select file from device
     - System uploads to cloud storage
     - File appears in file list with metadata
   - Download files:
     - Click download button on any file
     - System retrieves file from storage
     - File downloads to user's device
   - View file information (name, size, type, uploader, date)
   - Version tracking for updated files

7. **Report Generation**
   - Navigate to Report tab
   - Click "Generate Report (PDF)"
   - Review auto-populated information
   - Customize report fields if needed
   - Click "Generate PDF"
   - System creates PDF using project data
   - Report downloads automatically
   - Report saved with project

8. **Settings Management**
   - Navigate to Settings tab
   - Update project information
   - Manage team members
   - Configure project preferences
   - Save changes

### Workflow 3: Building a Portfolio

1. **Creating Portfolio**
   - User navigates to Portfolio section
   - Clicks "Create Portfolio" or "Edit Portfolio"
   - Fills in portfolio information:
     - Display Name
     - Title/Role
     - Bio
     - Social/Website links
   - Saves portfolio

2. **Adding Projects to Portfolio**
   - User selects "Add Project" in portfolio
   - Enters project details:
     - Project name
     - Abstract
     - Problem solved
     - Solution implemented
     - Role in project
   - Attaches project to portfolio
   - System saves portfolio project

3. **Sharing Portfolio**
   - User accesses portfolio URL
   - Shares URL publicly
   - Others can view portfolio without authentication

### Workflow 4: Team Member Management

1. **Adding Team Members**
   - Project Admin opens project
   - Clicks "Add Member" button
   - Enters member email address
   - Selects role (Admin/Member)
   - Submits invitation
   - System adds user to project
   - Real-time notification to all members
   - New member appears in team list

2. **Managing Member Roles**
   - Admin navigates to Settings tab
   - Views team member list
   - Changes member role (Admin ↔ Member)
   - Removes members if needed
   - System updates permissions immediately

---

## Feature Details

### Project Workspace Structure

Each project is organized as a virtual "Office" with specialized rooms:

1. **📊 Office Overview**
   - Project information display
   - Team roster
   - Project statistics
   - Quick links to other sections

2. **🪑 Work Table**
   - Task kanban board
   - Task creation and assignment
   - Status tracking
   - Progress visualization

3. **🏛️ Conference Room**
   - Real-time chat interface
   - Message threading
   - Message persistence
   - Online presence indicators

4. **📝 Scratch Pad**
   - Shared note-taking
   - Quick idea capture
   - Note organization
   - Collaborative editing

5. **📚 File Shelf**
   - File upload/download
   - File versioning
   - Storage management
   - File metadata

6. **📄 Report**
   - PDF report generation
   - Template-based reports
   - Custom fields
   - Export functionality

7. **⚙️ Settings**
   - Project configuration
   - Team management
   - Access control
   - Project metadata

### Real-Time Features

The platform uses **Socket.IO** for real-time updates:

- **Chat Messages**: Instant message delivery to all participants
- **Notes**: Real-time note synchronization
- **Task Updates**: Live task status changes
- **Member Activity**: Real-time member join/leave notifications
- **File Uploads**: Instant file list updates

**Connection Management:**
- Client connects to Socket.IO server on project access
- Client joins project-specific room
- Messages broadcast only to room members
- Automatic reconnection on disconnect
- Message persistence ensures no data loss

### File Storage System

**Storage Technology**: Supabase Storage

**Features:**
- Cloud-based file storage
- Public/private access control
- File versioning support
- Metadata tracking
- Direct upload/download URLs
- Automatic file cleanup on project deletion

**File Workflow:**
1. User selects file for upload
2. Frontend validates file (size, type)
3. File uploads to Supabase Storage bucket
4. System generates file URL
5. Metadata saved to database
6. File appears in project file list
7. Download uses direct Supabase URL

---

## Technology Stack

### Frontend
- **React.js**: UI framework
- **TypeScript**: Type-safe JavaScript
- **React Router**: Client-side routing
- **Socket.IO Client**: Real-time communication
- **Axios**: HTTP requests
- **Vite**: Build tool and dev server

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **TypeScript**: Type-safe server code
- **Socket.IO**: Real-time WebSocket server
- **Prisma**: Database ORM
- **Multer**: File upload handling
- **Puppeteer**: PDF generation
- **Handlebars**: Template engine

### Database
- **PostgreSQL**: Relational database
- **Supabase**: Database hosting and services

### Authentication
- **Supabase Auth**: User authentication service
- **JWT**: Session token management

### File Storage
- **Supabase Storage**: Cloud file storage
- **Bucket-based organization**: Files isolated by project

### Real-Time Communication
- **Socket.IO**: WebSocket-based real-time engine
- **Room-based messaging**: Project-specific channels
- **Event-driven architecture**: Publish-subscribe pattern

---

## Data Architecture

### Database Schema

The platform uses **PostgreSQL** with **Prisma ORM** for type-safe database access.

**Core Models:**

1. **User**
   - id, name, email, bio
   - Authentication credentials
   - Profile information

2. **Project**
   - id, name, domain, description
   - abstract, problemStatement, solutionApproach
   - createdById (creator reference)
   - Timestamps

3. **ProjectMember**
   - userId, projectId, role
   - Join timestamp
   - Role (ADMIN/MEMBER)

4. **File**
   - id, originalName, mimeType, size
   - fileUrl (Supabase Storage URL)
   - projectId, uploadedById
   - Version tracking

5. **ChatMessage**
   - id, projectId, userId
   - author, text
   - Timestamp

6. **ProjectNote**
   - id, projectId, userId
   - author, text
   - Timestamp

7. **Report**
   - id, projectId, status
   - Timestamp

8. **Portfolio**
   - userId, displayName, title, bio
   - Links, avatar

9. **PortfolioProject**
   - portfolioId, name, abstract
   - problem, solution, roles

### Data Relationships

```
User (1) ─────< (M) Project (created projects)
User (1) ─────< (M) ProjectMember (project memberships)
Project (1) ───< (M) ProjectMember (team members)
Project (1) ───< (M) File (project files)
Project (1) ───< (M) ChatMessage (chat messages)
Project (1) ───< (M) ProjectNote (project notes)
Project (1) ───< (M) Report (generated reports)
User (1) ──────< (1) Portfolio (personal portfolio)
Portfolio (1) ─< (M) PortfolioProject (portfolio projects)
```

---

## Security & Data Isolation

### Project Containerization

**Critical Requirement**: Each project must operate in complete isolation to prevent data mixing or overlap.

### Implementation Strategy

#### 1. Database Level Isolation

**Foreign Key Constraints:**
- Every project-related record has `projectId` foreign key
- Database enforces referential integrity
- Cascade deletes maintain consistency

**Example:**
```sql
-- ChatMessage table
projectId INT NOT NULL,
FOREIGN KEY (projectId) REFERENCES Project(id) ON DELETE CASCADE
```

**Query Filtering:**
- All queries scoped by projectId
- No cross-project data access
- ORM-level security filters

**Example:**
```typescript
// Get messages only for specific project
const messages = await prisma.chatMessage.findMany({
  where: { projectId: projectId }
})
```

#### 2. Application Level Isolation

**Middleware Authentication:**
- Every request requires valid user token
- Token validated before any operation

**Permission Checks:**
- Project membership verified before access
- Role-based permissions enforced
- Admin-only operations protected

**Example Flow:**
```typescript
1. Request arrives with JWT token
2. authMiddleware validates token
3. Get userId from token
4. Check if user is project member:
   - Query ProjectMember table
   - Verify userId + projectId exists
5. If member, allow access
6. If not member, return 403 Forbidden
```

#### 3. Real-Time Isolation

**Socket.IO Room-Based Isolation:**
- Each project has unique room ID
- Users join room only for their projects
- Messages broadcast only within room

**Room Naming:**
```typescript
const roomId = `project:${projectId}`
socket.join(roomId)
io.to(roomId).emit('message', data)
```

**Benefits:**
- No cross-project message leakage
- Automatic user isolation
- Scalable architecture

#### 4. File Storage Isolation

**Supabase Storage Organization:**
- Files organized by project in storage paths
- Project-specific access policies
- URL-based access control

**Storage Structure:**
```
/files
  /project-123
    /file1.pdf
    /file2.png
  /project-456
    /document.docx
```

**Access Control:**
- File URLs include project reference
- Backend validates project membership before serving
- Cloud storage policies enforce access rules

#### 5. Data Deletion Cascade

**Automatic Cleanup:**
```sql
ON DELETE CASCADE
```

When project deleted:
- All project members removed
- All files deleted from storage
- All chat messages deleted
- All notes deleted
- All reports deleted
- Complete data cleanup

**Prevents:**
- Orphaned data
- Storage leaks
- Privacy issues

### Data Isolation Guarantees

| Level | Mechanism | Result |
|-------|-----------|--------|
| **Database** | Foreign keys + WHERE clauses | No cross-project queries |
| **API** | Membership checks | No unauthorized access |
| **Real-time** | Socket.IO rooms | No message leakage |
| **Storage** | Path-based isolation | No file access across projects |
| **Deletion** | Cascade constraints | Complete cleanup |

### Security Best Practices

1. **Authentication Required**: Every endpoint requires valid token
2. **Membership Verification**: Project access verified per request
3. **Role-Based Access**: Admin operations restricted by role
4. **Input Validation**: All user input validated and sanitized
5. **SQL Injection Prevention**: ORM (Prisma) prevents SQL injection
6. **XSS Prevention**: Output sanitization in templates
7. **CORS Configuration**: Restricted origins for API access

---

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database (or Supabase account)
- Supabase account (for Auth and Storage)

### Installation

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd startsphere
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables**

   **Backend** (`apps/api/.env`):
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/database"
   SUPABASE_URL="https://your-project.supabase.co"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   SUPABASE_ANON_KEY="your-anon-key"
   PORT=8080
   USE_SUPABASE_STORAGE=true
   ```

   **Frontend** (`apps/web/.env`):
   ```env
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-key"
   ```

4. **Initialize Database**
   ```bash
   cd apps/api
   pnpm prisma db push
   ```

5. **Start Development Servers**
   ```bash
   # Terminal 1 - Backend
   cd apps/api
   pnpm dev

   # Terminal 2 - Frontend
   cd apps/web
   pnpm dev
   ```

6. **Access Platform**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080
   - Health Check: http://localhost:8080/api/health

### First Steps

1. **Register Account**: Create your first user account
2. **Create Project**: Start your first project
3. **Explore Features**: Try chat, notes, file upload
4. **Invite Team**: Add team members to collaborate
5. **Generate Report**: Create your first PDF report
6. **Build Portfolio**: Showcase your projects

---

## Platform Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (React)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │Dashboard │ │ Projects │ │ Profile  │ │Portfolio │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            │ HTTP / WebSocket
                            │
┌─────────────────────────────────────────────────────────┐
│                   Backend (Express + Socket.IO)          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │   Auth   │ │ Projects │ │  Files   │ │  Socket  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
    ┌───────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
    │  PostgreSQL  │ │  Supabase │ │   Supabase  │
    │   Database   │ │    Auth   │ │   Storage   │
    └──────────────┘ └───────────┘ └─────────────┘
```

### Request Flow Examples

**Example 1: Creating a Project**
```
1. User fills project form
2. Frontend validates input
3. POST /api/projects with data
4. authMiddleware verifies user token
5. Backend creates project in database
6. Backend adds user as Admin member
7. Backend emits Socket.IO event
8. Response sent to frontend
9. Frontend updates UI
10. Other users see real-time update
```

**Example 2: Sending Chat Message**
```
1. User types message in chat
2. Socket.IO emits 'chat:message' event
3. Backend receives event
4. Backend validates project membership
5. Backend saves message to database
6. Backend broadcasts to project room
7. All room members receive message
8. Frontend updates chat UI
```

**Example 3: File Upload**
```
1. User selects file
2. Frontend creates FormData
3. POST /api/files/upload
4. authMiddleware validates user
5. Multer processes file upload
6. File uploaded to Supabase Storage
7. Storage returns file URL
8. Metadata saved to database
9. Response with file info
10. Frontend displays file in list
```

---

## Conclusion

StartSphere provides a complete project management solution with strong emphasis on:
- **Structured Workflows**: Clear user paths from project creation to completion
- **Real-Time Collaboration**: Instant communication and updates
- **Data Isolation**: Guaranteed project containerization
- **Scalable Architecture**: Modern tech stack for growth
- **User Experience**: Intuitive interface and smooth workflows

The platform is designed to grow with teams, providing all necessary tools for project success while maintaining security and data integrity.

---

## License

[Specify License Here]

## Contact

[Add Contact Information]
#   S t a r t s p h e r e . a n t i g r a v i t y  
 