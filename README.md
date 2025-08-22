# 🛡️ Military Asset Management System

A secure web application for managing military assets, personnel, and bases with role-based access control for the Indian Armed Forces.

## 🚀 Live Application

- **Frontend**: https://kapeesh-selvathangaraj.github.io/Military_Asset_Management_System
- **Backend API**: https://military-asset-management-system-x5x4.onrender.com

## ✨ Features

- **Asset Management**: Track vehicles, weapons, aircraft, and equipment
- **Base Management**: Manage military bases with commander handover tracking
- **Personnel Management**: User management with Indian military ranks
- **Dashboard Analytics**: Real-time metrics and operational insights
- **Role-Based Security**: Admin, Base Commander, Logistics Officer access levels
- **Audit Trails**: Comprehensive logging for security and compliance

## 🔐 Demo Credentials

| Role | Username | Password | Description |
|------|----------|----------|-------------|
| Administrator | `gen_bipin` | `password123` | General Bipin Rawat |
| Base Commander | `col_rajesh` | `password123` | Colonel Rajesh Kumar |
| Logistics Officer | `maj_suresh` | `password123` | Major Suresh Gupta |
| Naval Commander | `capt_vikram` | `password123` | Captain Vikram Singh |
| Air Force Commander | `gp_capt_anjali` | `password123` | Group Captain Anjali Verma |

## 🛠️ Tech Stack

**Frontend**: React 18, Tailwind CSS, React Query  
**Backend**: Node.js, Express.js, PostgreSQL  
**Deployment**: GitHub Pages (Frontend), Render (Backend)  
**Security**: JWT Authentication, Role-based Access Control

## 🏃‍♂️ Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Setup
```bash
# Clone repository
git clone https://github.com/kapeesh-selvathangaraj/Military_Asset_Management_System.git
cd Military_Asset_Management_System

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
npm start
```

### Database Setup
```bash
# Create PostgreSQL database
createdb military_assets

# Apply schema
psql -d military_assets -f backend/database/schema-postgresql.sql

# Seed sample data
cd backend
node scripts/seed-military.js
```

## 📁 Project Structure

```
├── backend/           # Node.js API server
│   ├── routes/        # API endpoints
│   ├── middleware/    # Auth & security middleware
│   ├── database/      # Schema and migrations
│   └── scripts/       # Utility scripts
├── frontend/          # React application
│   ├── src/
│   │   ├── components/ # Reusable components
│   │   ├── pages/     # Page components
│   │   └── contexts/  # React contexts
│   └── public/        # Static assets
└── .github/workflows/ # Auto-deployment
```

## 🔧 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/military_assets
JWT_SECRET=your-secret-key
PORT=5000
NODE_ENV=development
```

### Frontend (.env.local)
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENV=development
```

## 🚀 Deployment

The application is automatically deployed using GitHub Actions:
- **Frontend**: Deployed to GitHub Pages on push to master
- **Backend**: Deployed to Render with PostgreSQL database

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - User logout

### Assets
- `GET /api/assets` - List assets
- `POST /api/assets` - Create asset
- `PUT /api/assets/:id` - Update asset
- `DELETE /api/assets/:id` - Delete asset

### Users & Bases
- `GET /api/users` - List users
- `GET /api/bases` - List bases
- `POST /api/bases/:id/commander-handover` - Commander handover

## 🛡️ Security

- JWT token-based authentication
- Role-based access control (RBAC)
- Rate limiting on API endpoints
- Input validation and sanitization
- Comprehensive audit logging
- HTTPS enforcement in production

## 🔍 Troubleshooting

### Common Issues

**Login fails**: Ensure database is seeded with user data  
**API connection errors**: Check backend is running and CORS is configured  
**Build failures**: Clear node_modules and reinstall dependencies

### Health Checks
- Backend: `GET /api/health`
- Database: Check logs in `backend/logs/`

## 📄 License

For Official Use Only - Restricted to authorized military personnel.

---

**🎯 Ready to use!** Visit the live application or set up locally for development.
