import { useState, useEffect } from "react"

export type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

// Global state for toasts
let toastCallbacks: ((toast: ToastProps) => void)[] = []

export function toast(props: ToastProps) {
  toastCallbacks.forEach(cb => cb(props))
}

export function useToast() {
  const [toasts, setToasts] = useState<(ToastProps & { id: number })[]>([])

  useEffect(() => {
    const cb = (props: ToastProps) => {
      const id = Date.now()
      setToasts(prev => [...prev, { ...props, id }])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 3000)
    }
    toastCallbacks.push(cb)
    return () => {
      toastCallbacks = toastCallbacks.filter(c => c !== cb)
    }
  }, [])

  return { toast, toasts }
}
