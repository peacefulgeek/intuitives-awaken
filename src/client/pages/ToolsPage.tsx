import React, { useState } from 'react';

const BUNNY = 'https://intuitives-awaken.b-cdn.net';
const AMAZON_TAG = 'spankyspinola-20';

function amazonUrl(asin: string): string {
  return `https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}`;
}

const TOOLS = [
  {
    category: 'Books: Psychic Development',
    icon: '◈',
    items: [
      {
        asin: '0062765426',
        title: 'The Empath\'s Survival Guide',
        author: 'Judith Orloff MD',
        description: 'The most clinically grounded book on empathic sensitivity. Orloff bridges psychiatry and psychic experience without losing rigor.',
        why: 'Essential reading if you absorb others\' emotions and can\'t figure out where yours end.'
      },
      {
        asin: '0062873717',
        title: 'Thriving as an Empath',
        author: 'Judith Orloff MD',
        description: '365 daily practices for empaths. Practical, specific, and not woo.',
        why: 'Use this as a daily reset when your sensitivity is running hot.'
      },
      {
        asin: '0062699660',
        title: 'The Highly Sensitive Person',
        author: 'Elaine Aron PhD',
        description: 'The original research-backed framework for high sensitivity. Aron\'s work legitimized the experience for millions.',
        why: 'Read this before anything else. It gives you the vocabulary.'
      },
      {
        asin: '1250301696',
        title: 'Real Magic',
        author: 'Dean Radin PhD',
        description: 'A senior scientist at IONS reviews the experimental evidence for psychic phenomena. Rigorous, honest, and surprising.',
        why: 'For the skeptical part of you that needs evidence before you trust your own experience.'
      },
    ]
  },
  {
    category: 'Books: Consciousness & Grounding',
    icon: '◇',
    items: [
      {
        asin: '0060935502',
        title: 'The Power of Now',
        author: 'Eckhart Tolle',
        description: 'The foundational text on present-moment awareness. Overexposed but still essential.',
        why: 'Psychic development without presence work is just noise. This is the foundation.'
      },
      {
        asin: '0060596163',
        title: 'A New Earth',
        author: 'Eckhart Tolle',
        description: 'The ego structure and how it distorts perception. Deeper than The Power of Now.',
        why: 'Understanding the ego is prerequisite to trusting your intuition.'
      },
      {
        asin: '1577314808',
        title: 'The Untethered Soul',
        author: 'Michael A. Singer',
        description: 'Clear, practical teaching on consciousness and the observer self.',
        why: 'The observer perspective is the key to not being overwhelmed by what you sense.'
      },
    ]
  },
  {
    category: 'Grounding Tools',
    icon: '◆',
    items: [
      {
        asin: 'B07VFKZWG5',
        title: 'Earthing Mat',
        author: 'Earthing Universal Mat Kit',
        description: 'Direct electrical contact with the earth. The research on earthing and nervous system regulation is legitimate.',
        why: 'For people who feel perpetually ungrounded or electrically "buzzy." This helps.'
      },
      {
        asin: 'B07G1BWGQT',
        title: 'Weighted Blanket',
        author: 'YnM Weighted Blanket',
        description: 'Deep pressure stimulation calms the nervous system. Evidence-based for anxiety and sensory processing.',
        why: 'After intense empathic experiences, this is the fastest way to come back into your body.'
      },
    ]
  },
  {
    category: 'Meditation & Practice',
    icon: '◉',
    items: [
      {
        asin: 'B07YWKN5QH',
        title: 'Muse 2 Meditation Headband',
        author: 'Muse',
        description: 'EEG biofeedback for meditation. Gives you real-time data on your brain state during practice.',
        why: 'For analytical types who need feedback to trust that their practice is working.'
      },
      {
        asin: 'B01DFKBL68',
        title: 'Tibetan Singing Bowl Set',
        author: 'Ohm Store',
        description: 'Sound as a grounding and clearing tool. The vibration is physical, not metaphorical.',
        why: 'Useful for clearing absorbed energy after difficult interactions or environments.'
      },
    ]
  },
  {
    category: 'Journals & Writing',
    icon: '◈',
    items: [
      {
        asin: 'B07CQPZGPB',
        title: 'Leuchtturm1917 Hardcover Notebook',
        author: 'Leuchtturm1917',
        description: 'The best journal for serious work. Numbered pages, index, archival quality.',
        why: 'Tracking your intuitive hits over time is how you build trust in your perception. You need a good journal.'
      },
    ]
  }
];

export default function ToolsPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const displayed = activeCategory
    ? TOOLS.filter(t => t.category === activeCategory)
    : TOOLS;

  return (
    <div className="tools-page">
      <div className="tools-header">
        <div className="container">
          <span className="tools-eyebrow">✦ Curated Resources</span>
          <h1>The Sensitive's Toolkit</h1>
          <p>
            Books, tools, and equipment that actually help. Curated for people with high sensitivity
            or active psychic development practice. Everything here is something I'd recommend to
            someone I care about.
          </p>
          <p className="affiliate-note">
            Links below are Amazon affiliate links (paid links). I earn a small commission if you
            purchase through them. This doesn't affect my recommendations.
          </p>
        </div>
      </div>

      <div className="container">
        <div className="tools-filter">
          <button
            className={`filter-btn ${!activeCategory ? 'active' : ''}`}
            onClick={() => setActiveCategory(null)}
          >
            All
          </button>
          {TOOLS.map(t => (
            <button
              key={t.category}
              className={`filter-btn ${activeCategory === t.category ? 'active' : ''}`}
              onClick={() => setActiveCategory(t.category)}
            >
              {t.icon} {t.category}
            </button>
          ))}
        </div>

        {displayed.map(section => (
          <div key={section.category} className="tools-section">
            <h2 className="tools-section-title">
              <span className="section-icon">{section.icon}</span>
              {section.category}
            </h2>
            <div className="tools-grid">
              {section.items.map(item => (
                <div key={item.asin} className="tool-card">
                  <div className="tool-card-body">
                    <h3 className="tool-title">{item.title}</h3>
                    <p className="tool-author">{item.author}</p>
                    <p className="tool-description">{item.description}</p>
                    <div className="tool-why">
                      <span className="why-label">Why it matters:</span>
                      <span className="why-text">{item.why}</span>
                    </div>
                  </div>
                  <a
                    href={amazonUrl(item.asin)}
                    target="_blank"
                    rel="nofollow sponsored noopener noreferrer"
                    className="tool-cta"
                  >
                    View on Amazon
                    <span className="paid-label">(paid link)</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .tools-page { padding-bottom: 4rem; }
        .tools-header {
          background: linear-gradient(135deg, var(--bg-dark) 0%, var(--bg-dark-secondary) 100%);
          padding: 4rem 0;
          margin-bottom: 3rem;
        }
        .tools-eyebrow {
          display: block;
          font-family: var(--font-ui);
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 0.75rem;
        }
        .tools-header h1 {
          font-family: var(--font-heading);
          font-size: 3rem;
          color: var(--text-on-dark);
          margin-bottom: 0.75rem;
        }
        .tools-header p {
          color: rgba(245, 240, 250, 0.7);
          font-size: 1.05rem;
          max-width: 600px;
          margin-bottom: 0.75rem;
        }
        .affiliate-note {
          font-size: 0.8rem !important;
          color: rgba(245, 240, 250, 0.45) !important;
          font-style: italic;
        }
        .tools-filter {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 3rem;
        }
        .filter-btn {
          font-family: var(--font-ui);
          font-size: 0.78rem;
          font-weight: 600;
          padding: 0.4rem 0.875rem;
          border-radius: var(--radius-full);
          border: 1px solid var(--border);
          background: var(--bg-card);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
          min-height: var(--tap-target-min);
        }
        .filter-btn:hover { border-color: var(--accent); color: var(--text-primary); }
        .filter-btn.active { background: var(--accent); border-color: var(--accent); color: #1A0F2E; }
        .tools-section { margin-bottom: 3rem; }
        .tools-section-title {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-primary);
        }
        .section-icon { color: var(--accent); }
        .tools-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }
        .tool-card {
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-light);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: all var(--transition-base);
        }
        .tool-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
          border-color: var(--border);
        }
        .tool-card-body {
          padding: 1.5rem;
          flex: 1;
        }
        .tool-title {
          font-family: var(--font-heading);
          font-size: 1.1rem;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }
        .tool-author {
          font-family: var(--font-ui);
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-bottom: 0.75rem;
          font-style: italic;
        }
        .tool-description {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 1rem;
        }
        .tool-why {
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          padding: 0.75rem;
          font-size: 0.85rem;
        }
        .why-label {
          font-family: var(--font-ui);
          font-weight: 700;
          font-size: 0.72rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--accent);
          display: block;
          margin-bottom: 0.25rem;
        }
        .why-text { color: var(--text-secondary); line-height: 1.5; }
        .tool-cta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.875rem;
          background: var(--bg-secondary);
          color: var(--text-primary);
          text-decoration: none;
          font-family: var(--font-ui);
          font-size: 0.85rem;
          font-weight: 600;
          border-top: 1px solid var(--border-light);
          transition: all var(--transition-fast);
          min-height: var(--tap-target-min);
        }
        .tool-cta:hover { background: var(--accent); color: #1A0F2E; }
        .paid-label {
          font-size: 0.7rem;
          font-weight: 400;
          color: var(--text-muted);
          font-style: italic;
        }
        .tool-cta:hover .paid-label { color: rgba(26, 15, 46, 0.6); }
        @media (max-width: 1024px) { .tools-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .tools-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
