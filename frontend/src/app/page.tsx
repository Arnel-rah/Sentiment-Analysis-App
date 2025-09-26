'use client';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Loader2, 
  Star, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Download,
  BarChart3,
  Users,
  Clock,
  Shield,
  Zap,
  Target,
  FileText,
  Calendar,
  Filter,
  Search,
  Copy,
  Share2,
  BookOpen,
  HelpCircle,
  Settings,
  Bell
} from 'lucide-react';

interface AnalysisResult {
  sentiment: string;
  confidence: number;
  timestamp: string;
  review_length: number;
}

interface AnalysisHistory {
  id: string;
  review: string;
  result: AnalysisResult;
  date: Date;
}

export default function ProfessionalSentimentAnalyzer() {
  const [review, setReview] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'analyze' | 'history' | 'insights'>('analyze');
  const [selectedHistory, setSelectedHistory] = useState<AnalysisHistory | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('sentimentAnalysisHistory');
    if (savedHistory) {
      setAnalysisHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    if (analysisHistory.length > 0) {
      localStorage.setItem('sentimentAnalysisHistory', JSON.stringify(analysisHistory));
    }
  }, [analysisHistory]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!review.trim()) {
      setError('Veuillez entrer un avis à analyser');
      return;
    }

    if (review.length < 10) {
      setError('L\'avis doit contenir au moins 10 caractères pour une analyse précise');
      return;
    }

    if (review.length > 2000) {
      setError('L\'avis ne peut pas dépasser 2000 caractères');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await axios.post(
        'http://localhost:8000/analyze-single', 
        `review=${encodeURIComponent(review)}`, 
        {
          headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 15000
        }
      );

      const analysisResult: AnalysisResult = {
        ...res.data,
        timestamp: new Date().toISOString(),
        review_length: review.length
      };

      setResult(analysisResult);
      const newAnalysis: AnalysisHistory = {
        id: Date.now().toString(),
        review: review.substring(0, 200) + (review.length > 200 ? '...' : ''),
        result: analysisResult,
        date: new Date()
      };

      setAnalysisHistory(prev => [newAnalysis, ...prev.slice(0, 49)]); // Garder seulement les 50 derniers
      
    } catch (error: any) {
      console.error('Analysis error:', error);
      if (error.code === 'ECONNABORTED') {
        setError('Timeout - Le serveur met trop de temps à répondre');
      } else if (error.response?.status >= 500) {
        setError('Erreur serveur - Veuillez réessayer plus tard');
      } else if (error.response?.status === 413) {
        setError('Le texte est trop long pour être analysé');
      } else {
        setError('Erreur lors de l\'analyse. Veuillez vérifier votre connexion et réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setReview('');
    setResult(null);
    setError(null);
    setCharCount(0);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleClearHistory = () => {
    setAnalysisHistory([]);
    localStorage.removeItem('sentimentAnalysisHistory');
  };

  const handleCopyResult = () => {
    if (result) {
      const text = `Sentiment: ${getSentimentLabel(result.sentiment)}\nConfiance: ${(result.confidence * 100).toFixed(1)}%`;
      navigator.clipboard.writeText(text);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'NEGATIVE':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Minus className="w-5 h-5 text-amber-500" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE':
        return 'from-green-500 to-emerald-500';
      case 'NEGATIVE':
        return 'from-red-500 to-orange-500';
      default:
        return 'from-amber-500 to-yellow-500';
    }
  };

  const getSentimentBgColor = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE':
        return 'bg-green-50 border-green-200';
      case 'NEGATIVE':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-amber-50 border-amber-200';
    }
  };

  const getSentimentLabel = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE':
        return 'Positif';
      case 'NEGATIVE':
        return 'Négatif';
      default:
        return 'Neutre';
    }
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.9) return 'Excellente';
    if (confidence >= 0.8) return 'Très élevée';
    if (confidence >= 0.7) return 'Élevée';
    if (confidence >= 0.6) return 'Bonne';
    return 'Modérée';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-amber-600';
    return 'text-red-600';
  };

  // Statistiques de l'historique
  const stats = {
    total: analysisHistory.length,
    positive: analysisHistory.filter(item => item.result.sentiment === 'POSITIVE').length,
    negative: analysisHistory.filter(item => item.result.sentiment === 'NEGATIVE').length,
    neutral: analysisHistory.filter(item => item.result.sentiment === 'NEUTRAL').length,
    averageConfidence: analysisHistory.length > 0 
      ? analysisHistory.reduce((acc, item) => acc + item.result.confidence, 0) / analysisHistory.length 
      : 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SentimentPro</h1>
                <p className="text-xs text-gray-500">Analyse de sentiment professionnelle</p>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-1">
              {[
                { icon: BarChart3, label: 'Analyse', value: 'analyze' },
                { icon: FileText, label: 'Historique', value: 'history' },
                { icon: Target, label: 'Insights', value: 'insights' }
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setActiveTab(item.value as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    activeTab === item.value
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="flex items-center space-x-3">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cartes de statistiques rapides */}
        {analysisHistory.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Total analyses</span>
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Positifs</span>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600 mt-2">{stats.positive}</p>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Négatifs</span>
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600 mt-2">{stats.negative}</p>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Confiance moy.</span>
                <Target className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-600 mt-2">
                {(stats.averageConfidence * 100).toFixed(1)}%
              </p>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2">
            {activeTab === 'analyze' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-200"
              >
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    Analyse de sentiment en temps réel
                  </h2>
                  <p className="text-gray-600 mt-1">Analysez instantanément le sentiment d'un texte</p>
                </div>

                <div className="p-6">
                  <form onSubmit={handleAnalyze} className="space-y-6">
                    <div>
                      <label htmlFor="review" className="block text-sm font-medium text-gray-700 mb-3">
                        Texte à analyser
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <textarea
                          ref={textareaRef}
                          id="review"
                          value={review}
                          onChange={(e) => {
                            setReview(e.target.value);
                            setCharCount(e.target.value.length);
                          }}
                          placeholder="Saisissez le texte que vous souhaitez analyser... Exemple: 'Le service client était exceptionnel, rapide et efficace !'"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50"
                          rows={6}
                          maxLength={2000}
                          disabled={loading}
                        />
                        <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded">
                          {charCount}/2000
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        {charCount > 0 && charCount < 10 && (
                          <p className="text-amber-600 text-sm flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            Minimum 10 caractères requis
                          </p>
                        )}
                        <span className="text-xs text-gray-500">
                          {charCount >= 10 ? '✓ Longueur suffisante' : ''}
                        </span>
                      </div>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
                        >
                          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-red-700 text-sm font-medium">Erreur d'analyse</p>
                            <p className="text-red-600 text-sm mt-1">{error}</p>
                          </div>
                          <button
                            onClick={() => setError(null)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={loading || review.length < 10 || review.length > 2000}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Analyse en cours...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            Lancer l'analyse
                          </>
                        )}
                      </button>
                      
                      <button
                        type="button"
                        onClick={handleReset}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Réinitialiser
                      </button>
                    </div>
                  </form>

                  <AnimatePresence>
                    {result && (
                      <motion.div
                        initial={{ opacity: 0, y: 20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -20, height: 0 }}
                        className="mt-8 pt-6 border-t border-gray-200"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            Résultats de l'analyse
                          </h3>
                          <div className="flex gap-2">
                            <button
                              onClick={handleCopyResult}
                              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Copier les résultats"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className={`rounded-xl p-5 border-2 ${getSentimentBgColor(result.sentiment)}`}>
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-semibold text-gray-700">Sentiment détecté</span>
                              {getSentimentIcon(result.sentiment)}
                            </div>
                            <div className={`text-3xl font-bold bg-gradient-to-r ${getSentimentColor(result.sentiment)} bg-clip-text text-transparent`}>
                              {getSentimentLabel(result.sentiment)}
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-semibold text-blue-700">Niveau de confiance</span>
                              <Target className="w-5 h-5 text-blue-500" />
                            </div>
                            <div className="space-y-3">
                              <p className="text-3xl font-bold text-blue-700">
                                {(result.confidence * 100).toFixed(1)}%
                              </p>
                              <p className={`text-sm font-medium ${getConfidenceColor(result.confidence)}`}>
                                {getConfidenceLevel(result.confidence)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6">
                          <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>Fiabilité de l'analyse</span>
                            <span>{(result.confidence * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <motion.div
                              className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${result.confidence * 100}%` }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                          </div>
                        </div>

                        <div className="mt-4 text-xs text-gray-500 flex justify-between">
                          <span>Longueur du texte: {result.review_length} caractères</span>
                          <span>Analyse effectuée à {new Date(result.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* Autres onglets... */}
          </div>

          {/* Sidebar latérale */}
          <div className="space-y-6">
            {/* Carte d'aide */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
            >
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                Guide d'utilisation
              </h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>Saisissez un texte d'au moins 10 caractères</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>Les textes plus longs donnent de meilleurs résultats</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>Évitez les textes trop techniques ou ambigus</span>
                </div>
              </div>
            </motion.div>

            {/* Carte de statistiques */}
            {analysisHistory.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
              >
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Vue d'ensemble
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Analyses aujourd'hui</span>
                      <span>{analysisHistory.filter(item => 
                        new Date(item.date).toDateString() === new Date().toDateString()
                      ).length}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${(analysisHistory.filter(item => 
                          new Date(item.date).toDateString() === new Date().toDateString()
                        ).length / Math.max(analysisHistory.length, 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-green-600">{stats.positive}</div>
                      <div className="text-xs text-green-700">Positifs</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-red-600">{stats.negative}</div>
                      <div className="text-xs text-red-700">Négatifs</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Carte de sécurité */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-6 h-6 text-blue-600" />
                <span className="font-semibold text-blue-900">Sécurité des données</span>
              </div>
              <p className="text-sm text-blue-700">
                Vos analyses sont traitées de manière sécurisée et ne sont pas stockées sur nos serveurs.
                L'historique local est uniquement conservé sur votre appareil.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}