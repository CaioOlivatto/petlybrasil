import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useOutlet } from "react-router-dom";
import { cloneElement } from "react";

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const pageTransition = {
  duration: 0.25,
  ease: "easeInOut" as const,
};

export function AnimatedOutlet() {
  const location = useLocation();
  const element = useOutlet();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={pageTransition}
      >
        {element && cloneElement(element, { key: location.pathname })}
      </motion.div>
    </AnimatePresence>
  );
}
