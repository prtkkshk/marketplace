import React from 'react';
import { Link } from 'react-router-dom';
import { GoogleButton } from './GoogleButton';
import { AuthLayout } from '../../components/layout/AuthLayout';

export const SignUpScreen: React.FC = () => {
  return (
    <AuthLayout 
      title="Create Your Account"
      subtitle="Sign up with your IIT Kharagpur Google Workspace account"
    >
      <GoogleButton />

      <p className="text-center text-sm text-subtle mt-8">
        Already have an account?{' '}
        <Link to="/auth/signin" className="text-accent font-semibold hover:underline">
          Sign In
        </Link>
      </p>
    </AuthLayout>
  );
};
