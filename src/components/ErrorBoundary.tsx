import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, RefreshCw, ChevronDown, ChevronUp, Terminal } from 'lucide-react';

interface Props {
  children: ReactNode;
  language?: 'en' | 'rw';
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // Log the error internally for auditing
    console.error('[GFI Nasho 1 ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isRw = this.props.language === 'rw';
      const title = this.props.fallbackTitle || (isRw ? 'Habaye ikibazo kidateganijwe' : 'Something went wrong');
      const message = isRw
        ? 'Habaye ikosa mu gukora kwiyi paji. Amakuru yose y’ubutaka n’amazi akomeje kubikwa mu mutekano.'
        : 'An unexpected application error occurred. Your irrigation records and local offline queue remain safe.';
      const reloadLabel = isRw ? 'Subiramo Porogaramu (Reload)' : 'Reload Application';
      const tryAgainLabel = isRw ? 'Ongera Ugerageze' : 'Try Again';
      const techDetailsLabel = isRw ? 'Ibisobanuro by’ikoranabuhanga' : 'Technical Diagnostic Details';

      return (
        <div
          role="alert"
          className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 text-slate-100"
        >
          <div className="max-w-xl w-full rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Badge */}
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-rose-400">
                <AlertOctagon className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-400">
                  GFI Nasho 1 Irrigation Scheme
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {title}
                </h1>
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-300 leading-relaxed">
              {message}
            </p>

            {/* Error snippet */}
            {this.state.error && (
              <div className="mt-4 rounded-xl bg-slate-950/80 border border-slate-800/80 p-3 text-xs text-rose-300 font-mono">
                <span className="font-semibold text-rose-400">Error:</span> {this.state.error.message || 'Unknown runtime error'}
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-600/30 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{reloadLabel}</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-850 px-4 py-2.5 text-sm font-medium text-slate-200 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{tryAgainLabel}</span>
              </button>
            </div>

            {/* Technical diagnostic details disclosure */}
            <div className="mt-6 border-t border-slate-800/80 pt-4">
              <button
                type="button"
                onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                className="flex items-center justify-between w-full text-left text-xs font-medium text-slate-400 hover:text-slate-300 transition-colors"
                aria-expanded={this.state.showDetails}
              >
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-400" />
                  <span>{techDetailsLabel}</span>
                </span>
                {this.state.showDetails ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {this.state.showDetails && (
                <div className="mt-3 rounded-lg bg-slate-950 p-3 font-mono text-[11px] text-slate-400 overflow-x-auto max-h-48 border border-slate-800">
                  <div className="font-semibold text-rose-400">
                    {this.state.error?.name}: {this.state.error?.message}
                  </div>
                  {this.state.errorInfo?.componentStack && (
                    <pre className="mt-2 text-slate-500 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
