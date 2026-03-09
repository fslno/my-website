'use server';
/**
 * @fileOverview A Genkit flow for generating product descriptions for administrators.
 *
 * - adminGenerateProductDescription - A function that generates product descriptions using AI.
 * - AdminGenerateProductDescriptionInput - The input type for the adminGenerateProductDescription function.
 * - AdminGenerateProductDescriptionOutput - The return type for the adminGenerateProductDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdminGenerateProductDescriptionInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  features:
    z.array(z.string()).describe('A list of key features or selling points of the product.'),
  targetAudience:
    z.string().optional().describe('The target audience for the product.'),
  tone:
    z.string().optional().describe('The desired tone for the product description (e.g., "luxurious", "modern", "playful").'),
  keywords:
    z.array(z.string()).optional().describe('Specific keywords to incorporate into the description.'),
});
export type AdminGenerateProductDescriptionInput = z.infer<
  typeof AdminGenerateProductDescriptionInputSchema
>;

const AdminGenerateProductDescriptionOutputSchema = z.object({
  description: z.string().describe('The generated product description.'),
});
export type AdminGenerateProductDescriptionOutput = z.infer<
  typeof AdminGenerateProductDescriptionOutputSchema
>;

export async function adminGenerateProductDescription(
  input: AdminGenerateProductDescriptionInput
): Promise<AdminGenerateProductDescriptionOutput> {
  return generateProductDescriptionFlow(input);
}

const productDescriptionPrompt = ai.definePrompt({
  name: 'productDescriptionPrompt',
  input: {schema: AdminGenerateProductDescriptionInputSchema},
  output: {schema: AdminGenerateProductDescriptionOutputSchema},
  prompt: `You are an expert marketing copywriter for a luxury e-commerce store.
Your task is to create a compelling, high-quality product description based on the provided details.

Product Name: "{{{productName}}}"

Key Features:
{{#each features}}
- {{{this}}}
{{/each}}

{{#if targetAudience}}
Target Audience: "{{{targetAudience}}}"
{{/if}}

{{#if tone}}
Desired Tone: "{{{tone}}}"
{{/if}}

{{#if keywords.length}}
Keywords to include:
{{#each keywords}}
- {{{this}}}
{{/each}}
{{/if}}

Craft a detailed and engaging product description that highlights the product's benefits and appeals to the target audience, maintaining the specified tone. Ensure the description is sophisticated and emphasizes the luxury aspect of the brand.`,
});

const generateProductDescriptionFlow = ai.defineFlow(
  {
    name: 'generateProductDescriptionFlow',
    inputSchema: AdminGenerateProductDescriptionInputSchema,
    outputSchema: AdminGenerateProductDescriptionOutputSchema,
  },
  async input => {
    const {output} = await productDescriptionPrompt(input);
    return output!;
  }
);
