import { UserClaims } from '../types';
import { Config } from '../utils/config';
import * as AWS from 'aws-sdk';

const cognito = new AWS.CognitoIdentityServiceProvider();

export class Auth {
    static isAdmin(claims: UserClaims): boolean {
        const groups = claims['cognito:groups'] || '';
        const adminGroup = Config.COGNITO.ADMIN_GROUP;
        return Array.isArray(groups) ? groups.includes(adminGroup) : groups.includes(adminGroup);
    }

    static canUpdateTask(claims: UserClaims, taskAssignedTo: string): boolean {
        if (this.isAdmin(claims)) return true;
        const assignees = Array.isArray(taskAssignedTo) ? taskAssignedTo : [taskAssignedTo];
        return assignees.includes(claims.email);
    }

    static async isUserActive(email: string): Promise<boolean> {
        if (!Config.COGNITO.USER_POOL_ID) return false;
        
        try {
            const result = await cognito.adminGetUser({
                UserPoolId: Config.COGNITO.USER_POOL_ID,
                Username: email
            }).promise();
            
            return result.Enabled === true && result.UserStatus !== 'UNKNOWN';
        } catch (err) {
            return false;
        }
    }

    static isDeactivated(email: string): boolean {
        return email.toLowerCase().includes('deactivated');
    }
}
