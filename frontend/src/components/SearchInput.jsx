import { useState, useRef, useEffect } from 'react'
import { Search, Settings, Clock, Link as LinkIcon, Cpu, Key, Upload, Save, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SearchInput({ onSubmit, onOpenHistory, onToggleSettings, onHistoryImported }) {
  const [query, setQuery] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [depth, setDepth] = useState(6)
  const [llmUrl, setLlmUrl] = useState('')
  const [modelName, setModelName] = useState('')
  const [llmApiKey, setLlmApiKey] = useState('')
  const [tavilyApiKey, setTavilyApiKey] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    // Autofocus input on load
    inputRef.current?.focus()
    
    // Load config
    const loadConfig = async () => {
      if (window.pywebview && window.pywebview.api) {
        try {
          const data = await window.pywebview.api.get_config()
          if (data.depth) setDepth(data.depth)
          if (data.llmUrl) setLlmUrl(data.llmUrl)
          if (data.modelName) setModelName(data.modelName)
          if (data.llmApiKey !== undefined) setLlmApiKey(data.llmApiKey)
          if (data.tavilyApiKey !== undefined) setTavilyApiKey(data.tavilyApiKey)
        } catch (err) {
          console.error("Error loading config", err)
        }
      } else {
        setTimeout(loadConfig, 500)
      }
    }
    loadConfig()
  }, [])

  // Sync settings state with parent component
  useEffect(() => {
    if (onToggleSettings) {
      onToggleSettings(showSettings)
    }
  }, [showSettings, onToggleSettings])

  const handleSaveConfig = async () => {
    setIsSaving(true)
    if (window.pywebview && window.pywebview.api) {
      try {
        await window.pywebview.api.save_config({ depth, llmUrl, modelName, llmApiKey, tavilyApiKey })
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2000)
      } catch (err) {
        console.error("Error saving config", err)
      } finally {
        setIsSaving(false)
      }
    } else {
      setIsSaving(false)
    }
  }

  const handleImportHistory = async () => {
    if (window.pywebview && window.pywebview.api) {
      const res = await window.pywebview.api.import_history()
      if (res.success) {
        if (onHistoryImported) onHistoryImported()
        // Ocultar settings después de importar para ver el dashboard si quisieran
        // o mostrar un mensajito.
      } else if (res.error !== "Operación cancelada.") {
        alert(res.error || "Error al importar el historial.")
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      onSubmit(query, depth, llmUrl, modelName)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="glass-panel rounded-2xl overflow-hidden flex flex-col transition-all duration-300">
        
        {/* Main Search Area */}
        <div className="flex items-center p-4 gap-3 relative z-10">
          <button 
            onClick={handleSubmit}
            className="p-2 text-zinc-400 hover:text-indigo-400 transition-colors"
          >
            <Search size={24} />
          </button>
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="¿Qué deseas investigar?"
            className="flex-1 bg-transparent border-none outline-none text-xl text-zinc-100 placeholder:text-zinc-500 py-2"
          />
          
          <div className="flex items-center gap-1 border-l border-glass-border pl-3 ml-2">
            <button 
              onClick={onOpenHistory}
              className="p-2 text-zinc-400 hover:text-zinc-200 transition-colors rounded-lg hover:bg-glass-highlight"
              title="Ver historial"
            >
              <Clock size={20} />
            </button>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${showSettings ? 'text-indigo-400 bg-glass-highlight' : 'text-zinc-400 hover:text-zinc-200 hover:bg-glass-highlight'}`}
              title="Ajustes de búsqueda"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Settings Drawer (Animated) */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-glass-border bg-black/20"
            >
              <div className="p-5 flex flex-col gap-5">
                
                {/* Depth Slider */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-300 font-medium">Profundidad de investigación</span>
                    <span className="text-indigo-400 font-mono font-bold bg-indigo-500/10 px-2 py-1 rounded-md">
                      {depth} {depth <= 4 ? '(Básico)' : depth <= 6 ? '(Intermedio)' : '(Avanzado)'}
                    </span>
                  </div>
                  
                  <input 
                    type="range" 
                    min="2" 
                    max="10" 
                    step="2"
                    value={depth}
                    onChange={(e) => setDepth(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer h-2 bg-zinc-800 rounded-lg appearance-none mt-2"
                  />
                  
                  <div className="flex justify-between text-xs text-zinc-500 px-1 mt-1">
                    <span>Rápido</span>
                    <span>Balanceado</span>
                    <span>Exhaustivo</span>
                  </div>
                </div>

                {/* LLM Configuration & API Keys */}
                <div className="grid grid-cols-2 gap-4 border-t border-glass-border pt-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-zinc-400 flex items-center gap-1.5">
                      <LinkIcon size={12} />
                      LLM URL Base
                    </label>
                    <input 
                      type="text" 
                      value={llmUrl}
                      onChange={(e) => setLlmUrl(e.target.value)}
                      className="bg-black/30 border border-glass-border rounded-lg px-3 py-1.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/50 transition-colors"
                      placeholder="http://localhost:1234/v1"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-zinc-400 flex items-center gap-1.5">
                      <Cpu size={12} />
                      Nombre del Modelo
                    </label>
                    <input 
                      type="text" 
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      className="bg-black/30 border border-glass-border rounded-lg px-3 py-1.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/50 transition-colors"
                      placeholder="google/gemma-4-e4b"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-zinc-400 flex items-center gap-1.5">
                      <Key size={12} />
                      LLM API Key
                    </label>
                    <input 
                      type="password" 
                      value={llmApiKey}
                      onChange={(e) => setLlmApiKey(e.target.value)}
                      className="bg-black/30 border border-glass-border rounded-lg px-3 py-1.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/50 transition-colors"
                      placeholder="Opcional para modelos locales."
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-zinc-400 flex items-center gap-1.5">
                      <Key size={12} />
                      Tavily API Key
                    </label>
                    <input 
                      type="password" 
                      value={tavilyApiKey}
                      onChange={(e) => setTavilyApiKey(e.target.value)}
                      className="bg-black/30 border border-glass-border rounded-lg px-3 py-1.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/50 transition-colors"
                      placeholder="tvly-..."
                    />
                  </div>
                </div>

                {/* Data Management & Save Button */}
                <div className="border-t border-glass-border pt-4 flex justify-between items-center">
                  <button 
                    onClick={handleImportHistory}
                    className="flex items-center justify-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg px-4 py-2 text-sm transition-colors"
                  >
                    <Upload size={16} />
                    Importar Historial
                  </button>

                  <button 
                    onClick={handleSaveConfig}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${saveSuccess ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-indigo-500 text-white hover:bg-indigo-600'}`}
                  >
                    {saveSuccess ? (
                      <>
                        <Check size={16} />
                        ¡Guardado!
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Guardar Preferencias
                      </>
                    )}
                  </button>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
      </div>
    </motion.div>
  )
}
