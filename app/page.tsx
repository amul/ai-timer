"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Image from 'next/image';

export default function Home() {
  const [prompt, setPrompt] = useState("indian guy wearing vr headset jumping from cliff");
  const [interval, setInterval] = useState(0);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && imageUrl) {
      handleSubmit();
    }
    return () => clearTimeout(timer);
  }, [timeLeft, imageUrl]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, interval }),
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to generate image');
        }
        setImageUrl(data.imageUrl);
        setTimeLeft(interval / 1000);
        toast.success('Image generated successfully!');
      } else {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Received non-JSON response from server');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">FAL AI Image Generator</h1>
      <div className="space-y-4">
        <div className="flex space-x-4">
          <Button onClick={() => setInterval(60000)} variant={interval === 60000 ? "default" : "outline"}>1 min</Button>
          <Button onClick={() => setInterval(300000)} variant={interval === 300000 ? "default" : "outline"}>5 min</Button>
          <Button onClick={() => setInterval(600000)} variant={interval === 600000 ? "default" : "outline"}>10 min</Button>
        </div>
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt"
          className="w-full"
        />
        <Button onClick={handleSubmit} disabled={loading || interval === 0}>
          {loading ? 'Generating...' : 'Generate Image'}
        </Button>
      </div>
      {imageUrl && (
        <div className="mt-8 relative">
          <h2 className="text-2xl font-semibold mb-4">Generated Image:</h2>
          <div className="relative">
            <Image src={imageUrl} alt="Generated image" width={512} height={512} className="rounded-lg shadow-lg" />
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}