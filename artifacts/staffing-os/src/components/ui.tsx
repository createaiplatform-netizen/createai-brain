import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";

// --- BUTTON ---
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      default: "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      outline: "border-2 border-input bg-transparent hover:bg-accent hover:text-accent-foreground hover:border-accent",
      ghost: "hover:bg-accent/10 hover:text-accent",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
    };
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-12 rounded-lg px-8 text-base",
      icon: "h-10 w-10",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

// --- INPUT ---
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-2 w-full">
        {label && <label className="text-sm font-semibold text-foreground">{label}</label>}
        <input
          ref={ref}
          className={cn(
            "flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/10 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
            error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/10",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-destructive font-medium">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

// --- SELECT ---
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, children, ...props }, ref) => {
    return (
      <div className="space-y-2 w-full">
        {label && <label className="text-sm font-semibold text-foreground">{label}</label>}
        <select
          ref={ref}
          className={cn(
            "flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/10 disabled:cursor-not-allowed disabled:opacity-50 transition-all appearance-none",
            error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/10",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-destructive font-medium">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

// --- BADGE ---
export function Badge({ className, variant = "default", children }: { className?: string, variant?: "default" | "success" | "warning" | "destructive" | "outline", children: React.ReactNode }) {
  const variants = {
    default: "bg-primary/10 text-primary hover:bg-primary/20",
    success: "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25",
    warning: "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25",
    destructive: "bg-destructive/15 text-destructive hover:bg-destructive/25",
    outline: "text-foreground border border-input",
  };
  return (
    <div className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors", variants[variant], className)}>
      {children}
    </div>
  );
}

// --- CARD ---
export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-2xl border border-slate-200/60 bg-card text-card-foreground shadow-sm hover:shadow-md transition-all duration-300", className)} {...props}>
      {children}
    </div>
  );
}

// --- MODAL ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, description, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl pointer-events-auto border border-slate-100"
            >
              <div className="flex flex-col">
                <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                  <div>
                    <h2 className="text-lg font-bold text-foreground font-display">{title}</h2>
                    {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
                  </div>
                  <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-200/50 text-slate-500 transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-6 max-h-[75vh] overflow-y-auto">
                  {children}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// --- PAGE HEADER ---
export function PageHeader({ title, description, action }: { title: string, description?: string, action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground font-display">{title}</h1>
        {description && <p className="text-muted-foreground mt-1 text-sm md:text-base">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// --- TABLE WRAPPER ---
export function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-sm text-left">
          {children}
        </table>
      </div>
    </div>
  );
}

export function Th({ children, className }: { children: React.ReactNode, className?: string }) {
  return <th className={cn("px-6 py-4 font-semibold text-slate-500 border-b border-slate-100 bg-slate-50/50 uppercase tracking-wider text-xs", className)}>{children}</th>;
}

export function Td({ children, className }: { children: React.ReactNode, className?: string }) {
  return <td className={cn("px-6 py-4 border-b border-slate-50 text-slate-700", className)}>{children}</td>;
}
