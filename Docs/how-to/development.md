# A-Player Evaluation System - Developer Guide

<!-- merged: Docs/DEVELOPMENT.md, ENVIRONMENT_SETUP.md (2025-08-18) -->

Comprehensive guide for local development setup, workflows, and environment configuration.

---

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
   cd a-player-dashboard
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Configuration**
   ```bash
   # Copy environment template from project root
   cp ../env.example .env
   
   # Edit .env with your actual values
   # Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
   ```

4. **Start Development Server**
   ```bash
   pnpm dev
   ```
   
   Application will be available at: `http://localhost:5173`

---

## 🔐 Environment Variables Setup

### 1. Supabase Edge Functions Environment Variables

You need to set these in your **Supabase Dashboard**:

#### How to Update Supabase Environment Variables:

1. **Go to Supabase Dashboard**: [supabase.com/dashboard](https://supabase.com/dashboard)
2. **Select your project**
3. **Navigate to**: `Edge Functions` → `Environment Variables`
4. **Add/Update these variables**:

```env
RESEND_API_KEY=<your-resend-api-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SUPABASE_URL=https://<your-project-ref>.supabase.co
```

#### Alternative: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Set the API key
supabase secrets set RESEND_API_KEY=<your-resend-api-key>

# Verify it was set
supabase secrets list
```

### 2. Local Development Environment

Create a `.env` file in the `a-player-dashboard` directory:

```bash
# Copy the example file from project root to a-player-dashboard directory
cp env.example a-player-dashboard/.env
```

Then edit `a-player-dashboard/.env` with your actual values:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>

# Email Configuration
RESEND_API_KEY=<your-resend-api-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Application Configuration
VITE_APP_TITLE=A-Player Evaluation Dashboard
VITE_APP_ENVIRONMENT=development

# Feature Flags
VITE_TENANCY_ENFORCED=true
VITE_DEBUG_MODE=false
```

### 3. Production Deployment Environment

If using Docker or other hosting platforms, ensure these environment variables are set:

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
RESEND_API_KEY=<your-resend-api-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

---

## 🗄️ Supabase Local Development

### Database Management

#### 1. Install Supabase CLI
```bash
# Install globally (pinned version)
npm install -g supabase@1.150.0

# Verify installation
supabase --version
```

#### 2. Initialize Project
```bash
# Link to existing project
supabase link --project-ref <your-project-id>

# Or start fresh
supabase init
```

#### 3. Local Database Operations
```bash
# Start local database
supabase start

# Stop local database  
supabase stop

# Reset database
supabase db reset

# Apply migrations
supabase db push
```

### Edge Functions Development

#### 1. Function Development
```bash
# Serve functions locally
supabase functions serve

# Deploy specific function
supabase functions deploy function-name

# View function logs
supabase functions logs function-name
```

#### 2. Testing Functions Locally
```bash
# Test with curl
curl -X POST 'http://localhost:54321/functions/v1/<your-function>' \
  -H 'Authorization: Bearer <your-anon-key>' \
  -H 'Content-Type: application/json' \
  -d '{"test": "data"}'
```

---

## 🧪 Testing the Email System

### 1. Test Email Functionality

You can test the email system using the Supabase Edge Function:

```bash
# Call the test function (replace with your function URL)
curl -X POST 'https://<your-project-ref>.supabase.co/functions/v1/test-resend-simple' \
  -H 'Authorization: Bearer <your-anon-key>' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

### 2. Check Edge Function Logs

1. Go to **Supabase Dashboard** → **Edge Functions** → **Logs**
2. Look for successful API key validation
3. Verify email sending works

### 3. Functions Using the API Key

The following Edge Functions use `RESEND_API_KEY`:

- `test-resend-simple`
- `test-resend-detailed`
- `send-invitation-email`
- `create-invite`
- Any other email-related functions

---

## 🛠️ Development Workflow

### Branch Management
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push branch
git push origin feature/your-feature-name
```

### Code Quality
```bash
# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Type checking
pnpm type-check

# Format code
pnpm format
```

### Testing
```bash
# Unit tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage

# End-to-end tests with Playwright
pnpm test:e2e
```

---

## 🏗️ Build Process

### Development Build
```bash
# Start development server
pnpm dev

# Build for development with source maps
pnpm build:dev
```

### Production Build
```bash
# Build optimized production version
pnpm build

# Preview production build
pnpm preview

# Analyze bundle size
pnpm build:analyze
```

### Build Configuration

The application uses **Vite 7.0.4** with these optimizations:
- TypeScript compilation
- React Fast Refresh
- CSS preprocessing with PostCSS
- Asset optimization
- Code splitting

---

## 📂 Project Structure

```
a-player-dashboard/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Page components
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom hooks
│   ├── services/           # API and business logic
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   └── assets/             # Static assets
├── supabase/
│   ├── functions/          # Edge Functions
│   └── migrations/         # Database migrations
├── tests/                  # Test files
├── docs/                   # Documentation
│   ├── _archive/           # Historical documentation
│   └── _generated/         # Auto-generated reports
└── public/                 # Public assets
```

---

## 🔍 Debugging

### VS Code Configuration

Recommended `.vscode/settings.json`:
```json
{
  "typescript.preferences.useAliasesForRenames": false,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

### Browser Developer Tools

#### React DevTools
1. Install React Developer Tools extension
2. Use Components tab to inspect component hierarchy
3. Use Profiler tab for performance analysis

#### Supabase Debugging
```javascript
// Enable debug mode in browser console
localStorage.setItem('supabase.debug', 'true');

// View auth state
console.log(supabase.auth.getUser());

// View session details
console.log(supabase.auth.getSession());
```

---

## 🚨 Common Issues & Solutions

### Node.js Version Issues
```bash
# Check current version
node --version

# Use Node Version Manager (nvm)
nvm install 18
nvm use 18
```

### Package Installation Issues
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Or use legacy peer deps
pnpm install --legacy-peer-deps
```

### Supabase Connection Issues
```bash
# Test connection
curl https://<your-project-ref>.supabase.co/rest/v1/

# Check environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```

### Build Failures
```bash
# Check TypeScript errors
pnpm type-check

# Check for missing dependencies
pnpm install

# Clear Vite cache
rm -rf node_modules/.vite
```

---

## 🔧 IDE Setup

### VS Code Extensions

**Essential:**
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets
- Auto Rename Tag
- Bracket Pair Colorizer

**Recommended:**
- GitLens
- Prettier - Code formatter
- ESLint
- PostCSS Language Support

### Configuration Files

#### `.vscode/extensions.json`
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

---

## 📊 Performance Monitoring

### Local Performance Testing
```bash
# Bundle analyzer
pnpm build:analyze

# Lighthouse audit
lighthouse http://localhost:5173

# Performance testing
pnpm test:perf
```

### Development Metrics
- **Hot reload time**: < 1 second
- **Build time**: < 30 seconds
- **Test execution**: < 10 seconds

---

## ⚠️ Security Notes

### Development Security
1. **Never commit** `.env` files to Git
2. **Use environment variables** in production, not hardcoded values
3. **Rotate API keys** regularly for security
4. **Monitor usage** in Resend dashboard
5. **Use HTTPS** even in development when testing auth

### Secure Development Practices
- Always use TypeScript strict mode
- Validate all user inputs
- Sanitize data before database operations
- Use prepared statements/parameterized queries
- Implement proper error handling

---

## 🚀 Deployment from Development

### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Edge functions tested
- [ ] Performance optimized

### Deployment Commands
```bash
# Build production version
pnpm build

# Deploy to staging (requires custom npm script in package.json)
pnpm deploy:staging

# Deploy to production (requires custom npm script in package.json)
pnpm deploy:prod
```

**Note**: The `deploy:staging` and `deploy:prod` commands are custom npm scripts that must be defined in your `package.json`. If they don't exist, you'll need to create them based on your deployment strategy.

---

## 📞 Development Support

### Getting Help
- **TypeScript Issues**: Check official TypeScript docs
- **React Issues**: React documentation and community
- **Supabase Issues**: Supabase documentation and Discord
- **Vite Issues**: Vite documentation and GitHub issues

### Debugging Resources
- Browser DevTools
- React DevTools
- Redux DevTools (if using Redux)
- Supabase Dashboard logs

---

## 🎯 Development Best Practices

### Code Organization
- Use TypeScript strict mode
- Implement proper error boundaries
- Follow React hooks best practices
- Use custom hooks for shared logic
- Implement proper loading states

### Performance
- Use React.memo for expensive components
- Implement proper lazy loading
- Optimize bundle size
- Use proper caching strategies

### Testing
- Write unit tests for business logic
- Test user interactions
- Mock external dependencies
- Test error scenarios

**✅ Your development environment is ready! Happy coding! 🚀**
