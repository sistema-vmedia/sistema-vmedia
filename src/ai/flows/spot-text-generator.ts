'use server';
/**
 * @fileOverview A Genkit flow for generating creative radio spot texts.
 *
 * - generateSpotText - A function that handles the generation of radio spot text.
 * - SpotTextGeneratorInput - The input type for the generateSpotText function.
 * - SpotTextGeneratorOutput - The return type for the generateSpotText function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SpotTextGeneratorInputSchema = z.object({
  clientName: z.string().describe('The name of the client for whom the spot is being created.'),
  campaignObjective: z.string().describe('The main objective of the radio campaign (e.g., increase sales, brand awareness).'),
  productServiceDescription: z.string().describe('A description of the product or service to be promoted.'),
  targetAudience: z.string().describe('The demographic or group the radio spot is intended for.'),
  duration: z.string().describe('The desired length of the radio spot (e.g., "30 seconds", "60 seconds").'),
  keyMessage: z.string().describe('The core message that needs to be communicated in the spot.'),
  callToAction: z.string().describe('The desired action for the listener to take after hearing the spot.'),
});
export type SpotTextGeneratorInput = z.infer<typeof SpotTextGeneratorInputSchema>;

const SpotTextGeneratorOutputSchema = z.object({
  spotText: z.string().describe('The generated creative text for the radio spot.'),
  suggestions: z.array(z.string()).describe('An array of alternative suggestions or taglines for the radio spot.'),
});
export type SpotTextGeneratorOutput = z.infer<typeof SpotTextGeneratorOutputSchema>;

export async function generateSpotText(input: SpotTextGeneratorInput): Promise<SpotTextGeneratorOutput> {
  return spotTextGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'spotTextGeneratorPrompt',
  input: { schema: SpotTextGeneratorInputSchema },
  output: { schema: SpotTextGeneratorOutputSchema },
  prompt: `Eres un experto copywriter de spots de radio. Tu objetivo es crear textos creativos, efectivos y atractivos para spots de radio basados en la información proporcionada.

Aquí tienes la información para ayudarte a redactar el spot:

Nombre del Cliente: {{{clientName}}}
Objetivo de la Campaña: {{{campaignObjective}}}
Descripción del Producto/Servicio: {{{productServiceDescription}}}
Audiencia Objetivo: {{{targetAudience}}}
Duración Deseada: {{{duration}}}
Mensaje Clave: {{{keyMessage}}}
Llamada a la Acción: {{{callToAction}}}

Por favor, genera un texto para un spot de radio que sea pegadizo, persuasivo y adecuado para la audiencia objetivo y el objetivo de la campaña. Además, proporciona algunas sugerencias o alternativas para diferentes enfoques o eslóganes.

Asegúrate de que la salida esté en español y sigue estrictamente el formato JSON especificado.`,
});

const spotTextGeneratorFlow = ai.defineFlow(
  {
    name: 'spotTextGeneratorFlow',
    inputSchema: SpotTextGeneratorInputSchema,
    outputSchema: SpotTextGeneratorOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
