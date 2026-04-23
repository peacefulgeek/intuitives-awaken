import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const QUIZ = {
  title: 'The Psychic Sensitivity Quiz',
  description: 'Not everyone who feels a lot is psychically sensitive. Not everyone who\'s psychically sensitive feels a lot. This quiz helps you understand your specific sensitivity profile.',
  questions: [
    {
      id: 1,
      text: 'You walk into a room where people have just had an argument. No one says anything. What happens?',
      options: [
        { value: 0, label: 'Nothing unusual. I just see people.' },
        { value: 1, label: 'I notice the mood feels off but can\'t explain why.' },
        { value: 2, label: 'I feel a physical tension or unease in my body.' },
        { value: 3, label: 'I know exactly what happened and feel it as if I was there.' },
      ]
    },
    {
      id: 2,
      text: 'When a friend is struggling emotionally but hasn\'t told you yet, do you:',
      options: [
        { value: 0, label: 'Find out when they tell me.' },
        { value: 1, label: 'Sometimes sense something is off.' },
        { value: 2, label: 'Usually know before they say anything.' },
        { value: 3, label: 'Feel their distress in my own body before I even see them.' },
      ]
    },
    {
      id: 3,
      text: 'Crowds, shopping malls, or busy public spaces:',
      options: [
        { value: 0, label: 'Don\'t bother me at all.' },
        { value: 1, label: 'Can be tiring if I\'m there too long.' },
        { value: 2, label: 'Often leave me feeling drained or agitated.' },
        { value: 3, label: 'Are genuinely overwhelming - I absorb everyone\'s energy.' },
      ]
    },
    {
      id: 4,
      text: 'Your gut feeling about a person you just met:',
      options: [
        { value: 0, label: 'Takes time to form based on what they say and do.' },
        { value: 1, label: 'Is usually right but I often second-guess it.' },
        { value: 2, label: 'Is immediate and accurate more often than not.' },
        { value: 3, label: 'Is so strong it\'s hard to override even when I try.' },
      ]
    },
    {
      id: 5,
      text: 'Dreams for you are:',
      options: [
        { value: 0, label: 'Mostly forgettable or random.' },
        { value: 1, label: 'Sometimes vivid and meaningful.' },
        { value: 2, label: 'Often symbolic and emotionally significant.' },
        { value: 3, label: 'Sometimes predictive or contain information I couldn\'t have known.' },
      ]
    },
    {
      id: 6,
      text: 'When you\'re around someone who is lying to you:',
      options: [
        { value: 0, label: 'I usually believe them unless I have proof otherwise.' },
        { value: 1, label: 'Something feels off but I can\'t always identify it.' },
        { value: 2, label: 'I almost always know, even if I can\'t explain how.' },
        { value: 3, label: 'I feel it physically - a specific sensation that signals deception.' },
      ]
    },
    {
      id: 7,
      text: 'As a child, adults often told you:',
      options: [
        { value: 0, label: 'Nothing unusual about my sensitivity.' },
        { value: 1, label: 'I was "too sensitive" or "too emotional."' },
        { value: 2, label: 'I was "an old soul" or "too mature for my age."' },
        { value: 3, label: 'I was "making things up" or "imagining things" about people or situations.' },
      ]
    },
    {
      id: 8,
      text: 'Physical spaces hold energy for you:',
      options: [
        { value: 0, label: 'No, a room is just a room.' },
        { value: 1, label: 'Some places feel more comfortable than others.' },
        { value: 2, label: 'Yes - I can sense the history or emotional residue of places.' },
        { value: 3, label: 'Strongly - some places feel unbearable and I can\'t explain why.' },
      ]
    },
    {
      id: 9,
      text: 'After spending time with certain people, you feel:',
      options: [
        { value: 0, label: 'The same as before.' },
        { value: 1, label: 'Energized or drained depending on the person.' },
        { value: 2, label: 'Like I\'ve absorbed their emotional state.' },
        { value: 3, label: 'Like I need significant time alone to "clear" myself.' },
      ]
    },
    {
      id: 10,
      text: 'When you have a strong intuitive hit about a decision:',
      options: [
        { value: 0, label: 'I rely on logic and evidence, not feelings.' },
        { value: 1, label: 'I consider it but often override it with rational thinking.' },
        { value: 2, label: 'I\'ve learned to take it seriously - it\'s usually right.' },
        { value: 3, label: 'Ignoring it has cost me enough times that I don\'t anymore.' },
      ]
    },
    {
      id: 11,
      text: 'Your relationship with your own emotions:',
      options: [
        { value: 0, label: 'Straightforward - I know what I feel and why.' },
        { value: 1, label: 'Sometimes I\'m not sure if what I\'m feeling is mine.' },
        { value: 2, label: 'Often hard to separate my feelings from others\' feelings.' },
        { value: 3, label: 'I regularly absorb others\' emotions and mistake them for my own.' },
      ]
    },
    {
      id: 12,
      text: 'The phrase "I just knew" describes your experience:',
      options: [
        { value: 0, label: 'Rarely or never.' },
        { value: 1, label: 'Occasionally, in hindsight.' },
        { value: 2, label: 'Regularly - it\'s a normal part of how I navigate the world.' },
        { value: 3, label: 'Constantly - it\'s one of my primary ways of knowing things.' },
      ]
    }
  ],
  results: [
    {
      range: [0, 10],
      title: 'Low Sensitivity Profile',
      description: 'Your sensitivity is in the typical range. You process information primarily through the five standard senses and logical reasoning. This doesn\'t mean you\'re not intuitive - it means your intuition likely works quietly in the background rather than as a prominent perceptual channel.',
      advice: 'If you\'re curious about developing intuition, start with body awareness practices. Your nervous system is the gateway.',
      color: '#5B8DB8'
    },
    {
      range: [11, 20],
      title: 'Moderate Sensitivity Profile',
      description: 'You have real sensitivity that you\'ve probably been managing your whole life, often without a framework for it. You pick up on things others miss. You\'re affected by environments and people in ways that aren\'t always easy to explain. This is a real perceptual difference, not a personality quirk.',
      advice: 'The most useful thing you can do right now: start distinguishing your emotions from absorbed emotions. That\'s the skill that changes everything.',
      color: '#C9A84C'
    },
    {
      range: [21, 30],
      title: 'High Sensitivity Profile',
      description: 'You\'re operating with a significantly wider perceptual bandwidth than most people. You likely know things before you can explain how you know them. You\'ve probably been told you\'re "too sensitive" or "too intense." You\'re not. You\'re under-supported. The sensitivity isn\'t the problem - the lack of structure around it is.',
      advice: 'Your work now is discernment: learning to tell the difference between intuition and anxiety, between your energy and others\'. That\'s the whole game.',
      color: '#8B5CF6'
    },
    {
      range: [31, 36],
      title: 'Very High Sensitivity Profile',
      description: 'You\'re in the upper range of psychic sensitivity. You absorb environments, people, and emotional fields in ways that can be both a profound gift and a significant burden. "Psychic development without grounding is just dissociation with better branding." That quote was written for you.',
      advice: 'Grounding is not optional for you - it\'s structural. Before you develop any more sensitivity, build the container. Start with body, breath, and boundaries.',
      color: '#C9A84C'
    }
  ]
};

export default function QuizPage() {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const question = QUIZ.questions[currentQ];
  const totalScore = answers.reduce((sum, v) => sum + v, 0);
  const result = QUIZ.results.find(r => totalScore >= r.range[0] && totalScore <= r.range[1]);
  const progress = ((currentQ) / QUIZ.questions.length) * 100;

  function handleSelect(value: number) {
    setSelected(value);
  }

  function handleNext() {
    if (selected === null) return;
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    setSelected(null);
    if (currentQ + 1 >= QUIZ.questions.length) {
      setShowResult(true);
    } else {
      setCurrentQ(currentQ + 1);
    }
  }

  function handleRestart() {
    setCurrentQ(0);
    setAnswers([]);
    setSelected(null);
    setShowResult(false);
  }

  return (
    <div className="quiz-page">
      <div className="quiz-header">
        <div className="container">
          <h1>{QUIZ.title}</h1>
          <p>{QUIZ.description}</p>
        </div>
      </div>

      <div className="container">
        <div className="quiz-container">
          {!showResult ? (
            <>
              <div className="quiz-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <span className="progress-text">Question {currentQ + 1} of {QUIZ.questions.length}</span>
              </div>

              <div className="quiz-question">
                <p className="question-text">{question.text}</p>
                <div className="quiz-options">
                  {question.options.map((opt) => (
                    <button
                      key={opt.value}
                      className={`quiz-option ${selected === opt.value ? 'selected' : ''}`}
                      onClick={() => handleSelect(opt.value)}
                    >
                      <span className="option-indicator" />
                      <span className="option-text">{opt.label}</span>
                    </button>
                  ))}
                </div>
                <button
                  className="btn btn-primary quiz-next"
                  onClick={handleNext}
                  disabled={selected === null}
                >
                  {currentQ + 1 === QUIZ.questions.length ? 'See My Results' : 'Next Question'}
                </button>
              </div>
            </>
          ) : (
            <div className="quiz-result">
              <div className="result-header" style={{ borderColor: result?.color }}>
                <span className="result-symbol" style={{ color: result?.color }}>✦</span>
                <h2 className="result-title">{result?.title}</h2>
                <div className="result-score">
                  Score: {totalScore} / {QUIZ.questions.length * 3}
                </div>
              </div>
              <p className="result-description">{result?.description}</p>
              <div className="result-advice">
                <h3>What to do with this</h3>
                <p>{result?.advice}</p>
              </div>
              <div className="result-actions">
                <Link to="/assessment" className="btn btn-primary">Take the Full Assessment</Link>
                <Link to="/articles" className="btn btn-outline">Read the Articles</Link>
                <button className="btn btn-ghost-dark" onClick={handleRestart}>Retake Quiz</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .quiz-page { padding-bottom: 4rem; }
        .quiz-header {
          background: linear-gradient(135deg, var(--bg-dark) 0%, var(--bg-dark-secondary) 100%);
          padding: 4rem 0;
          margin-bottom: 3rem;
        }
        .quiz-header h1 {
          font-family: var(--font-heading);
          font-size: 2.5rem;
          color: var(--text-on-dark);
          margin-bottom: 0.75rem;
        }
        .quiz-header p {
          color: rgba(245, 240, 250, 0.7);
          font-size: 1.05rem;
          max-width: 600px;
        }
        .quiz-container {
          max-width: 680px;
          margin: 0 auto;
        }
        .quiz-progress {
          margin-bottom: 2rem;
        }
        .progress-bar {
          height: 4px;
          background: var(--bg-secondary);
          border-radius: var(--radius-full);
          overflow: hidden;
          margin-bottom: 0.5rem;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent), var(--accent-blue));
          border-radius: var(--radius-full);
          transition: width var(--transition-base);
        }
        .progress-text {
          font-family: var(--font-ui);
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .quiz-question {
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          padding: 2.5rem;
          border: 1px solid var(--border-light);
          box-shadow: var(--shadow-md);
        }
        .question-text {
          font-family: var(--font-heading);
          font-size: 1.35rem;
          color: var(--text-primary);
          line-height: 1.4;
          margin-bottom: 2rem;
        }
        .quiz-options {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }
        .quiz-option {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem 1.25rem;
          background: var(--bg-primary);
          border: 2px solid var(--border-light);
          border-radius: var(--radius-lg);
          cursor: pointer;
          text-align: left;
          transition: all var(--transition-fast);
          min-height: var(--tap-target-min);
        }
        .quiz-option:hover {
          border-color: var(--accent-blue);
          background: var(--bg-secondary);
        }
        .quiz-option.selected {
          border-color: var(--accent);
          background: var(--accent-soft);
        }
        .option-indicator {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid var(--border);
          flex-shrink: 0;
          margin-top: 2px;
          transition: all var(--transition-fast);
          position: relative;
        }
        .quiz-option.selected .option-indicator {
          border-color: var(--accent);
          background: var(--accent);
        }
        .quiz-option.selected .option-indicator::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
        }
        .option-text {
          font-size: 0.95rem;
          color: var(--text-primary);
          line-height: 1.5;
        }
        .quiz-next {
          width: 100%;
          justify-content: center;
        }
        .quiz-next:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        /* Result */
        .quiz-result {
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          padding: 2.5rem;
          border: 1px solid var(--border-light);
          box-shadow: var(--shadow-md);
        }
        .result-header {
          text-align: center;
          padding-bottom: 2rem;
          margin-bottom: 2rem;
          border-bottom: 2px solid var(--border-light);
        }
        .result-symbol {
          font-size: 3rem;
          display: block;
          margin-bottom: 1rem;
          filter: drop-shadow(0 0 12px currentColor);
        }
        .result-title {
          font-family: var(--font-heading);
          font-size: 2rem;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }
        .result-score {
          font-family: var(--font-ui);
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .result-description {
          font-size: 1.05rem;
          color: var(--text-secondary);
          line-height: 1.7;
          margin-bottom: 2rem;
        }
        .result-advice {
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          margin-bottom: 2rem;
          border-left: 3px solid var(--accent);
        }
        .result-advice h3 {
          font-family: var(--font-heading);
          font-size: 1.1rem;
          color: var(--accent);
          margin-bottom: 0.75rem;
        }
        .result-advice p {
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin: 0;
        }
        .result-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .result-actions .btn {
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
        .btn-ghost-dark:hover {
          color: var(--text-primary);
          border-color: var(--text-muted);
        }
        @media (max-width: 768px) {
          .quiz-question { padding: 1.5rem; }
          .quiz-result { padding: 1.5rem; }
        }
      `}</style>
    </div>
  );
}
