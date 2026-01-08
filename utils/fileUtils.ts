
import { ImagePart } from '../types';

// This function converts an image file to a base64 string with its mime type.
const fileToImagePart = (file: File): Promise<ImagePart> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result !== 'string') {
        return reject(new Error("Failed to read file as string."));
      }
      const base64Data = reader.result.split(',')[1];
      resolve({
        inlineData: {
          mimeType: file.type,
          data: base64Data,
        },
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

// This function handles PDF files by rendering each page to a canvas and converting it to a base64 image part.
const pdfToImageParts = async (file: File): Promise<ImagePart[]> => {
    const pdfjsLib = (window as any).pdfjsLib;
    if (!pdfjsLib) {
        throw new Error("PDF.js library is not loaded.");
    }

    const fileBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
    const parts: ImagePart[] = [];
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
        throw new Error("Could not create canvas context.");
    }

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 }); // Increased scale for better OCR quality
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: viewport,
        };
        await page.render(renderContext).promise;
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9); // Use JPEG for smaller size
        const base64Data = dataUrl.split(',')[1];

        parts.push({
            inlineData: {
                data: base64Data,
                mimeType: 'image/jpeg',
            },
        });
    }

    return parts;
};

// A wrapper function to handle both image and PDF files.
export const fileToImageParts = async (file: File): Promise<ImagePart[]> => {
    if (file.type.startsWith('image/')) {
        return [await fileToImagePart(file)];
    } else if (file.type === 'application/pdf') {
        return await pdfToImageParts(file);
    } else {
        console.warn(`Unsupported file type: ${file.type}. Skipping file.`);
        return [];
    }
};
