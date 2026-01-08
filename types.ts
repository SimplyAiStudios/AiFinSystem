
export interface Transaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    category: string;
    notes: string;
}

// For Gemini API Part structure
export interface ImagePart {
    inlineData: {
        mimeType: string;
        data: string;
    };
}
