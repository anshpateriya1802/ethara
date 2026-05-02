# Ethara - TaskFlow Project Management Web App

A full-stack project management platform where teams can create projects, assign tasks, and track progress with role-based access control.

## 🎯 Features

- **User Authentication** - Secure login/signup with JWT tokens
- **Project Management** - Create, update, and delete projects
- **Task Tracking** - Organize tasks by status (Todo, In Progress, Review, Done)
- **Team Collaboration** - Add team members to projects with role-based permissions
- **Dashboard** - Real-time stats, overdue tasks, and recent projects
- **Role-Based Access** - Admin and Member roles with granular permissions

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Database**: MongoDB (Atlas)
- **Authentication**: JWT (jsonwebtoken)
- **Password Security**: bcryptjs
- **Validation**: express-validator

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **State Management**: React Context + useState

## 📦 Project Structure

```
ethara/
├── backend/
│   ├── index.js              # Express server entry
│   ├── package.json
│   ├── config/
│   │   └── db.js             # MongoDB schemas
│   ├── middleware/
│   │   └── auth.js           # JWT authentication
│   └── routes/
│       ├── auth.js
│       ├── dashboard.js
│       ├── projects.js
│       ├── tasks.js
│       └── users.js
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   └── services/
│   │       └── api.js
│   ├── package.json
│   ├── vite.config.js
│   └── server.js             # Static file server
├── render.yaml               # Render.com blueprint
├── railway.json              # Railway deployment config
└── Procfile                  # Heroku/Railway start command
```

## 🚀 Deployment on Railway

### Prerequisites
- GitHub account with code pushed
- Railway account (https://railway.app)
- MongoDB Atlas cluster and connection string

### Step-by-Step Setup

#### 1. Create Backend Service

1. Go to https://railway.app/dashboard
2. Click **"New Project"** → **"Deploy from GitHub"**
3. Select your **ethara** repository
4. Create first service:
   - **Name**: `ethara-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

#### 2. Add Backend Environment Variables

Go to backend service → **Variables** tab. Add:

| Variable | Value |
|----------|-------|
| `PORT` | `8000` |
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | Generate a strong secret (or let Railway generate) |

**MongoDB URI Format**:
```
mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/taskflow?retryWrites=true&w=majority
```

#### 3. Deploy Backend

Click **"Deploy"** and wait for health check to pass. Once successful, copy the **Service URL**.

#### 4. Create Frontend Service

In the same Railway project:
1. Click **"New"** → **"Service"** → **"GitHub Repo"**
2. Configure:
   - **Name**: `ethara-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

#### 5. Add Frontend Environment Variables

Go to frontend service → **Variables** tab. Add:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your backend service URL (e.g., `https://ethara-backend.up.railway.app`) |

#### 6. Deploy Frontend

Click **"Deploy"** and wait for completion. Once successful, click the frontend service URL.

## 🏠 Local Development

### Prerequisites
- Node.js 18+
- MongoDB running locally or MongoDB Atlas
- Git

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ethara.git
   cd ethara
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Setup backend environment**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   ```

4. **Start backend**
   ```bash
   npm run dev
   ```
   Backend will run on http://localhost:3001

5. **In a new terminal, install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

6. **Start frontend (in development mode)**
   ```bash
   npm run dev
   ```
   Frontend will run on http://localhost:5173

The frontend dev server has a proxy configured for `/api` → backend, so API calls work out of the box.

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/:id/members` - List project members
- `POST /api/projects/:id/members` - Add member
- `DELETE /api/projects/:id/members/:userId` - Remove member

### Tasks
- `GET /api/projects/:projectId/tasks` - List tasks
- `POST /api/projects/:projectId/tasks` - Create task
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard stats
- `GET /api/dashboard/overdue` - Get overdue tasks
- `GET /api/dashboard/recent-projects` - Get recent projects

## 🔑 Environment Variables

### Backend (.env)
```
PORT=8000
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/taskflow?retryWrites=true&w=majority
JWT_SECRET=your-secret-key-here
```

### Frontend (.env or Railway Variables)
```
VITE_API_URL=https://your-backend-url.up.railway.app
```

## 🐛 Troubleshooting

### Registration/Login Failing
- Check backend logs for MongoDB connection errors
- Verify `MONGO_URI` is correct
- Ensure `VITE_API_URL` includes the backend URL properly (should resolve to `https://backend/api`)

### Frontend showing 404 on routes
- Ensure `frontend/server.js` exists and has SPA rewrite rules
- Check frontend deployment logs for build errors

### Health check failing on Railway
- Verify `PORT` environment variable is set to `8000`
- Check backend startup logs for MongoDB connection issues
- Ensure MongoDB Atlas IP whitelist allows Railway's IP range (`0.0.0.0/0`)

### CORS errors
- Backend has CORS enabled; check if frontend URL is correct
- Verify `VITE_API_URL` environment variable is set on frontend

## 📝 Building for Production

### Frontend
```bash
cd frontend
npm run build
# Creates optimized build in dist/
```

### Backend
No special build needed; runs directly with `npm start`

## 🔐 Security Notes

- **Never commit `.env` files** - Add to `.gitignore`
- **JWT_SECRET** should be a strong, random string in production
- **MongoDB Atlas** should have IP whitelist configured
- Passwords are hashed with bcryptjs before storage

## 📞 Support

For issues or questions:
1. Check deployment logs on Railway dashboard
2. Verify all environment variables are set correctly
3. Ensure MongoDB connection string is valid
4. Check that frontend and backend services are both running

## 📄 License

MIT

---

**Deployed on Railway** - Visit https://railway.app for deployment documentation
