import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  private isNetworkError(error: Error | null): boolean {
    if (!error) return false;
    return (
      error.message.includes('Failed to fetch') ||
      error.message.includes('Network request failed') ||
      error.message.includes('NetworkError') ||
      error.message.includes('connection')
    );
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isNetwork = this.isNetworkError(this.state.error);
      const title = isNetwork ? "Connection Error" : "Something went wrong";
      const description = isNetwork
        ? "We couldn't connect to the server. Please check your internet connection and try again."
        : "We encountered an unexpected error. Don't worry, your data is safe.";

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl"
          >
            <Card className="border-2 border-destructive/20">
              <CardHeader className="text-center pb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4"
                >
                  <AlertTriangle className="w-10 h-10 text-destructive" />
                </motion.div>
                <CardTitle className="text-2xl">{title}</CardTitle>
                <CardDescription className="text-base mt-2">
                  {description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {this.state.error && !isNetwork && (
                  <details className="text-sm">
                    <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground mb-2">
                      Error Details
                    </summary>
                    <pre className="p-4 bg-muted rounded-lg overflow-auto text-xs">
                      {this.state.error.message}
                      {'\n\n'}
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}

                <div className="flex gap-3 justify-center pt-4">
                  <Button onClick={this.handleReset} className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={this.handleGoHome} className="gap-2">
                    <Home className="w-4 h-4" />
                    Go Home
                  </Button>
                </div>

                <p className="text-center text-sm text-muted-foreground pt-4">
                  If this problem persists, please contact support.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Feature-level error boundary with inline error display
export const FeatureErrorBoundary: React.FC<Props> = ({ children, onReset }) => {
  return (
    <ErrorBoundary
      onReset={onReset}
      fallback={
        <Card className="border-destructive/50">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Failed to load this section</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Something went wrong while loading this content.
            </p>
            <Button onClick={onReset} size="sm" variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      }
    >
      {children}
    </ErrorBoundary>
  );
};

