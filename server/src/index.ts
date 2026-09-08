import 'dotenv/config';
import { app } from './app.js';

const PORT = process.env.PORT || 5001;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 NZZ Platform Server is running on http://localhost:${PORT}`);
  });
}

export { app };

