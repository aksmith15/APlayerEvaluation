const express = require('express');
const path = require('path');
const compression = require('compression');

const app = express();
const dist = path.resolve(__dirname, 'dist');

// Canonical host redirect (old → new)
app.use((req, res, next) => {
  const host = req.headers.host || '';
  if (host.includes('a-player-dashboard.onrender.com')) {
    const target = `https://a-player-evaluations.onrender.com${req.originalUrl}`;
    return res.redirect(301, target);
  }
  return next();
});

// Gzip everything
app.use(compression());

// Long-cache immutable assets
app.use(
  '/assets',
  express.static(path.join(dist, 'assets'), {
    immutable: true,
    maxAge: '1y',
  })
);

// Default static files; make index.html no-cache
app.use(
  express.static(dist, {
    setHeaders(res, filePath) {
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  })
);

// SPA fallback
app.get('*', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(dist, 'index.html'));
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Web service listening on ${port}`));
