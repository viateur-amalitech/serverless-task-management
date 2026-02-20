import { PreSignUpTriggerEvent } from 'aws-lambda';
import { Config } from '../utils/config';
import { Logger } from '../utils/logger';
import { ValidationError } from '../utils/errors';

export const handler = async (event: PreSignUpTriggerEvent): Promise<PreSignUpTriggerEvent> => {
    Logger.info('Validating signup attempt', { email: event.request.userAttributes.email });

    const email = event.request.userAttributes.email;

    if (!email) {
        throw new ValidationError('Email is required for registration.');
    }

    const domain = email.split('@')[1];

    if (Config.COGNITO.ALLOWED_DOMAINS.includes(domain)) {
        Logger.info(`Signup allowed for domain: ${domain}`);
        return event;
    } else {
        Logger.warn(`Blocked signup attempt from domain: ${domain}`);
        throw new Error('Invalid email domain. Only official corporate domains are allowed.');
    }
};
