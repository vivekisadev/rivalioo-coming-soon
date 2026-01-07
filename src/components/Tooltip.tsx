import React from 'react';
import {
    Tooltip as ShadcnTooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface TooltipProps {
    text: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({
    text,
    children,
    position = 'top',
}) => {
    return (
        <TooltipProvider delayDuration={300}>
            <ShadcnTooltip>
                <TooltipTrigger asChild>
                    {children}
                </TooltipTrigger>
                <TooltipContent side={position}>
                    <p>{text}</p>
                </TooltipContent>
            </ShadcnTooltip>
        </TooltipProvider>
    );
};

export default Tooltip;
