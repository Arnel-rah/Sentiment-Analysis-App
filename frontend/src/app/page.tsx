'use client';
import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [review, setReview] = useState('');
  const [result, setResult] = useState<{ sentiment: string; confidence: number } | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:8000/analyze-single', `review=${review}`, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      setResult(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Analyse d'un Avis Unique</h1>
      <form onSubmit={handleAnalyze} className="space-y-4">
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Entrez un avis client..."
          className="w-full p-2 border"
          rows={4}
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Analyser
        </button>
      </form>
      {result && (
        <div className="mt-4 p-4 border rounded">
          <p><strong>Sentiment :</strong> {result.sentiment}</p>
          <p><strong>Confiance :</strong> {(result.confidence * 100).toFixed(2)}%</p>
        </div>
      )}
    </div>
  );
}