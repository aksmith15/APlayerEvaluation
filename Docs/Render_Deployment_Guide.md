# Render Deployment Guide - A-Player Evaluations Dashboard

## ✅ **SUCCESSFUL DEPLOYMENT CONFIGURATION**

### **Final Working Setup:**
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `npm run serve`
- **Node Version**: 22.x (specified in package.json engines)
- **Root Directory**: `a-player-dashboard`

---

## 🚨 **All Issues Encountered & Solutions**

### **Issue Timeline: Console Errors → 403 Errors → SUCCESS**

## **Phase 1: React Context Isolation Errors (Issues #022-#027)**

### **Problem:** Multiple createContext/forwardRef errors
```javascript
pdf-pages-DJuRIdTk.js:1 Uncaught TypeError: Cannot read properties of undefined (reading 'createContext')
chart-vendor-QBFMCu5g.js:1 Uncaught TypeError: Cannot read properties of undefined (reading 'forwardRef')
react-router-CG0dymrT.js:1 Uncaught TypeError: Cannot read properties of undefined (reading 'createContext')
assignment-components-DdNoby73.js:2 Uncaught TypeError: Cannot read properties of undefined (reading 'createContext')
```

### **Root Cause:** 
Over-engineered Vite code splitting was creating separate chunks for React-dependent components, isolating them from the React core bundle and breaking access to React APIs.

### **Solution:** 
Completely overhauled vite.config.ts:
- Simplified `manualChunks` to only `react-core` bundle
- Added `resolve.dedupe` for React dependencies
- Removed all problematic feature-specific chunks
- Kept React ecosystem together

---

## **Phase 2: Asset Serving Issues**

### **Problem:** Survey components 404 errors
```javascript
GET https://a-player-evaluations.onrender.com/assets/survey-components-EbTAcVai.js net::ERR_ABORTED 404 (Not Found)
```

### **Root Cause:** 
Vite was creating separate chunks that Render's serving configuration couldn't handle properly.

### **Solution:** 
Added `base: '/'` and eliminated problematic chunks.

---

## **Phase 3: Production Serving Issues (Issue #028)**

### **Problem:** All assets returning 403 Forbidden
```javascript
GET https://a-player-evaluations.onrender.com/assets/react-core-D8DZKptW.js net::ERR_ABORTED 403 (Forbidden)
GET https://a-player-evaluations.onrender.com/assets/styles-BxF9wFiD.css net::ERR_ABORTED 403 (Forbidden)
```

### **Root Cause:** 
Render was still using `npm run preview` (Vite's development preview) instead of the new production Express server.

### **Solution:** 
1. Created production Express server (`server.cjs`)
2. Updated Render start command to `npm run serve`
3. Added proper caching headers and SPA fallback

---

## **🎯 Key Success Factors**

### **1. Express Production Server (server.cjs)**
```javascript
const express = require('express');
const path = require('path');
const compression = require('compression');

const app = express();
const dist = path.resolve(__dirname, 'dist');

// Gzip compression
app.use(compression());

// Long-cache immutable assets (1 year)
app.use('/assets', express.static(path.join(dist, 'assets'), {
  immutable: true,
  maxAge: '1y',
}));

// No-cache for HTML files
app.use(express.static(dist, {
  setHeaders(res, filePath) {
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
}));

// SPA fallback for React Router
app.get('*', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(dist, 'index.html'));
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Web service listening on ${port}`));
```

### **2. Simplified Vite Configuration**
```typescript
export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    // Prevent duplicate React copies
    dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
  },
  build: {
    rollupOptions: {
      output: {
        // Only one vendor chunk for React ecosystem
        manualChunks: {
          'react-core': ['react', 'react-dom', 'react-router', 'react-router-dom'],
        },
      },
    },
  },
});
```

### **3. Package.json Scripts**
```json
{
  "scripts": {
    "build": "tsc -b && vite build",
    "serve": "node server.cjs",
    "start": "node server.cjs"
  },
  "dependencies": {
    "express": "^4.19.2",
    "compression": "^1.7.4"
  }
}
```

---

## **📋 Render Web Service Configuration**

### **Environment Settings:**
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `npm run serve`
- **Node Version**: 22.x
- **Root Directory**: `a-player-dashboard`

### **Expected Build Output:**
```
✓ built in ~12s
dist/assets/react-core-[hash].js     ~178kB - React ecosystem
dist/assets/index-[hash].js          ~2.1MB - Main application
dist/assets/styles-[hash].css        ~54kB  - Styles
dist/index.html                      ~1kB   - Entry point
```

---

## **🔍 Debugging Tips**

### **Local Testing:**
```bash
cd a-player-dashboard
npm run build
npm run serve
# Test at http://localhost:8080
```

### **Common Issues:**

1. **403 Errors**: Wrong start command (use `npm run serve`, not `npm run preview`)
2. **404 Errors**: Missing assets (check build output and dist/ folder)
3. **React Errors**: Context isolation (ensure dedupe in vite.config.ts)
4. **Routing Issues**: Missing SPA fallback (Express server handles this)

### **Success Indicators:**
- ✅ No console errors
- ✅ All assets load (check Network tab)
- ✅ React Router navigation works
- ✅ Fast loading with proper caching

---

## **🎉 Final Status: FULLY OPERATIONAL**

**All Issues Resolved:**
- ✅ Issues #022-#027: React context isolation → Fixed with simplified chunking
- ✅ Issue #028: Asset 403 errors → Fixed with Express server

**Production Performance:**
- ✅ Fast loading with Gzip compression
- ✅ Optimal caching strategy
- ✅ Proper SPA routing support
- ✅ Zero console errors

**Key Learning:**
Complex Vite code splitting configurations can cause more problems than they solve in production. A simpler approach with professional Express serving is more reliable and performant.

---

## **Maintenance Notes**

### **Cache Management:**
- HTML files: No cache (always fresh)
- Assets: 1-year cache (content-addressed)
- Automatic cache busting via hash names

### **Future Deployments:**
1. Build succeeds locally: ✅ Safe to deploy
2. Assets generate correctly: ✅ No 404s expected  
3. Express server starts: ✅ No 403s expected
4. Standard git push → auto-deploy workflow

This deployment configuration is now production-ready and stable for ongoing development.
