import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { useToast } from '../context/ToastContext';
import URLCard from '../components/URLCard';
import QRModal from '../components/QRModal';
import { Plus, Search, HelpCircle, Loader2, ArrowUpDown, ShieldAlert, BarChart3, Link as LinkIcon, Calendar, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

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
            <p className="text-sm font-semibold text-muted-foreground">Aggregate Clicks</p>
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

          {/* Submit Action */}
          <div className="md:col-span-12 flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/95 px-6 py-3.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-primary/15 hover:shadow-primary/25 disabled:opacity-50"
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
    </div>
  );
};

export default Dashboard;
