import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Field Companion Uncaught Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-navy-900/40 backdrop-blur-md rounded-xl shadow-lg border border-rose-200 p-6 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4">
              <AlertOctagon className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-cyan-50 mb-2">
              Application Shell Encountered An Issue
            </h2>
            <p className="text-xs text-cyan-300 mb-4">
              A component error was caught safely. Local database records are intact.
            </p>
            {this.state.error && (
              <div className="bg-slate-900 text-slate-200 text-left p-3 rounded-lg text-xs font-mono mb-5 overflow-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors w-full"
            >
              <RotateCcw className="w-4 h-4" />
              Reload Digital Companion
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
