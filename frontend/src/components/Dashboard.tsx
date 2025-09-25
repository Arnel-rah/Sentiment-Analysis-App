"use client";
import { useState } from "react";
import axios from "axios";
import {
  PieChart as PieChartComponent,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Papa from "papaparse";
import { motion } from "framer-motion";
import {
  FileSpreadsheet,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  Loader2,
  MessageSquare,
  Menu,
  X,
} from "lucide-react";

interface Stats {
  total_reviews: number;
  positive_pct: number;
  negative_pct: number;
  neutral_pct: number;
  sentiments_count: { [key: string]: number };
  analyzed_data: Array<{
    original_review: string;
    sentiment: string;
    confidence: number;
  }>;
}

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:8000/analyze-csv", formData, {
        timeout: 30000,
      });
      setStats(res.data);
    } catch (error) {
      console.error("Upload error:", error);
      setError("Erreur lors de l'analyse. Vérifiez le format CSV.");
    }
    setLoading(false);
  };

  const handleExport = () => {
    if (!stats) return;
    const csv = Papa.unparse(stats.analyzed_data);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "avis_analysees.csv";
    a.click();
  };

  const COLORS = ["#22c55e", "#ef4444", "#facc15"];

  const sidebarVariants = {
    open: { width: "16rem", transition: { duration: 0.3 } },
    closed: { width: "4rem", transition: { duration: 0.3 } },
  };

  const navItems = [
    { icon: FileSpreadsheet, label: "Télécharger CSV", section: "upload" },
    { icon: PieChartIcon, label: "Camembert", section: "pie" },
    { icon: BarChart3, label: "Graphique Barres", section: "bar" },
    { icon: MessageSquare, label: "Tableau Avis", section: "table" },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar */}
      <motion.aside
        className="bg-white/90 backdrop-blur-lg border-r shadow-lg p-4 flex flex-col justify-between fixed h-screen z-50"
        variants={sidebarVariants}
        animate={isOpen ? "open" : "closed"}
        initial="open"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <motion.h2
              className="text-2xl font-extrabold text-indigo-600"
              initial={{ opacity: 1 }}
              animate={{ opacity: isOpen ? 1 : 0 }}
            >
              SentimentAI
            </motion.h2>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-full hover:bg-indigo-50 transition"
              aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {isOpen ? <X className="w-6 h-6 text-indigo-600" /> : <Menu className="w-6 h-6 text-indigo-600" />}
            </button>
          </div>
          <nav className="space-y-2">
            {navItems.map((item, index) => (
              <motion.a
                key={index}
                href={`#${item.section}`}
                className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg hover:bg-indigo-50 transition text-indigo-600"
                initial={{ opacity: 1 }}
                animate={{ opacity: isOpen ? 1 : 0 }}
                whileHover={{ scale: isOpen ? 1.02 : 1 }}
                style={{ display: isOpen ? "flex" : "none" }}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-sm font-medium">{item.label}</span>
              </motion.a>
            ))}
            {navItems.map((item, index) => (
              <motion.a
                key={`icon-${index}`}
                href={`#${item.section}`}
                className="flex items-center justify-center w-full text-left px-3 py-2 rounded-lg hover:bg-indigo-50 transition text-indigo-600"
                initial={{ opacity: 1 }}
                animate={{ opacity: isOpen ? 0 : 1 }}
                whileHover={{ scale: 1.1 }}
              >
                <item.icon className="w-6 h-6" />
                <span className="sr-only">{item.label}</span>
              </motion.a>
            ))}
          </nav>
        </div>
        <motion.p
          className="text-xs text-gray-500 text-center"
          initial={{ opacity: 1 }}
          animate={{ opacity: isOpen ? 1 : 0 }}
        >
          © 2025 SentimentAI
        </motion.p>
      </motion.aside>

      {/* Main content with offset for sidebar */}
      <main className="flex-1 ml-0 md:ml-16 lg:ml-64 p-8 transition-all duration-300" style={{ marginLeft: isOpen ? "16rem" : "4rem" }}>
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard Analyse des Avis</h1>
          {stats && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition"
            >
              <Download className="w-5 h-5" />
              Exporter CSV
            </button>
          )}
        </header>

        {/* Upload Form */}
        {!stats && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-lg border rounded-xl shadow-lg p-8 max-w-xl mx-auto"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Importer vos données CSV</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null);
                  setError(null);
                }}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={!file || loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Analyse...
                  </span>
                ) : (
                  "Analyser"
                )}
              </button>
            </form>
          </motion.div>
        )}

        {stats && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  label: "Total Avis",
                  value: stats.total_reviews,
                  color: "text-indigo-600",
                  icon: <FileSpreadsheet className="w-6 h-6" />,
                },
                {
                  label: "Positifs",
                  value: `${stats.positive_pct}%`,
                  color: "text-green-600",
                  icon: <PieChartIcon className="w-6 h-6" />,
                },
                {
                  label: "Négatifs",
                  value: `${stats.negative_pct}%`,
                  color: "text-red-600",
                  icon: <PieChartIcon className="w-6 h-6" />,
                },
                {
                  label: "Neutres",
                  value: `${stats.neutral_pct}%`,
                  color: "text-yellow-600",
                  icon: <PieChartIcon className="w-6 h-6" />,
                },
              ].map((kpi, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/80 backdrop-blur-lg border rounded-xl p-6 shadow-md flex items-center gap-4"
                >
                  <div className={`p-3 rounded-lg bg-gray-100 ${kpi.color}`}>
                    {kpi.icon}
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-500">{kpi.label}</h3>
                    <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-white/80 backdrop-blur-lg border rounded-xl p-6 shadow-lg" id="pie">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Répartition des Sentiments</h3>
              <ResponsiveContainer width="100%" height={350}>
                <PieChartComponent>
                  <Pie
                    data={[
                      { name: "Positif", value: stats.positive_pct },
                      { name: "Négatif", value: stats.negative_pct },
                      { name: "Neutre", value: stats.neutral_pct },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                  >
                    {COLORS.map((c, i) => (
                      <Cell key={i} fill={c} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChartComponent>
              </ResponsiveContainer>
            </div>

            <div className="bg-white/80 backdrop-blur-lg border rounded-xl p-6 shadow-lg" id="bar">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribution par Sentiment</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={Object.entries(stats.sentiments_count).map(([name, value]) => ({ name, value }))}
                >
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#6366f1" radius={6} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white/80 backdrop-blur-lg border rounded-xl p-6 shadow-lg" id="table">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Avis Analysés</h3>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-left text-sm text-gray-600">
                      <th className="p-3">Avis</th>
                      <th className="p-3">Sentiment</th>
                      <th className="p-3">Confiance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.analyzed_data.slice(0, 50).map((row, i) => (
                      <tr
                        key={i}
                        className="border-b last:border-none hover:bg-gray-50 transition"
                      >
                        <td className="p-3 text-sm text-gray-700">{row.original_review}</td>
                        <td
                          className={`p-3 text-sm font-medium ${
                            row.sentiment === "POSITIVE"
                              ? "text-green-600"
                              : row.sentiment === "NEGATIVE"
                              ? "text-red-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {row.sentiment}
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          {(row.confidence * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {stats.analyzed_data.length > 50 && (
                <p className="text-xs text-gray-500 mt-2">
                  Affichage limité à 50 avis pour performance
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}