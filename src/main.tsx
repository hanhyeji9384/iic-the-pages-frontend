// ============================================================
// main.tsx - 앱의 진입점 (시작점)
// React 앱을 HTML의 #root 요소에 연결합니다.
// ============================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 전역 CSS 스타일 임포트 (Tailwind + 커스텀 스타일)
import './index.css';

// #root 요소를 찾아서 React 앱을 연결합니다.
// ! 표시: "이 요소가 반드시 존재한다"고 TypeScript에 알려줍니다.
ReactDOM.createRoot(document.getElementById('root')!).render(
  // StrictMode: 개발 중에 잠재적인 문제를 더 잘 감지하기 위한 모드
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
