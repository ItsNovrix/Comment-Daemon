import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { createServer, getServerPort } from '@devvit/web/server';

// --- IMPORT TRIGGERS ---
import { handleAppInstall } from './triggers/install.js';
import { handleAppUpgrade } from './triggers/upgrade.js';
import { handlePostCreate } from './triggers/post.js';

// --- IMPORT SCHEDULER ---
import { handleUpgradeCheckJob } from './scheduler/upgradeJob.js';
import { handleReminder } from './scheduler/reminder.js';
import { handleReminderRemoval } from './scheduler/reminderRemoval.js';
import { handleAction } from './scheduler/action.js';


const app = new Hono();

// ==========================================
// ROUTES
// ==========================================

// Triggers
app.post('/internal/triggers/on-app-install', handleAppInstall);
app.post('/internal/triggers/on-app-upgrade', handleAppUpgrade);
app.post('/internal/triggers/on-post-create', handlePostCreate);

// Scheduler
app.post('/internal/scheduler/upgrade-notifier-job', handleUpgradeCheckJob);
app.post('/internal/scheduler/reminder', handleReminder);
app.post('/internal/scheduler/reminder-removal', handleReminderRemoval);
app.post('/internal/scheduler/action', handleAction);

serve({
  fetch: app.fetch,
  createServer,
  port: getServerPort(),
});