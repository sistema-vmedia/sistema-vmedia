'use server';
/**
 * @fileOverview A Genkit flow for transcribing audio spots.
 *
 * - transcribeAudioSpot - A function that handles the audio transcription process.
 * - AudioSpotTranscriberInput - The input type for the transcribeAudioSpot function.
 * - AudioSpotTranscriberOutput - The return type for the transcribeAudioSpot function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AudioSpotTranscriberInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "Audio data of a spot, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>' (e.g., audio/mpeg or audio/wav)."
    ),
});
export type AudioSpotTranscriberInput = z.infer<typeof AudioSpotTranscriberInputSchema>;

const AudioSpotTranscriberOutputSchema = z.object({
  transcribedText: z.string().describe('The transcribed text from the audio.'),
});
export type AudioSpotTranscriberOutput = z.infer<typeof AudioSpotTranscriberOutputSchema>;

export async function transcribeAudioSpot(input: AudioSpotTranscriberInput): Promise<AudioSpotTranscriberOutput> {
  return transcribeAudioSpotFlow(input);
}

const transcribeAudioSpotPrompt = ai.definePrompt({
  name: 'transcribeAudioSpotPrompt',
  input: { schema: AudioSpotTranscriberInputSchema },
  output: { schema: AudioSpotTranscriberOutputSchema },
  prompt: `You are an expert audio transcription service. Your task is to accurately transcribe the spoken content from the provided audio.

Audio: {{media url=audioDataUri}}

Transcribe the audio and output the text in the specified JSON format.`,
});

const transcribeAudioSpotFlow = ai.defineFlow(
  {
    name: 'transcribeAudioSpotFlow',
    inputSchema: AudioSpotTranscriberInputSchema,
    outputSchema: AudioSpotTranscriberOutputSchema,
  },
  async (input) => {
    const { output } = await transcribeAudioSpotPrompt({ ...input, model: 'googleai/gemini-1.5-flash' });
    return output!;
  }
);
