import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// Using a simple type for roles
export type UserRole = 'admin' | 'user';

export interface User {
    username: string;
    name: string;
    role: UserRole;
    avatar?: string;
    displayRole?: string; // e.g. "CEO", "Manager"
    permissions?: string[]; // Allowed paths. If undefined, allow all.
}

interface AuthContextType {
    user: User | null;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Import assets using new URL to avoid TypeScript module issues
const logoUrl = new URL('../assets/logo.jpg', import.meta.url).href;
const inventoryAvatarUrl = new URL('../assets/avatar_inventory.png', import.meta.url).href;
const salesAvatarUrl = new URL('../assets/avatar_sales.png', import.meta.url).href;

// Hardcoded credentials as requested
// SECURITY WARNING: This is for demonstration/local use only.
const CREDENTIALS = {
    ADMIN: { username: 'eragondevs', password: 'Drottastar21', name: 'Eragon Deves', role: 'admin' as UserRole, displayRole: 'Administrator' },
    USER: { username: 'konsut', password: 'konsut26', name: 'Konsut', role: 'user' as UserRole, displayRole: 'CEO', avatar: logoUrl },
    DATA_ENTRY: {
        username: 'Data entry',
        password: 'entry',
        name: 'Inventory Clerk',
        role: 'user' as UserRole,
        displayRole: 'Data Entry',
        avatar: inventoryAvatarUrl,
        permissions: ['/stock'] // STRICT ACCESS
    },
    SALES: {
        username: 'orders',
        password: 'create',
        name: 'Sales Agent',
        role: 'user' as UserRole,
        displayRole: 'Sales',
        avatar: salesAvatarUrl,
        permissions: ['/new-invoice', '/invoices', '/clients'] // Access to create/view orders and clients (needed for orders)
    }
};

const STORAGE_KEY = 'konsut_auth_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    // Load user from storage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch (e) {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    }, []);

    const login = async (username: string, password: string): Promise<boolean> => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Helper to set user
        const authenticate = (u: any) => {
            setUser(u);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
            return true;
        };

        if (username === CREDENTIALS.ADMIN.username && password === CREDENTIALS.ADMIN.password) {
            return authenticate({
                username: CREDENTIALS.ADMIN.username,
                name: CREDENTIALS.ADMIN.name,
                role: CREDENTIALS.ADMIN.role,
                displayRole: CREDENTIALS.ADMIN.displayRole
            });
        }

        if (username === CREDENTIALS.USER.username && password === CREDENTIALS.USER.password) {
            return authenticate({
                username: CREDENTIALS.USER.username,
                name: CREDENTIALS.USER.name,
                role: CREDENTIALS.USER.role,
                displayRole: CREDENTIALS.USER.displayRole,
                avatar: CREDENTIALS.USER.avatar
            });
        }

        if (username === CREDENTIALS.DATA_ENTRY.username && password === CREDENTIALS.DATA_ENTRY.password) {
            return authenticate({
                username: CREDENTIALS.DATA_ENTRY.username,
                name: CREDENTIALS.DATA_ENTRY.name,
                role: CREDENTIALS.DATA_ENTRY.role,
                displayRole: CREDENTIALS.DATA_ENTRY.displayRole,
                avatar: CREDENTIALS.DATA_ENTRY.avatar,
                permissions: CREDENTIALS.DATA_ENTRY.permissions
            });
        }

        if (username === CREDENTIALS.SALES.username && password === CREDENTIALS.SALES.password) {
            return authenticate({
                username: CREDENTIALS.SALES.username,
                name: CREDENTIALS.SALES.name,
                role: CREDENTIALS.SALES.role,
                displayRole: CREDENTIALS.SALES.displayRole,
                avatar: CREDENTIALS.SALES.avatar,
                permissions: CREDENTIALS.SALES.permissions
            });
        }

        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
