import { Component } from 'react'
import { Shield, AlertTriangle, RotateCcw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
            <AlertTriangle size={32} className="text-red-400" />
          </div>
          <h1 className="text-[20px] font-bold text-white text-center mb-2">Something went wrong</h1>
          <p className="text-[14px] text-text-muted text-center mb-6 max-w-xs">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.reload()
            }}
            className="h-[48px] px-6 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-[14px] shadow-glow flex items-center gap-2"
          >
            <RotateCcw size={18} />
            Refresh Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
