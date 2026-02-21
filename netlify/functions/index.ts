import serverless from 'serverless-http';
import { app } from '../../apps/backend/src/index';

const handlerInstance = serverless(app);

export const handler = async (event: any, context: any) => {
    try {
        await app.ready();
        return await handlerInstance(event, context);
    } catch (error) {
        console.error('SERVERLESS_STARTUP_ERROR:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error during startup', details: String(error) })
        };
    }
};
