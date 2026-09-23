# Technology Stack & Implementation Details

## 1. Frontend
*   **Framework/Library:** React.js (Next.js 또는 Vite 기반 권장 - Antigravity가 가장 잘 이해하고 빠르게 구성할 수 있는 스택)
*   **Styling:** Tailwind CSS (빠른 모바일 반응형 디자인 적용)
*   **Icons:** Lucide React (심플하고 현대적인 아이콘 적용)

## 2. Backend & Database (BaaS)
*   **Database:** Google Sheets
*   **Middleware/API:** Google Apps Script (GAS)
    *   *구현 방법:* 구글 시트에서 `확장 프로그램 > Apps Script`를 열고, `doGet(e)`과 `doPost(e)` 함수를 작성하여 웹 앱으로 배포. 이를 통해 프론트엔드에서 CORS 이슈 없이 데이터를 읽고 쓸 수 있는 나만의 API 서버 구축.

## 3. 핵심 라이브러리 (기능 구현용)
*   **PDF Generation:** `html2pdf.js` 또는 `jsPDF` + `html2canvas`
    *   *용도:* 탐구 포트폴리오의 최종 요약 화면(HTML DOM)을 그대로 캡처하여 PDF 문서로 변환 및 기기 다운로드.
*   **Image Handling:** (Type B 질문 입력 시) 이미지는 Base64 인코딩하여 구글 시트에 텍스트로 저장하거나, 브라우저 로컬 스토리지에 임시 보관 후 텍스트 위주로 DB를 경량화하는 방식을 초기 프로토타입에 적용.

## 4. 배포 (Deployment)
*   **Frontend Hosting:** Vercel 또는 Netlify (GitHub 리포지토리 연동을 통해 푸시할 때마다 자동 배포, 무료 및 설정이 매우 간편함). 중학생들이 브라우저 링크만으로 앱 설치 없이 즉시 접속 가능.