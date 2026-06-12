import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { useToast } from '../context/ToastContext';
import URLCard from '../components/URLCard';
import QRModal from '../components/QRModal';
import { Plus, Search, HelpCircle, Loader2, ArrowUpDown, ShieldAlert, BarChart3, Link as LinkIcon, Calendar, Sparkles, Upload, X, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';

// Simple CSV parser supporting headers or column order
const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line !== '');
  if (lines.length === 0) return [];

  const parseLine = (line) => {
    const result = [];
    let cell = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(cell.trim());
        cell = '';
      } else {
        cell += char;
      }
    }
    result.push(cell.trim());
    return result.map(c => c.replace(/^"|"$/g, '').trim());
  };

  const firstLineCells = parseLine(lines[0]);
  let hasHeaders = false;
  let urlIdx = 0;
  let aliasIdx = -1;
  let expiryIdx = -1;

  const isHeader = (cell) => /url|longurl|link|alias|customalias|expiry|expirydate/i.test(cell);
  if (firstLineCells.some(isHeader)) {
    hasHeaders = true;
    firstLineCells.forEach((cell, idx) => {
      const cellLower = cell.toLowerCase();
      if (cellLower.includes('url') || cellLower.includes('link')) {
        urlIdx = idx;
      } else if (cellLower.includes('alias')) {
        aliasIdx = idx;
      } else if (cellLower.includes('expiry')) {
        expiryIdx = idx;
      }
    });
  }

  const startLine = hasHeaders ? 1 : 0;
  const parsedRows = [];

  for (let i = startLine; i < lines.length; i++) {
    const cells = parseLine(lines[i]);
    if (cells.length === 0 || !cells[urlIdx]) continue;

    parsedRows.push({
      longUrl: cells[urlIdx],
      customAlias: aliasIdx !== -1 && cells[aliasIdx] ? cells[aliasIdx] : undefined,
      expiryDate: expiryIdx !== -1 && cells[expiryIdx] ? cells[expiryIdx] : undefined
    });
  }

  return parsedRows;
};

const Dashboard = () => {
  const { showToast } = useToast();
  
  // URL creation form state
  const [longUrl, setLongUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  
  // Lists and loaders
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Bulk upload states
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkUrls, setBulkUrls] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  
  // Filtering & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, clicks, expiry

  // QR Modal State
  const [qrModal, setQrModal] = useState({
    isOpen: false,
    shortUrl: '',
    shortCode: ''
  });

  // Fetch all user URLs on mount
  const fetchUrls = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/urls');
      setUrls(response.data);
    } catch (error) {
      console.error('Fetch URLs error:', error);
      showToast('Failed to load shortened URLs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUrls();
  }, []);

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!longUrl) {
      showToast('Please enter a long URL', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { longUrl };
      if (customAlias) payload.customAlias = customAlias;
      if (expiryDate) payload.expiryDate = expiryDate;

      const response = await api.post('/api/urls', payload);
      
      // Concat new URL to state
      setUrls(prev => [response.data.url, ...prev]);
      
      // Clear form
      setLongUrl('');
      setCustomAlias('');
      setExpiryDate('');

      // Play hackathon wow animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#8b5cf6', '#3b82f6', '#10b981']
      });

      showToast('URL shortened successfully!', 'success');
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.errors?.[0]?.message || 'Failed to shorten URL';
      showToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // URL deletion handler
  const handleDelete = async (urlId) => {
    try {
      await api.delete(`/api/urls/${urlId}`);
      setUrls(prev => prev.filter(u => u.id !== urlId));
      showToast('Short URL deleted successfully', 'success');
    } catch (error) {
      showToast('Failed to delete URL', 'error');
    }
  };

  // QR modal helpers
  const handleOpenQR = (shortUrl, shortCode) => {
    setQrModal({
      isOpen: true,
      shortUrl,
      shortCode
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        showToast('No valid rows found in the CSV file', 'error');
        return;
      }
      setBulkUrls(parsed);
      showToast(`Successfully parsed ${parsed.length} rows from CSV`, 'success');
    };
    reader.onerror = () => {
      showToast('Error reading CSV file', 'error');
    };
    reader.readAsText(file);
  };

  const handleBulkSubmit = async () => {
    if (bulkUrls.length === 0) {
      showToast('No URLs to shorten', 'error');
      return;
    }

    setBulkLoading(true);
    setBulkResult(null);

    try {
      const response = await api.post('/api/urls/bulk', { urls: bulkUrls });
      const { urls: createdUrls, errors, successCount, errorCount } = response.data;
      
      setBulkResult({
        successCount,
        errorCount,
        urls: createdUrls,
        errors
      });

      if (createdUrls.length > 0) {
        setUrls(prev => [...createdUrls, ...prev]);
        
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.7 },
          colors: ['#a78bfa', '#60a5fa', '#34d399']
        });
      }

      showToast(`Bulk processing completed: ${successCount} succeeded, ${errorCount} failed.`, successCount > 0 ? 'success' : 'error');
    } catch (error) {
      console.error('Bulk creation error:', error);
      const errorMsg = error.response?.data?.error || 'Failed to process bulk URLs';
      showToast(errorMsg, 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  // Calculate high-level stats for visual feedback
  const totalUrls = urls.length;
  const totalClicks = urls.reduce((sum, item) => sum + item.clicksCount, 0);
  const activeUrls = urls.filter(u => !u.expiryDate || new Date(u.expiryDate) > new Date()).length;

  // Apply search filtering
  const filteredUrls = urls.filter(u => 
    u.longUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.customAlias && u.customAlias.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Apply sorting
  const sortedUrls = [...filteredUrls].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (sortBy === 'clicks') {
      return b.clicksCount - a.clicksCount;
    }
    if (sortBy === 'expiry') {
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;
      return new Date(a.expiryDate) - new Date(b.expiryDate);
    }
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 relative">
      
      {/* Decorative Glow */}
      <div className="glow-purple -top-10 right-10" />
      <div className="glow-blue top-80 left-20" />

      {/* Top Banner / Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Stat 1 */}
        <div className="bg-card border border-border/80 p-6 rounded-3xl shadow-sm flex items-center space-x-4">
          <div className="bg-primary/10 p-3 rounded-2xl text-primary">
            <LinkIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Total Short Links</p>
            <h4 className="text-2xl font-extrabold text-foreground">{totalUrls}</h4>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-card border border-border/80 p-6 rounded-3xl shadow-sm flex items-center space-x-4">
          <div className="bg-emerald-500/10 p-3 rounded-2xl text-emerald-500">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Total Clicks</p>
            <h4 className="text-2xl font-extrabold text-foreground">{totalClicks}</h4>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-card border border-border/80 p-6 rounded-3xl shadow-sm flex items-center space-x-4">
          <div className="bg-indigo-500/10 p-3 rounded-2xl text-indigo-500">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Active Links</p>
            <h4 className="text-2xl font-extrabold text-foreground">{activeUrls}</h4>
          </div>
        </div>
      </div>

      {/* URL Creation Card */}
      <div className="bg-card border border-border p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="flex items-center space-x-2 text-primary mb-6">
          <Sparkles className="h-5 w-5 animate-pulse" />
          <h2 className="text-xl font-bold text-foreground">Shorten a Long Link</h2>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
          {/* Long URL Input */}
          <div className="md:col-span-6 space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Long URL
            </label>
            <input
              type="url"
              required
              value={longUrl}
              onChange={(e) => setLongUrl(e.target.value)}
              className="w-full border border-border bg-background px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-foreground"
              placeholder="https://example.com/very/long/path/to/some/resource"
            />
          </div>

          {/* Custom Alias Input */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center space-x-1">
              <span>Custom Alias</span>
              <span className="text-[10px] font-normal text-muted-foreground lowercase">(optional)</span>
            </label>
            <input
              type="text"
              value={customAlias}
              onChange={(e) => setCustomAlias(e.target.value)}
              className="w-full border border-border bg-background px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-foreground"
              placeholder="my-promo-link"
            />
          </div>

          {/* Expiry Date Input */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center space-x-1">
              <span>Expiry Date</span>
              <span className="text-[10px] font-normal text-muted-foreground lowercase">(optional)</span>
            </label>
            <input
              type="datetime-local"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full border border-border bg-background px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-foreground"
            />
          </div>

          {/* Submit & Bulk Actions */}
          <div className="md:col-span-12 flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsBulkModalOpen(true);
                setBulkUrls([]);
                setBulkResult(null);
              }}
              className="flex items-center justify-center space-x-2 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary px-6 py-3.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
            >
              <Upload className="h-4.5 w-4.5" />
              <span>Bulk Shorten (CSV)</span>
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/95 px-6 py-3.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-primary/15 hover:shadow-primary/25 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4.5 w-4.5" />
                  <span>Shorten Link</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* URL Grid Filtering and Header */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-xl font-bold text-foreground">My Shortened Links</h3>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {/* Search Bar */}
            <div className="relative flex-1 sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-border bg-card text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-foreground"
                placeholder="Search link or short code..."
              />
            </div>

            {/* Sort Select */}
            <div className="relative flex items-center border border-border bg-card rounded-xl px-2.5 shadow-sm text-xs font-medium text-muted-foreground">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent py-2 pr-4 focus:outline-none cursor-pointer text-foreground text-xs"
              >
                <option value="newest">Sort: Newest</option>
                <option value="clicks">Sort: Most Clicks</option>
                <option value="expiry">Sort: Expiry Date</option>
              </select>
            </div>
          </div>
        </div>

        {/* URLs List / Grid */}
        {loading ? (
          /* Skeleton Loading State */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border border-border/60 bg-card/60 p-5 rounded-3xl space-y-4 animate-pulse">
                <div className="flex justify-between">
                  <div className="h-3 w-20 bg-muted rounded"></div>
                  <div className="h-3 w-10 bg-muted rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-5 w-40 bg-muted rounded"></div>
                  <div className="h-3.5 w-24 bg-muted rounded"></div>
                </div>
                <div className="h-0.5 bg-muted/30"></div>
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <div className="h-8 w-8 bg-muted rounded-lg"></div>
                    <div className="h-8 w-8 bg-muted rounded-lg"></div>
                    <div className="h-8 w-16 bg-muted rounded-lg"></div>
                  </div>
                  <div className="h-8 w-8 bg-muted rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedUrls.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedUrls.map(url => (
              <URLCard
                key={url.id}
                url={url}
                onDelete={handleDelete}
                onOpenQR={handleOpenQR}
                onUpdate={(updatedUrl) => {
                  setUrls(prev => prev.map(u => u.id === updatedUrl.id ? updatedUrl : u));
                }}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-card border border-border/80 border-dashed rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 shadow-sm animate-in fade-in duration-300">
            <div className="mx-auto inline-flex bg-primary/10 p-4 rounded-full text-primary">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div>
              <h4 className="text-base font-bold text-foreground">No Shortened Links found</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Generate your first short link above to get started with analytics.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* QR Code Modal rendering */}
      <QRModal
        isOpen={qrModal.isOpen}
        onClose={() => setQrModal(prev => ({ ...prev, isOpen: false }))}
        shortUrl={qrModal.shortUrl}
        shortCode={qrModal.shortCode}
      />

      {/* Bulk Shorten Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-300" 
            onClick={() => {
              if (!bulkLoading) setIsBulkModalOpen(false);
            }}
          />

          <div className="relative w-full max-w-2xl bg-card border border-border rounded-3xl p-6 shadow-2xl z-10 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4 shrink-0">
              <div className="flex items-center space-x-2 text-primary">
                <Upload className="h-5 w-5" />
                <h3 className="text-lg font-bold text-foreground">Bulk URL Shortening</h3>
              </div>
              <button 
                onClick={() => setIsBulkModalOpen(false)}
                disabled={bulkLoading}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              {!bulkResult && (
                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 text-xs space-y-2 text-muted-foreground">
                  <p className="font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                    CSV File Guidelines
                  </p>
                  <p>
                    Please upload a <strong>.csv</strong> file. The first row can contain header labels:
                  </p>
                  <code className="block bg-background p-2 rounded-lg text-foreground border border-border select-all font-mono">
                    longUrl,customAlias,expiryDate
                  </code>
                  <p>
                    Example row:<br />
                    <code className="text-foreground select-all font-mono">
                      https://example.com/item-123,my-promo,2026-12-31T23:59:59Z
                    </code>
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    * If headers are omitted, columns will map automatically by order: Long URL (col 1), Custom Alias (col 2), Expiry Date (col 3).
                  </p>
                </div>
              )}

              {!bulkResult && bulkUrls.length === 0 && (
                <div className="relative border-2 border-dashed border-border/80 hover:border-primary/50 transition-all rounded-2xl p-8 text-center bg-card/50">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-3">
                    <div className="mx-auto inline-flex bg-primary/10 p-3 rounded-full text-primary">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Click to upload or drag & drop</p>
                      <p className="text-xs text-muted-foreground mt-1">Accepts CSV files with columns/headers</p>
                    </div>
                  </div>
                </div>
              )}

              {bulkUrls.length > 0 && !bulkResult && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-foreground">Parsed URLs Preview ({bulkUrls.length} entries)</p>
                    <button
                      onClick={() => setBulkUrls([])}
                      className="text-[11px] text-rose-500 hover:underline font-bold"
                    >
                      Clear File
                    </button>
                  </div>
                  <div className="border border-border/60 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-muted text-muted-foreground border-b border-border/50">
                          <th className="p-2.5 font-bold">#</th>
                          <th className="p-2.5 font-bold">Destination URL</th>
                          <th className="p-2.5 font-bold">Alias</th>
                          <th className="p-2.5 font-bold">Expiry Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkUrls.map((row, idx) => (
                          <tr key={idx} className="border-b border-border/30 hover:bg-muted/30">
                            <td className="p-2.5 text-muted-foreground font-semibold">{idx + 1}</td>
                            <td className="p-2.5 font-medium truncate max-w-xs text-foreground" title={row.longUrl}>
                              {row.longUrl}
                            </td>
                            <td className="p-2.5 font-mono text-primary">{row.customAlias || '-'}</td>
                            <td className="p-2.5 text-muted-foreground">
                              {row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {bulkLoading && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-sm font-semibold text-muted-foreground">Shortening URLs in bulk, please wait...</p>
                </div>
              )}

              {bulkResult && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center space-x-3 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-6 w-6" />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Succeeded</p>
                        <h4 className="text-xl font-extrabold">{bulkResult.successCount}</h4>
                      </div>
                    </div>
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center space-x-3 text-rose-500">
                      <XCircle className="h-6 w-6" />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Failed</p>
                        <h4 className="text-xl font-extrabold">{bulkResult.errorCount}</h4>
                      </div>
                    </div>
                  </div>

                  {bulkResult.errors.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-rose-500 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Failures & Errors
                      </p>
                      <div className="border border-rose-500/25 bg-rose-500/5 rounded-xl p-3 max-h-40 overflow-y-auto text-[11px] font-medium space-y-1.5 text-rose-500">
                        {bulkResult.errors.map((err, idx) => (
                          <div key={idx} className="flex items-start space-x-1">
                            <span className="font-bold shrink-0">Row {err.index + 1}:</span>
                            <span className="break-all">{err.error} {err.url ? `(URL: ${err.url})` : ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {bulkResult.urls.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-foreground">Shortened Links</p>
                      <div className="border border-border/60 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-muted text-muted-foreground border-b border-border/50">
                              <th className="p-2.5 font-bold">Short Link</th>
                              <th className="p-2.5 font-bold">Original Destination</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bulkResult.urls.map((u, idx) => (
                              <tr key={idx} className="border-b border-border/30 hover:bg-muted/30">
                                <td className="p-2.5 font-bold text-primary break-all">
                                  <a href={u.shortUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                    {u.shortUrl.replace(/^https?:\/\//, '')}
                                  </a>
                                </td>
                                <td className="p-2.5 font-medium truncate max-w-xs text-muted-foreground" title={u.longUrl}>
                                  {u.longUrl}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-border pt-4 mt-4 flex justify-end space-x-3 shrink-0">
              <button
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setBulkUrls([]);
                  setBulkResult(null);
                }}
                disabled={bulkLoading}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted text-foreground transition-all disabled:opacity-50"
              >
                {bulkResult ? 'Close' : 'Cancel'}
              </button>
              {bulkUrls.length > 0 && !bulkResult && !bulkLoading && (
                <button
                  onClick={handleBulkSubmit}
                  className="flex items-center space-x-1.5 bg-primary text-primary-foreground hover:bg-primary/95 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-md shadow-primary/10"
                >
                  <Plus className="h-4 w-4" />
                  <span>Shorten All ({bulkUrls.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
