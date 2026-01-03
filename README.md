# AI Study Reels - 학습 카드 생성기

PDF를 업로드하면 AI가 핵심 개념을 인스타그램 릴스 스타일의 학습 카드로 변환해주는 웹 애플리케이션입니다.

## 🚀 주요 기능

- **PDF 업로드**: 드래그 앤 드롭 또는 클릭으로 PDF 파일 업로드
- **AI 요약**: Google Gemini 1.5 Flash를 활용한 지능형 핵심 개념 추출
- **릴스 스타일 UI**: 모바일 퍼스트 디자인의 수직 스크롤 카드 뷰
- **부드러운 애니메이션**: Framer Motion을 활용한 세련된 전환 효과

## 📋 사전 요구사항

- Node.js 18 이상
- npm 또는 yarn
- Google Gemini API 키

## 🛠️ 설치 방법

1. 프로젝트 클론 또는 다운로드

2. 의존성 설치:
```bash
npm install
```

3. 환경 변수 설정:
`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Google Gemini API 키는 [Google AI Studio](https://makersuite.google.com/app/apikey)에서 발급받을 수 있습니다.

## 🎯 실행 방법

개발 서버 실행:
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 📱 사용 방법

1. 메인 화면에서 PDF 파일을 드래그 앤 드롭하거나 클릭하여 업로드
2. AI가 PDF를 분석하여 학습 카드를 생성하는 동안 잠시 대기
3. 생성된 카드를 수직 스크롤로 탐색
4. 각 카드에는 핵심 개념, 요약 내용, 키워드가 포함됩니다

## 🎨 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **AI Model**: Google Gemini 1.5 Flash
- **PDF Parsing**: pdf-parse
- **Icons**: Lucide React

## 📝 주요 특징

- 모바일 퍼스트 디자인 (최대 너비 480px 권장)
- 수직 스크롤 스냅으로 한 번에 한 카드씩 표시
- 다크 모드 기반 UI로 가독성 향상
- 카드 진입 시 순차적 페이드인 애니메이션
- 터치 제스처 지원 (모바일)

## ⚠️ 주의사항

- PDF 파일 크기는 최대 10MB까지 지원
- 텍스트가 4000자 이상인 경우 자동으로 요약 처리
- 생성되는 카드는 5~10개로 제한됩니다

## 📄 라이선스

이 프로젝트는 개인 학습 목적으로 제작되었습니다.

