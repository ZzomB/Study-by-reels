'use client';

import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { processPDF, StudyCard } from '@/app/actions/pdf';

interface PDFUploaderProps {
  onUploadStart: () => void;
  onCardsGenerated: (cards: StudyCard[], file: File) => void;
  onError: (errorMessage: string) => void;
}

export default function PDFUploader({ onUploadStart, onCardsGenerated, onError }: PDFUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    // 파일 타입 체크 (더 유연하게)
    const isValidPDF = file.type === 'application/pdf' || 
                       file.name.toLowerCase().endsWith('.pdf') ||
                       file.type === '';
    
    if (!isValidPDF) {
      setError('PDF 파일만 업로드 가능합니다.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    if (file.size === 0) {
      setError('빈 파일은 업로드할 수 없습니다.');
      return;
    }

    setError(null);
    onUploadStart();

    try {
      console.log('파일 업로드 시작:', file.name, file.size, 'bytes');
      
      // FormData로 변환하여 서버 액션에 전달
      // Next.js 서버 액션은 File 객체를 직접 받을 수 없으므로 FormData를 사용해야 합니다
      const formData = new FormData();
      formData.append('file', file);
      
      const cards = await processPDF(formData);
      console.log('카드 생성 완료:', cards.length, '개');
      onCardsGenerated(cards, file);
    } catch (err) {
      console.error('파일 처리 오류:', err);
      const errorMessage = err instanceof Error ? err.message : 'PDF 처리 중 오류가 발생했습니다.';
      setError(errorMessage);
      onError(errorMessage); // 에러 메시지와 함께 로딩 상태 해제
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // 입력 리셋 (같은 파일을 다시 선택할 수 있도록)
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 cursor-pointer
          transition-all duration-300
          ${isDragging 
            ? 'border-purple-500 bg-purple-500/10 scale-105' 
            : 'border-gray-700 hover:border-gray-600 hover:bg-gray-900/50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileInput}
          className="hidden"
        />
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className={`
            p-4 rounded-full transition-colors
            ${isDragging ? 'bg-purple-500' : 'bg-gray-800'}
          `}>
            <Upload className={`w-8 h-8 ${isDragging ? 'text-white' : 'text-gray-400'}`} />
          </div>
          
          <div className="text-center space-y-2">
            <p className="text-white font-medium text-lg">
              {isDragging ? '여기에 파일을 놓으세요' : 'PDF 파일을 드래그하거나 클릭하세요'}
            </p>
            <p className="text-gray-500 text-sm">
              최대 10MB까지 업로드 가능
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
          <X className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}

