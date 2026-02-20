import React from 'react';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { awsConfig } from './aws-exports';
import Dashboard from './pages/Dashboard';

Amplify.configure(awsConfig);

const App: React.FC = () => {
  return (
    <Authenticator.Provider>
      <Authenticator
        signUpAttributes={['email']}
        formFields={{
          signUp: {
            email: {
              placeholder: 'Enter your corporate email',
              isRequired: true,
            },
          },
        }}
      >
        {({ signOut, user }) => {
          if (!user) return <></>;
          return <Dashboard user={user} signOut={signOut!} />;
        }}
      </Authenticator>
    </Authenticator.Provider>
  );
}

export default App;
