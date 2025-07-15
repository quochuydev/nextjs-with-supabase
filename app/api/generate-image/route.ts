import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { prompt, apiKey } = await req.json();

  if (!prompt || !apiKey) {
    return NextResponse.json(
      { error: "Missing prompt or API key" },
      { status: 400 }
    );
  }

  try {
    console.log(`debug:start-generate`);

    const geminiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      }
    );

    const data = await geminiRes.json();

    const base64Image = data?.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.inlineData?.mimeType === "image/png"
    )?.inlineData?.data;

    if (!base64Image) {
      return NextResponse.json(
        { error: "No image returned." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      imageUrl: `data:image/png;base64,${base64Image}`,
    });
  } catch (error) {
    console.log(`debug:error`, error);

    return NextResponse.json(
      {
        error: "Failed to generate image.",
      },
      {
        status: 500,
      }
    );
  }
}
