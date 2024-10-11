import { NextRequest, NextResponse } from 'next/server';
import * as fal from "@fal-ai/serverless-client";

fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(req: NextRequest) {
  console.log('API route called');
  let prompt, interval;
  try {
    ({ prompt, interval } = await req.json());
    console.log('Received prompt:', prompt);
    console.log('Received interval:', interval);
  } catch (error) {
    console.error('Error parsing request body:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!process.env.FAL_KEY) {
    console.error('FAL_KEY is not set in the environment variables');
    return NextResponse.json({ error: 'FAL_KEY is not configured' }, { status: 500 });
  }

  try {
    console.log('Sending request to FAL AI');
    const result = await fal.subscribe("fal-ai/fast-lightning-sdxl", {
      input: {
        prompt: prompt,
      },
      logs: true,
      onQueueUpdate: (update) => {
        console.log('Queue update:', JSON.stringify(update, null, 2));
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    console.log('FAL AI response received');
    console.log('API Response:', JSON.stringify(result, null, 2));

    if (!result.images || result.images.length === 0) {
      throw new Error('No image generated');
    }

    return NextResponse.json({ imageUrl: result.images[0].url });
  } catch (error) {
    console.error('Error generating image:', error);
    let errorMessage = 'An unexpected error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error stack:', error.stack);
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    if (error instanceof Response) {
      try {
        const text = await error.text();
        console.error('Raw API response:', text);
      } catch (e) {
        console.error('Failed to read error response:', e);
      }
    }
    
    console.error('Detailed error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}