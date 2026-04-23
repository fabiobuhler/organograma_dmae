import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, color: '#ef4444', fontFamily: 'sans-serif' }}>
          <h2>Algo deu Errado!</h2>
          <pre style={{ background: '#fef2f2', padding: 20, whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
          </pre>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ padding: '10px 20px', background: '#dc2626', color: 'white', border: 'none', cursor: 'pointer', borderRadius: 4 }}>
            Limpar LocalStorage e Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
