import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

type TransitionContextType = {
    triggerTransition: (path: string, x: number, y: number, color?: string, state?: any, isExternal?: boolean) => void;
};

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

export const TransitionProvider = ({ children }: { children: ReactNode }) => {
    const navigate = useNavigate();
    const [isActive, setIsActive] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [color, setColor] = useState('#2FE9A9'); // Default brand green
    const [nextPath, setNextPath] = useState('');
    const [navState, setNavState] = useState<any>(null);
    const [isExternalLink, setIsExternalLink] = useState(false);

    const triggerTransition = (path: string, x: number, y: number, customColor?: string, state?: any, isExternal?: boolean) => {
        setPosition({ x, y });
        setNextPath(path);
        if (customColor) setColor(customColor);
        if (state) setNavState(state);
        setIsExternalLink(!!isExternal);
        setIsActive(true);
    };

    return (
        <TransitionContext.Provider value={{ triggerTransition }}>
            {children}
            <AnimatePresence mode="wait">
                {isActive && (
                    <motion.div
                        initial={{ clipPath: `circle(0px at ${position.x}px ${position.y}px)` }}
                        animate={{ clipPath: `circle(150% at ${position.x}px ${position.y}px)` }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }} // smooth easeInOut
                        className="fixed inset-0 z-[9999] pointer-events-none"
                        style={{ backgroundColor: color }}
                        onAnimationComplete={() => {
                            // Navigate once the screen is fully covered
                            if (isExternalLink) {
                                window.location.href = nextPath;
                            } else {
                                navigate(nextPath, { state: navState });
                            }
                            // Small delay to ensure render, then fade out
                            setTimeout(() => setIsActive(false), 200);
                        }}
                    />
                )}
            </AnimatePresence>
        </TransitionContext.Provider>
    );
};

export const useTransition = () => {
    const context = useContext(TransitionContext);
    if (!context) {
        throw new Error('useTransition must be used within a TransitionProvider');
    }
    return context;
};
