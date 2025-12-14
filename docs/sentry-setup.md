# Sentry Error Tracking Setup Guide
## Los Ricos Tacos Application

### Prerequisites
- Sentry account (free tier available at sentry.io)
- Project created for Los Ricos Tacos

### Step 1: Create Sentry Projects

1. Go to https://sentry.io
2. Create two projects:
   - **Backend** (Node.js/Express)
   - **Frontend** (React)
3. Copy the DSN for each project

### Step 2: Install Sentry SDKs

**Backend**:
```bash
cd backend
npm install --save @sentry/node @sentry/profiling-node
```

**Frontend**:
```bash
cd react-app
npm install --save @sentry/react
```

### Step 3: Configure Environment Variables

Add to `.env`:
```bash
# Sentry Configuration
SENTRY_DSN_BACKEND=https://YOUR_BACKEND_KEY@o123456.ingest.sentry.io/123456
SENTRY_DSN_FRONTEND=https://YOUR_FRONTEND_KEY@o123456.ingest.sentry.io/123457
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=1.0.0
```

### Step 4: Backend Integration

Add to `backend/server.js` (at the top, before other imports):
```javascript
const Sentry = require("@sentry/node");
const { ProfilingIntegration } = require("@sentry/profiling-node");

Sentry.init({
  dsn: process.env.SENTRY_DSN_BACKEND,
  integrations: [
    new ProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  environment: process.env.SENTRY_ENVIRONMENT || 'development',
  release: process.env.SENTRY_RELEASE,
});

// RequestHandler creates a separate execution context using domains
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());
```

Add error handler (before other error handlers):
```javascript
// Sentry error handler must be before other error handlers
app.use(Sentry.Handlers.errorHandler());
```

### Step 5: Frontend Integration

Add to `react-app/src/index.js`:
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

### Step 6: Test Error Tracking

**Backend test**:
```bash
curl -X POST http://localhost:5001/api/test-error
```

**Frontend test**:
Add a test button that throws an error.

### Step 7: Rebuild Containers

```bash
docker compose -f local.docker.yml up -d --build
```

### Verification

1. Trigger test errors
2. Check Sentry dashboard for error reports
3. Verify source maps are uploaded (for production)
4. Configure alert rules in Sentry

### Production Checklist

- [ ] DSN configured in production `.env`
- [ ] Source maps uploaded for frontend
- [ ] Alert rules configured
- [ ] Team members added to project
- [ ] Release tracking enabled
- [ ] Performance monitoring enabled

**Note**: For this mission, Sentry integration requires account setup which is external. The integration code is ready to be added once DSN keys are obtained.
