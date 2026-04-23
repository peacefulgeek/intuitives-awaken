import React from 'react';
import { Link } from 'react-router-dom';

const BUNNY = 'https://intuitives-awaken.b-cdn.net';

export default function AboutPage() {
  return (
    <div className="about-page">
      <div className="about-hero">
        <div className="container">
          <div className="about-hero-inner">
            <div className="about-image-wrap">
              <img
                src={`${BUNNY}/images/kalesh-portrait.webp`}
                alt="Kalesh - Consciousness Teacher and Writer"
                width="480"
                height="600"
                onError={(e) => {
                  const t = e.target as HTMLImageElement;
                  t.src = `${BUNNY}/images/articles/default-hero.webp`;
                }}
              />
            </div>
            <div className="about-intro">
              <span className="about-eyebrow">✦ About</span>
              <h1>Kalesh</h1>
              <p className="about-role">Consciousness Teacher &amp; Writer</p>
              <p className="about-tagline">
                "Intuition isn't mystical. It's a perceptual bandwidth most people have been trained to ignore."
              </p>
              <a
                href="https://kalesh.love"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Visit Kalesh.love
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="about-body container">
        <div className="about-content content-width">
          <h2>Who I Am</h2>
          <p>
            I'm not a psychic who performs psychic things. I'm a consciousness researcher who happens
            to be clairsentient. That distinction matters more than it sounds.
          </p>
          <p>
            For most of my life, I experienced things that didn't fit the available frameworks. I felt
            what others felt before they said anything. I knew things I had no logical way of knowing.
            I walked into rooms and absorbed their emotional history. None of this felt mystical. It
            felt like a perceptual difference that no one had a decent vocabulary for.
          </p>
          <p>
            The New Age world had vocabulary, but it came with a performance requirement I couldn't
            meet. The scientific world had skepticism, but it dismissed the experiences entirely. I
            spent years in the gap between those two positions, trying to build a framework that was
            honest about what was actually happening.
          </p>
          <p>
            That's what this site is. A framework. Grounded, analytical, and compassionate about
            experiences that are real but poorly understood.
          </p>

          <h2>What I Write About</h2>
          <p>
            The sensitivity isn't the problem. The lack of structure around it is. That's the through-line
            of everything I write. Whether I'm writing about clairsentience, the neuroscience of intuition,
            grounding practices, or why standard boundary advice doesn't work for empaths - the question
            is always the same: how do you build a life that works with this, not against it?
          </p>
          <p>
            I reference researchers like Dean Radin, Rupert Sheldrake, Judith Orloff, and Elaine Aron
            because their work is rigorous and relevant. I also reference Krishnamurti and Alan Watts
            because consciousness work without philosophical depth is just technique. The 70/30 split
            between niche research and broader spiritual inquiry is intentional.
          </p>

          <h2>The Bright Wound</h2>
          <p>
            The name comes from a specific experience. The cost of seeing what others don't want seen.
            The sensitivity that makes you perceptive also makes you a target - for dismissal, for
            gaslighting, for the slow erosion of your own certainty. That's the wound. But it's bright
            because it's the same thing as the gift. You can't separate them.
          </p>
          <p>
            If you've been told you're too sensitive, you're making things up, or you're crazy - this
            site says: you're not. Here's how to work with it.
          </p>

          <div className="about-cta">
            <Link to="/articles" className="btn btn-primary">Read the Articles</Link>
            <Link to="/assessment" className="btn btn-outline">Take the Assessment</Link>
          </div>
        </div>
      </div>

      <style>{`
        .about-page { padding-bottom: 4rem; }
        .about-hero {
          background: linear-gradient(135deg, var(--bg-dark) 0%, var(--bg-dark-secondary) 100%);
          padding: 4rem 0;
          margin-bottom: 3rem;
        }
        .about-hero-inner {
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 4rem;
          align-items: center;
        }
        .about-image-wrap img {
          border-radius: var(--radius-lg);
          width: 100%;
          height: 500px;
          object-fit: cover;
          box-shadow: var(--shadow-lg);
        }
        .about-eyebrow {
          display: block;
          font-family: var(--font-ui);
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 0.75rem;
        }
        .about-intro h1 {
          font-family: var(--font-heading);
          font-size: 4rem;
          color: var(--text-on-dark);
          margin-bottom: 0.5rem;
        }
        .about-role {
          font-family: var(--font-ui);
          font-size: 1rem;
          color: rgba(245, 240, 250, 0.6);
          margin-bottom: 1.5rem;
        }
        .about-tagline {
          font-family: var(--font-heading);
          font-size: 1.2rem;
          font-style: italic;
          color: rgba(245, 240, 250, 0.85);
          border-left: 2px solid var(--accent);
          padding-left: 1rem;
          margin-bottom: 2rem;
          line-height: 1.5;
        }
        .about-content h2 {
          font-family: var(--font-heading);
          font-size: 1.75rem;
          margin: 2.5rem 0 1rem;
          color: var(--text-primary);
        }
        .about-content h2:first-child { margin-top: 0; }
        .about-content p {
          font-size: 1.05rem;
          color: var(--text-secondary);
          line-height: 1.8;
          margin-bottom: 1.25rem;
        }
        .about-cta {
          display: flex;
          gap: 1rem;
          margin-top: 2.5rem;
          flex-wrap: wrap;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 1.75rem;
          border-radius: var(--radius-full);
          font-family: var(--font-ui);
          font-size: 0.9rem;
          font-weight: 600;
          text-decoration: none;
          transition: all var(--transition-base);
          cursor: pointer;
          border: 2px solid transparent;
          min-height: var(--tap-target-min);
        }
        .btn-primary {
          background: var(--accent);
          color: #1A0F2E;
          border-color: var(--accent);
        }
        .btn-primary:hover {
          background: var(--accent-hover);
          border-color: var(--accent-hover);
          transform: translateY(-2px);
          color: #1A0F2E;
        }
        .btn-outline {
          background: transparent;
          color: var(--text-primary);
          border-color: var(--border);
        }
        .btn-outline:hover {
          background: var(--bg-secondary);
          border-color: var(--accent);
          color: var(--text-primary);
        }
        @media (max-width: 768px) {
          .about-hero-inner { grid-template-columns: 1fr; }
          .about-image-wrap { display: none; }
          .about-intro h1 { font-size: 2.5rem; }
        }
      `}</style>
    </div>
  );
}
