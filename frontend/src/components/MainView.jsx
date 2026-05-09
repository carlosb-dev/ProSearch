import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ExternalLink, Database, SearchCheck, Copy, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function MainView({ data, onBack, isLoading }) {
  const [isCopied, setIsCopied] = useState(false)
  const [displayedText, setDisplayedText] = useState('')

  useEffect(() => {
    if (isLoading) {
      setDisplayedText(data?.response || '')
    } else if (data?.response && data.isNew) {
      let i = 0
      const fullText = data.response
      setDisplayedText('')
      
      const interval = setInterval(() => {
        i += 6 // fast typing effect
        if (i >= fullText.length) {
          clearInterval(interval)
          setDisplayedText(fullText)
        } else {
          setDisplayedText(fullText.slice(0, i))
        }
      }, 15)
      
      return () => clearInterval(interval)
    } else {
      setDisplayedText(data?.response || '')
    }
  }, [data?.response, isLoading, data?.isNew])

  if (!data) return null

  const handleCopy = () => {
    if (data.response) {
      navigator.clipboard.writeText(data.response)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-6xl h-[85vh] flex gap-6"
    >
      {/* Main Content Area */}
      <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden relative">
        <div className="border-b border-glass-border p-6 bg-black/10">
          <h2 className="text-2xl font-semibold text-zinc-100 mb-2 pywebview-drag-region cursor-move select-none inline-block pr-10">
            {data.query}
          </h2>
          <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
            <span className="flex items-center gap-1 bg-zinc-800/50 px-2 py-1 rounded">
              <Database size={12} />
              Depth: {data.depth}
            </span>
            <span>{new Date(data.date).toLocaleString()}</span>

            {/* Back Button (Bottom Right of Main Area) */}
            <div className="absolute right-6 z-10">
              <button
                onClick={onBack}
                className="glass-button flex items-center gap-2 px-4 py-2 rounded-xl text-zinc-300"
              >
                <ArrowLeft size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar text-lg text-zinc-300 leading-relaxed">
          <div className="flex items-start gap-4">
            <div className="mt-1 bg-indigo-500/20 p-2 rounded-lg text-indigo-400">
              <SearchCheck size={20} />
            </div>
            <motion.div 
              key={data.id + (isLoading ? '-loading' : '-loaded')}
              initial={!data.isNew && !isLoading ? { opacity: 0, y: 15 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex-1 w-full overflow-hidden"
            >
              <ReactMarkdown
                components={{
                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-3 text-indigo-300" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-5 mb-3 text-indigo-300" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-lg font-bold mt-4 mb-2 text-indigo-200" {...props} />,
                  p: ({node, ...props}) => <p className="mb-4 leading-relaxed" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
                  li: ({node, ...props}) => <li className="text-zinc-300" {...props} />,
                  a: ({node, ...props}) => <a className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2" target="_blank" rel="noopener noreferrer" {...props} />,
                  code: ({node, inline, ...props}) => 
                    inline ? <code className="bg-zinc-800/80 px-1.5 py-0.5 rounded-md text-sm font-mono text-indigo-200" {...props} /> :
                    <div className="bg-black/40 p-4 rounded-xl overflow-x-auto mb-4 border border-glass-border"><code className="font-mono text-sm text-zinc-300" {...props} /></div>,
                  strong: ({node, ...props}) => <strong className="font-semibold text-zinc-100" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-500/50 pl-4 italic text-zinc-400 my-4" {...props} />,
                  table: ({node, ...props}) => <div className="overflow-x-auto w-full mb-6"><table className="w-full text-left border-collapse" {...props} /></div>,
                  thead: ({node, ...props}) => <thead className="border-b border-glass-border bg-black/20" {...props} />,
                  tbody: ({node, ...props}) => <tbody className="divide-y divide-glass-border" {...props} />,
                  tr: ({node, ...props}) => <tr className="hover:bg-white/5 transition-colors" {...props} />,
                  th: ({node, ...props}) => <th className="px-4 py-3 font-semibold text-zinc-200" {...props} />,
                  td: ({node, ...props}) => <td className="px-4 py-3 text-zinc-300 align-top" {...props} />
                }}
                remarkPlugins={[remarkGfm]}
              >
                {displayedText}
              </ReactMarkdown>
              {isLoading && <span className="inline-block w-2 h-5 bg-indigo-500 ml-1 animate-pulse align-middle" />}
              
              {!isLoading && data.response && (
                <div className="mt-8 pt-4 border-t border-glass-border flex justify-between items-center">
                  <div className="text-sm text-zinc-500 font-mono">
                    {data.elapsed_time ? `⏱️ ${data.elapsed_time}s` : ''}
                  </div>
                  <button 
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors border border-glass-border text-sm"
                  >
                    {isCopied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                    {isCopied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>

      </div>

      {/* Sources Sidebar */}
      <div className="w-80 flex flex-col gap-4">
        <div className="glass-panel rounded-2xl p-5 flex flex-col h-full overflow-hidden">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 border-b border-glass-border pb-3">
            Fuentes
          </h3>

          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-2">
            {data.sources && data.sources.length > 0 ? (
              data.sources.map((source, idx) => (
                <a
                  key={idx}
                  href={source.url || source.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block p-4 rounded-xl border border-glass-border bg-black/20 hover:bg-white/5 hover:border-indigo-500/30 transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-zinc-200 text-sm font-medium line-clamp-2 group-hover:text-indigo-300 transition-colors">
                      {source.title}
                    </h4>
                    <ExternalLink size={14} className="text-zinc-500 shrink-0 mt-0.5 group-hover:text-indigo-400" />
                  </div>
                  <p className="text-xs text-zinc-500 mt-2 truncate font-mono">
                    {source.url ? new URL(source.url).hostname : (source.link ? new URL(source.link).hostname : 'Enlace desconocido')}
                  </p>
                </a>
              ))
            ) : (
              <div className="text-center p-4 text-sm text-zinc-500 italic">
                No se encontraron fuentes.
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
