'use server';
/**
 * @fileOverview A Genkit flow for extracting key information from PDF documents.
 *
 * - documentDataExtractor - A function that handles the extraction of data from PDF documents.
 * - DocumentDataExtractorInput - The input type for the documentDataExtractor function.
 * - DocumentDataExtractorOutput - The return type for the documentDataExtractor function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DocumentDataExtractorInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF document as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  documentType: z
    .enum(['contract', 'invoice'])
    .describe('The type of document being processed (e.g., "contract" or "invoice").'),
});
export type DocumentDataExtractorInput = z.infer<typeof DocumentDataExtractorInputSchema>;

const DocumentDataExtractorOutputSchema = z.object({
  clientName: z.string().optional().describe('The full name of the client or company extracted from the document.'),
  contractAmount: z.number().optional().describe('The total or monthly amount of the contract. Only present if documentType is "contract".'),
  startDate: z.string().optional().describe('The start date of the contract in YYYY-MM-DD format. Only present if documentType is "contract".'),
  endDate: z.string().optional().describe('The end date of the contract in YYYY-MM-DD format. Only present if documentType is "contract".'),
  station: z.string().optional().describe('The radio station mentioned in the contract. Only present if documentType is "contract".'),
  campaignType: z.string().optional().describe('The type of campaign or service described in the contract. Only present if documentType is "contract".'),
  seller: z.string().optional().describe('The name of the salesperson or representative associated with the contract. Only present if documentType is "contract".'),
  invoiceNumber: z.string().optional().describe('The unique identifier for the invoice. Only present if documentType is "invoice".'),
  invoiceDate: z.string().optional().describe('The date the invoice was issued in YYYY-MM-DD format. Only present if documentType is "invoice".'),
  invoiceAmount: z.number().optional().describe('The total amount of the invoice. Only present if documentType is "invoice".'),
  concept: z.string().optional().describe('A brief description of the service or items invoiced. Only present if documentType is "invoice".'),
});
export type DocumentDataExtractorOutput = z.infer<typeof DocumentDataExtractorOutputSchema>;

export async function documentDataExtractor(input: DocumentDataExtractorInput): Promise<DocumentDataExtractorOutput> {
  return documentDataExtractorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'documentDataExtractorPrompt',
  input: { schema: DocumentDataExtractorInputSchema },
  output: { schema: DocumentDataExtractorOutputSchema },
  prompt: `You are an expert document data extractor. Your task is to extract key information from the provided PDF document.\n\nThe document provided is a '{{{documentType}}}'.\nCarefully read the document and extract the following information.\n\nFor ALL document types, extract:\n- Client Name: The full name of the client or company.\n\nIf the document is a 'contract', also extract:\n- Contract Amount: The total or monthly amount of the contract.\n- Start Date: The start date of the contract. Format as YYYY-MM-DD.\n- End Date: The end date of the contract. Format as YYYY-MM-DD.\n- Station: The radio station mentioned in the contract.\n- Campaign Type: The type of campaign or service described in the contract.\n- Seller: The name of the salesperson or representative associated with the contract.\n\nIf the document is an 'invoice', also extract:\n- Invoice Number: The unique identifier for the invoice.\n- Invoice Date: The date the invoice was issued. Format as YYYY-MM-DD.\n- Invoice Amount: The total amount of the invoice.\n- Concept: A brief description of the service or items invoiced.\n\nProvide the extracted information as a JSON object that strictly adheres to the output schema provided. If a field is not present or cannot be found in the document, it should be omitted from the output JSON.\n\nDocument: {{media url=pdfDataUri}}`,
});

const documentDataExtractorFlow = ai.defineFlow(
  {
    name: 'documentDataExtractorFlow',
    inputSchema: DocumentDataExtractorInputSchema,
    outputSchema: DocumentDataExtractorOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  },
);
