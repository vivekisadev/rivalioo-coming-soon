import { useEffect } from "react";
import Lenis from "lenis";

import "lenis/dist/lenis.css";

export default function SmoothScroll({ children }: { children: any }) {
    useEffect(() => {
        const lenis = new Lenis({
            lerp: 0.1, // Slightly higher for more responsiveness/less drag
            duration: 1.2,
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
            infinite: false,
            autoResize: true,
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
