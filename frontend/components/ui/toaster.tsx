"use client"
import { useToast } from "@/hooks/use-toast"
import { X } from "lucide-react"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4 max-w-md w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg border p-4 shadow-lg bg-background ${
            toast.variant === "destructive" ? "border-destructive" : ""
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              {toast.title && <div className="font-semibold">{toast.title}</div>}
              {toast.description && <div className="text-sm text-muted-foreground">{toast.description}</div>}
            </div>
            <button onClick={() => dismiss(toast.id)} className="p-1 hover:bg-muted rounded">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
