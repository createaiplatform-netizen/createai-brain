import React from "react";
import { motion } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ChatBubbleProps {
  role: "user" | "assistant" | "system";
  content: string;
  isStreaming?: boolean;
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "flex w-full my-1.5",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] px-4 py-2.5 text-[15px] leading-relaxed relative",
          isUser
            ? "bg-primary text-primary-foreground rounded-l-2xl rounded-tr-2xl rounded-br-sm ml-8"
            : "bg-secondary text-secondary-foreground rounded-r-2xl rounded-tl-2xl rounded-bl-sm mr-8",
          isStreaming && "animate-pulse shadow-[0_0_15px_rgba(0,122,255,0.15)]"
        )}
        style={{
          boxShadow: isUser 
            ? "0 2px 5px rgba(0,0,0,0.05), 0 1px 1px rgba(0,0,0,0.02)" 
            : "0 1px 2px rgba(0,0,0,0.03)",
        }}
      >
        <p className="whitespace-pre-wrap break-words">{content}</p>
        
        {/* Subtle decorative tail for iMessage effect */}
        <div 
          className={cn(
            "absolute bottom-0 w-4 h-4",
            isUser ? "-right-1.5 text-primary" : "-left-1.5 text-secondary"
          )}
        >
          <svg viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            {isUser ? (
               <path d="M0 16C0 16 6 16 10 12C12.5 9.5 16 0 16 0C16 0 13 8 0 16Z" />
            ) : (
               <path d="M16 16C16 16 10 16 6 12C3.5 9.5 0 0 0 0C0 0 3 8 16 16Z" />
            )}
          </svg>
        </div>
      </div>
    </motion.div>
  );
}
