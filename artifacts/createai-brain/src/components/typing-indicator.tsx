import React from "react";
import { motion } from "framer-motion";

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full my-1.5 justify-start"
    >
      <div className="bg-secondary text-secondary-foreground px-4 py-3.5 rounded-r-2xl rounded-tl-2xl rounded-bl-sm relative w-16 h-10 flex items-center justify-center gap-1 shadow-sm">
        <motion.div
          className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
        />
        <motion.div
          className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
        />
        
        {/* Subtle decorative tail */}
        <div className="absolute bottom-0 -left-1.5 w-4 h-4 text-secondary">
          <svg viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
             <path d="M16 16C16 16 10 16 6 12C3.5 9.5 0 0 0 0C0 0 3 8 16 16Z" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}
