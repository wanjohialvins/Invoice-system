import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design using media queries
 * 
 * @param query - CSS media query string (e.g., '(max-width: 768px)')
 * @returns boolean indicating if the media query matches
 */
export const useMediaQuery = (query: string): boolean => {
    const [matches, setMatches] = useState<boolean>(false);

    useEffect(() => {
        // Create media query list
        const mediaQuery = window.matchMedia(query);

        // Set initial value
        setMatches(mediaQuery.matches);

        // Create event listener function
        const handler = (event: MediaQueryListEvent) => {
            setMatches(event.matches);
        };

        // Add listener (using deprecated addListener for older browser support)
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handler);
        } else {
            // Fallback for older browsers
            mediaQuery.addListener(handler);
        }

        // Cleanup
        return () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', handler);
            } else {
                // Fallback for older browsers
                mediaQuery.removeListener(handler);
            }
        };
    }, [query]);

    return matches;
};

/**
 * Hook to detect if the current viewport is mobile/tablet (< 1024px)
 * This is the breakpoint where the sidebar should collapse
 */
export const useIsMobile = (): boolean => {
    return useMediaQuery('(max-width: 1023px)');
};

/**
 * Hook to detect if the current viewport is tablet (768px - 1023px)
 */
export const useIsTablet = (): boolean => {
    return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
};

/**
 * Hook to detect if the current viewport is desktop (>= 1024px)
 */
export const useIsDesktop = (): boolean => {
    return useMediaQuery('(min-width: 1024px)');
};
