import React from "react";

interface Props {
  appName?: string;
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary] ${this.props.appName ?? "App"} crashed:`, error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.20)" }}>
            ⚠️
          </div>
          <div>
            <p className="text-[17px] font-bold text-foreground" style={{ letterSpacing: "-0.02em" }}>
              {this.props.appName ?? "App"} encountered an error
            </p>
            <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed max-w-xs mx-auto">
              Something went wrong loading this app. Your data is safe — this is a UI error only.
            </p>
            {this.state.error?.message && (
              <p className="text-[11px] font-mono mt-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", color: "#f87171" }}>
                {this.state.error.message}
              </p>
            )}
          </div>
          <button
            onClick={this.handleReset}
            className="text-white text-[13px] font-semibold px-6 py-2.5 rounded-xl transition-all"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
          >
            ↩ Reload App
          </button>
        </div>
      );
    }

    return <>{this.props.children}</>;
  }
}
