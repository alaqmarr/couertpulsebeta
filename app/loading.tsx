"use client";

// Removed the import for Loader
import { motion } from "framer-motion";

// ERROR FIX: Defined the Loader component directly in this file
// to resolve the import path error.
function Loader() {
  return (
    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  );
}

export default function Loading() {
  return (
    // This div now fills the full height of its <main> container
    // MODIFICATION: Removed bg-gradient-to-br and replaced with simple bg-background
    <div className="flex flex-col items-center justify-center w-full h-full px-6 sm:px-10 md:px-16 text-foreground relative overflow-hidden">
      {/* "Glass Aurora" Background Effect */}
      <motion.div
        style={{ filter: "blur(120px)" }}
        animate={{
          x: [-100, 200, -100],
          y: [-100, 300, -100],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-80 h-80 bg-secondary/10 rounded-full"
        style={{ filter: "blur(100px)" }}
        animate={{
          x: [300, -200, 300],
          y: [200, -100, 200],
          rotate: [360, 180, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Main Content (z-10 to stay on top of aurora) */}
      {/* Removed 'mt-40' to allow proper vertical centering */}
      <div className="relative mt-40 z-10 flex flex-col items-center justify-center">
        {/* Brand Title */}
        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-center leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <img src="/logo.png" alt="CourtPulse Logo" className="w-50" />
        </motion.h1>

        {/* Tagline */}
        <motion.p
          className="mt-3 text-xs sm:text-sm md:text-base text-muted-foreground tracking-wide text-center max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Analyzing performance, syncing stats, and preparing your dashboard…
        </motion.p>

        {/* Loader Component */}
        <motion.div
          className="mt-12"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Loader />
        </motion.div>
      </div>

      {/* Footer */}
      <motion.p
        className="mt-4 bottom-6 sm:bottom-8 text-[10px] sm:text-xs text-muted-foreground tracking-widest uppercase text-center w-full z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ delay: 1.2 }}
      >
        © {new Date().getFullYear()} CourtPulse Analytics
      </motion.p>
    </div>
  );
}