'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface PDFViewerProps {
  file: File | null;
  pageNumber: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function PDFViewer({ file, pageNumber, isOpen, onClose }: PDFViewerProps) {
  const [scale, setScale] = useState(1.0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(pageNumber);

  useEffect(() => {
    if (file && isOpen) {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      setCurrentPage(pageNumber);
      setScale(1.0);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file, isOpen, pageNumber]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleResetZoom = () => {
    setScale(1.0);
  };

  if (!isOpen || !pdfUrl) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-gray-900 rounded-lg shadow-2xl w-full h-full max-w-7xl max-h-[95vh] flex flex-col"
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-4">
              <h3 className="text-white font-semibold">
                페이지 {currentPage}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleZoomOut}
                  className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                  aria-label="축소"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <span className="text-gray-400 text-sm min-w-[60px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                  aria-label="확대"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                  aria-label="확대/축소 리셋"
                >
                  <RotateCw className="w-5 h-5" />
                </button>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* PDF 뷰어 */}
          <div className="flex-1 overflow-auto bg-gray-800 p-4">
            <div className="flex justify-center items-start min-h-full">
              <div
                className="relative"
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: 'top center',
                  width: `${100 / scale}%`,
                  height: `${100 / scale}%`,
                }}
              >
                <iframe
                  src={`${pdfUrl}#page=${currentPage}`}
                  className="w-full h-full min-h-[600px] border-0 rounded"
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

