import { motion } from 'framer-motion'
import { ArrowLeft, Clock, MessageSquare, Database, X, Trash2, Download } from 'lucide-react'

export default function HistoryView({ history, onItemClick, onBack, onDelete, onClear, onExport }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-4xl h-[85vh] flex flex-col relative glass-panel rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-glass-border bg-black/20 flex items-center gap-3">
        <Clock className="text-indigo-400" size={24} />
        <h2 className="text-2xl font-semibold text-zinc-100 m-0 pywebview-drag-region cursor-move select-none inline-block pr-10">Historial de Búsquedas</h2>

        {/* Back Button */}
        <div className="absolute top-6 right-6 z-10">
          <button
            onClick={onBack}
            className="glass-button flex items-center gap-2 px-4 py-2 rounded-xl text-zinc-300"
          >
            <ArrowLeft size={18} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {history.length > 0 ? (
          <>
            <div className="grid gap-4">
              {history.map((item, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className="group p-5 rounded-xl border border-glass-border bg-black/10 hover:bg-white/5 hover:border-indigo-500/40 cursor-pointer transition-all flex flex-col gap-2"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium text-zinc-200 group-hover:text-indigo-300 transition-colors line-clamp-1 flex-1 pr-4">
                      {item.query}
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                        <span className="flex items-center gap-1 bg-zinc-800/60 px-2 py-0.5 rounded">
                          <Database size={10} /> D:{item.depth}
                        </span>
                        <span>{new Date(item.date).toLocaleDateString()}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item.id);
                        }}
                        className="p-1.5 rounded-md text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
                        title="Eliminar del historial"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">
                    <MessageSquare size={14} className="inline mr-2 text-zinc-500" />
                    {item.response}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Data Management Buttons */}
            <div className="mt-8 flex justify-center gap-4 pb-4">
              <button 
                onClick={onExport}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-colors"
              >
                <Download size={16} />
                <span className="text-sm font-medium">Exportar historial</span>
              </button>
              <button
                onClick={onClear}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-colors"
              >
                <Trash2 size={16} />
                <span className="text-sm font-medium">Borrar todo el historial</span>
              </button>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-4">
            <Clock size={48} className="opacity-20" />
            <p>No hay búsquedas recientes.</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
