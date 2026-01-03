'use client';

import { useState } from 'react';
import { Upload, Sparkles } from 'lucide-react';
import PDFUploader from '@/components/PDFUploader';
import ReelsViewer from '@/components/ReelsViewer';
import LoadingScreen from '@/components/LoadingScreen';
import { StudyCard } from '@/app/actions/pdf';

export default function Home() {
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const handleCardsGenerated = (generatedCards: StudyCard[], file: File) => {
    setCards(generatedCards);
    setPdfFile(file);
    setIsLoading(false);
    setError(null); // 성공 시 에러 초기화
  };

  const handleUploadStart = () => {
    setIsLoading(true);
    setCards([]);
    setPdfFile(null);
    setError(null); // 새 업로드 시작 시 에러 초기화
  };

  const handleReset = () => {
    setCards([]);
    setPdfFile(null);
    setIsLoading(false);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setIsLoading(false);
    setError(errorMessage);
    setCards([]);
    setPdfFile(null);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (cards.length > 0) {
    return <ReelsViewer cards={cards} pdfFile={pdfFile} onReset={handleReset} />;
  }

  return (
    <main className="min-h-[100svh] bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto text-center space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            AI Study Reels
          </h1>
          <p className="text-gray-400 text-lg">
            PDF를 업로드하면 AI가 핵심 개념을<br />
            릴스 스타일 학습 카드로 만들어드립니다
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-4">
            <p className="text-red-400 text-sm whitespace-pre-line">{error}</p>
          </div>
        )}

        <PDFUploader
          onUploadStart={handleUploadStart}
          onCardsGenerated={handleCardsGenerated}
          onError={handleError}
        />
      </div>
    </main>
  );
}

