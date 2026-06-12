import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { BarChart3, Calendar, ExternalLink, ShieldAlert, Link2, Clock, Globe } from 'lucide-react';

const PublicStats = () => {
  const { shortCode } = useParams();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPublicStats = async () => {
      try {
        setLoading(true);
        setError(null);
        // Base API points directly to backend (no auth header needed)
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await axios.get(`${baseUrl}/api/analytics/public/${shortCode}`);
        setData(response.data);
      } catch (err) {
        console.error('Fetch public stats error:', err);
        setError(err.response?.data?.error || 'Failed to load public statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicStats();
  }, [shortCode]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isExpired = data?.expiryDate ? new Date(data.expiryDate) < new Date() : false;

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center space-y-4 bg-background">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm font-semibold text-muted-foreground">Gathering stats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 text-center bg-background">
        <div className="bg-rose-500/10 p-4 rounded-full text-rose-500 mb-4">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Failed to Load Statistics</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">{error}</p>
        <Link 
          to="/login" 
          className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/95 transition-all shadow-md shadow-primary/10"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const fullShortUrl = `${window.location.protocol}//${window.location.host.split(':')[0]}:5000/r/${data.shortCode}`;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-background py-12 px-4 sm:px-6 lg:px-8">
      {/* Glow Effects */}
      <div className="glow-purple top-10 left-10" />
      <div className="glow-blue bottom-10 right-10" />

      <div className="relative max-w-4xl mx-auto space-y-8 z-10">
        
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex bg-primary/10 p-3 rounded-2xl text-primary mb-3">
            <BarChart3 className="h-7 w-7" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
            Public Statistics
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Anonymous real-time redirection analysis page
          </p>
        </div>

        {/* URL Card Summary */}
        <div className="bg-card border border-border p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
          {/* Status Badge */}
          <div className="absolute top-6 right-6">
            {isExpired ? (
              <span className="bg-rose-500/10 text-rose-500 text-xs font-bold tracking-wider px-3 py-1 rounded-full uppercase">
                Expired
              </span>
            ) : (
              <span className="bg-emerald-500/10 text-emerald-500 text-xs font-bold tracking-wider px-3 py-1 rounded-full uppercase">
                Active
              </span>
            )}
          </div>

          <div className="space-y-6">
            {/* Header branding */}
            <div className="flex items-center space-x-2 text-primary">
              <Link2 className="h-5 w-5" />
              <span className="font-extrabold tracking-tight text-foreground text-sm uppercase">Link Properties</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: URLs */}
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">Short Link</span>
                  <a 
                    href={fullShortUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xl font-extrabold text-primary hover:underline flex items-center space-x-1.5 break-all"
                  >
                    <span>{fullShortUrl.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink className="h-4 w-4 shrink-0" />
                  </a>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">Destination URL</span>
                  <p className="text-sm text-foreground/80 font-medium break-all line-clamp-2" title={data.longUrl}>
                    {data.longUrl}
                  </p>
                </div>
              </div>

              {/* Right Column: Metadata */}
              <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-2xl border border-border/40">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>Created On</span>
                  </span>
                  <p className="text-sm font-semibold text-foreground">{formatDate(data.createdAt)}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center space-x-1">
                    <Globe className="h-3 w-3" />
                    <span>Total Redirects</span>
                  </span>
                  <p className="text-lg font-black text-primary">{data.clicksCount}</p>
                </div>

                {data.expiryDate && (
                  <div className="col-span-2 space-y-1 border-t border-border/30 pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>Expiration Timestamp</span>
                    </span>
                    <p className={`text-sm font-semibold ${isExpired ? 'text-rose-500' : 'text-foreground'}`}>
                      {formatDate(data.expiryDate)} {isExpired && '(Expired)'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Daily Trend Chart */}
        <div className="bg-card border border-border p-6 rounded-3xl shadow-xl">
          <h3 className="text-lg font-bold text-foreground mb-4">Redirect Frequency (Last 30 Days)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} textAnchor="middle" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '16px',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="clicks"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 1 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

// Loader Indicator helper
const Loader2 = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`animate-spin ${className}`}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default PublicStats;
