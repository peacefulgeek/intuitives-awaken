import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const SECTIONS = [
  {
    id: 'clairsentience',
    title: 'Clairsentience',
    subtitle: 'Feeling as knowing',
    icon: '◎',
    questions: [
      { id: 'cs1', text: 'I feel others\' physical pain or discomfort in my own body.' },
      { id: 'cs2', text: 'I know when someone is lying even when their words are convincing.' },
      { id: 'cs3', text: 'I feel the emotional atmosphere of a room before anyone speaks.' },
      { id: 'cs4', text: 'I absorb the emotional states of people I spend time with.' },
    ]
  },
  {
    id: 'claircognizance',
    title: 'Claircognizance',
    subtitle: 'Clear knowing',
    icon: '◈',
    questions: [
      { id: 'cc1', text: 'I know things without being able to explain how I know them.' },
      { id: 'cc2', text: 'I have sudden, complete understandings of complex situations.' },
      { id: 'cc3', text: 'I often know how a situation will unfold before it does.' },
      { id: 'cc4', text: 'I receive information that later proves accurate with no logical source.' },
    ]
  },
  {
    id: 'clairvoyance',
    title: 'Clairvoyance',
    subtitle: 'Clear seeing',
    icon: '◉',
    questions: [
      { id: 'cv1', text: 'I see images, symbols, or scenes in my mind\'s eye that carry meaning.' },
      { id: 'cv2', text: 'My dreams are vivid, symbolic, and sometimes predictive.' },
      { id: 'cv3', text: 'I see or sense things in my peripheral vision that others don\'t notice.' },
      { id: 'cv4', text: 'I visualize information naturally - it comes as pictures, not just words.' },
    ]
  },
  {
    id: 'clairaudience',
    title: 'Clairaudience',
    subtitle: 'Clear hearing',
    icon: '◆',
    questions: [
      { id: 'ca1', text: 'I hear my name called when no one has spoken.' },
      { id: 'ca2', text: 'I receive guidance or information as an inner voice distinct from my own thinking.' },
      { id: 'ca3', text: 'I\'m highly sensitive to sound and easily overwhelmed by noise.' },
      { id: 'ca4', text: 'Music, tone of voice, and sound carry emotional information that others seem to miss.' },
    ]
  },
  {
    id: 'grounding',
    title: 'Grounding & Discernment',
    subtitle: 'Stability and clarity',
    icon: '◇',
    questions: [
      { id: 'gr1', text: 'I can distinguish between my own emotions and emotions I\'ve absorbed from others.' },
      { id: 'gr2', text: 'I have practices that help me clear absorbed energy.' },
      { id: 'gr3', text: 'I can tell the difference between intuition and anxiety.' },
      { id: 'gr4', text: 'I feel grounded and present in my body most of the time.' },
    ]
  }
];

const SCALE = [
  { value: 0, label: 'Never' },
  { value: 1, label: 'Rarely' },
  { value: 2, label: 'Sometimes' },
  { value: 3, label: 'Often' },
  { value: 4, label: 'Always' },
];

type Answers = Record<string, number>;

function getSectionScore(section: typeof SECTIONS[0], answers: Answers): number {
  return section.questions.reduce((sum, q) => sum + (answers[q.id] ?? 0), 0);
}

function getMaxScore(section: typeof SECTIONS[0]): number {
  return section.questions.length * 4;
}

function getStrengthLabel(score: number, max: number): { label: string; color: string } {
  const pct = score / max;
  if (pct >= 0.75) return { label: 'Strong', color: '#8B5CF6' };
  if (pct >= 0.5) return { label: 'Moderate', color: '#C9A84C' };
  if (pct >= 0.25) return { label: 'Developing', color: '#5B8DB8' };
  return { label: 'Minimal', color: '#7A6890' };
}

export default function AssessmentPage() {
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [showResults, setShowResults] = useState(false);

  const section = SECTIONS[currentSection];
  const allAnswered = section.questions.every(q => answers[q.id] !== undefined);
  const totalAnswered = SECTIONS.slice(0, currentSection).every(s =>
    s.questions.every(q => answers[q.id] !== undefined)
  );

  function handleAnswer(questionId: string, value: number) {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }

  function handleNext() {
    if (currentSection + 1 >= SECTIONS.length) {
      setShowResults(true);
    } else {
      setCurrentSection(currentSection + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleRestart() {
    setCurrentSection(0);
    setAnswers({});
    setShowResults(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const sectionProgress = ((currentSection) / SECTIONS.length) * 100;

  // Results calculation
  const scores = SECTIONS.map(s => ({
    section: s,
    score: getSectionScore(s, answers),
    max: getMaxScore(s),
    strength: getStrengthLabel(getSectionScore(s, answers), getMaxScore(s))
  }));

  const groundingScore = scores.find(s => s.section.id === 'grounding');
  const sensitivityScores = scores.filter(s => s.section.id !== 'grounding');
  const topStrength = [...sensitivityScores].sort((a, b) => (b.score / b.max) - (a.score / a.max))[0];
  const totalSensitivity = sensitivityScores.reduce((sum, s) => sum + s.score, 0);
  const maxSensitivity = sensitivityScores.reduce((sum, s) => sum + s.max, 0);
  const groundingGap = groundingScore ? (groundingScore.score / groundingScore.max) < 0.5 : false;

  return (
    <div className="assessment-page">
      <div className="assessment-header">
        <div className="container">
          <h1>Psychic Sensitivity Assessment</h1>
          <p>
            A structured 20-question assessment across five domains: clairsentience, claircognizance,
            clairvoyance, clairaudience, and grounding. Takes about 5 minutes.
          </p>
        </div>
      </div>

      <div className="container">
        {!showResults ? (
          <div className="assessment-container">
            {/* Section tabs */}
            <div className="section-tabs">
              {SECTIONS.map((s, i) => (
                <button
                  key={s.id}
                  className={`section-tab ${i === currentSection ? 'active' : ''} ${i < currentSection ? 'done' : ''}`}
                  onClick={() => i <= currentSection && setCurrentSection(i)}
                  disabled={i > currentSection}
                >
                  <span className="tab-icon">{s.icon}</span>
                  <span className="tab-label">{s.title}</span>
                </button>
              ))}
            </div>

            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${sectionProgress}%` }} />
            </div>

            <div className="assessment-section">
              <div className="section-header-inner">
                <span className="section-icon">{section.icon}</span>
                <div>
                  <h2>{section.title}</h2>
                  <p className="section-subtitle">{section.subtitle}</p>
                </div>
              </div>

              <div className="assessment-questions">
                {section.questions.map((q, qi) => (
                  <div key={q.id} className="assessment-question">
                    <p className="q-text">{q.text}</p>
                    <div className="q-scale">
                      {SCALE.map(opt => (
                        <button
                          key={opt.value}
                          className={`scale-btn ${answers[q.id] === opt.value ? 'selected' : ''}`}
                          onClick={() => handleAnswer(q.id, opt.value)}
                        >
                          <span className="scale-value">{opt.value}</span>
                          <span className="scale-label">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="btn btn-primary assessment-next"
                onClick={handleNext}
                disabled={!allAnswered}
              >
                {currentSection + 1 === SECTIONS.length ? 'See My Assessment' : `Next: ${SECTIONS[currentSection + 1]?.title}`}
              </button>
            </div>
          </div>
        ) : (
          <div className="assessment-results">
            <div className="results-header">
              <span className="results-symbol">✦</span>
              <h2>Your Sensitivity Profile</h2>
              <p>Based on your responses across five domains of psychic sensitivity.</p>
            </div>

            <div className="results-grid">
              {scores.filter(s => s.section.id !== 'grounding').map(({ section: s, score, max, strength }) => (
                <div key={s.id} className="result-card" style={{ borderTopColor: strength.color }}>
                  <div className="result-card-header">
                    <span className="result-card-icon" style={{ color: strength.color }}>{s.icon}</span>
                    <div>
                      <h3>{s.title}</h3>
                      <p className="result-card-sub">{s.subtitle}</p>
                    </div>
                    <span className="result-strength" style={{ color: strength.color, borderColor: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="result-bar-wrap">
                    <div className="result-bar">
                      <div
                        className="result-bar-fill"
                        style={{ width: `${(score / max) * 100}%`, background: strength.color }}
                      />
                    </div>
                    <span className="result-bar-score">{score}/{max}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Grounding section */}
            {groundingScore && (
              <div className={`grounding-card ${groundingGap ? 'gap' : 'ok'}`}>
                <div className="grounding-header">
                  <span className="grounding-icon">◇</span>
                  <div>
                    <h3>Grounding & Discernment</h3>
                    <p>Your stability foundation</p>
                  </div>
                  <span className="grounding-score">{groundingScore.score}/{groundingScore.max}</span>
                </div>
                {groundingGap ? (
                  <p className="grounding-message warning">
                    Your grounding score is lower than your sensitivity scores. This is the most common
                    pattern in people who feel overwhelmed by their sensitivity. The sensitivity isn't
                    the problem. The lack of structure around it is. Grounding work is your priority.
                  </p>
                ) : (
                  <p className="grounding-message ok">
                    Your grounding is solid relative to your sensitivity. You have the foundation to
                    work with your perceptual gifts without being overwhelmed by them.
                  </p>
                )}
              </div>
            )}

            {/* Primary strength */}
            {topStrength && (
              <div className="primary-strength">
                <h3>Your Primary Channel</h3>
                <p>
                  Your strongest sensitivity domain is <strong>{topStrength.section.title}</strong> ({topStrength.section.subtitle}).
                  This is where your perception is most reliable and where focused development will yield the most.
                </p>
              </div>
            )}

            <div className="results-actions">
              <Link to="/articles" className="btn btn-primary">Read Articles for Your Profile</Link>
              <Link to="/quiz" className="btn btn-outline">Take the Quick Quiz</Link>
              <button className="btn btn-ghost-dark" onClick={handleRestart}>Retake Assessment</button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .assessment-page { padding-bottom: 4rem; }
        .assessment-header {
          background: linear-gradient(135deg, var(--bg-dark) 0%, var(--bg-dark-secondary) 100%);
          padding: 4rem 0;
          margin-bottom: 3rem;
        }
        .assessment-header h1 {
          font-family: var(--font-heading);
          font-size: 2.5rem;
          color: var(--text-on-dark);
          margin-bottom: 0.75rem;
        }
        .assessment-header p {
          color: rgba(245, 240, 250, 0.7);
          font-size: 1.05rem;
          max-width: 600px;
        }
        .assessment-container {
          max-width: 760px;
          margin: 0 auto;
        }
        .section-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        .section-tab {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 0.875rem;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-light);
          background: var(--bg-card);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-family: var(--font-ui);
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-muted);
          min-height: var(--tap-target-min);
        }
        .section-tab:disabled { cursor: not-allowed; opacity: 0.5; }
        .section-tab.done {
          background: var(--bg-secondary);
          color: var(--text-secondary);
          border-color: var(--border);
        }
        .section-tab.active {
          background: var(--accent);
          color: #1A0F2E;
          border-color: var(--accent);
        }
        .tab-icon { font-size: 1rem; }
        .tab-label { display: none; }
        @media (min-width: 480px) { .tab-label { display: inline; } }
        .progress-bar {
          height: 3px;
          background: var(--bg-secondary);
          border-radius: var(--radius-full);
          overflow: hidden;
          margin-bottom: 2rem;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent), var(--accent-blue));
          border-radius: var(--radius-full);
          transition: width var(--transition-base);
        }
        .assessment-section {
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          padding: 2.5rem;
          border: 1px solid var(--border-light);
          box-shadow: var(--shadow-md);
        }
        .section-header-inner {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--border-light);
        }
        .section-icon {
          font-size: 2.5rem;
          color: var(--accent);
        }
        .section-header-inner h2 {
          font-family: var(--font-heading);
          font-size: 1.75rem;
          margin-bottom: 0.25rem;
        }
        .section-subtitle {
          font-family: var(--font-ui);
          font-size: 0.85rem;
          color: var(--text-muted);
          font-style: italic;
          margin: 0;
        }
        .assessment-questions {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          margin-bottom: 2rem;
        }
        .assessment-question {}
        .q-text {
          font-size: 1rem;
          color: var(--text-primary);
          margin-bottom: 1rem;
          line-height: 1.5;
        }
        .q-scale {
          display: flex;
          gap: 0.5rem;
        }
        .scale-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          padding: 0.75rem 0.25rem;
          border: 2px solid var(--border-light);
          border-radius: var(--radius-md);
          background: var(--bg-primary);
          cursor: pointer;
          transition: all var(--transition-fast);
          min-height: var(--tap-target-min);
        }
        .scale-btn:hover {
          border-color: var(--accent-blue);
          background: var(--bg-secondary);
        }
        .scale-btn.selected {
          border-color: var(--accent);
          background: var(--accent-soft);
        }
        .scale-value {
          font-family: var(--font-ui);
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .scale-btn.selected .scale-value { color: var(--text-primary); }
        .scale-label {
          font-family: var(--font-ui);
          font-size: 0.65rem;
          color: var(--text-muted);
          text-align: center;
        }
        .assessment-next {
          width: 100%;
          justify-content: center;
        }
        .assessment-next:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        /* Results */
        .assessment-results {
          max-width: 760px;
          margin: 0 auto;
        }
        .results-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }
        .results-symbol {
          display: block;
          font-size: 3rem;
          color: var(--accent);
          margin-bottom: 1rem;
          filter: drop-shadow(0 0 12px rgba(201, 168, 76, 0.4));
        }
        .results-header h2 {
          font-family: var(--font-heading);
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }
        .results-header p {
          color: var(--text-muted);
          font-size: 1rem;
        }
        .results-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .result-card {
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          border: 1px solid var(--border-light);
          border-top: 3px solid var(--border);
        }
        .result-card-header {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .result-card-icon { font-size: 1.5rem; flex-shrink: 0; }
        .result-card-header h3 {
          font-family: var(--font-heading);
          font-size: 1.1rem;
          margin-bottom: 0.2rem;
        }
        .result-card-sub {
          font-size: 0.78rem;
          color: var(--text-muted);
          font-style: italic;
          margin: 0;
        }
        .result-strength {
          margin-left: auto;
          font-family: var(--font-ui);
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 0.2rem 0.6rem;
          border-radius: var(--radius-full);
          border: 1px solid;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .result-bar-wrap {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .result-bar {
          flex: 1;
          height: 6px;
          background: var(--bg-secondary);
          border-radius: var(--radius-full);
          overflow: hidden;
        }
        .result-bar-fill {
          height: 100%;
          border-radius: var(--radius-full);
          transition: width 1s ease;
        }
        .result-bar-score {
          font-family: var(--font-ui);
          font-size: 0.75rem;
          color: var(--text-muted);
          white-space: nowrap;
        }
        .grounding-card {
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          border: 1px solid var(--border-light);
        }
        .grounding-card.gap { border-left: 3px solid #C9A84C; }
        .grounding-card.ok { border-left: 3px solid #5B8DB8; }
        .grounding-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .grounding-icon { font-size: 1.5rem; color: var(--accent); }
        .grounding-header h3 {
          font-family: var(--font-heading);
          font-size: 1.1rem;
          margin-bottom: 0.2rem;
        }
        .grounding-header p { font-size: 0.78rem; color: var(--text-muted); font-style: italic; margin: 0; }
        .grounding-score {
          margin-left: auto;
          font-family: var(--font-ui);
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-muted);
        }
        .grounding-message {
          font-size: 0.9rem;
          line-height: 1.6;
          margin: 0;
        }
        .grounding-message.warning { color: var(--text-secondary); }
        .grounding-message.ok { color: var(--text-secondary); }
        .primary-strength {
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          margin-bottom: 2rem;
          border-left: 3px solid var(--accent-blue);
        }
        .primary-strength h3 {
          font-family: var(--font-heading);
          font-size: 1.1rem;
          color: var(--accent-blue);
          margin-bottom: 0.5rem;
        }
        .primary-strength p { font-size: 0.95rem; color: var(--text-secondary); margin: 0; }
        .results-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .results-actions .btn {
          width: 100%;
          justify-content: center;
        }
        .btn-ghost-dark {
          background: transparent;
          color: var(--text-muted);
          border: 1px solid var(--border);
          padding: 0.75rem 1.75rem;
          border-radius: var(--radius-full);
          font-family: var(--font-ui);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          min-height: var(--tap-target-min);
        }
        .btn-ghost-dark:hover { color: var(--text-primary); border-color: var(--text-muted); }
        @media (max-width: 640px) {
          .results-grid { grid-template-columns: 1fr; }
          .assessment-section { padding: 1.5rem; }
          .q-scale { gap: 0.25rem; }
          .scale-btn { padding: 0.5rem 0.1rem; }
          .scale-label { display: none; }
        }
      `}</style>
    </div>
  );
}
