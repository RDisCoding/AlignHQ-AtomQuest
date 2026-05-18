# AlignHQ

Enterprise Goal Setting & Performance Tracking Portal

---

## Overview

AlignHQ is a web-based enterprise performance management platform built for the AtomQuest Hackathon 1.0. The platform digitizes the complete employee goal lifecycle including goal creation, approvals, quarterly check-ins, progress tracking, reporting, governance, and audit management.

The system is designed to replace fragmented spreadsheet-based workflows with a centralized and structured portal that supports employees, managers, and administrators through role-based workflows.

AlignHQ focuses on:

* Organizational goal alignment
* Structured performance tracking
* Quarterly review workflows
* Enterprise governance
* Shared departmental KPIs
* Audit-ready architecture
* Real-time progress visibility

---

# Core Features

## Employee Features

* Create and manage goal sheets
* Add goals with targets and weightages
* Select Unit of Measurement (UoM)
* Submit goals for approval
* View locked goals after approval
* Update quarterly achievements
* Track planned vs actual performance
* View shared departmental goals

---

## Manager Features

* Review submitted goal sheets
* Edit targets and weightages inline
* Approve or reject submissions
* Conduct quarterly check-ins
* Add structured feedback/comments
* Monitor team performance
* Create and assign shared goals
* Track completion status across team members

---

## Admin / HR Features

* Manage system cycles and review windows
* Monitor organization-wide completion rates
* Unlock locked goal sheets
* View audit logs
* Manage governance workflows
* Export reports
* Monitor approvals and check-ins

---

# Shared Goals System

AlignHQ supports shared departmental KPIs where managers can assign common organizational goals to multiple employees simultaneously.

Shared goals:

* Are centrally managed
* Maintain synchronized progress
* Allow employees to customize only weightage
* Prevent employees from editing targets or titles
* Support enterprise-style KPI alignment

This architecture avoids duplicated goal records and maintains consistency across organizational teams.

---

# Goal Validation Rules

The platform enforces the following business rules:

* Total goal weightage must equal 100%
* Minimum weightage per goal = 10%
* Maximum number of goals per employee = 8
* Locked goals cannot be edited without admin intervention

---

# Quarterly Check-in Workflow

The system supports quarterly performance tracking cycles:

| Phase        | Activity                   |
| ------------ | -------------------------- |
| Goal Setting | Goal creation and approval |
| Q1           | Achievement updates        |
| Q2           | Achievement updates        |
| Q3           | Achievement updates        |
| Q4 / Annual  | Final achievement capture  |

Managers can review quarterly progress and provide structured check-in feedback.

---

# Progress Calculation Logic

AlignHQ supports multiple Unit of Measurement (UoM) types:

| UoM Type | Logic                         |
| -------- | ----------------------------- |
| Min      | Higher achievement is better  |
| Max      | Lower achievement is better   |
| Timeline | Deadline-based completion     |
| Zero     | Zero incidents equals success |

The platform computes tracking progress dynamically based on the configured UoM type.

---

# Tech Stack

## Frontend

* Next.js (App Router)
* React
* TypeScript
* Tailwind CSS
* shadcn/ui

## Backend

* Next.js Server Actions / API Routes
* Prisma ORM
* PostgreSQL
* NextAuth.js

## Database

* PostgreSQL
* Prisma relational schema

## Deployment

* Vercel
* Supabase / Neon PostgreSQL

---

# System Architecture

The platform follows a role-based enterprise architecture.

## Primary Entities

* User
* EmployeeProfile
* GoalSheet
* Goal
* SharedGoal
* CheckIn
* AuditLog

## Relationship Flow

User → EmployeeProfile → GoalSheet → Goal → CheckIn

Shared goals are connected through assignment mappings to support centralized KPI synchronization.

---

# Database Design Highlights

* Normalized relational architecture
* Many-to-many shared goal assignment structure
* Audit-ready change logging
* Manager-subordinate hierarchy support
* Quarterly performance tracking support

---

# Role-Based Access Control (RBAC)

| Role     | Permissions                            |
| -------- | -------------------------------------- |
| Employee | Manage personal goals and updates      |
| Manager  | Team approvals and performance reviews |
| Admin    | Full governance and system control     |

---

# Audit & Governance

The system maintains audit trails for sensitive workflow actions.

Audit logs capture:

* User performing action
* Modified entity
* Previous value
* New value
* Timestamp

This ensures accountability and governance readiness.

---

# Reporting Features

* Planned vs Actual reports
* Completion dashboards
* Quarterly summaries
* Exportable CSV/Excel reports
* Team progress tracking

---

# Project Structure

```bash
src/
 ├── app/
 ├── components/
 ├── lib/
 ├── prisma/
 ├── types/
 ├── actions/
 ├── hooks/
 └── utils/
```

---

# Local Development Setup

## 1. Clone Repository

```bash
git clone <repository-url>
cd alignhq
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Configure Environment Variables

Create a `.env` file:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/atomquest_portal"
NEXTAUTH_SECRET="your_secret"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 4. Run Prisma Migration

```bash
npx prisma migrate dev
```

---

## 5. Generate Prisma Client

```bash
npx prisma generate
```

---

## 6. Start Development Server

```bash
npm run dev
```

---

# Deployment

Recommended deployment setup:

| Service         | Purpose            |
| --------------- | ------------------ |
| Vercel          | Frontend hosting   |
| Supabase / Neon | PostgreSQL hosting |

---

# Future Improvements

* Microsoft Entra ID integration
* Microsoft Teams notifications
* Email reminders
* Escalation workflows
* Advanced analytics dashboards
* QoQ trend analysis
* Department heatmaps
* AI-generated performance summaries

---

# Hackathon Focus

The primary focus of this implementation is:

* Stable enterprise workflows
* Strong RBAC structure
* Clean architecture
* End-to-end usability
* Low-bug execution
* Enterprise-style governance

The project prioritizes workflow reliability and business logic correctness over unnecessary complexity.

---

# Team Notes

This project is designed to simulate a real-world enterprise performance management system with scalable architecture and modern full-stack development practices.

The system architecture is intentionally modular to support future expansion into larger HRMS and organizational performance ecosystems.

---

# License

This project was developed for AtomQuest Hackathon 1.0.
