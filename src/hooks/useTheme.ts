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

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const applyTheme = (themeMode: 'light' | 'dark' | 'auto') => {
        const root = document.documentElement;

        if (themeMode === 'auto') {
            // Use system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        } else if (themeMode === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    };

    return { theme, applyTheme };
};
