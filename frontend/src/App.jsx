import { useState, useEffect } from 'react'
import SearchInput from './components/SearchInput'
import MainView from './components/MainView'
import HistoryView from './components/HistoryView'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Loader2, X } from 'lucide-react'

function App() {
  const [currentView, setCurrentView] = useState('search') // 'search', 'main', 'history'
  const [isSearchConfigOpen, setIsSearchConfigOpen] = useState(false)
  const [currentQueryData, setCurrentQueryData] = useState(null)
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadHistory = async () => {
    if (window.pywebview && window.pywebview.api) {
      try {
        const data = await window.pywebview.api.get_history()
        if (data.history) setHistory(data.history)
      } catch (err) {
        console.error("No se pudo cargar el historial", err)
      }
    } else {
      // Retry in 500ms if pywebview is not ready
      setTimeout(loadHistory, 500)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        window.pywebview?.api?.close?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const handleResearchComplete = (e) => {
      const data = e.detail
      
      // Update history after research completes
      loadHistory()
      
      const newData = {
        id: Date.now(),
        query: currentQueryData?.query || 'Última Búsqueda',
        response: data.summary || "No se generó resumen.",
        sources: data.urls || [],
        depth: currentQueryData?.depth || 6,
        elapsed_time: data.elapsed_time,
        date: new Date().toISOString(),
        isNew: true
      }
      
      setCurrentQueryData(newData)
      setIsLoading(false)
    }
    const handleResearchError = (e) => {
      setError(e.detail || 'Ocurrió un error inesperado durante la investigación.')
      setIsLoading(false)
    }

    window.addEventListener('research_complete', handleResearchComplete)
    window.addEventListener('research_error', handleResearchError)

    return () => {
      window.removeEventListener('research_complete', handleResearchComplete)
      window.removeEventListener('research_error', handleResearchError)
    }
  }, [currentQueryData])

  const handleSearchSubmit = async (query, depth, llmUrl, modelName) => {
    setIsLoading(true)
    setError(null)
    setCurrentQueryData({ query, depth }) // Temp data before complete

    if (window.pywebview && window.pywebview.api) {
      try {
        await window.pywebview.api.research({ query, depth, llmUrl, modelName })
        setCurrentView('main') // Switch immediately to see streaming
      } catch (err) {
        setError(err.message || 'Error de conexión con el backend.')
        setIsLoading(false)
      }
    } else {
      setError('PyWebView API no está disponible.')
      setIsLoading(false)
    }
  }

  const handleHistoryClick = (item) => {
    setCurrentQueryData({ ...item, isNew: false })
    setCurrentView('main')
  }

  const handleDeleteHistoryItem = async (id) => {
    if (window.pywebview && window.pywebview.api) {
      try {
        await window.pywebview.api.delete_history_item(id)
        setHistory(prev => prev.filter(item => item.id !== id))
      } catch (err) {
        console.error("Error al eliminar el item", err)
      }
    }
  }

  const handleClearHistory = async () => {
    if (window.pywebview && window.pywebview.api) {
      try {
        await window.pywebview.api.clear_history()
        setHistory([])
      } catch (err) {
        console.error("Error al limpiar el historial", err)
      }
    }
  }

  const handleExportHistory = async () => {
    if (window.pywebview && window.pywebview.api) {
      const res = await window.pywebview.api.export_history()
      if (!res.success && res.error !== "Operación cancelada.") {
        alert(res.error || "Error al exportar el historial.")
      }
    }
  }

  useEffect(() => {
    const resizeWindow = () => {
      if (window.pywebview && window.pywebview.api) {
        if (currentView === 'search') {
          if (isSearchConfigOpen) {
            window.pywebview.api.resize(710, 490)
          } else {
            window.pywebview.api.resize(710, 120)
          }
        } else if (currentView === 'history') {
          window.pywebview.api.resize(940, 680)
        } else if (currentView === 'main') {
          window.pywebview.api.resize(1190, 750)
        }
      }
    }

    if (window.pywebview) {
      resizeWindow()
    } else {
      window.addEventListener('pywebviewready', resizeWindow)
      return () => window.removeEventListener('pywebviewready', resizeWindow)
    }
  }, [currentView, isSearchConfigOpen])

  const displayData = currentQueryData ? {
    ...currentQueryData,
    response: isLoading ? "Leyendo fuentes y analizando datos..." : currentQueryData.response
  } : null

  return (
    <div className="w-full flex justify-center items-center min-h-screen text-zinc-100 font-sans p-4 relative">
      
      {/* Background Drag Region */}
      <div className="absolute inset-0 pywebview-drag-region z-0" />

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-red-500/20 border border-red-500/50 backdrop-blur-md px-4 py-3 rounded-xl flex items-center gap-3 shadow-2xl max-w-lg"
          >
            <AlertCircle className="text-red-400 shrink-0" size={20} />
            <span className="text-red-200 text-sm font-medium">{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-white transition-colors ml-2">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {currentView === 'search' && (
        <div className="relative w-full max-w-2xl mx-auto">
          <SearchInput 
            onSubmit={handleSearchSubmit} 
            onOpenHistory={() => setCurrentView('history')} 
            onToggleSettings={setIsSearchConfigOpen}
            onHistoryImported={loadHistory}
          />
        </div>
      )}
      
      {currentView === 'main' && (
        <MainView 
          data={displayData} 
          onBack={() => {
            setCurrentView('search')
          }} 
          isLoading={isLoading}
        />
      )}
      
      {currentView === 'history' && (
        <HistoryView 
          history={history} 
          onItemClick={handleHistoryClick} 
          onDelete={handleDeleteHistoryItem}
          onClear={handleClearHistory}
          onExport={handleExportHistory}
          onBack={() => setCurrentView('search')} 
        />
      )}
    </div>
  )
}

export default App
