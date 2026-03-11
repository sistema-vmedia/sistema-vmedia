import { config } from 'dotenv';
config();

import '@/ai/flows/spot-text-generator.ts';
import '@/ai/flows/audio-spot-transcriber.ts';
import '@/ai/flows/document-data-extractor.ts';