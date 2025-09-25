"use client";
import { useState } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';

interface Stats {
  total_reviews: number;
  positive_pct: number;
  negative_pct: number;
  neutral_pct: number;
  sentiments_count: { [key: string]: number };
  analyzed_data: Array<{ original_review: string; sentiment: string; confidence: number }>;
}

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('http://localhost:8000/analyze-csv', formData);
      setStats(res.data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleExport = () => {
    if (!stats) return;
    const csv = Papa.unparse(stats.analyzed_data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'avis_analysees.csv';
    a.click();
  };

  if (loading) return <p>Analyse en cours...</p>;

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Upload CSV d'Avis</h2>
      <form onSubmit={handleUpload} className="space-y-4 mb-8">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full p-2 border"
        />
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
          Analyser CSV
        </button>
      </form>

      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-100 p-4 rounded">
              <h3>Total Avis</h3>
              <p className="text-2xl">{stats.total_reviews}</p>
            </div>
            <div className="bg-green-100 p-4 rounded">
              <h3>Positif</h3>
              <p className="text-2xl">{stats.positive_pct}%</p>
            </div>
            <div className="bg-red-100 p-4 rounded">
              <h3>Négatif</h3>
              <p className="text-2xl">{stats.negative_pct}%</p>
            </div>
            <div className="bg-yellow-100 p-4 rounded">
              <h3>Neutre</h3>
              <p className="text-2xl">{stats.neutral_pct}%</p>
            </div>
          </div>

          {/* Graphique Camembert */}
          <div className="mb-8">
            <h3 className="text-lg mb-2">Répartition des Sentiments (Camembert)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Positif', value: stats.positive_pct },
                    { name: 'Négatif', value: stats.negative_pct },
                    { name: 'Neutre', value: stats.neutral_pct }
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  <Cell fill="#82ca9d" />
                  <Cell fill="#ff7300" />
                  <Cell fill="#ffc658" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Graphique Barres */}
          <div className="mb-8">
            <h3 className="text-lg mb-2">Nombre par Sentiment (Barres)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(stats.sentiments_count).map(([name, value]) => ({ name, value }))}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <button onClick={handleExport} className="bg-blue-500 text-white px-4 py-2 rounded">
            Exporter CSV
          </button>
        </>
      )}
    </div>
  );
}