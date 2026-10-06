import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-6 m-4 bg-rose-50 border-2 border-rose-300 rounded-3xl text-center space-y-3 shadow-lg">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-rose-900">
            화면을 표시하는 중 일시적인 오류가 발생했습니다.
          </h3>
          <p className="text-xs text-rose-700 font-mono bg-white p-3 rounded-xl border border-rose-200 text-left overflow-auto max-h-32">
            {this.state.error?.toString()}
          </p>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow transition active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>다시 시도하기</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
