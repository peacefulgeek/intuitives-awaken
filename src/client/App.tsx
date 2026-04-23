import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';

const HomePage = lazy(() => import('./pages/HomePage'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
const ArticlesListPage = lazy(() => import('./pages/ArticlesListPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ToolsPage = lazy(() => import('./pages/ToolsPage'));
const QuizPage = lazy(() => import('./pages/QuizPage'));
const AssessmentPage = lazy(() => import('./pages/AssessmentPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export default function App() {
  return (
    <div className="site-wrapper">
      <Header />
      <main className="site-main">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/articles" element={<ArticlesListPage />} />
            <Route path="/articles/:slug" element={<ArticlePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/assessment" element={<AssessmentPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
