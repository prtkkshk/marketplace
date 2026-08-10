import React from 'react';
import { analytics } from '../../lib/analytics';
import { ErrorState } from './ErrorState';

interface ErrorBoundaryProps {
 children: React.ReactNode;
}

interface ErrorBoundaryState {
 hasError: boolean;
 error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
 constructor(props: ErrorBoundaryProps) {
 super(props);
 this.state = { hasError: false, error: null };
 }

 static getDerivedStateFromError(error: Error) {
 return { hasError: true, error };
 }

 public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
 // Report React render errors
 analytics.track('error_occurred', {
 type: 'react_render',
 message: error.message,
 stack: errorInfo.componentStack,
 route: window.location.pathname,
 });
 }

 public override render() {
 if (this.state.hasError) {
 return (
 <div className="min-h-screen bg-bg flex items-center justify-center p-4">
 <ErrorState 
 message="Something went wrong while displaying this page." 
 onRetry={() => window.location.reload()} 
 />
 </div>
 );
 }

 return this.props.children;
 }
}
