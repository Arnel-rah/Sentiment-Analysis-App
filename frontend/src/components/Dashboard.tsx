"use client";
import { useState, useRef, useEffect } from "react";
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
  TooltipProps,
} from "recharts";
import Papa from "papaparse";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSpreadsheet,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  Loader2,
  MessageSquare,
  Upload,
  AlertCircle,
  CheckCircle2,
  Home,
  BarChart4,
  Users,
  Settings,
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

// Composant Tooltip personnalisé pour TypeScript
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{`${label}`}</p>
        <p className="text-sm text-gray-600">
          {`Valeur: ${payload[0].value}`}
        </p>
      </div>
    );
  }
  return null;
};

const PercentTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{`${label}`}</p>
        <p className="text-sm text-gray-600">
          {`Pourcentage: ${payload[0].value}%`}
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("upload");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (file) setError(null);
  }, [file]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Veuillez sélectionner un fichier CSV");
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError("Le fichier doit être au format CSV");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Le fichier est trop volumineux (max 10MB)");
      return;
    }

    setLoading(true);
    setError(null);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:8000/analyze-csv", formData, {
        timeout: 60000,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });
      setStats(res.data);
      setActiveSection("dashboard");
    } catch (error: any) {
      console.error("Upload error:", error);
      if (error.code === 'ECONNABORTED') {
        setError("Timeout - Le serveur met trop de temps à répondre");
      } else if (error.response?.status === 413) {
        setError("Fichier trop volumineux pour le serveur");
      } else if (error.response?.status >= 500) {
        setError("Erreur serveur - Veuillez réessayer plus tard");
      } else {
        setError("Erreur lors de l'analyse. Vérifiez le format CSV.");
      }
    }
    setLoading(false);
    setUploadProgress(0);
  };

  const handleExport = () => {
    if (!stats) return;
    
    try {
      const csv = Papa.unparse(stats.analyzed_data);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analyse_sentiments_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      setError("Erreur lors de l'exportation");
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const COLORS = ["#22c55e", "#ef4444", "#f59e0b"];
  const SENTIMENT_COLORS = {
    POSITIVE: "#22c55e",
    NEGATIVE: "#ef4444", 
    NEUTRAL: "#f59e0b"
  };

  const navItems = [
    { icon: Home, label: "Dashboard", section: "dashboard" },
    { icon: PieChartIcon, label: "Camembert", section: "pie" },
    { icon: BarChart3, label: "Graphique Barres", section: "bar" },
    { icon: MessageSquare, label: "Avis Analysés", section: "table" },
    { icon: Users, label: "Analytiques", section: "analytics" },
  ];

  const secondaryNavItems = [
    { icon: FileSpreadsheet, label: "Importer CSV", section: "upload" },
    { icon: Settings, label: "Paramètres", section: "settings" },
  ];

  const pieData = [
    { name: "Positif", value: stats?.positive_pct || 0 },
    { name: "Négatif", value: stats?.negative_pct || 0 },
    { name: "Neutre", value: stats?.neutral_pct || 0 },
  ];

  const barData = stats ? Object.entries(stats.sentiments_count).map(([name, value]) => ({ 
    name, 
    value: value as number,
    fill: SENTIMENT_COLORS[name as keyof typeof SENTIMENT_COLORS] || "#6366f1"
  })) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation Bar */}
      <nav className="bg-white/95 backdrop-blur-lg border-b shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo et titre */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BarChart4 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  SentimentAI
                </h1>
                <p className="text-xs text-gray-500">Analyse de sentiment</p>
              </div>
            </div>

            {/* Navigation principale - Desktop */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <button
                  key={item.section}
                  onClick={() => setActiveSection(item.section)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                    activeSection === item.section
                      ? "bg-indigo-50 text-indigo-700 shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Actions - Desktop */}
            <div className="hidden md:flex items-center gap-3">
              {secondaryNavItems.map((item) => (
                <button
                  key={item.section}
                  onClick={() => setActiveSection(item.section)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    activeSection === item.section
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
              
              {stats && (
                <motion.button
                  onClick={handleExport}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm">Exporter</span>
                </motion.button>
              )}
            </div>

            {/* Menu mobile */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <div className="w-6 h-6 flex flex-col justify-center gap-1">
                  <span className={`block h-0.5 w-full bg-gray-600 transition-all ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                  <span className={`block h-0.5 w-full bg-gray-600 transition-all ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                  <span className={`block h-0.5 w-full bg-gray-600 transition-all ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
                </div>
              </button>
            </div>
          </div>

          {/* Menu mobile déroulant */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden border-t bg-white/95 backdrop-blur-lg"
              >
                <div className="py-2 space-y-1">
                  {[...navItems, ...secondaryNavItems].map((item) => (
                    <button
                      key={item.section}
                      onClick={() => {
                        setActiveSection(item.section);
                        setIsMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-200 ${
                        activeSection === item.section
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ))}
                  
                  {stats && (
                    <button
                      onClick={() => {
                        handleExport();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                    >
                      <Download className="w-5 h-5" />
                      <span className="font-medium">Exporter CSV</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700 text-sm">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto">
                <AlertCircle className="w-4 h-4 text-red-500" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Section */}
        {activeSection === "upload" && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-lg border rounded-2xl shadow-xl p-6 md:p-8 max-w-2xl mx-auto"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Importer vos données CSV</h2>
              <p className="text-gray-600">Téléchargez un fichier CSV contenant les avis à analyser</p>
            </div>

            <form onSubmit={handleUpload} className="space-y-6">
              <div
                onDrop={handleFileDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
                  file ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-indigo-400 bg-gray-50/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-green-500 flex-shrink-0" />
                    <div className="text-left min-w-0">
                      <p className="font-medium text-gray-800 truncate">{file.name}</p>
                      <p className="text-sm text-gray-600">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="ml-auto text-gray-400 hover:text-gray-600 flex-shrink-0"
                    >
                      <AlertCircle className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-2">
                      <span className="text-indigo-600 font-medium">Cliquez pour sélectionner</span> ou glissez-déposez
                    </p>
                    <p className="text-sm text-gray-500">CSV uniquement, max 10MB</p>
                  </div>
                )}
              </div>

              {loading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Analyse en cours...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-indigo-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!file || loading}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyse en cours...
                  </span>
                ) : (
                  "Démarrer l'analyse"
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* Dashboard Sections */}
        {stats && activeSection !== "upload" && (
          <div className="space-y-8">
            {/* Header du dashboard */}
            {activeSection === "dashboard" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
              >
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Tableau de Bord Analytique</h2>
                <p className="text-gray-600">Vue d'ensemble des analyses de sentiment</p>
              </motion.div>
            )}

            {/* KPIs */}
            {(activeSection === "dashboard" || activeSection === "analytics") && (
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {[
                  {
                    label: "Total Avis",
                    value: stats.total_reviews.toLocaleString(),
                    color: "text-indigo-600",
                    bgColor: "bg-indigo-50",
                    icon: <FileSpreadsheet className="w-5 h-5" />,
                  },
                  {
                    label: "Positifs",
                    value: `${stats.positive_pct}%`,
                    color: "text-green-600",
                    bgColor: "bg-green-50",
                    icon: <PieChartIcon className="w-5 h-5" />,
                  },
                  {
                    label: "Négatifs",
                    value: `${stats.negative_pct}%`,
                    color: "text-red-600",
                    bgColor: "bg-red-50",
                    icon: <PieChartIcon className="w-5 h-5" />,
                  },
                  {
                    label: "Neutres",
                    value: `${stats.neutral_pct}%`,
                    color: "text-amber-600",
                    bgColor: "bg-amber-50",
                    icon: <PieChartIcon className="w-5 h-5" />,
                  },
                ].map((kpi, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="bg-white/80 backdrop-blur-lg border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">{kpi.label}</h3>
                        <p className={`text-2xl font-bold ${kpi.color} mt-1`}>{kpi.value}</p>
                      </div>
                      <div className={`p-3 rounded-xl ${kpi.bgColor} ${kpi.color}`}>
                        {kpi.icon}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Sections spécifiques */}
            <AnimatePresence mode="wait">
              {/* Pie Chart */}
              {(activeSection === "dashboard" || activeSection === "pie") && (
                <motion.div
                  key="pie-chart"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white/80 backdrop-blur-lg border rounded-2xl p-6 shadow-lg"
                >
                  <h3 className="text-xl font-semibold text-gray-800 mb-6">Répartition des Sentiments</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChartComponent>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={140}
                        innerRadius={70}
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(1)}%`}
                        labelLine={false}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PercentTooltip />} />
                      <Legend />
                    </PieChartComponent>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {/* Bar Chart */}
              {(activeSection === "dashboard" || activeSection === "bar" || activeSection === "analytics") && (
                <motion.div
                  key="bar-chart"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white/80 backdrop-blur-lg border rounded-2xl p-6 shadow-lg"
                >
                  <h3 className="text-xl font-semibold text-gray-800 mb-6">Distribution par Sentiment</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={barData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}