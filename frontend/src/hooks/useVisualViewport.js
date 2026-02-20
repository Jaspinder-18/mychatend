/**
 * useVisualViewport — Production-grade keyboard + notch handler
 *
 * Writes two CSS variables into :root:
 *   --app-height : the VISIBLE viewport height (shrinks when keyboard opens)
 *   --app-top    : the offset from top (non-zero if viewport scrolls up on Android)
 *
 * This makes the app behave exactly like WhatsApp / Instagram:
 *   - Header stays pinned at the top (uses --app-top to compensate)
 *   - Input follows the keyboard up (container shrinks via --app-height)
 *   - Zero layout jump or white gap
 */
import { useEffect } from 'react';

const useVisualViewport = () => {
    useEffect(() => {
        const update = () => {
            const vv = window.visualViewport;
            const height = vv ? vv.height : window.innerHeight;
            const offsetTop = vv ? vv.offsetTop : 0;

            document.documentElement.style.setProperty('--app-height', `${height}px`);
            document.documentElement.style.setProperty('--app-top', `${offsetTop}px`);
        };

        update();

        const vv = window.visualViewport;
        if (vv) {
            vv.addEventListener('resize', update, { passive: true });
            vv.addEventListener('scroll', update, { passive: true });
        }
        window.addEventListener('resize', update, { passive: true });

        return () => {
            if (vv) {
                vv.removeEventListener('resize', update);
                vv.removeEventListener('scroll', update);
            }
            window.removeEventListener('resize', update);
        };
    }, []);
};

export default useVisualViewport;
