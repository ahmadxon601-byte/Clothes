import serverless from 'serverless-http';
import { app } from '../../apps/backend/src/index';

export const handler = serverless(app);
