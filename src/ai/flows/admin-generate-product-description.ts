'use server';
/**
 * @fileOverview A Genkit flow for generating product content for administrators.
 *
 * - adminGenerateProductDescription - A function that generates product descriptions and SEO metadata using AI.
 * - AdminGenerateProductDescriptionInput - The input type for the adminGenerateProductDescription function.
 * - AdminGenerateProductDescriptionOutput - The return type for the adminGenerateProductDescription function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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
  metaTitle: z.string().describe('An SEO-optimized meta title.'),
  metaDescription: z.string().describe('An SEO-optimized meta description.'),
});
export type AdminGenerateProductDescriptionOutput = z.infer<
  typeof AdminGenerateProductDescriptionOutputSchema
>;

/**
 * Helper to notify admin of API failures.
 */
function notifyAdmin(email: string, message: string) {
  // Logic to log to a central dashboard or send alert
  console.error(`[ADMIN ALERT] Sent to ${email}: ${message}`);
}

export async function adminGenerateProductDescription(
  input: AdminGenerateProductDescriptionInput
): Promise<AdminGenerateProductDescriptionOutput> {
  let delay = 2000; // Start with a 2-second wait
  const maxRetries = 3;

  for (let i = 0; i < maxRetries; i++) {
    try {
      // Calling the flow directly
      return await generateProductDescriptionFlow(input);
    } catch (error: any) {
      // Check for rate limiting (429) or specific SDK error indicators
      const isRateLimited = error.status === 429 || error.message?.includes('429');

      if (isRateLimited && i < maxRetries - 1) {
        console.warn(`Attempt ${i + 1}: Rate limited. Retrying in ${delay}ms...`);
        await new Promise(res => setTimeout(res, delay));
        delay *= 2; // Exponential backoff
        continue;
      }

      if (i === maxRetries - 1) {
        console.error("Critical: Gemini API exhausted after multiple tries.");
        notifyAdmin("admin@example.com", "Gemini API Limit Reached");
        throw error;
      }

      // If it's not a retryable error, throw immediately
      if (!isRateLimited) throw error;
    }
  }
  throw new Error("Failed to generate description after multiple attempts.");
}

const productDescriptionPrompt = ai.definePrompt({
  name: 'productDescriptionPrompt',
  input: { schema: AdminGenerateProductDescriptionInputSchema },
  output: { schema: AdminGenerateProductDescriptionOutputSchema },
  prompt: `You are an expert marketing copywriter and SEO specialist for a luxury e-commerce store called FSLNO Studio.
Your task is to create a compelling, high-quality product description and SEO metadata based on the provided details.

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
{{else}}
Desired Tone: "luxurious and minimalist"
{{/if}}

{{#if keywords.length}}
Keywords to include:
{{#each keywords}}
- {{{this}}}
{{/each}}
{{/if}}

Task:
1. Craft a detailed and engaging product description that highlights the product's benefits and appeals to the target audience, maintaining the specified tone. Ensure the description is sophisticated and emphasizes the luxury aspect of the brand.
2. Create an SEO-optimized Meta Title (under 60 characters) that includes the product name and brand.
3. Create an SEO-optimized Meta Description (under 160 characters) that summarizes the product's value proposition and includes a call to action.`,
});

const generateProductDescriptionFlow = ai.defineFlow(
  {
    name: 'generateProductDescriptionFlow',
    inputSchema: AdminGenerateProductDescriptionInputSchema,
    outputSchema: AdminGenerateProductDescriptionOutputSchema,
  },
  async input => {
    const { output } = await productDescriptionPrompt(input);
    return output!;
  }
);

