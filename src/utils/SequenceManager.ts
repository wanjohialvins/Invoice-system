import { DocumentEngine } from "./DocumentEngine";

const SEQUENCE_KEY = "konsut_document_sequences";

type SequenceConfig = {
    invoice: number;
    quotation: number;
    proforma: number;
    lastDate: string; // YYYY-MM-DD
};

export class SequenceManager {
    private static getSequences(): SequenceConfig {
        const raw = localStorage.getItem(SEQUENCE_KEY);
        const todayCommon = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

        const defaults: SequenceConfig = {
            invoice: 0,
            quotation: 0,
            proforma: 0,
            lastDate: todayCommon
        };

        if (!raw) return defaults;

        try {
            const data = JSON.parse(raw) as SequenceConfig;
            // Daily reset check
            if (data.lastDate !== todayCommon) {
                return defaults;
            }
            return data;
        } catch {
            return defaults;
        }
    }

    private static saveSequences(config: SequenceConfig) {
        localStorage.setItem(SEQUENCE_KEY, JSON.stringify(config));
    }

    /**
     * Atomically gets the next number for a document type.
     * Increments the counter PERMANENTLY.
     * Use this only when actually saving/generating a final document.
     */
    static getNextNumber(type: 'invoice' | 'quotation' | 'proforma'): string {
        const config = this.getSequences();

        // Increment
        config[type]++;

        this.saveSequences(config);

        return DocumentEngine.formatDocumentNumber(type, config[type]);
    }

    /**
     * Peeks at what the next number WILL be without incrementing.
     * Useful for "New Quote #..." preview.
     */
    static peekNextNumber(type: 'invoice' | 'quotation' | 'proforma'): string {
        const config = this.getSequences();
        return DocumentEngine.formatDocumentNumber(type, config[type] + 1);
    }
}
