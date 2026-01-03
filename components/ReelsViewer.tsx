'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { StudyCard } from '@/app/actions/pdf';
import PDFViewer from '@/components/PDFViewer';

// 텍스트 포맷팅 함수: **단어**는 박스 처리, __표현__은 밑줄 처리
function formatContent(text: string) {
  // __표현__ 형식 처리 (밑줄)
  let formatted = text.replace(/__([^__]+)__/g, '<span class="underline decoration-2 decoration-purple-400">$1</span>');
  
  // **단어** 형식 처리 (박스 + 두꺼운 글씨)
  // 줄간격 겹침 방지를 위해 padding과 margin 조정
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<span class="inline-block px-1.5 py-0.5 my-0.5 bg-purple-500/20 border border-purple-500/50 rounded font-bold leading-tight align-middle">$1</span>');
  
  return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
}

interface ReelsViewerProps {
  cards: StudyCard[];
  pdfFile: File | null;
  onReset: () => void;
}

export default function ReelsViewer({ cards, pdfFile, onReset }: ReelsViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const cardHeight = container.clientHeight;
      const newIndex = Math.round(scrollTop / cardHeight);
      setCurrentIndex(newIndex);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToCard = (index: number) => {
    setCurrentIndex(index);
    const container = containerRef.current;
    if (container) {
      const cardHeight = container.clientHeight;
      container.scrollTo({
        top: index * cardHeight,
        behavior: 'smooth',
      });
    }
  };

  // 터치 이벤트 처리 (모바일) - 텍스트 박스 외부에서만 작동
  const handleTouchStart = (e: React.TouchEvent) => {
    // 텍스트 박스 내부가 아닌 경우에만 처리
    const target = e.target as HTMLElement;
    const isContentArea = target.closest('.content-area');
    if (!isContentArea) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // 텍스트 박스 내부가 아닌 경우에만 처리
    const target = e.target as HTMLElement;
    const isContentArea = target.closest('.content-area');
    if (isContentArea) return;

    touchEndY.current = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentIndex < cards.length - 1) {
        scrollToCard(currentIndex + 1);
      } else if (diff < 0 && currentIndex > 0) {
        scrollToCard(currentIndex - 1);
      }
    }
  };

  return (
    <div className="h-[100svh] w-full bg-black overflow-hidden relative">
      {/* 상단 리셋 버튼 */}
      <button
        onClick={onReset}
        className="absolute top-4 right-4 z-50 p-3 rounded-full bg-gray-800/80 hover:bg-gray-700/80 transition-colors backdrop-blur-sm"
        aria-label="다시 시작"
      >
        <RotateCcw className="w-5 h-5 text-white" />
      </button>

      {/* 카드 컨테이너 */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{
          scrollBehavior: 'smooth',
        }}
      >
        {cards.map((card, index) => (
          <Card
            key={index}
            card={card}
            index={index}
            isActive={index === currentIndex}
            totalCards={cards.length}
            pdfFile={pdfFile}
            onScrollTo={() => scrollToCard(index)}
          />
        ))}
      </div>

      {/* 인디케이터 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
        {cards.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToCard(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-purple-500 w-8'
                : 'bg-gray-600 hover:bg-gray-500'
            }`}
            aria-label={`카드 ${index + 1}로 이동`}
          />
        ))}
      </div>
    </div>
  );
}

interface CardProps {
  card: StudyCard;
  index: number;
  isActive: boolean;
  totalCards: number;
  pdfFile: File | null;
  onScrollTo: () => void;
}

function Card({ card, index, isActive, totalCards, pdfFile }: CardProps) {
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchStartScrollTop = useRef<number>(0);

  const handlePageClick = () => {
    if (card.pageNumber && pdfFile) {
      setIsPdfViewerOpen(true);
    }
  };

  // 텍스트 박스 내부 터치 시작
  const handleContentTouchStart = (e: React.TouchEvent) => {
    if (contentRef.current) {
      touchStartY.current = e.touches[0].clientY;
      touchStartScrollTop.current = contentRef.current.scrollTop;
      e.stopPropagation(); // 카드 스크롤로 전파 방지
    }
  };

  // 텍스트 박스 내부 터치 이동
  const handleContentTouchMove = (e: React.TouchEvent) => {
    if (!contentRef.current) return;

    const touchY = e.touches[0].clientY;
    const diff = touchStartY.current - touchY;
    const scrollTop = contentRef.current.scrollTop;
    const scrollHeight = contentRef.current.scrollHeight;
    const clientHeight = contentRef.current.clientHeight;

    // 스크롤 가능 여부 확인
    const canScrollUp = scrollTop > 0;
    const canScrollDown = scrollTop < scrollHeight - clientHeight - 1;

    // 위로 스크롤하려고 할 때
    if (diff < 0 && canScrollUp) {
      e.stopPropagation(); // 카드 스크롤 방지
      return;
    }

    // 아래로 스크롤하려고 할 때
    if (diff > 0 && canScrollDown) {
      e.stopPropagation(); // 카드 스크롤 방지
      return;
    }

    // 스크롤이 끝에 도달했을 때만 카드 스크롤 허용
    if ((diff < 0 && !canScrollUp) || (diff > 0 && !canScrollDown)) {
      // 카드 스크롤 허용 (stopPropagation 호출 안 함)
    }
  };

  // 텍스트 박스 내부 휠 이벤트 처리
  const handleContentWheel = (e: React.WheelEvent) => {
    if (!contentRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const deltaY = e.deltaY;

    // 위로 스크롤
    if (deltaY < 0 && scrollTop > 0) {
      e.stopPropagation(); // 카드 스크롤 방지
      return;
    }

    // 아래로 스크롤
    if (deltaY > 0 && scrollTop < scrollHeight - clientHeight - 1) {
      e.stopPropagation(); // 카드 스크롤 방지
      return;
    }

    // 스크롤이 끝에 도달했을 때만 카드 스크롤 허용
  };

  return (
    <div className="h-[100svh] w-full snap-start flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full max-w-md mx-auto bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl border border-gray-700 flex flex-col h-[95vh] max-h-[95vh]"
      >
        {/* 이모지와 제목 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mb-4 flex-shrink-0"
        >
          <div className="text-4xl md:text-6xl mb-3">{card.emoji}</div>
          <h2 className="text-3xl font-bold text-white mb-2">{card.title}</h2>
          {card.pageNumber && (
            <button
              onClick={handlePageClick}
              className="text-gray-500 hover:text-purple-400 text-sm mt-2 transition-colors cursor-pointer underline decoration-dotted"
            >
              페이지 {card.pageNumber}
            </button>
          )}
        </motion.div>

        {/* 본문 */}
        <motion.div
          ref={contentRef}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="content-area mb-6 flex-1 overflow-y-auto"
          onTouchStart={handleContentTouchStart}
          onTouchMove={handleContentTouchMove}
          onWheel={handleContentWheel}
        >
          <div className="text-gray-200 text-base md:text-[1.5rem] leading-relaxed">
            {card.content.split('\n').map((line, i) => 
              line.trim() ? (
                <p key={i} className="mb-4 last:mb-0 leading-[1.8]">
                  {formatContent(line.trim())}
                </p>
              ) : null
            )}
          </div>
        </motion.div>

        {/* 다음 카드 유도 화살표 */}
        {isActive && index < totalCards - 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex justify-center"
          >
            <motion.div
              animate={{
                y: [0, 10, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <ChevronDown className="w-8 h-8 text-gray-500" />
            </motion.div>
          </motion.div>
        )}
      </motion.div>

      {/* PDF 뷰어 모달 */}
      {card.pageNumber && (
        <PDFViewer
          file={pdfFile}
          pageNumber={card.pageNumber}
          isOpen={isPdfViewerOpen}
          onClose={() => setIsPdfViewerOpen(false)}
        />
      )}
    </div>
  );
}

