# TaskFlow - Project Management Web App

## 1. Project Overview

**Project Name:** TaskFlow  
**Type:** Full-stack Web Application  
**Core Functionality:** A project management platform where users can create projects, assign tasks to team members, and track progress with role-based access control (Admin/Member).  
**Target Users:** Teams, startups, and organizations needing task tracking and project management.

---

## 2. Technology Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** SQLite (better-sqlite3)
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcryptjs
- **Validation:** express-validator

### Frontend
- **Framework:** React 18 with Vite
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Icons:** Lucide React
- **State:** React Context + useState

---

## 3. Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT CHECK(role IN ('admin', 'member')) DEFAULT 'member',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Projects Table
```sql
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  owner_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);
```

### Project Members Table (Many-to-Many)
```sql
CREATE TABLE project_members (
  project_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT CHECK(role IN ('admin', 'member')) DEFAULT 'member',
  PRIMARY KEY (project_id, user_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Tasks Table
```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK(status IN ('todo', 'in_progress', 'review', 'done')) DEFAULT 'todo',
  priority TEXT CHECK(priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  due_date DATE,
  project_id INTEGER NOT NULL,
  assigned_to INTEGER,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

---

## 4. REST API Endpoints

### Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /api/auth/register | Register new user | Public |
| POST | /api/auth/login | Login user | Public |
| GET | /api/auth/me | Get current user | Auth |

### Users
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/users | List all users | Admin |
| GET | /api/users/:id | Get user by ID | Auth |

### Projects
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/projects | List user's projects | Auth |
| POST | /api/projects | Create project | Auth |
| GET | /api/projects/:id | Get project details | Member |
| PUT | /api/projects/:id | Update project | Admin |
| DELETE | /api/projects/:id | Delete project | Admin |
| POST | /api/projects/:id/members | Add member to project | Admin |
| DELETE | /api/projects/:id/members/:userId | Remove member | Admin |
| GET | /api/projects/:id/members | List project members | Member |

### Tasks
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/projects/:projectId/tasks | List project tasks | Member |
| POST | /api/projects/:projectId/tasks | Create task | Member |
| GET | /api/tasks/:id | Get task details | Member |
| PUT | /api/tasks/:id | Update task | Member |
| DELETE | /api/tasks/:id | Delete task | Member |

### Dashboard
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/dashboard/stats | Get dashboard stats | Auth |
| GET | /api/dashboard/overdue | Get overdue tasks | Auth |

---

## 5. Role-Based Access Control

### Roles
1. **Admin** - Can manage projects, assign members, delete tasks, manage users
2. **Member** - Can create/view tasks in assigned projects, update own tasks

### Permissions Matrix
| Action | Admin (Project) | Member (Project) |
|--------|----------------|----------------|
| Create project | ✓ | ✗ |
| Delete project | ✓ | ✗ |
| Add/remove members | ✓ | ✗ |
| Create tasks | ✓ | ✓ |
| Update any task | ✓ | ✓ |
| Delete any task | ✓ | ✗ |
| Update own task | ✓ | ✓ |

---

## 6. UI/UX Specification

### Color Palette
- **Background:** #0f0f0f (dark)
- **Surface:** #1a1a1a
- **Surface Elevated:** #242424
- **Primary:** #3b82f6 (blue)
- **Primary Hover:** #2563eb
- **Success:** #22c55e (green)
- **Warning:** #f59e0b (amber)
- **Danger:** #ef4444 (red)
- **Text Primary:** #ffffff
- **Text Secondary:** #a1a1a1
- **Text Muted:** #6b6b6b
- **Border:** #2a2a2a

### Typography
- **Font Family:** "Inter", system-ui, -apple-system, sans-serif
- **Headings:** 700 weight
  - H1: 2rem
  - H2: 1.5rem
  - H3: 1.25rem
- **Body:** 400 weight, 1rem
- **Small:** 0.875rem
- **XSmall:** 0.75rem

### Layout
- **Max Width:** 1400px (content area)
- **Sidebar:** 260px fixed width
- **Content Padding:** 24px
- **Card Padding:** 20px
- **Border Radius:** 12px (cards), 8px (buttons), 6px (inputs)
- **Gap:** 16px (grid), 12px (elements)

### Responsive Breakpoints
- **Mobile:** < 768px (sidebar collapses to drawer)
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

### Components

#### Sidebar Navigation
- Logo at top
- Navigation items with icons
- User profile at bottom
- Active state: blue highlight on left border

#### Cards
- Dark surface background (#1a1a1a)
- Subtle border
- Hover state: slight elevation

#### Buttons
- Primary: Blue background, white text
- Secondary: Transparent, border
- Danger: Red background
- Disabled: 50% opacity

#### Form Inputs
- Dark background (#242424)
- Border on focus (blue)
- Error state: red border
- Placeholder: muted text

#### Badges
- Status badges with appropriate colors:
  - Todo: Gray (#6b6b6b)
  - In Progress: Blue (#3b82f6)
  - Review: Amber (#f59e0b)
  - Done: Green (#22c55e)
- Priority badges:
  - Low: Gray
  - Medium: Blue
  - High: Red

#### Task Card
- Title, description preview
- Status dropdown
- Priority indicator
- Assignee avatar
- Due date with overdue indicator

---

## 7. Pages

### 1. Login Page
- Logo
- Email input
- Password input
- Login button
- Register link

### 2. Register Page
- Username input
- Email input
- Password input
- Confirm password
- Register button
- Login link

### 3. Dashboard (Home)
- Welcome message with user name
- Stats cards: Total Tasks, In Progress, Completed, Overdue
- Recent projects grid
- Overdue tasks list

### 4. Projects Page
- Projects grid (cards)
- Create project button (Admin)
- Project card: name, description, member count, task count

### 5. Project Detail Page
- Project header (name, description)
- Members list
- Tasks list with filters
- Task creation form
- Task cards (drag-drop ready for future)

### 6. Task Detail/Edit Modal
- Title input
- Description textarea
- Status dropdown
- Priority dropdown
- Assignee dropdown
- Due date picker
- Save/Cancel buttons

### 7. Users Page (Admin only)
- Users list table
- Add user button
- Edit role functionality

---

## 8. Acceptance Criteria

### Authentication
- [ ] Users can register with username, email, password
- [ ] Users can login with email and password
- [ ] JWT token is stored and sent with requests
- [ ] Protected routes redirect to login

### Projects
- [ ] Admins can create new projects
- [ ] Admins can add members to projects
- [ ] Admins can delete projects
- [ ] Members can view assigned projects
- [ ] Project owner can edit project details

### Tasks
- [ ] Members can create tasks in assigned projects
- [ ] Members can update task status
- [ ] Members can assign tasks to other members
- [ ] Due date can be set, shows overdue indicator
- [ ] Tasks can be filtered by status

### Dashboard
- [ ] Shows task counts by status
- [ ] Shows overdue task count
- [ ] Shows recent projects
- [ ] Shows overdue tasks list

### Role-Based Access
- [ ] Regular users can register as 'member' role
- [ ] First registered user can be promoted to admin manually
- [ ] Admins can access user management
- [ ] Only project admins can add/remove members

---

## 9. Project Structure

```
ethara/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── tasks.js
│   │   ├── users.js
│   │   └── dashboard.js
│   ├── index.js
│   ├── package.json
│   └── database.sql
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── SPEC.md
```