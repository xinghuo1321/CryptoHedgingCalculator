import { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Clock, 
  Calculator, 
  ShieldAlert, 
  ArrowRightLeft,
  Info,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, differenceInSeconds } from 'date-fns';
import { getMarketMetrics, type MarketMetrics } from './services/binance';
import { cn } from './lib/utils';

export default function App() {
  const [metrics, setMetrics] = useState<MarketMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ethValue, setEthValue] = useState<string>('');
  const [btcValue, setBtcValue] = useState<string>('');
  const [inputUnit, setInputUnit] = useState<'USD' | 'COIN'>('USD');
  const [hedgeMode, setHedgeMode] = useState<'ETH_TO_BTC' | 'BTC_TO_ETH'>('ETH_TO_BTC');
  const [timeLeft, setTimeLeft] = useState<number>(3600);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchData = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    else setLoading(true);
    
    try {
      const data = await getMarketMetrics();
      
      // Set initial values only on the first load
      setMetrics((prev) => {
        if (!prev) {
          setEthValue(data.ethPrice.toString());
          setBtcValue(data.btcPrice.toString());
        }
        return data;
      });

      setError(null);
      setTimeLeft(3600);
    } catch (err) {
      setError('Failed to fetch market data. Please check your connection.');
      console.error(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 3600000); // 1 hour
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculation Logic
  let hedgeQty = 0;
  let hedgeValue = 0;
  let hedgeSymbol = '';
  let baseSymbol = '';

  if (metrics) {
    if (hedgeMode === 'ETH_TO_BTC') {
      baseSymbol = 'ETH';
      hedgeSymbol = 'BTC';
      const inputVal = parseFloat(ethValue || '0');
      const ethValUSD = inputUnit === 'USD' ? inputVal : inputVal * metrics.ethPrice;
      hedgeQty = (ethValUSD * metrics.beta) / metrics.btcPrice;
      hedgeValue = hedgeQty * metrics.btcPrice;
    } else {
      baseSymbol = 'BTC';
      hedgeSymbol = 'ETH';
      const inputVal = parseFloat(btcValue || '0');
      const btcValUSD = inputUnit === 'USD' ? inputVal : inputVal * metrics.btcPrice;
      hedgeQty = (btcValUSD / metrics.beta) / metrics.ethPrice;
      hedgeValue = hedgeQty * metrics.ethPrice;
    }
  }

  if (loading && !metrics) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-500" />
          <p className="text-xl font-medium animate-pulse">Initializing Market Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Crypto Hedging Calculator</h1>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Beta Volatility Strategy</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-6 text-sm mr-4">
              <div className="flex flex-col items-end">
                <span className="text-slate-500 text-[10px] uppercase font-bold">Last Updated</span>
                <span className="font-mono text-slate-300">
                  {metrics ? format(metrics.lastUpdated, 'HH:mm:ss') : '--:--:--'}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-slate-500 text-[10px] uppercase font-bold">Next Update</span>
                <span className="font-mono text-blue-400">{formatTime(timeLeft)}</span>
              </div>
            </div>
            <button 
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 transition-all px-4 py-2 rounded-lg text-sm font-semibold border border-slate-700"
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              {isRefreshing ? 'Updating...' : 'Update Now'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-8 p-4 bg-red-900/20 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-200">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Prices & Metrics */}
          <div className="lg:col-span-2 space-y-8">
            {/* Price Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingUp className="w-24 h-24 text-orange-500" />
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                    <span className="text-orange-500 font-bold text-xs">₿</span>
                  </div>
                  <span className="text-slate-400 font-bold uppercase text-xs tracking-widest">BTC / USDT</span>
                </div>
                <div className="text-3xl font-mono font-bold text-slate-100">
                  ${metrics?.btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingUp className="w-24 h-24 text-blue-500" />
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <span className="text-blue-500 font-bold text-xs">Ξ</span>
                  </div>
                  <span className="text-slate-400 font-bold uppercase text-xs tracking-widest">ETH / USDT</span>
                </div>
                <div className="text-3xl font-mono font-bold text-slate-100">
                  ${metrics?.ethPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </motion.div>
            </div>

            {/* Market Metrics */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  <h2 className="font-bold">Volatility & Correlation Analysis</h2>
                </div>
                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded font-bold uppercase tracking-tighter">30D Rolling</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800">
                <div className="p-6">
                  <p className="text-slate-500 text-xs font-bold uppercase mb-2">BTC Volatility (σ)</p>
                  <p className="text-2xl font-mono font-bold text-slate-200">
                    {(metrics?.btcVol ? metrics.btcVol * 100 : 0).toFixed(2)}%
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 italic">Annualized Std Dev</p>
                </div>
                <div className="p-6">
                  <p className="text-slate-500 text-xs font-bold uppercase mb-2">ETH Volatility (σ)</p>
                  <p className="text-2xl font-mono font-bold text-slate-200">
                    {(metrics?.ethVol ? metrics.ethVol * 100 : 0).toFixed(2)}%
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 italic">Annualized Std Dev</p>
                </div>
                <div className="p-6">
                  <p className="text-slate-500 text-xs font-bold uppercase mb-2">Correlation (ρ)</p>
                  <p className="text-2xl font-mono font-bold text-blue-400">
                    {metrics?.correlation.toFixed(4)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 italic">Pearson Coefficient</p>
                </div>
              </div>
            </motion.div>

            {/* Formula Explanation */}
            <div className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-2xl">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Info className="w-5 h-5 text-blue-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-blue-400">How it works</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    We use a <span className="text-slate-200 font-medium">Beta-based volatility strategy</span>. 
                    Beta represents the sensitivity of ETH relative to BTC. 
                    By shorting <span className="font-mono text-slate-200">ETH Value × Beta</span> worth of BTC, 
                    we neutralize the systematic risk of the position based on historical volatility ratios.
                  </p>
                  <div className="pt-2 flex flex-wrap gap-4 text-[11px] font-mono text-slate-500">
                    <span className="bg-slate-800 px-2 py-1 rounded">Beta = ρ × (ETH σ / BTC σ)</span>
                    <span className="bg-slate-800 px-2 py-1 rounded">Short BTC = (ETH Value × Beta) / BTC Price</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Calculator */}
          <div className="space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-900 border border-blue-500/30 rounded-2xl p-8 shadow-2xl shadow-blue-500/5"
            >
              <div className="flex items-center gap-3 mb-8">
                <Calculator className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-bold">Hedging Calculator</h2>
              </div>

              {/* Mode Toggle */}
              <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 mb-8">
                <button 
                  onClick={() => setHedgeMode('ETH_TO_BTC')}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                    hedgeMode === 'ETH_TO_BTC' ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  Hold ETH / Short BTC
                </button>
                <button 
                  onClick={() => setHedgeMode('BTC_TO_ETH')}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                    hedgeMode === 'BTC_TO_ETH' ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  Hold BTC / Short ETH
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Your {baseSymbol} Position
                    </label>
                    <div className="flex bg-slate-950 rounded-md border border-slate-800 p-0.5">
                      <button 
                        onClick={() => setInputUnit('USD')}
                        className={cn(
                          "px-2 py-1 text-[10px] font-bold rounded transition-all",
                          inputUnit === 'USD' ? "bg-slate-800 text-blue-400" : "text-slate-600 hover:text-slate-400"
                        )}
                      >
                        USD
                      </button>
                      <button 
                        onClick={() => setInputUnit('COIN')}
                        className={cn(
                          "px-2 py-1 text-[10px] font-bold rounded transition-all",
                          inputUnit === 'COIN' ? "bg-slate-800 text-blue-400" : "text-slate-600 hover:text-slate-400"
                        )}
                      >
                        {baseSymbol}
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono">
                      {inputUnit === 'USD' ? '$' : baseSymbol === 'BTC' ? '₿' : 'Ξ'}
                    </span>
                    <input 
                      type="number"
                      value={hedgeMode === 'ETH_TO_BTC' ? ethValue : btcValue}
                      onChange={(e) => hedgeMode === 'ETH_TO_BTC' ? setEthValue(e.target.value) : setBtcValue(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 pl-12 pr-4 text-xl font-mono focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder={inputUnit === 'USD' ? "Enter USD value..." : `Enter ${baseSymbol} quantity...`}
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Calculated Beta</span>
                    <span className="text-lg font-mono font-bold text-blue-400">
                      {metrics?.beta.toFixed(4)}
                    </span>
                  </div>
                  <div className="h-px bg-slate-800" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Hedge Ratio</span>
                    <span className="text-sm font-mono text-slate-300">
                      1 : {hedgeMode === 'ETH_TO_BTC' ? metrics?.beta.toFixed(2) : (1 / (metrics?.beta || 1)).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="pt-4">
                  <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-600/20">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-2">Recommended {hedgeSymbol} Short</p>
                    <div className="flex items-baseline gap-2 group relative">
                      <span className="text-4xl font-mono font-bold">{hedgeQty.toFixed(4)}</span>
                      <span className="text-xl font-bold opacity-80">{hedgeSymbol}</span>
                      <button 
                        onClick={() => handleCopy(hedgeQty.toFixed(8))}
                        className="ml-2 p-1 hover:bg-white/10 rounded transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1"
                        title="Copy to clipboard"
                      >
                        {copied ? (
                          <span className="text-[10px] font-bold bg-white text-blue-600 px-1 rounded animate-in fade-in zoom-in">COPIED!</span>
                        ) : (
                          <ArrowRightLeft className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center">
                      <span className="text-xs opacity-80">Notional Value</span>
                      <span className="font-mono font-bold">${hedgeValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-500 italic">
                  <Clock className="w-3 h-3" />
                  Calculated based on current market prices and 30D volatility.
                </div>
              </div>
            </motion.div>

            {/* Quick Stats/Alert */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-orange-500" />
                Risk Management
              </h3>
              <ul className="space-y-3 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-orange-500 rounded-full mt-1.5" />
                  Beta is dynamic and changes with market volatility.
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-orange-500 rounded-full mt-1.5" />
                  Correlation can break during extreme market decoupling.
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-orange-500 rounded-full mt-1.5" />
                  Always account for exchange fees and slippage.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Footer Stats */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-4 flex justify-between items-center z-50">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase font-bold">Next Update</span>
          <span className="font-mono text-blue-400 text-sm">{formatTime(timeLeft)}</span>
        </div>
        <button 
          onClick={() => fetchData(true)}
          className="bg-blue-600 px-4 py-2 rounded-lg text-xs font-bold"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
