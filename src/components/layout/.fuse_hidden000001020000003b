import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle} from 'lucide-react';
import { Button } from '../ui/Button';

interface Props {
 children?: ReactNode;
}

interface State {
 hasError: boolean;
 error: Error | null;
}

 import { analytics } from '../../lib/analytics';

 export class ErrorBoundary extends Component<Props, State> {
 public override state: State = {
 hasError: false,
 error: null};

 public static getDerivedStateFromError(error: Error): State {
 return { hasError: true, error };
 }

 public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
 console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
 
 analytics.track('error_occurred', {
 type: 'react_render',
 message: error.message,
 stack: errorInfo.componentStack,
 route: window.location.pathname,
 });
 }

 private handleReset = () => {
 this.setState({ hasError: false, error: null });
 window.location.href = '/';
 };

 public override render() {
 if (this.state.hasError) {
 return (
 <div className="min-h-screen bg-bg flex flex-col justify-center items-center p-4">
 <div className="max-w-md w-full bg-surface border border-danger/20 rounded-2xl p-6 shadow-hard text-center">
 <div className="w-14 h-14 bg-danger-wash rounded flex items-center justify-center mx-auto mb-4 text-danger">
 <AlertCircle className="w-8 h-8" />
 </div>
 <h1 className="text-lg font-bold text-ink mb-2">Something went wrong</h1>
 <p className="text-xs text-subtle mb-6">
 An unexpected error occurred in the application shell. No database or raw error detail is exposed.
 </p>
 <Button variant="primary" onClick={this.handleReset} >
 Reload Application
 </Button>
 </div>
 </div>
 );
 }

 return this.props.children;
 }
}
