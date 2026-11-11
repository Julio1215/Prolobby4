import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react'

// ============================================
// CONTEXT
// ============================================

const ToastContext = createContext(null)

let externalToast = null

// ============================================
// TOAST ITEM
// ============================================

function ToastItem({ id, message, type = 'info', duration = 3500, onRemove }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), duration - 300)
    return () => clearTimeout(t)
  }, [duration])

  useEffect(() => {
    if (!visible) {
      const t = setTimeout(() => onRemove(id), 300)
      return () => clearTimeout(t)
    }
  }, [visible, id, onRemove])

  const icons = {
    success: '✓',
    error: '✕',
    info: '◆',
    warning: '⚠',
  }

  const styles = {
    success: 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200 [&>span:first-child]:bg-emerald-500/20 [&>span:first-child]:text-emerald-400',
    error:   'bg-red-950/90 border-red-500/30 text-red-200 [&>span:first-child]:bg-red-500/20 [&>span:first-child]:text-red-400',
    info:    'bg-slate-900/90 border-purple-500/30 text-purple-200 [&>span:first-child]:bg-purple-500/20 [&>span:first-child]:text-purple-300',
    warning: 'bg-amber-950/90 border-amber-500/30 text-amber-200 [&>span:first-child]:bg-amber-500/20 [&>span:first-child]:text-amber-400',
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md text-xs font-semibold shadow-xl transition-all duration-300 pointer-events-auto max-w-sm ${styles[type]} ${
        visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'
      }`}
    >
      <span className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold">
        {icons[type]}
      </span>
      <span className="leading-snug">{message}</span>
    </div>
  )
}

// ============================================
// PROVIDER
// ============================================

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counterRef = useRef(0)

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++counterRef.current
    setToasts(prev => [...prev, { id, message, type, duration }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // expose globally
  useEffect(() => {
    externalToast = addToast
    return () => { externalToast = null }
  }, [addToast])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map(t => (
          <ToastItem key={t.id} {...t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// ============================================
// HOOKS
// ============================================

export function useToast() {
  return useContext(ToastContext)
}

// Call from anywhere (outside React tree)
export const toast = {
  success: (msg, dur) => externalToast?.(msg, 'success', dur),
  error:   (msg, dur) => externalToast?.(msg, 'error', dur),
  info:    (msg, dur) => externalToast?.(msg, 'info', dur),
  warning: (msg, dur) => externalToast?.(msg, 'warning', dur),
}

export default toast