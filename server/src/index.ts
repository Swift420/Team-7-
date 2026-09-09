import 'dotenv/config';
import { app } from './app.js';

const PORT = process.env.PORT || 5001;

process.on('unhandledRejection', (reason) => {
  console.error('[Process] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught Exception:', err);
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 NZZ Platform Server is running on http://localhost:${PORT}`);
    const missingKeys = ['DATABASE_URL', 'AUTH_SECRET', 'GOOGLE_CLOUD_PROJECT', 'GCP_PROJECT_ID'].filter(
      (k) => !process.env[k]
    );
    if (missingKeys.length > 0) {
      console.warn(`⚠️ [Config Notice] The following environment keys are not configured: ${missingKeys.join(', ')}`);
    }
  });
}

export { app };

