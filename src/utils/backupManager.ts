// src/utils/backupManager.ts
/**
 * Backup and Restore Manager
 * 
 * Handles exporting and importing all application data from localStorage.
 * Provides data safety and portability across devices/browsers.
 */

interface BackupData {
    version: string;
    timestamp: string;
    appName: string;
    data: {
        invoices?: any[];
        konsut_clients?: any[];
        stockData?: any;
        konsut_settings?: any;
        konsut_newinvoice_draft_vFinal?: any;
        konsut_pdf_history?: any[];
        freightRate?: string;
        usdToKshRate?: string;
        [key: string]: any;
    };
    metadata: {
        invoiceCount: number;
        clientCount: number;
        stockItemCount: number;
        totalSize: string;
    };
}

// Keys to backup from localStorage
const BACKUP_KEYS = [
    'invoices',
    'konsut_clients',
    'stockData',
    'konsut_settings',
    'konsut_newinvoice_draft_vFinal',
    'konsut_pdf_history',
    'freightRate',
    'usdToKshRate',
];

/**
 * Calculate the size of localStorage data in bytes
 */
const calculateStorageSize = (): number => {
    let total = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            total += localStorage[key].length + key.length;
        }
    }
    return total;
};

/**
 * Format bytes to human-readable size
 */
const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Export all application data to a JSON file
 */
export const exportBackup = (): void => {
    try {
        const data: any = {};

        // Collect all data from localStorage
        BACKUP_KEYS.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                try {
                    data[key] = JSON.parse(value);
                } catch {
                    data[key] = value; // Store as string if not JSON
                }
            }
        });

        // Calculate metadata
        const invoices = data.invoices || [];
        const clients = data.konsut_clients || [];
        const stock = data.stockData || {};
        const stockItemCount =
            (stock.products?.length || 0) +
            (stock.mobilization?.length || 0) +
            (stock.services?.length || 0);

        const backup: BackupData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            appName: 'KONSUT Invoice System',
            data,
            metadata: {
                invoiceCount: invoices.length,
                clientCount: clients.length,
                stockItemCount,
                totalSize: formatBytes(calculateStorageSize()),
            },
        };

        // Create and download the backup file
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        link.href = url;
        link.download = `konsut_backup_${timestamp}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log('Backup created successfully:', backup.metadata);
    } catch (error) {
        console.error('Backup failed:', error);
        throw new Error('Failed to create backup. Please try again.');
    }
};

/**
 * Validate backup file structure
 */
const validateBackup = (backup: any): boolean => {
    if (!backup || typeof backup !== 'object') return false;
    if (!backup.version || !backup.timestamp || !backup.data) return false;
    if (backup.appName !== 'KONSUT Invoice System') {
        console.warn('Backup is from a different application');
    }
    return true;
};

/**
 * Import backup data and restore to localStorage
 * @param file - The backup JSON file
 * @param mode - 'replace' to wipe existing data, 'merge' to combine
 */
export const importBackup = (file: File, mode: 'replace' | 'merge' = 'replace'): Promise<BackupData> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const backup: BackupData = JSON.parse(content);

                // Validate backup structure
                if (!validateBackup(backup)) {
                    reject(new Error('Invalid backup file format'));
                    return;
                }

                // Clear existing data if replace mode
                if (mode === 'replace') {
                    BACKUP_KEYS.forEach(key => localStorage.removeItem(key));
                }

                // Restore data to localStorage
                Object.entries(backup.data).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

                        if (mode === 'merge' && BACKUP_KEYS.includes(key)) {
                            // Merge arrays for certain keys
                            if (key === 'invoices' || key === 'konsut_clients' || key === 'konsut_pdf_history') {
                                const existing = localStorage.getItem(key);
                                if (existing) {
                                    try {
                                        const existingData = JSON.parse(existing);
                                        const mergedData = [...existingData, ...value];
                                        // Remove duplicates based on id
                                        const unique = mergedData.filter((item, index, self) =>
                                            index === self.findIndex((t) => t.id === item.id)
                                        );
                                        localStorage.setItem(key, JSON.stringify(unique));
                                        return;
                                    } catch (e) {
                                        console.warn(`Failed to merge ${key}, replacing instead`);
                                    }
                                }
                            }
                        }

                        localStorage.setItem(key, stringValue);
                    }
                });

                console.log('Backup restored successfully:', backup.metadata);
                resolve(backup);
            } catch (error) {
                console.error('Restore failed:', error);
                reject(new Error('Failed to restore backup. The file may be corrupted.'));
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read backup file'));
        };

        reader.readAsText(file);
    });
};

/**
 * Clear all application data from localStorage
 */
export const clearAllData = (): void => {
    BACKUP_KEYS.forEach(key => localStorage.removeItem(key));
    console.log('All application data cleared');
};

/**
 * Get backup metadata without creating a file
 */
export const getBackupInfo = () => {
    const invoices = localStorage.getItem('invoices');
    const clients = localStorage.getItem('konsut_clients');
    const stock = localStorage.getItem('stockData');

    const invoiceCount = invoices ? JSON.parse(invoices).length : 0;
    const clientCount = clients ? JSON.parse(clients).length : 0;

    let stockItemCount = 0;
    if (stock) {
        const stockData = JSON.parse(stock);
        stockItemCount =
            (stockData.products?.length || 0) +
            (stockData.mobilization?.length || 0) +
            (stockData.services?.length || 0);
    }

    return {
        invoiceCount,
        clientCount,
        stockItemCount,
        totalSize: formatBytes(calculateStorageSize()),
        lastBackup: localStorage.getItem('last_backup_date') || null,
    };
};

/**
 * Update last backup timestamp
 */
export const updateLastBackupDate = (): void => {
    localStorage.setItem('last_backup_date', new Date().toISOString());
};

/**
 * Get browser storage location info
 */
export const getBrowserStorageInfo = (): { browser: string; path: string } => {
    const userAgent = navigator.userAgent.toLowerCase();
    const username = '[YourUsername]';

    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
        return {
            browser: 'Google Chrome',
            path: `C:\\Users\\${username}\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Local Storage`,
        };
    } else if (userAgent.includes('edg')) {
        return {
            browser: 'Microsoft Edge',
            path: `C:\\Users\\${username}\\AppData\\Local\\Microsoft\\Edge\\User Data\\Default\\Local Storage`,
        };
    } else if (userAgent.includes('firefox')) {
        return {
            browser: 'Mozilla Firefox',
            path: `C:\\Users\\${username}\\AppData\\Roaming\\Mozilla\\Firefox\\Profiles\\[profile]\\storage\\default`,
        };
    } else {
        return {
            browser: 'Unknown Browser',
            path: 'Check your browser documentation for localStorage location',
        };
    }
};
