import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldOff, Home, ArrowLeft } from 'lucide-react';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20 }
};

const floatAnimation = {
  y: [0, -12, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'easeInOut'
  }
};

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-navy pt-20 pb-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center"
    >
      <div className="max-w-lg w-full text-center">
        {/* Floating Shield Icon */}
        <motion.div
          animate={floatAnimation}
          className="inline-flex items-center justify-center mb-8"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-danger/20 blur-xl scale-150" />
            <div className="relative p-6 rounded-full bg-danger/10 border border-danger/30">
              <ShieldOff className="w-16 h-16 text-danger" />
            </div>
          </div>
        </motion.div>

        {/* 404 Glitch Text */}
        <div className="relative mb-4">
          <h1
            className="text-8xl sm:text-9xl font-black tracking-tighter"
            style={{
              color: 'transparent',
              WebkitTextStroke: '2px var(--danger)',
              textShadow: '0 0 40px rgba(224, 85, 85, 0.3)',
            }}
          >
            404
          </h1>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 text-8xl sm:text-9xl font-black tracking-tighter text-danger/30"
            style={{ transform: 'translate(2px, 2px)' }}
          >
            404
          </motion.h1>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-text-white mb-3">
          Page Not Found
        </h2>
        <p className="text-text-muted mb-8 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved. 
          Let's get you back to a secure zone.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="bg-blue-accent hover:bg-blue-600 text-white font-semibold rounded-xl px-6 py-3 transition-all duration-300 btn-glow flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </button>
          <button
            onClick={() => navigate(-1)}
            className="text-text-muted hover:text-text-white border border-navy-border hover:border-blue-accent/50 rounded-xl px-6 py-3 transition-all duration-300 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>

        {/* Decorative Grid Lines */}
        <div className="mt-16 grid grid-cols-3 gap-3 opacity-20">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.1 * i, duration: 0.6 }}
              className="h-1 rounded-full bg-gradient-to-r from-danger/0 via-danger to-danger/0"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default NotFound;
