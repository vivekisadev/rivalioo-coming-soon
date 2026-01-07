import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for class merging
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Context for Accordion state
type AccordionContextType = {
    activeValues: string[];
    toggleItem: (value: string) => void;
    collapsible: boolean;
};

const AccordionContext = createContext<AccordionContextType | undefined>(undefined);

type AccordionProps = {
    type?: 'single' | 'multiple';
    collapsible?: boolean;
    className?: string;
    children: React.ReactNode;
    defaultValue?: string | string[];
};

export const Accordion = ({
    type = 'single',
    collapsible = false,
    className,
    children,
    defaultValue,
}: AccordionProps) => {
    // Initialize state based on defaultValue
    const [activeValues, setActiveValues] = useState<string[]>(() => {
        if (defaultValue) {
            return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
        }
        return [];
    });

    const toggleItem = (value: string) => {
        setActiveValues((prev) => {
            if (type === 'single') {
                // If clicking the active item and it's collapsible, close it.
                // Otherwise, open the new item.
                if (prev.includes(value)) {
                    return collapsible ? [] : [value]; // If not collapsible, keep open (standard behavior usually allows closing if collapsible)
                }
                return [value];
            } else {
                // Multiple
                if (prev.includes(value)) {
                    return prev.filter((v) => v !== value);
                }
                return [...prev, value];
            }
        });
    };

    return (
        <AccordionContext.Provider value={{ activeValues, toggleItem, collapsible }}>
            <div className={cn('flex flex-col gap-2', className)}>{children}</div>
        </AccordionContext.Provider>
    );
};

type AccordionItemProps = {
    value: string;
    children: React.ReactNode;
    className?: string;
};

export const AccordionItem = ({ value, children, className }: AccordionItemProps) => {
    // Pass the value to children via Context or simple cloning?
    // Easier to use context, but AccordionItem basically just wraps.
    // Actually, Trigger and Content need to know the 'value' of this item.
    // We can use a context for the Item too.
    return (
        <AccordionItemContext.Provider value={{ value }}>
            <div className={cn('border-b border-white/10', className)}>
                {children}
            </div>
        </AccordionItemContext.Provider>
    );
};

// Items Context
const AccordionItemContext = createContext<{ value: string } | undefined>(undefined);

type AccordionTriggerProps = {
    children: React.ReactNode;
    className?: string;
    showArrow?: boolean;
};

export const AccordionTrigger = ({ children, className, showArrow = true }: AccordionTriggerProps) => {
    const context = useContext(AccordionContext);
    const itemContext = useContext(AccordionItemContext);

    if (!context || !itemContext) throw new Error('AccordionTrigger used outside Accordion');

    const isOpen = context.activeValues.includes(itemContext.value);

    return (
        <button
            onClick={() => context.toggleItem(itemContext.value)}
            className={cn(
                'flex w-full items-center justify-between py-4 text-sm font-medium transition-all hover:text-[#2FE9A9]',
                isOpen ? 'text-[#2FE9A9]' : 'text-gray-300',
                className
            )}
        >
            {children}
            {showArrow && (
                <ChevronDown
                    className={cn(
                        'h-4 w-4 shrink-0 transition-transform duration-200',
                        isOpen && 'rotate-180'
                    )}
                />
            )}
        </button>
    );
};

type AccordionContentProps = {
    children: React.ReactNode;
    className?: string;
    keepRendered?: boolean;
};

export const AccordionContent = ({ children, className }: AccordionContentProps) => {
    const context = useContext(AccordionContext);
    const itemContext = useContext(AccordionItemContext);

    if (!context || !itemContext) throw new Error('AccordionContent used outside Accordion');

    const isOpen = context.activeValues.includes(itemContext.value);

    return (
        <AnimatePresence initial={false}>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                >
                    <div className={cn('pb-4 text-sm text-gray-500', className)}>
                        {children}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
