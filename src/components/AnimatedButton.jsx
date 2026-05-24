import {
    motion,
  } from "framer-motion";
  
  export default function AnimatedButton({
    children,
    className,
    onClick,
  }) {
  
    return (
  
      <motion.button
        whileTap={{
          scale: 0.96,
        }}
        transition={{
          duration: 0.12,
        }}
        onClick={onClick}
        className={className}
      >
  
        {children}
  
      </motion.button>
  
    );
  
  }