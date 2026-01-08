
import { GoogleGenAI } from "@google/genai";
import { Transaction, ImagePart } from '../types';
import { fileToImageParts } from "../utils/fileUtils";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const SYSTEM_PROMPT = `You are a world-class financial data extraction assistant. Your task is to convert bank and credit card statements into a structured CSV format with extreme accuracy.

Rules:
1.  **Completeness:** You MUST extract EVERY SINGLE transaction listed in the provided document. Do not summarize or omit any entry.
2.  **Date Format:** Always use YYYY-MM-DD format for dates.
3.  **Amount Format:** Format amounts as a number. Deposits, credits, or payments must be POSITIVE numbers. Expenses, debits, or withdrawals must be NEGATIVE numbers.
4.  **Category Detection:** Auto-detect the category for each transaction based on the description. Common categories include: Rent, Insurance, Subscription, Groceries, Dining, Utilities, Transport, Shopping, Income. If unsure, use 'Other'.
5.  **Notes:** If the transaction description contains location information or other relevant details, add it to the 'Notes' column. Otherwise, leave it blank.
6.  **Output Format:** Provide ONLY a raw CSV table with a header row. Do not include any conversational text, explanations, summaries, or markdown formatting like \`\`\`.

The CSV header must be:
Date,Description,Amount,Category,Notes
`;

const parseCsvToTransactions = (csv: string): Transaction[] => {
    // Basic cleanup of markdown blocks if AI ignored instructions
    const cleanCsv = csv.replace(/```csv/g, '').replace(/```/g, '').trim();
    const lines = cleanCsv.split('\n');
    if (lines.length <= 1) return [];

    const header = lines.shift()?.toLowerCase().split(',').map(h => h.trim());
    if(!header || !header.includes('date') || !header.includes('description') || !header.includes('amount')) {
        console.warn("CSV header is missing required columns. Header found:", header);
        return [];
    }

    const dateIndex = header.indexOf('date');
    const descriptionIndex = header.indexOf('description');
    const amountIndex = header.indexOf('amount');
    const categoryIndex = header.indexOf('category');
    const notesIndex = header.indexOf('notes');

    return lines.map((line, index) => {
        // Simple CSV parsing, handles commas inside quotes
        const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
        const cleanValues = values.map(v => v.replace(/^"|"$/g, '').trim());

        if (cleanValues.length < 3) return null;

        const amount = parseFloat(cleanValues[amountIndex]?.replace(/[$,]/g, '') || '0');
        
        return {
            id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${index}-${Math.random()}`,
            date: cleanValues[dateIndex] || '',
            description: cleanValues[descriptionIndex] || 'N/A',
            amount: isNaN(amount) ? 0 : amount,
            category: cleanValues[categoryIndex] || 'Other',
            notes: cleanValues[notesIndex] || '',
        };
    }).filter(t => t !== null && t.description !== 'N/A' && t.amount !== 0) as Transaction[];
};

/**
 * Extracts transactions from a list of files.
 * Processes each file sequentially to ensure high accuracy and avoid token limits.
 */
export const extractTransactionsFromFiles = async (
    files: File[], 
    onProgress?: (processedCount: number) => void
): Promise<Transaction[]> => {
    const allTransactions: Transaction[] = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
            const parts = await fileToImageParts(file);
            if (parts.length === 0) continue;

            // Process one file at a time
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [{ parts }],
                config: {
                    systemInstruction: SYSTEM_PROMPT,
                },
            });
            
            const csvText = response.text;
            if (csvText) {
                const transactions = parseCsvToTransactions(csvText);
                allTransactions.push(...transactions);
            }
        } catch (fileError) {
            console.error(`Error processing file ${file.name}:`, fileError);
            // We continue processing other files even if one fails
        }
        
        if (onProgress) {
            onProgress(i + 1);
        }
    }
    
    if (allTransactions.length === 0 && files.length > 0) {
        throw new Error("No transactions were found in the uploaded files. Please ensure the documents are legible bank or credit card statements.");
    }

    return allTransactions;
};
