export const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID || 'eu-north-1_wemDgqpEJ',
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || '1b6bc9nsaq195guncev031h4pc',
      signUpVerificationMethod: 'code' as const
    }
  },
  API: {
    REST: {
      TaskAPI: {
        endpoint: (import.meta.env.VITE_API_URL || 'https://zj544ec5vj.execute-api.eu-north-1.amazonaws.com').replace(/\/$/, ''),
        region: import.meta.env.VITE_AWS_REGION || 'eu-north-1'
      }
    }
  }
};
