import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";

// Subtle spinner shown at the top of a scroll area while a pull-to-refresh is in flight.
export default function PullToRefreshIndicator({ isRefreshing }) {
  return (
    <AnimatePresence>
      {isRefreshing && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center overflow-hidden"
        >
          <div className="flex items-center gap-2 text-muted-foreground text-xs py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Refreshing…
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}