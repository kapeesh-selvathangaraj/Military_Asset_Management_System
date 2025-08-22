# 🛡️ Military Asset Management System

A comprehensive web-based application designed for the Indian Armed Forces to manage military assets, personnel, bases, and operations with role-based access control and comprehensive audit trails.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com/)

## 🎯 Overview

The Military Asset Management System provides a secure, scalable solution for managing military assets across the Indian Armed Forces. Built with modern web technologies and designed with military-specific requirements in mind.

### ✨ Key Features

- **🏛️ Base Management**: Comprehensive base management with India-specific military zones and commands
- **👥 Personnel Management**: User management with Indian military ranks and role-based access
- **🚁 Asset Tracking**: Track vehicles, weapons, aircraft, naval vessels, and equipment
- **📊 Dashboard Analytics**: Real-time metrics and operational insights
- **🔄 Commander Handover**: Track base commander changes with ceremony documentation
- **📋 Audit Trails**: Comprehensive logging for security and compliance
- **🔐 Role-Based Security**: Hierarchical access control for military structure
- **🇮🇳 Indian Military Context**: Authentic Armed Forces structure with proper commands and ranks

## 🏗️ Architecture

### Tech Stack

**Backend:**
- Node.js 18+ with Express.js
- PostgreSQL 14+ database
- JWT authentication
- Winston logging
- Helmet security

**Frontend:**
- React 18+ with hooks
- Tailwind CSS styling
- React Query for state management
- Axios for API calls
- Modern responsive design

**Deployment:**
- Docker containerization
- Nginx reverse proxy
- Production-ready configuration

### System Requirements

- **Node.js**: Version 18.0 or higher
- **PostgreSQL**: Version 14.0 or higher
- **Memory**: Minimum 4GB RAM
- **Storage**: Minimum 20GB available space
- **Network**: Secure military network environment

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd military-asset-management
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 3. Database Setup
```bash
# Install PostgreSQL and create database
sudo -u postgres psql
CREATE DATABASE military_assets;
CREATE USER military_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE military_assets TO military_user;

# Apply schema
psql -U military_user -d military_assets -f backend/database/schema-postgresql.sql
```

### 4. Backend Setup
```bash
cd backend
npm install
npm run dev
```

### 5. Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 6. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 🔐 Default Credentials

After running the data seeding script:

| Role | Username | Password | Description |
|------|----------|----------|-------------|
| Admin | `admin` | `password123` | System administrator |
| Base Commander | `col_rajesh` | `password123` | Base commander role |
| Logistics Officer | `maj_suresh` | `password123` | Logistics operations |

## 🐳 Docker Deployment

### Development
```bash
docker-compose up -d
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Local Production Mode
```bash
# Windows
start-production.bat

# Linux/macOS
./start-production.sh
```

## 📁 Project Structure

```
military-asset-management/
├── backend/                 # Node.js backend
│   ├── config/             # Database and app configuration
│   ├── routes/             # API route handlers
│   ├── middleware/         # Custom middleware
│   ├── database/           # Database schema and migrations
│   ├── scripts/            # Utility and seeding scripts
│   └── logs/               # Application logs
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   └── config/         # Frontend configuration
│   └── public/             # Static assets
├── docs/                   # Documentation
├── docker-compose*.yml     # Docker configurations
└── README.md              # This file
```

## 🔧 Configuration

### Environment Variables

Key configuration options in `.env`:

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/military_assets

# Security
JWT_SECRET=your-secret-key
RATE_LIMIT_MAX_REQUESTS=100

# Server
PORT=5000
NODE_ENV=production
FRONTEND_URL=http://localhost:3000
```

See `.env.example` for complete configuration options.

## 🛡️ Security Features

- **JWT Authentication**: Stateless token-based authentication
- **Role-Based Access Control**: Four-tier military hierarchy
- **Rate Limiting**: Protection against brute force attacks
- **Security Headers**: Helmet.js security middleware
- **Audit Logging**: Comprehensive activity tracking
- **Input Validation**: Joi schema validation
- **SQL Injection Protection**: Parameterized queries

## 📊 API Documentation

### Authentication
```bash
POST /api/auth/login
POST /api/auth/register
GET /api/auth/profile
POST /api/auth/logout
```

### Asset Management
```bash
GET /api/assets
POST /api/assets
PUT /api/assets/:id
DELETE /api/assets/:id
```

### User Management
```bash
GET /api/users
POST /api/users
PUT /api/users/:id
GET /api/users/:id/activity
```

### Base Management
```bash
GET /api/bases
POST /api/bases
PUT /api/bases/:id
POST /api/bases/:id/commander-handover
```

For complete API documentation, see `MILITARY_ASSET_MANAGEMENT_DOCUMENTATION.md`.

## 🧪 Testing

### Run Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Load Testing
```bash
# Install artillery
npm install -g artillery

# Run load tests
artillery run tests/load-test.yml
```

## 📈 Monitoring

### Health Checks
- **Backend Health**: `GET /api/health`
- **Database Health**: `GET /api/health/db`
- **System Metrics**: `GET /api/metrics`

### Logging
- **Error Logs**: `backend/logs/error.log`
- **Combined Logs**: `backend/logs/combined.log`
- **Audit Logs**: `backend/logs/audit.log`

## 🔄 Maintenance

### Database Backup
```bash
# Create backup
pg_dump -U military_user military_assets > backup_$(date +%Y%m%d).sql

# Restore backup
psql -U military_user -d military_assets < backup_20250822.sql
```

### Log Rotation
```bash
# Rotate logs (automated via logrotate)
sudo logrotate /etc/logrotate.d/military-assets
```

### Updates
```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm update

# Apply database migrations
npm run migrate
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create Pull Request

### Development Guidelines
- Follow military coding standards
- Include comprehensive tests
- Update documentation
- Ensure security compliance
- Test with all user roles

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database schema applied
- [ ] SSL certificates installed
- [ ] Security headers enabled
- [ ] Rate limiting configured
- [ ] Backup procedures tested

### Post-Deployment
- [ ] Health checks passing
- [ ] Logs monitoring active
- [ ] User access verified
- [ ] Performance metrics baseline
- [ ] Security scan completed
- [ ] Documentation updated

## 🆘 Troubleshooting

### Common Issues

**Database Connection Errors:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Verify connection
psql -U military_user -d military_assets -c "SELECT 1;"
```

**Frontend Build Issues:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Authentication Problems:**
```bash
# Verify JWT secret
echo $JWT_SECRET

# Check user credentials
psql -U military_user -d military_assets -c "SELECT username, role FROM users;"
```
