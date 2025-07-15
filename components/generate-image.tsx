"use client";
import { useState } from "react";

export function GenerateImage() {
  const [apiKey, setApiKey] = useState("");
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    try {
      if (!apiKey || !prompt) return alert("Missing API key or prompt");
      setLoading(true);
      setImageUrl("");

      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, apiKey }),
      });

      const data = await res.json();
      if (data.imageUrl) {
        setImageUrl(data.imageUrl);
      } else {
        alert("❌ " + data.error);
      }
    } catch (error: any) {
      console.log(`debug:error-generate`, error);
      if (error.message) alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white p-6 rounded-2xl shadow space-y-4">
      <h1 className="text-xl font-bold">Gemini Image Generator</h1>
      <input
        type="text"
        placeholder="Enter API key"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        className="w-full border p-2 rounded-lg"
      />

      <div>
        <p className="text-sm text-gray-600">
          Get your API key from{" "}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noreferrer"
            className="font-bold hover:underline text-blue-600"
          >
            https://aistudio.google.com/apikey
          </a>
        </p>
        <p className="text-sm text-black italic">
          {`Related to security, we don't store your API key.`}
        </p>
      </div>

      <textarea
        placeholder="Enter image prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full border p-2 rounded-lg h-48"
      />
      <button
        onClick={handleGenerate}
        disabled={loading || !apiKey}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
      >
        {loading ? "Generating..." : "Generate Image"}
      </button>

      {imageUrl && (
        <div className="pt-4">
          <img
            src={imageUrl}
            alt="Generated"
            className="rounded-lg border"
            width={400}
            height={400}
          />
        </div>
      )}
    </div>
  );
}
