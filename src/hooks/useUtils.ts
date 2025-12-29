// Shared utility hooks for the application
import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Debounced search hook
 * Delays the search value update to reduce unnecessary re-renders
 */
export const useDebounce = <T,>(value: T, delay: number = 300): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
};

/**
 * Keyboard shortcut hook
 * Handles keyboard shortcuts throughout the application
 */
export const useKeyboardShortcut = (
    key: string,
    callback: () => void,
    ctrlKey: boolean = false,
    shiftKey: boolean = false
) => {
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (
                e.key.toLowerCase() === key.toLowerCase() &&
                e.ctrlKey === ctrlKey &&
                e.shiftKey === shiftKey
            ) {
                e.preventDefault();
                callback();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [key, callback, ctrlKey, shiftKey]);
};

/**
 * Loading state hook with automatic timeout
 */
export const useLoadingState = (initialState: boolean = false) => {
    const [loading, setLoading] = useState(initialState);

    const startLoading = useCallback(() => setLoading(true), []);
    const stopLoading = useCallback(() => setLoading(false), []);

    return { loading, startLoading, stopLoading };
};

/**
 * Local storage hook with JSON serialization
 */
export const useLocalStorage = <T,>(key: string, initialValue: T) => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error loading ${key} from localStorage:`, error);
            return initialValue;
        }
    });

    const setValue = useCallback((value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(`Error saving ${key} to localStorage:`, error);
        }
    }, [key, storedValue]);

    return [storedValue, setValue] as const;
};
