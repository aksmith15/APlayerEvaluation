# A-Player Evaluation System Documentation

Welcome to the comprehensive documentation for the A-Player Evaluation System. This documentation is organized into clear sections to help you find exactly what you need.

## 📁 Documentation Structure

### 🎯 [Explanation](./explanation/)
*What and why* - Understand the concepts and rationale behind the system
- **[Product Requirements (PRD)](./explanation/PRD.md)** - Complete product specification and objectives
- **[A-Player Coaching](./explanation/A-Player-Coaching.md)** - AI-powered coaching report implementation

### 📋 [How-To Guides](./how-to/)
*Step-by-step procedures* - Get things done with clear instructions
- **[Development Setup](./how-to/development.md)** - Complete local development environment setup
- **[Implementation Workflow](./how-to/workflow.md)** - Tenancy implementation and development workflow

### 🏗️ [Architecture](./architecture/)
*System design and decisions* - Understand how the system is built
- **[System Architecture](./architecture/ARCHITECTURE.md)** - Overall system design and structure
- **[Diagrams](./architecture/diagrams/)** - Visual representations of system components
  - [High-Level Architecture](./architecture/diagrams/high-level.mmd)
  - [Data Flow](./architecture/diagrams/data-flow.mmd)
- **[Decisions](./architecture/decisions/)** - Architecture Decision Records (ADRs)
  - [ADR 0002: Profiles Table Decision](./architecture/decisions/0002-profiles-table-decision.md)

### 📖 [Reference](./reference/)
*Look-up information* - API docs, configurations, and technical references
- **[Components](./reference/components/)** - Complete component library documentation (20 components)
- **[Hooks](./reference/hooks/)** - Custom React hooks reference (8 hooks)
- **[Database](./reference/db/)** - Database schema and configuration
  - [Overview](./reference/db/overview.md) - Database structure and relationships
  - [RLS Policies](./reference/db/rls-policies.md) - Row Level Security implementation
  - [Grants](./reference/db/grants.md) - Database permissions and roles
- **[Routes](./reference/routes.md)** - Complete application routing table
- **[Edge Functions](./reference/edge-functions.md)** - Supabase Edge Functions documentation
- **[Environment Variables](./reference/env.md)** - Configuration reference
- **[Integrations](./reference/integrations.md)** - External service integrations

### ⚙️ [Operations](./ops/)
*Running and maintaining* - Deployment, monitoring, and troubleshooting
- **[Deployment Guide](./ops/deployment.md)** - Complete deployment instructions for all environments
- **[Runbooks](./ops/runbooks/)** - Operational procedures and troubleshooting
  - [Authentication Service Fix](./ops/runbooks/auth-service-fix.md) - Auth issue resolution
  - [Invite Flow Issues](./ops/runbooks/invite-flow-issues.md) - Invitation system troubleshooting

### 🤖 [Generated](._generated/)
*Auto-generated content* - Reports, inventories, and analysis
- **[Completeness Report](._generated/COMPLETENESS_REPORT.md)** - System completeness analysis
- **[Audit Configuration](._generated/audit.config.json)** - Active documentation auditing rules
- **[Project Structure](._generated/project_structure.md)** - Current project organization
- **[Reorganization Plan](._generated/reorg_plan.json)** - Documentation restructuring plan

### 📦 [Archive](._archive/)
*Historical content* - Completed implementations and superseded documentation

---

## 🚀 Quick Start Links

### For Developers
1. **[Development Setup](./how-to/development.md)** - Get your local environment running
2. **[Component Reference](./reference/components/)** - Browse available UI components
3. **[Database Overview](./reference/db/overview.md)** - Understand the data model

### For Operators
1. **[Deployment Guide](./ops/deployment.md)** - Deploy to any environment
2. **[Authentication Runbook](./ops/runbooks/auth-service-fix.md)** - Troubleshoot auth issues
3. **[Environment Reference](./reference/env.md)** - Configure environment variables

### For Product/Business
1. **[Product Requirements](./explanation/PRD.md)** - Understand what we're building
2. **[System Architecture](./architecture/ARCHITECTURE.md)** - High-level system overview
3. **[Coaching Report](./explanation/A-Player-Coaching.md)** - AI coaching capabilities

---

## 🔍 Finding Information

### By Task
- **Setting up development** → [Development Setup](./how-to/development.md)
- **Deploying the application** → [Deployment Guide](./ops/deployment.md)
- **Understanding the database** → [Database Overview](./reference/db/overview.md)
- **Troubleshooting auth** → [Auth Service Fix](./ops/runbooks/auth-service-fix.md)
- **Using components** → [Component Reference](./reference/components/)

### By Role
- **Frontend Developer** → [Components](./reference/components/) + [Hooks](./reference/hooks/) + [Development](./how-to/development.md)
- **Backend Developer** → [Database](./reference/db/) + [Edge Functions](./reference/edge-functions.md) + [Architecture](./architecture/)
- **DevOps Engineer** → [Deployment](./ops/deployment.md) + [Environment](./reference/env.md) + [Operations](./ops/)
- **Product Manager** → [PRD](./explanation/PRD.md) + [Architecture](./architecture/ARCHITECTURE.md) + [Completeness Report](._generated/COMPLETENESS_REPORT.md)

---

## 📊 Documentation Status

- **Components**: 20 documented components with MDX examples
- **Hooks**: 8 custom hooks with usage examples  
- **Database**: Complete schema documentation with RLS policies
- **Operations**: Comprehensive deployment and troubleshooting guides
- **Architecture**: Decision records and system diagrams
- **Coverage**: 85%+ documentation coverage (per audit config)

---

## 🔗 External Resources

- **[Supabase Documentation](https://supabase.com/docs)** - Database and auth platform
- **[React Documentation](https://react.dev)** - Frontend framework
- **[TypeScript Handbook](https://www.typescriptlang.org/docs/)** - Type system
- **[Tailwind CSS](https://tailwindcss.com/docs)** - Styling framework
- **[Vite Guide](https://vitejs.dev/guide/)** - Build tool

---

## 📝 Contributing to Documentation

1. **Location**: All documentation lives in the `docs/` directory
2. **Structure**: Follow the established [explanation|how-to|reference|architecture] pattern
3. **Components**: Use MDX format for component documentation
4. **Links**: Use relative links within the docs directory
5. **Updates**: Run the audit tool to verify documentation completeness

---

**Need help? Check the [Operations runbooks](./ops/runbooks/) or reach out to the development team.**