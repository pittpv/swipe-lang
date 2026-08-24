/**
 * Vercel serverless entry point — mounts the whole Express app as one function.
 * Static files are served by the platform from dist/ (see vercel.json);
 * everything else is rewritten here and handled by the SPA catch-all.
 */
import app from '../server/index.js';

export default app;