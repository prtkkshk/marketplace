import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export const PageContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div 
      className={`max-w-[1280px] mx-auto px-5 md:px-[34px] w-full ${className}`}
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.180, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};
