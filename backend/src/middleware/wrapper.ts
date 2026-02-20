import { APIGatewayProxyEventV2, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { UserClaims } from '../types';

type HandlerFunction = (
    event: APIGatewayProxyEventV2,
    context: Context,
    claims: UserClaims
) => Promise<any>;

export const withMiddleware = (handler: HandlerFunction) => {
    return async (event: APIGatewayProxyEventV2, context: Context): Promise<APIGatewayProxyResult> => {
        // 1. Unified Logging
        Logger.info('Incoming request', {
            path: event.rawPath,
            method: event.requestContext.http.method,
            requestId: context.awsRequestId
        });

        try {
            // 2. Extract Claims
            const claims = ((event.requestContext as any).authorizer?.jwt?.claims || {}) as UserClaims;

            // 3. Execute Handler
            const result = await handler(event, context, claims);

            // 4. Standardized Success Response
            return {
                statusCode: result?.statusCode || 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT',
                    'X-Content-Type-Options': 'nosniff'
                },
                body: JSON.stringify(result?.body || result)
            };

        } catch (error: any) {
            // 5. Global Error Handling
            if (error instanceof AppError) {
                Logger.warn('Controlled operational error', { error });
                return {
                    statusCode: error.statusCode,
                    headers: { 'Access-Control-Allow-Origin': '*' },
                    body: JSON.stringify({
                        message: error.message,
                        code: error.code,
                        requestId: context.awsRequestId
                    })
                };
            }

            Logger.error('Unhandled system exception', error);
            return {
                statusCode: 500,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({
                    message: 'A critical system error occurred',
                    code: 'INTERNAL_SERVER_ERROR',
                    requestId: context.awsRequestId
                })
            };
        }
    };
};
