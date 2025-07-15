// app/api/generate-image/route.ts
import { NextResponse } from "next/server";
import { generateImageFromPrompt } from "@/lib/gemini";

export async function POST(req: Request) {
  const { prompt, apiKey } = await req.json();

  if (!prompt || !apiKey) {
    return NextResponse.json(
      { error: "Missing prompt or API key" },
      { status: 400 }
    );
  }

  try {
    const imageUrl = await generateImageFromPrompt(prompt, apiKey);
    return NextResponse.json({ imageUrl });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
