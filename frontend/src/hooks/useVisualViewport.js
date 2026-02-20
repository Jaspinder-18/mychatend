/**
 * useVisualViewport
 * -----------------
 * Listens to the VisualViewport API so the app height tracks the
 * *visible* area (i.e. shrinks when the on-screen keyboard opens).
 *
 * We write the height into a CSS custom property: --app-height
 * That variable is used INSTEAD of 100vh/100dvh everywhere.
 *
 * Why this works:
 *   - 100vh on iOS Safari = full screen (doesn't shrink for keyboard)
 *   - 100dvh = better but still jumpy on some Android browsers
 *   - visualViewport.height = exact visible area, updates instantly
 */
import { useEffect } from 'react';

const useVisualViewport = () => {
    useEffect(() => {
        const setHeight = () => {
            const vh = window.visualViewport
                ? window.visualViewport.height
                : window.innerHeight;

            // Set on :root so any elem can use var(--app-height)
            document.documentElement.style.setProperty('--app-height', `${vh}px`);
        };

        // Run immediately
        setHeight();

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', setHeight);
            window.visualViewport.addEventListener('scroll', setHeight);
        }
        window.addEventListener('resize', setHeight);

        return () => {
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', setHeight);
                window.visualViewport.removeEventListener('scroll', setHeight);
            }
            window.removeEventListener('resize', setHeight);
        };
    }, []);
};

export default useVisualViewport;
