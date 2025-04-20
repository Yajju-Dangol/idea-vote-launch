'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface LightboxProps {
  imageUrl: string | null;
  onClose: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({ imageUrl, onClose }) => {
  // Prevent scrolling when lightbox is open
  React.useEffect(() => {
    if (imageUrl) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    // Cleanup function
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [imageUrl]);

  return (
    <AnimatePresence>
      {imageUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose} // Close on overlay click
        >
          {/* Content Wrapper (prevents overlay click from closing when clicking image/button) */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative max-w-full max-h-full flex"
            onClick={(e) => e.stopPropagation()} // Stop click propagation
          >
            <img
              src={imageUrl}
              alt="Fullscreen Idea Image"
              className="block max-w-[90vw] max-h-[90vh] object-contain rounded-md shadow-lg"
            />
          </motion.div>

          {/* Close Button */}
          <motion.button
             initial={{ opacity: 0 }}
             animate={{ opacity: 1, transition: { delay: 0.2 } }}
             exit={{ opacity: 0 }}
             onClick={onClose}
             className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/75 transition-colors z-50"
             aria-label="Close image view"
          >
            <X size={24} />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Lightbox; 