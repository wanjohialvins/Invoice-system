import { useEffect, useState } from 'react';

export const useTheme = () => {
    const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light');

    useEffect(() => {
        // Load theme from localStorage
        const loadTheme = () => {
            try {
                const stored = localStorage.getItem('userPreferences');
                if (stored) {
                    const prefs = JSON.parse(stored);
                    return prefs.theme || 'light';
                }
            } catch (e) {
                console.error('Failed to load theme:', e);
            }
            return 'light';
        };

        const savedTheme = loadTheme();
        setTheme(savedTheme);
        applyTheme(savedTheme);

        // Listen for storage changes (when settings are updated)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'userPreferences' && e.newValue) {
                try {
                    const prefs = JSON.parse(e.newValue);
                    if (prefs.theme) {
                        setTheme(prefs.theme);
                        applyTheme(prefs.theme);
                    }
                } catch (err) {
                    console.error('Failed to parse theme update:', err);
                }
            }
        };

        // Listen for system theme changes if mode is 'auto'
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemChange = (e: MediaQueryListEvent) => {
            const currentTheme = loadTheme(); // Check current setting
            if (currentTheme === 'auto') {
                const root = document.documentElement;
                if (e.matches) root.classList.add('dark');
                else root.classList.remove('dark');
            }
        };

        window.addEventListener('storage', handleStorageChange);
        mediaQuery.addEventListener('change', handleSystemChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            mediaQuery.removeEventListener('change', handleSystemChange);
        };
    }, []);

    // Helper to actually apply the class
    const updateDOM = (themeMode: 'light' | 'dark' | 'auto') => {
        const root = document.documentElement;
        const isDark =
            themeMode === 'dark' ||
            (themeMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

        if (isDark) root.classList.add('dark');
        else root.classList.remove('dark');
    };

    const applyTheme = (newTheme: 'light' | 'dark' | 'auto') => {
        // If View Transitions API is not supported, just update
        if (!document.startViewTransition) {
            updateDOM(newTheme);
            return;
        }

        // Nanobot / Tech Construction Effect
        const transition = document.startViewTransition(() => {
            updateDOM(newTheme);
        });

        transition.ready.then(() => {
            // "Wave from Right" Effect
            // The new theme flows in from the right edge to the left like water
            document.documentElement.animate(
                {
                    clipPath: [
                        "inset(0 0 0 100%)", // Fully clipped from left (hidden) - reveals from right? No, inset(top right bottom left)
                        // wait. inset(0 0 0 100%) means 100% is cut from the left. So visible width is 0. Content is at right? No.
                        // Standard inset clips *inward*.
                        // We want the new view (on top) to enter from Right.
                        // Start: clip-path should hide it.
                        // End: clip-path should show it.
                        // If we want it to look like it flows Left, the visible region should grow from Right to Left.
                        // inset(0 0 0 100%) -> inset(0 0 0 0).
                        // At 100% left clip, visible is 0. As clip reduces to 0, it reveals leftwards. Correct.
                        "inset(0 0 0 0)"
                    ],
                },
                {
                    duration: 1500, // Gradual, fluid
                    easing: "cubic-bezier(0.4, 0.0, 0.2, 1)", // Smooth water-like flow
                    pseudoElement: "::view-transition-new(root)",
                }
            );
        });
    };

    const setThemeAndSave = (newTheme: 'light' | 'dark' | 'auto') => {
        setTheme(newTheme);
        // Persist immediately (Iron Man doesn't wait to save his config)
        try {
            const stored = localStorage.getItem('userPreferences');
            const prefs = stored ? JSON.parse(stored) : {};
            localStorage.setItem('userPreferences', JSON.stringify({ ...prefs, theme: newTheme }));
        } catch (e) {
            console.error(e);
        }
        applyTheme(newTheme);
    };

    return { theme, applyTheme: setThemeAndSave };
};
