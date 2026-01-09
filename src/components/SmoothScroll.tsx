import { useEffect } from "react";
import Lenis from "lenis";

import "lenis/dist/lenis.css";

export default function SmoothScroll({ children }: { children: any }) {
    useEffect(() => {
        const lenis = new Lenis({
            lerp: 0.08, // Smoother easing (lower = smoother but slightly more lag)
            duration: 1.5, // Longer duration for more fluid motion
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 0.8, // Reduced for finer control
            touchMultiplier: 1.5, // Reduced for smoother touch scrolling
            infinite: false,
            autoResize: true,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Custom easing for premium feel
        });

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
        };
    }, []);

    return <>{children}</>;
}
