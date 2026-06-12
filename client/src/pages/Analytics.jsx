import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/api';
import { useToast } from '../context/ToastContext';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { ArrowLeft, BarChart3, Globe, Laptop, Monitor, Calendar, Share2, Clipboard, QrCode } from 'lucide-react';
import QRModal from '../components/QRModal';

// Colors for Pie Charts
const CHART_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];

const Analytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shortUrl, setShortUrl] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [qrOpen, setQrOpen] = useState(false);

  // Fetch detailed URL analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [analyticsRes, urlsRes] = await Promise.all([
          api.get(`/api/analytics/${id}`),
          api.get('/api/urls')
        ]);

        setData(analyticsRes.data);
        
        // Find corresponding short URL to build helper links
        const urlObj = urlsRes.data.find(u => u.id === id);
        if (urlObj) {
          setShortUrl(urlObj.shortUrl);
          setShortCode(urlObj.shortCode);
        }
      } catch (error) {
        console.error('Fetch analytics error:', error);
        showToast('Failed to load analytics or unauthorized access', 'error');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [id, navigate]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard!', 'success');
    } catch (err) {
      showToast('Failed to copy text', 'error');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm font-semibold text-muted-foreground">Generating aggregate report...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative">
      {/* Decorative Glow */}
      <div className="glow-purple -top-10 left-10" />
      <div className="glow-blue top-80 right-20" />

      {/* Header / Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-10 relative">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all shadow-sm"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div>
            <h2 className="text-2xl font-extrabold text-foreground flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <span>Link Analytics</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Real-time redirect metrics and user-agent data
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Public Stats Page Link */}
          {shortCode && (
            <Link
              to={`/stats/${shortCode}`}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-secondary hover:bg-muted border border-border text-foreground hover:text-foreground/90 text-sm font-semibold rounded-xl transition-all shadow-sm"
            >
              <Share2 className="h-4 w-4 text-primary" />
              <span>Public Stats Page</span>
            </Link>
          )}

          {/* QR trigger */}
          <button
            onClick={() => setQrOpen(true)}
            className="p-2.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-all shadow-sm"
            title="QR Code"
          >
            <QrCode className="h-4.5 w-4.5" />
          </button>

          {/* Copy Button */}
          {shortUrl && (
            <button
              onClick={() => copyToClipboard(shortUrl)}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 text-sm font-semibold rounded-xl transition-all shadow-md shadow-primary/15"
            >
              <Clipboard className="h-4 w-4" />
              <span>Copy Link</span>
            </button>
          )}
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
        {/* Total Clicks */}
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Click Redirects</p>
          <h3 className="text-4xl font-extrabold text-foreground mt-2">{data.totalClicks}</h3>
          <span className="text-xs text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full mt-2 inline-block">
            Active
          </span>
        </div>

        {/* Last Visited */}
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Last Visited Timestamp</p>
          <h3 className="text-lg font-bold text-foreground mt-4">
            {data.lastVisited ? formatDate(data.lastVisited) : 'No visits recorded yet'}
          </h3>
          <p className="text-xs text-muted-foreground mt-2">
            Updated just now
          </p>
        </div>
      </div>

      {/* Click Trend Chart */}
      <div className="bg-card border border-border p-6 rounded-3xl shadow-lg relative z-10">
        <h3 className="text-lg font-bold text-foreground mb-4">Click Frequency Trend (Last 30 Days)</h3>
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

      {/* User Agent Distribution Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {/* Browser Dist */}
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 flex items-center space-x-1.5">
            <Globe className="h-4 w-4 text-primary" />
            <span>Browsers</span>
          </h3>
          <div className="h-48 flex-1">
            {data.distributions.browsers.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.distributions.browsers}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.distributions.browsers.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No Browser Data</div>
            )}
          </div>
          {/* Custom Legends */}
          <div className="space-y-1 mt-4">
            {data.distributions.browsers.slice(0, 3).map((item, idx) => (
              <div key={item.name} className="flex justify-between items-center text-xs">
                <span className="flex items-center space-x-1.5 text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                  <span>{item.name}</span>
                </span>
                <span className="font-bold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Devices Dist */}
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 flex items-center space-x-1.5">
            <Laptop className="h-4 w-4 text-emerald-500" />
            <span>Devices</span>
          </h3>
          <div className="h-48 flex-1">
            {data.distributions.devices.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.distributions.devices}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.distributions.devices.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No Device Data</div>
            )}
          </div>
          {/* Custom Legends */}
          <div className="space-y-1 mt-4">
            {data.distributions.devices.slice(0, 3).map((item, idx) => (
              <div key={item.name} className="flex justify-between items-center text-xs">
                <span className="flex items-center space-x-1.5 text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: CHART_COLORS[(idx + 2) % CHART_COLORS.length] }} />
                  <span>{item.name}</span>
                </span>
                <span className="font-bold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* OS Dist */}
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 flex items-center space-x-1.5">
            <Monitor className="h-4 w-4 text-indigo-500" />
            <span>Operating Systems</span>
          </h3>
          <div className="h-48 flex-1">
            {data.distributions.os.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.distributions.os}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.distributions.os.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 4) % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No OS Data</div>
            )}
          </div>
          {/* Custom Legends */}
          <div className="space-y-1 mt-4">
            {data.distributions.os.slice(0, 3).map((item, idx) => (
              <div key={item.name} className="flex justify-between items-center text-xs">
                <span className="flex items-center space-x-1.5 text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: CHART_COLORS[(idx + 4) % CHART_COLORS.length] }} />
                  <span>{item.name}</span>
                </span>
                <span className="font-bold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visitor Click History Logs */}
      <div className="bg-card border border-border rounded-3xl shadow-md overflow-hidden relative z-10">
        <div className="px-6 py-4 border-b border-border bg-muted/40">
          <h3 className="text-base font-bold text-foreground">Recent Visits Log (Last 10)</h3>
        </div>
        <div className="overflow-x-auto">
          {data.recentVisits.length > 0 ? (
            <table className="min-w-full divide-y divide-border/60 text-left text-sm">
              <thead className="bg-muted/20 text-muted-foreground text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">IP Address</th>
                  <th className="px-6 py-3.5">OS</th>
                  <th className="px-6 py-3.5">Browser</th>
                  <th className="px-6 py-3.5">Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 bg-card text-foreground/80 font-medium">
                {data.recentVisits.map((click, idx) => (
                  <tr key={idx} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(click.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-foreground">{click.ip}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{click.os}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{click.browser}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="bg-primary/5 text-primary text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {click.device}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No clicks registered yet. Share your link to start tracking!
            </div>
          )}
        </div>
      </div>

      {/* Loader helper */}
      <Loader2 className="hidden" />

      {/* QR Modal render */}
      <QRModal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        shortUrl={shortUrl}
        shortCode={shortCode}
      />
    </div>
  );
};

// Helper Loader2 component declaration for loading state fallback
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

export default Analytics;
