# A-Player Evaluation System - Developer Guide

Comprehensive guide for local development setup, workflows, and common development tasks.

## 🚀 Local Setup

### Prerequisites

**Required Software:**
- **Node.js**: Version 18.x or higher
- **pnpm**: Version 8.x or higher (preferred package manager)
- **Git**: Version 2.30 or higher
- **VS Code**: Recommended editor with TypeScript support

**Optional Tools:**
- **Supabase CLI**: Version 1.150.0+ for database management
- **Docker**: For containerized development
- **Playwright**: For end-to-end testing

### Initial Setup

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd A-Player\ Evaluation2
   ```

2. **Install Dependencies**
   ```bash
   cd a-player-dashboard
   pnpm install
   ```

3. **Environment Configuration**
   ```bash
   # Copy environment template
   cp env.example .env
   
   # Edit .env with your actual values
   # Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
   ```

4. **Start Development Server**
   ```bash
   pnpm dev
   ```
   
   Application will be available at: `http://localhost:5173`

## 🗄️ Supabase Local Development

### Setup Local Supabase

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Initialize Local Environment**
   ```bash
   # Start all Supabase services
   supabase start
   
   # This starts:
   # - PostgreSQL database
   # - Supabase Studio (dashboard)
   # - Edge Functions runtime
   # - Auth services
   ```

3. **Database Management**
   ```bash
   # Reset database to clean state
   supabase db reset
   
   # Apply pending migrations
   supabase db push
   
   # Create new migration
   supabase db diff -f new_migration_name
   
   # View current migrations
   supabase migration list
   ```

4. **Seed Data (Optional)**
   ```bash
   # Run seed scripts if available
   supabase db reset --with-seed
   ```

### Database Access

- **Supabase Studio**: `http://localhost:54323`
- **Database URL**: `postgresql://postgres:postgres@localhost:54322/postgres`
- **API URL**: `http://localhost:54321`

## ⚡ Edge Functions Development

### Local Edge Functions

1. **Serve Functions Locally**
   ```bash
   # Serve all functions
   supabase functions serve
   
   # Serve specific function
   supabase functions serve create-invite
   
   # Serve with custom port
   supabase functions serve --port 54322
   ```

2. **Test Function Locally**
   ```bash
   # Test create-invite function
   curl -X POST 'http://localhost:54321/functions/v1/create-invite' \
     -H 'Authorization: Bearer YOUR_ANON_KEY' \
     -H 'Content-Type: application/json' \
     -d '{"email": "test@example.com", "company_id": "test-company"}'
   ```

### Edge Function Deployment

1. **Deploy Single Function**
   ```bash
   # Deploy specific function
   supabase functions deploy create-invite
   
   # Deploy with custom project reference
   supabase functions deploy create-invite --project-ref your-project-ref
   ```

2. **Deploy All Functions**
   ```bash
   # Deploy all functions in functions/ directory
   supabase functions deploy
   ```

3. **Set Edge Function Secrets**
   ```bash
   # Set individual secret
   supabase secrets set RESEND_API_KEY=your-api-key
   
   # Set multiple secrets from .env file
   supabase secrets set --env-file .env
   
   # List current secrets
   supabase secrets list
   ```

## 🛠️ Common Development Workflows

### Frontend Development

1. **Start Development Server**
   ```bash
   pnpm dev
   ```

2. **Type Checking**
   ```bash
   pnpm type-check
   ```

3. **Linting & Formatting**
   ```bash
   # Run ESLint
   pnpm lint
   
   # Fix ESLint issues
   pnpm lint:fix
   
   # Format with Prettier
   pnpm format
   ```

4. **Testing**
   ```bash
   # Run unit tests
   pnpm test
   
   # Run tests in watch mode
   pnpm test:watch
   
   # Run end-to-end tests
   pnpm test:e2e
   
   # Run tests with coverage
   pnpm test:coverage
   ```

5. **Build & Preview**
   ```bash
   # Production build
   pnpm build
   
   # Preview production build
   pnpm preview
   ```

### Database Workflows

1. **Schema Changes**
   ```bash
   # Create migration for schema changes
   supabase db diff -f add_new_table
   
   # Apply migration
   supabase db push
   
   # Reset to latest migration
   supabase db reset
   ```

2. **Type Generation**
   ```bash
   # Generate TypeScript types from database
   supabase gen types typescript --local > src/types/database.ts
   
   # For remote database
   supabase gen types typescript --project-ref your-ref > src/types/database.ts
   ```

3. **Backup & Restore**
   ```bash
   # Backup local database
   supabase db dump --local > backup.sql
   
   # Restore from backup
   supabase db reset --with-seed backup.sql
   ```

## 🚧 Development-Only Features

### PDF Preview Route

The application includes a dev-only route for PDF preview:

```typescript
// Available only when import.meta.env.DEV is true
Route: /dev/pdf-preview
Component: src/pages/react-pdf/DevPdfPreview.tsx
```

**Features:**
- Live PDF preview with Hot Module Replacement (HMR)
- Real-time updates during development
- Guarded by `import.meta.env.DEV` check

**Usage:**
```bash
# Start dev server
pnpm dev

# Navigate to PDF preview
open http://localhost:5173/dev/pdf-preview
```

### Debug Utilities

Development utilities are automatically imported in dev mode:

```typescript
// Auto-imported in development
import('./utils/debugTenant');
import('./utils/clearAuthStorage');
```

**Available Debug Functions:**
- **debugTenant()** - Tenant isolation debugging
- **clearAuthStorage()** - Clear authentication data
- **Performance Monitoring** - Enhanced logging in development

## 🔧 Environment-Specific Configuration

### Development Environment

**Required Variables:**
```bash
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key
VITE_APP_ENVIRONMENT=development
```

**Optional Development Variables:**
```bash
VITE_TENANCY_ENFORCED=false          # Disable for easier testing
VITE_ANALYTICS_ENABLED=false         # Disable analytics in dev
VITE_PERFORMANCE_MONITORING=true     # Enable detailed performance logging
VITE_FEATURE_PDF_GENERATION=true     # Enable PDF features
```

### Production-like Testing

To test production behavior locally:

```bash
# Build production version
pnpm build

# Preview with production settings
VITE_APP_ENVIRONMENT=production pnpm preview
```

## 🐛 Troubleshooting & Tips

### Common Issues

1. **CORS Issues**
   ```bash
   # Edge Functions CORS problems
   # Solution: Check _shared/cors.ts configuration
   # Ensure proper headers in Edge Function responses
   ```

2. **Authentication Issues**
   ```bash
   # Clear authentication storage
   localStorage.clear()
   sessionStorage.clear()
   
   # Or use debug utility
   clearAuthStorage()
   ```

3. **Database Connection Issues**
   ```bash
   # Restart Supabase services
   supabase stop
   supabase start
   
   # Check service status
   supabase status
   ```

4. **Type Errors After Schema Changes**
   ```bash
   # Regenerate database types
   supabase gen types typescript --local > src/types/database.ts
   
   # Restart TypeScript server in VS Code
   Cmd/Ctrl + Shift + P -> "TypeScript: Restart TS Server"
   ```

### Performance Optimization

1. **Component Performance**
   ```typescript
   // Use performance monitoring hook
   const { measureRender, getPerformanceInsights } = usePerformanceMonitoring({
     componentName: 'MyComponent',
     trackRenders: true
   });
   
   // Check performance insights
   const insights = getPerformanceInsights();
   if (insights.alerts.length > 0) {
     console.warn('Performance alerts:', insights.alerts);
   }
   ```

2. **Data Fetching Optimization**
   ```typescript
   // Use data fetching hook with caching
   const { data, loading, error } = useDataFetch(
     () => fetchEmployeeData(id),
     [id],
     {
       cacheKey: `employee-${id}`,
       cacheTTL: 5 * 60 * 1000, // 5 minutes
       retryCount: 3
     }
   );
   ```

### Realtime Features

1. **Testing Realtime Subscriptions**
   ```bash
   # Test realtime updates
   # Open multiple browser tabs
   # Changes in one tab should reflect in others
   ```

2. **Realtime Debugging**
   ```typescript
   // Enable realtime debugging
   import { debugRealtime } from './src/services/realtimeService';
   debugRealtime(true);
   ```

### Hot Module Replacement (HMR)

HMR is configured for optimal development experience:

- **Component Changes**: Instant updates
- **Style Changes**: CSS hot-reload
- **PDF Preview**: Live PDF updates
- **Edge Functions**: Require restart

### Browser Dev Tools

**Recommended Extensions:**
- React Developer Tools
- Supabase Chrome Extension
- Redux DevTools (if using Redux)

**Console Debugging:**
```javascript
// Global debug helpers (dev mode only)
window.debugTenant();
window.clearAuthStorage();
window.performanceMonitor?.getMetrics();
```

## 📊 Analytics & Monitoring

### Development Analytics

Performance monitoring is enhanced in development:

```typescript
// Sample rate: 100% in development, 10% in production
sampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1
```

### Performance Monitoring

```bash
# Enable performance monitoring
VITE_PERFORMANCE_MONITORING=true

# Monitor Core Web Vitals
# Check browser console for performance metrics
```

## 🔗 Related Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture overview
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide
- **[ENVIRONMENT.md](./ENVIRONMENT.md)** - Environment variable reference
- **[UI_UX_doc.md](./UI_UX_doc.md)** - UI/UX design specifications
- **[Project Structure](./project_structure.md)** - Codebase organization

---

**💡 Pro Tips:**
- Use `pnpm dev` for development (faster than npm)
- Enable VS Code TypeScript strict mode
- Use Supabase Studio for database inspection
- Monitor console for performance insights
- Test Edge Functions locally before deployment
