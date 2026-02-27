export const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID || '',
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || '',
      signUpVerificationMethod: 'code' as const
    }
  },
  API: {
    REST: {
      TaskAPI: {
        endpoint: (import.meta.env.VITE_API_URL || '').replace(/\/$/, ''),
        region: import.meta.env.VITE_AWS_REGION || ''
      }
    }
  }
};
