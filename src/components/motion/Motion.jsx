import React from "react";
import { motion } from "framer-motion";

// ---- Premium motion primitives, shared across the whole app ----
// Tuned spring/ease values give a smooth, tactile, high-end feel.

const EASE = [0.22, 1, 0.36, 1]; // gentle "ease-out-expo" style

// Page-level entrance: subtle fade + rise.
export const PageTransition = ({ children, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.45, ease: EASE }}
    className={className}
  >
    {children}
  </motion.div>
);

// Container that staggers its children in sequence.
export const Stagger = ({ children, className = "", delay = 0.05 }) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="show"
    variants={{
      hidden: {},
      show: { transition: { staggerChildren: 0.06, delayChildren: delay } },
    }}
  >
    {children}
  </motion.div>
);

// A single item inside a Stagger (or standalone reveal).
export const StaggerItem = ({ children, className = "" }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 16 },
      show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// Tactile press wrapper for cards / list rows.
export const Pressable = ({ children, className = "", ...props }) => (
  <motion.div
    whileHover={{ y: -2 }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: "spring", stiffness: 400, damping: 25 }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// Count-up-ish number pop for stat tiles.
export const Pop = ({ children, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    className={className}
  >
    {children}
  </motion.div>
);

export { motion };