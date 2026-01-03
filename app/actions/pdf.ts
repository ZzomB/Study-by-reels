'use server';

import pdfParse from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';

export type StudyCard = {
  title: string;
  content: string;
  emoji: string;
  pageNumber?: number; // PDF 페이지 번호 (선택적)
};

export async function processPDF(formData: FormData): Promise<StudyCard[]> {
  // 공식 문서 기준 무료 등급에서 사용 가능한 모델 목록
  // https://ai.google.dev/gemini-api/docs 참고
  // gemini-1.5-flash는 v1beta에서 작동하지 않으므로 gemini-2.5-flash를 우선 사용
  const availableModels = [
    'gemini-2.5-flash', // 공식 문서 예제 모델 (무료 등급, v1beta 지원)
    'gemini-1.5-pro', // Pro 버전
    'gemini-pro', // 구버전
    // gemini-1.5-flash는 제거 (v1beta에서 404 에러 발생)
  ];

  // 환경 변수로 지정된 모델이 있더라도 gemini-2.5-flash를 우선 사용
  // (gemini-1.5-flash는 v1beta에서 작동하지 않음)
  const preferredModel = process.env.GEMINI_MODEL;

  // gemini-1.5-flash가 설정되어 있어도 무시하고 gemini-2.5-flash를 우선 사용
  if (preferredModel === 'gemini-1.5-flash') {
    console.log(
      '⚠️ gemini-1.5-flash는 v1beta에서 작동하지 않습니다. gemini-2.5-flash를 사용합니다.'
    );
  }

  const modelsToTry =
    preferredModel && preferredModel !== 'gemini-1.5-flash'
      ? [preferredModel, ...availableModels.filter((m) => m !== preferredModel)]
      : availableModels;

  try {
    // FormData에서 파일 추출
    const file = formData.get('file') as File | null;

    if (!file) {
      throw new Error('파일이 업로드되지 않았습니다.');
    }

    // File 객체 검증
    if (!(file instanceof File)) {
      throw new Error('유효하지 않은 파일 형식입니다.');
    }

    console.log('PDF 처리 시작:', file.name, file.size, 'bytes');

    // PDF 텍스트 추출
    const arrayBuffer = await file.arrayBuffer();
    // Buffer.from() 사용 (deprecated 경고 해결)
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      throw new Error('PDF 파일이 비어있습니다.');
    }

    console.log('PDF 파싱 중...');
    let data;
    try {
      data = await pdfParse(buffer);
    } catch (parseError) {
      console.error('PDF 파싱 오류:', parseError);
      throw new Error(
        'PDF 파일을 읽을 수 없습니다. 파일이 손상되었거나 지원되지 않는 형식일 수 있습니다.'
      );
    }

    if (!data || !data.text || data.text.trim().length === 0) {
      throw new Error(
        'PDF에서 텍스트를 추출할 수 없습니다. 이미지로만 구성된 PDF일 수 있습니다.'
      );
    }

    console.log('추출된 텍스트 길이:', data.text.length);

    let text = data.text;

    // 텍스트가 너무 길 경우 (4000자 이상) 핵심 부분만 추출
    if (text.length > 4000) {
      // 앞부분과 뒷부분을 합쳐서 4000자로 제한
      const halfLength = 2000;
      text =
        text.substring(0, halfLength) +
        '\n\n...\n\n' +
        text.substring(text.length - halfLength);
    }

    // Gemini API 호출
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인해주세요.'
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    console.log(`시도할 모델 목록: ${modelsToTry.join(', ')}`);
    console.log(`환경 변수 모델: ${preferredModel || '없음'}`);

    let model;
    let workingModel: string | null = null;

    // 첫 번째 모델로 시작 (실제 API 호출에서 실패하면 대체 모델 시도)
    workingModel = modelsToTry[0];

    // 공식 문서에 따르면 모델 이름만 전달하면 됨
    // @google/generative-ai SDK는 자동으로 올바른 API 버전을 사용함
    model = genAI.getGenerativeModel({ model: workingModel });
    console.log(`초기 모델 선택: ${workingModel}`);

    const prompt = `다음은 학습용 PDF에서 추출한 텍스트입니다. 이 내용을 분석하여 시험에 잘 나올법한 핵심 개념을 5~10개의 학습 카드로 만들어주세요.

각 카드는 다음 형식의 JSON 배열로 응답해주세요:
[
  {
    "title": "짧고 강렬한 제목 (10자 이내)",
    "content": "상세한 설명 내용 (여러 문단으로 구성)",
    "emoji": "관련 이모지 하나",
    "pageNumber": 해당_내용이_나오는_대략적인_페이지_번호_또는_null
  }
]

중요한 요구사항:
- 반드시 유효한 JSON 배열 형식으로만 응답하세요
- 다른 설명이나 텍스트는 포함하지 마세요
- title은 짧고 기억하기 쉬운 제목으로 작성하세요
- content는 다음을 반드시 준수하세요:
  * 3~5문장 정도로 적절한 길이로 작성하세요 (너무 길지 않게)
  * 반드시 여러 문단으로 나누어 작성하세요 (줄바꿈 문자 \\n 사용)
  * 각 문단은 2~3문장으로 구성하세요
  * 다음 형식 중 적절한 것을 선택하여 작성:
    - 단어/개념 정의: "개념명은 ...를 의미한다. ..."
    - 설명 형식: "이 개념은 ...와 관련이 있다. ..."
    - 요약 형식: "핵심 내용을 상세하게 설명"
    - 비교 형식: "A와 B의 차이점은 ..."
    - 예시 포함: "예를 들어, ..."
  * 중요한 용어나 개념은 명확하게 정의하고 설명하세요
  * 각 문단은 명확하고 독립적으로 읽을 수 있어야 합니다
  * 중요 단어는 **단어** 형식으로 감싸주세요 (예: **방사면역측정법**)
  * 중요한 표현이나 서술은 __표현__ 형식으로 감싸주세요 (예: __정확하게 측정__)
- pageNumber는 해당 내용이 PDF의 어느 부분에 나오는지 추정하여 숫자로 제공하세요 (정확하지 않아도 괜찮습니다)
- pageNumber를 추정할 수 없으면 null을 사용하세요

PDF 내용:
${text}`;

    console.log('Gemini API 호출 중...');
    let result;
    let response;
    let responseText: string | undefined;

    try {
      result = await model.generateContent(prompt);
      response = await result.response;
      responseText = response.text();
      console.log(
        `✅ Gemini API 응답 받음 (모델: ${workingModel}), 길이: ${responseText.length}`
      );
    } catch (apiError: any) {
      console.error('Gemini API 호출 오류:', apiError);
      console.error('에러 상세:', {
        status: apiError?.status,
        statusText: apiError?.statusText,
        message: apiError?.message,
        errorDetails: apiError?.errorDetails,
      });

      // 404 에러인 경우 모델 이름 문제 - 다른 모델로 재시도
      if (apiError?.status === 404) {
        // 다른 모델로 재시도
        const fallbackModels = modelsToTry.filter((m) => m !== workingModel);
        console.log(
          `모델 "${workingModel}" 실패 (404), 다른 모델 시도: ${fallbackModels.join(
            ', '
          )}`
        );

        responseText = undefined; // 초기화

        for (const fallbackModel of fallbackModels) {
          try {
            console.log(`대체 모델 시도: ${fallbackModel}`);
            const fallbackModelInstance = genAI.getGenerativeModel({
              model: fallbackModel,
            });
            const fallbackResult = await fallbackModelInstance.generateContent(
              prompt
            );
            const fallbackResponse = await fallbackResult.response;
            const fallbackResponseText = fallbackResponse.text();

            console.log(`✅ 대체 모델 "${fallbackModel}" 성공!`);
            responseText = fallbackResponseText;
            workingModel = fallbackModel;
            break;
          } catch (fallbackError: any) {
            console.warn(
              `❌ 대체 모델 "${fallbackModel}" 실패:`,
              fallbackError?.message || fallbackError
            );
            continue;
          }
        }

        // 모든 모델 시도 실패
        if (!responseText) {
          // 근본적인 해결: modelsToTry 참조를 완전히 제거하고 하드코딩된 메시지 사용
          // Next.js 서버 액션의 직렬화 제약을 피하기 위해
          throw new Error(
            '모든 Gemini 모델 시도 실패. API 키와 모델 설정을 확인하세요. ' +
              'Google AI Studio에서 사용 가능한 모델을 확인하고 .env.local의 GEMINI_API_KEY를 확인하세요.'
          );
        }
      } else {
        // 404가 아닌 다른 에러 처리
        // API 키 문제
        if (apiError?.status === 401 || apiError?.status === 403) {
          throw new Error(
            'Gemini API 키가 유효하지 않습니다. .env.local 파일의 GEMINI_API_KEY를 확인해주세요.'
          );
        }

        // Rate limit 에러 (무료 등급에서 흔함)
        if (apiError?.status === 429) {
          throw new Error(
            'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요. (무료 등급: 일일 요청 한도 제한)'
          );
        }

        // 기타 에러
        const errorMessage = apiError?.message || '알 수 없는 오류';
        throw new Error(
          `Gemini API 호출 실패: ${errorMessage}\n모델: ${workingModel}`
        );
      }
    }

    // responseText가 없으면 에러
    if (!responseText) {
      throw new Error('Gemini API로부터 응답을 받지 못했습니다.');
    }

    // JSON 파싱 시도
    let cards: StudyCard[];
    try {
      // 응답에서 JSON 부분만 추출 (마크다운 코드 블록 제거)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        cards = JSON.parse(jsonMatch[0]);
      } else {
        cards = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      console.error('응답 텍스트:', responseText);
      throw new Error('AI 응답을 파싱하는 중 오류가 발생했습니다.');
    }

    // 카드 개수 검증
    if (!Array.isArray(cards) || cards.length === 0) {
      throw new Error('생성된 카드가 없습니다.');
    }

    // 카드 개수를 10개로 제한
    if (cards.length > 10) {
      cards = cards.slice(0, 10);
    }

    return cards;
  } catch (error) {
    console.error('PDF 처리 오류:', error);
    throw error;
  }
}
