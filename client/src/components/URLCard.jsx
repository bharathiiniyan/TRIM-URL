import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { Copy, Check, BarChart3, QrCode, Trash2, Calendar, Clock, ExternalLink, HelpCircle } from 'lucide-react';

const URLCard = ({ url, onDelete, onOpenQR }) => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url.shortUrl);
      setCopied(true);
      showToast('Copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showToast('Failed to copy link', 'error');
    }
  };

  const isExpired = url.expiryDate ? new Date(url.expiryDate) < new Date() : false;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="group relative bg-card hover:bg-card/85 border border-border/70 hover:border-primary/30 p-5 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 shine-hover">
      
      {/* Expiry / Status Badge */}
      <div className="absolute top-5 right-5 flex space-x-2">
        {url.customAlias && (
          <span className="bg-primary/10 text-primary text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase">
            Alias
          </span>
        )}
        {isExpired ? (
          <span className="bg-rose-500/10 text-rose-500 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase">
            Expired
          </span>
        ) : url.expiryDate ? (
          <span className="bg-amber-500/10 text-amber-500 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase">
            Expires Soon
          </span>
        ) : null}
      </div>

      {/* Main Info */}
      <div className="space-y-4">
        {/* original URL (truncated) */}
        <div className="max-w-[85%]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">Original URL</span>
          <div className="relative group/tooltip">
            <p className="text-sm text-foreground/80 font-medium truncate max-w-xs sm:max-w-sm md:max-w-md lg:max-w-xs">
              {url.longUrl}
            </p>
            {/* Tooltip */}
            <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block bg-slate-900 dark:bg-slate-950 text-white text-xs rounded-xl p-3 shadow-xl max-w-sm break-all z-20 transition-all duration-200">
              {url.longUrl}
            </div>
          </div>
        </div>

        {/* Shortened URL */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">Short Link</span>
          <div className="flex items-center space-x-2">
            <a
              href={url.shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base sm:text-lg font-bold text-primary hover:underline hover:text-primary/95 flex items-center space-x-1.5 break-all"
            >
              <span>{url.shortUrl.replace(/^https?:\/\//, '')}</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-60 shrink-0" />
            </a>
          </div>
        </div>

        {/* URL Metadata Badges */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-2 border-t border-border/50 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(url.createdAt)}</span>
          </div>
          {url.expiryDate && (
            <div className={`flex items-center space-x-1 ${isExpired ? 'text-rose-500' : ''}`}>
              <Clock className="h-3.5 w-3.5" />
              <span>Exp: {formatDate(url.expiryDate)}</span>
            </div>
          )}
          <div className="ml-auto flex items-center space-x-1">
            <span className="bg-primary/5 dark:bg-primary/10 text-primary font-extrabold px-3 py-1 rounded-full text-xs shadow-sm">
              {url.clicksCount} clicks
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-border/30">
          <div className="flex items-center space-x-2">
            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all shadow-sm"
              title="Copy Short URL"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-500 animate-in zoom-in-75 duration-200" /> : <Copy className="h-4 w-4" />}
            </button>

            {/* QR Code trigger */}
            <button
              onClick={() => onOpenQR(url.shortUrl, url.shortCode)}
              className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all shadow-sm"
              title="QR Code"
            >
              <QrCode className="h-4 w-4" />
            </button>

            {/* View Analytics */}
            <button
              onClick={() => navigate(`/analytics/${url.id}`)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-secondary hover:bg-muted border border-border text-foreground hover:text-foreground/90 text-xs font-semibold transition-all shadow-sm"
            >
              <BarChart3 className="h-4 w-4 text-primary" />
              <span>Analytics</span>
            </button>
          </div>

          {/* Delete Button / Confirmation */}
          <div className="relative">
            {confirmDelete ? (
              <div className="flex items-center space-x-1.5 animate-in slide-in-from-right-3 duration-200 z-10">
                <button
                  onClick={() => onDelete(url.id)}
                  className="px-2.5 py-1.5 bg-rose-500 text-white rounded-lg text-xs font-bold hover:bg-rose-600 transition-colors shadow-sm"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-1.5 border border-border bg-card text-muted-foreground rounded-lg text-xs font-semibold hover:bg-muted hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-2 rounded-xl border border-border hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 hover:border-rose-500/25 transition-all shadow-sm"
                title="Delete Link"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default URLCard;
