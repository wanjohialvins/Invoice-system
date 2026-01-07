import { STORAGE_KEYS } from "../constants";
import type { Customer, Invoice, InvoiceItem, InvoiceStatus, Product } from "../types/types";

// Prefix for all generated data ID to allow safe deletion
const DEV_PREFIX = "DEV_";
const CLIENTS_STORAGE_KEY = "konsut_clients";

// Local definition since Client is not exported from Clients.tsx
interface Client extends Customer {
    company?: string;
    createdAt: string;
    updatedAt: string;
    source: 'invoice' | 'draft' | 'manual';
}

const generateId = () => `${DEV_PREFIX}${Math.random().toString(36).substring(2, 9)}`;

// --- Generators ---

const SAMPLE_NAMES = [
    "Acme Corp", "Globex Inc", "Soylent Corp", "Initech", "Umbrella Corp",
    "Stark Ind", "Wayne Ent", "Cyberdyne", "Massive Dynamic", "Hooli"
];

const SAMPLE_PRODUCTS = [
    { name: "Consulting Hour", price: 5000 },
    { name: "Server Setup", price: 15000 },
    { name: "Maintenance", price: 2500 },
    { name: "Domain Registration", price: 1200 },
    { name: "Web Hosting (Yearly)", price: 10000 },
    { name: "SSL Certificate", price: 3500 },
    { name: "Cloud Storage 1TB", price: 800 },
];

const generateRandomClient = (): Client => {
    const name = SAMPLE_NAMES[Math.floor(Math.random() * SAMPLE_NAMES.length)] + " " + Math.floor(Math.random() * 100);
    const now = new Date().toISOString();
    return {
        id: generateId(),
        name,
        phone: `+254 7${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 900 + 100)}`,
        email: `contact@${name.replace(/\s/g, "").toLowerCase()}.com`,
        address: `${Math.floor(Math.random() * 100)} Enterprise Rd, Nairobi`,
        company: name,
        kraPin: `P051${Math.floor(Math.random() * 100000)}Z`,
        createdAt: now,
        updatedAt: now,
        source: 'manual',
    };
};

// Local definition matching Stock.tsx
interface StockItem extends Product {
    category: "products" | "mobilization" | "services";
    quantity: number;
}

const generateRandomProduct = (): StockItem => {
    const sample = SAMPLE_PRODUCTS[Math.floor(Math.random() * SAMPLE_PRODUCTS.length)];
    return {
        id: generateId(),
        name: sample.name,
        priceKsh: sample.price,
        priceUSD: Math.round(sample.price / 130), // Approx rate
        description: "Generated for testing",
        category: "products",
        quantity: Math.floor(Math.random() * 50) + 1,
    };
};

const generateRandomInvoice = (date: Date, client: Customer, products: Product[]): Invoice => {
    const numItems = Math.floor(Math.random() * 4) + 1; // 1-4 items
    const items: InvoiceItem[] = [];
    let subtotal = 0;

    for (let i = 0; i < numItems; i++) {
        const prod = products[Math.floor(Math.random() * products.length)];
        const qty = Math.floor(Math.random() * 5) + 1;
        const price = prod.priceKsh || 0;
        const lineTotal = price * qty;
        items.push({
            id: prod.id,
            name: prod.name,
            category: "products",
            quantity: qty,
            unitPrice: price,
            lineTotal,
            description: prod.description,
        });
        subtotal += lineTotal;
    }

    const tax = subtotal * 0.16;
    const total = subtotal + tax;

    // Randomize status based on date logic
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let statusStr = "paid";
    if (diffDays < 5) statusStr = "sent";

    // Cast to InvoiceStatus
    const status: InvoiceStatus = statusStr as InvoiceStatus;

    return {
        id: generateId(),
        type: "invoice",
        status,
        date: date.toISOString(),
        issuedDate: date.toISOString().split("T")[0],
        dueDate: new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        customer: client,
        items,
        subtotal,
        tax,
        grandTotal: total,
        currencyRate: 130,
    };
};

export const seedWorkload = () => {
    try {
        if (typeof window === 'undefined') return { success: false, message: "Window not defined" };

        // 1. Generate Clients
        const existingClients: Client[] = JSON.parse(localStorage.getItem(CLIENTS_STORAGE_KEY) || "[]");
        const newClients = Array.from({ length: 15 }, generateRandomClient);
        localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify([...existingClients, ...newClients]));

        // 2. Generate Stock
        const initialStock = { products: [], mobilization: [], services: [] };
        let existingStock = initialStock;
        try {
            const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.STOCK) || "{}");
            if (parsed && !Array.isArray(parsed) && parsed.products) {
                existingStock = parsed;
            }
        } catch (e) { /* ignore */ }

        const newStockItems = Array.from({ length: 20 }, generateRandomProduct);

        // Distribute new items into categories (mostly products for now as per generator)
        const newStock: any = { ...existingStock };
        // We only generated "products" category in generateRandomProduct, so add them there
        // Or better, we can respect the category generated in the item if we randomized it

        newStockItems.forEach(item => {
            // Ensure the category array exists before pushing
            if (!newStock[item.category]) {
                newStock[item.category] = [];
            }
            newStock[item.category].push(item);
        });

        localStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(newStock));

        // 3. Generate Invoices (Last 30 Days)
        const existingInvoices: Invoice[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVOICES) || "[]");
        const newInvoices: Invoice[] = [];

        // Combine clients for invoice generation
        const allClients: Client[] = [...existingClients, ...newClients];

        // Flatten stock for random picking
        const allStock: StockItem[] = [
            ...newStock.products,
            ...newStock.mobilization,
            ...newStock.services
        ];

        const today = new Date();

        // GUARANTEE: Generate 5 recent orders for "today" to populate the dashboard immediately
        for (let k = 0; k < 5; k++) {
            if (allClients.length > 0 && allStock.length > 0) {
                const randomClient = allClients[Math.floor(Math.random() * allClients.length)];
                const inv = generateRandomInvoice(today, randomClient, allStock);
                // Mix types for recent ones
                const types: any[] = ['invoice', 'quotation', 'proforma'];
                inv.type = types[Math.floor(Math.random() * types.length)];
                // Recent ones should be pending or sent mostly, unless invoice
                if (inv.type !== 'invoice') inv.status = 'sent';

                newInvoices.push(inv);
            }
        }

        // Generate history
        for (let i = 1; i < 30; i++) {
            const date = new Date();
            date.setDate(today.getDate() - i);

            // Random 0-4 invoices per day
            const dailyCount = Math.floor(Math.random() * 5);
            for (let j = 0; j < dailyCount; j++) {
                if (allClients.length > 0 && allStock.length > 0) {
                    const randomClient = allClients[Math.floor(Math.random() * allClients.length)];
                    const inv = generateRandomInvoice(date, randomClient, allStock);

                    // Randomize Types: 60% Invoice, 20% Quote, 20% Proforma
                    const rand = Math.random();
                    if (rand > 0.4) inv.type = 'invoice';
                    else if (rand > 0.2) inv.type = 'quotation';
                    else inv.type = 'proforma';

                    newInvoices.push(inv);
                }
            }
        }

        // Sort invoices by date descending
        const finalInvoices = [...existingInvoices, ...newInvoices].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(finalInvoices));

        return { success: true, message: `Generated ${newClients.length} clients, ${newStock.length} items, and ${newInvoices.length} invoices.` };

    } catch (error) {
        console.error("Seeding failed", error);
        return { success: false, message: "Failed to generate data" };
    }
};

export const clearSeedData = () => {
    try {
        if (typeof window === 'undefined') return { success: false, message: "Window not defined" };

        const keys = [CLIENTS_STORAGE_KEY, STORAGE_KEYS.STOCK, STORAGE_KEYS.INVOICES];
        let deletedCount = 0;

        keys.forEach(key => {
            const raw = localStorage.getItem(key);
            if (!raw) return;
            const data = JSON.parse(raw);

            if (key === STORAGE_KEYS.STOCK && !Array.isArray(data)) {
                // Handle Record<Category, StockItem[]>
                let deleted = 0;
                (["products", "mobilization", "services"] as const).forEach(cat => {
                    const originalLen = data[cat]?.length || 0;
                    if (data[cat]) {
                        data[cat] = data[cat].filter((item: any) => !item.id?.startsWith(DEV_PREFIX));
                        deleted += (originalLen - data[cat].length);
                    }
                });
                deletedCount += deleted;
                localStorage.setItem(key, JSON.stringify(data));
            }
            else if (Array.isArray(data)) {
                // Handle Array (Clients, Invoices)
                const filtered = data.filter((item: any) => !item.id?.startsWith(DEV_PREFIX));
                deletedCount += (data.length - filtered.length);
                localStorage.setItem(key, JSON.stringify(filtered));
            }
        });

        return { success: true, message: `Removed ${deletedCount} test items.` };
    } catch (e) {
        return { success: false, message: "Error clearing data" };
    }
};
