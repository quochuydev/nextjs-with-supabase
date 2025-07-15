// lib/gemini.ts
export async function generateImageFromPrompt(
  prompt: string,
  apiKey: string
): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );
  const data = await res.json();
  console.log(`debug:data`, data);
  return data.candidates[0].content.parts[0].text; // Or image_url
}
