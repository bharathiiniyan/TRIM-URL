import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Download, QrCode } from 'lucide-react';

const QRModal = ({ isOpen, onClose, shortUrl, shortCode }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isOpen && canvasRef.current && shortUrl) {
      QRCode.toCanvas(
        canvasRef.current,
        shortUrl,
        {
          width: 240,
          margin: 2,
          color: {
            dark: '#1e1b4b', // Deep indigo text color
            light: '#ffffff'
          },
          errorCorrectionLevel: 'H' // High reliability level
        },
        (error) => {
          if (error) console.error('Error generating QR code:', error);
        }
      );
    }
  }, [isOpen, shortUrl]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `trimurl-qr-${shortCode}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
          <div className="flex items-center space-x-2 text-primary">
            <QrCode className="h-5 w-5" />
            <h3 className="text-lg font-bold text-foreground">QR Code Generator</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* QR Code Canvas */}
        <div className="flex flex-col items-center justify-center bg-white p-6 rounded-2xl border border-border/50 shadow-inner">
          <canvas ref={canvasRef} className="max-w-full rounded-lg" />
        </div>

        {/* Short Code Metadata */}
        <div className="mt-5 text-center">
          <p className="text-sm font-semibold text-muted-foreground">Short Link</p>
          <a 
            href={shortUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary font-bold hover:underline break-all"
          >
            {shortUrl}
          </a>
        </div>

        {/* Action Button */}
        <div className="mt-6 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted text-foreground transition-all"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/95 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-md shadow-primary/10"
          >
            <Download className="h-4 w-4" />
            <span>Download PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRModal;
