import { NextRequest, NextResponse } from 'next/server';
import * as fal from "@fal-ai/serverless-client";

fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(req: NextRequest) {
  const { prompt, interval } = await req.json();

  if (!process.env.FAL_KEY) {
    console.error('FAL_KEY is not set in the environment variables');
    return NextResponse.json({ error: 'FAL_KEY is not configured' }, { status: 500 });
  }

  try {
    const result = await fal.subscribe("fal-ai/fast-lightning-sdxl", {
      input: {
        prompt: prompt,
        image_size: "square_hd",
        num_inference_steps: 4,
        num_images: 1,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    console.log(`Image generation requested with interval: ${interval / 1000} seconds`);
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
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    console.error('Detailed error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}