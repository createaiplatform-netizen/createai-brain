import React from "react";
import { motion } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { OutputFormatter } from "@/components/OutputFormatter";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ChatBubbleProps {
  role: "user" | "assistant" | "system";
  content: string;
  isStreaming?: boolean;
}

function looksStructured(text: string): boolean {
  return (
    text.includes("## ") ||
    text.includes("### ") ||
    text.includes("**") ||
    text.includes("- ") ||
    text.includes("1. ") ||
    text.includes("---") ||
    text.split("\n").length > 6
  );
}

export function ChatBubble({ role, content, isStreaming }: ChatBubbleProps) {
  if (role === "system") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center my-6"
      >
        <div className="bg-muted text-muted-foreground text-xs font-medium px-4 py-1.5 rounded-full tracking-wide">
          {content}
        </div>
      </motion.div>
    );
  }

  const isUser = role === "user";
  const useFormatter = !isUser && looksStructured(content);

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18 }}
        className="flex w-full my-1.5 justify-end"
      >
        <div
          className="max-w-[75%] px-4 py-2.5 text-[15px] leading-relaxed relative rounded-l-2xl rounded-tr-2xl rounded-br-sm ml-8"
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
            color: "#fff",
            boxShadow: "0 2px 12px rgba(99,102,241,0.30)",
          }}
        >
          <p className="whitespace-pre-wrap break-words">{content}</p>
          <div className="absolute bottom-0 -right-1.5 w-4 h-4" style={{ color: "#818cf8" }}>
            <svg viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 16C0 16 6 16 10 12C12.5 9.5 16 0 16 0C16 0 13 8 0 16Z" />
            </svg>
          </div>
        </div>
      </motion.div>
    );
  }

  if (useFormatter) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className={cn(
          "flex w-full my-2 justify-start",
          isStreaming && "opacity-90"
        )}
      >
        <div className="flex items-start gap-2.5 max-w-[88%] mr-8">
          <div
            className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center text-base mt-0.5"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.20) 0%, rgba(139,92,246,0.20) 100%)",
              border: "1px solid rgba(99,102,241,0.25)",
            }}
          >
            🧠
          </div>
          <div
            className="flex-1 rounded-2xl rounded-tl-sm px-4 py-3"
            style={{
              background: "rgba(14,18,42,0.80)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(20px)",
            }}
          >
            <OutputFormatter content={content} compact />
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-primary/70 rounded-full ml-1 animate-pulse" />
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18 }}
      className={cn(
        "flex w-full my-1.5 justify-start",
        isStreaming && "opacity-90"
      )}
    >
      <div className="flex items-start gap-2.5 max-w-[80%] mr-8">
        <div
          className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center text-base mt-0.5"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.18) 100%)",
            border: "1px solid rgba(99,102,241,0.22)",
          }}
        >
          🧠
        </div>
        <div
          className="flex-1 px-4 py-2.5 text-[15px] leading-relaxed relative rounded-r-2xl rounded-tl-2xl rounded-bl-sm"
          style={{
            background: "rgba(14,18,42,0.75)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.88)",
          }}
        >
          <p className="whitespace-pre-wrap break-words">{content}</p>
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-primary/70 rounded-full ml-1 animate-pulse" />
          )}
        </div>
      </div>
    </motion.div>
  );
}
