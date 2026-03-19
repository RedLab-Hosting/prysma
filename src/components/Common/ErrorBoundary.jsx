import React from 'react';
import { AlertTriangle, RefreshCcw, ShieldAlert, Cpu } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      expanded: false 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReload = () => {
    // Clear all storage to "reload cache" as requested
    localStorage.clear();
    sessionStorage.clear();
    // Cache-busting reload
    window.location.reload(true);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-zinc-100 flex flex-col">
            {/* Header */}
            <div className="p-8 bg-linear-to-br from-red-50 to-white border-b border-red-100 flex items-center gap-6">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shadow-inner">
                <ShieldAlert size={36} />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Vaya, algo salió mal</h1>
                <p className="text-zinc-500 font-medium tracking-tight">La aplicación encontró un error inesperado.</p>
              </div>
            </div>

            {/* Error Message */}
            <div className="p-8 space-y-6">
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 flex items-start gap-4">
                <AlertTriangle className="text-orange-500 shrink-0 mt-1" size={20} />
                <div className="overflow-hidden">
                  <div className="text-[10px] uppercase font-black text-zinc-400 tracking-widest mb-1">Mensaje del Error</div>
                  <div className="font-bold text-zinc-900 wrap-break-word">{this.state.error?.message || "Error desconocido"}</div>
                </div>
              </div>

              {/* Debug Info */}
              <div>
                <button 
                  onClick={() => this.setState({ expanded: !this.state.expanded })}
                  className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-600 transition-colors uppercase tracking-widest mb-3"
                >
                  <Cpu size={14} /> {this.state.expanded ? 'Ocultar Detalles Técnicos' : 'Ver Detalles Técnicos'}
                </button>
                
                {this.state.expanded && (
                  <div className="bg-zinc-900 rounded-xl p-4 text-[10px] font-mono text-zinc-400 overflow-auto max-h-48 leading-relaxed shadow-inner">
                    <pre className="whitespace-pre-wrap">
                      {this.state.error?.stack}
                      {"\n\nComponent Stack:\n"}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Footer / Actions */}
            <div className="p-8 bg-zinc-50 border-t border-zinc-100 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={this.handleReload}
                className="flex-1 bg-zinc-900 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
              >
                <RefreshCcw size={18} /> Limpiar Caché y Recargar
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="sm:px-8 bg-white border border-zinc-200 text-zinc-600 py-4 rounded-2xl font-bold text-sm hover:bg-zinc-100 transition-all"
              >
                Ir al Inicio
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
