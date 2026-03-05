import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
    return (
        <main className="home">
            <section className="hero">
                <div className="hero-inner">
                    <span className="hero-label">software engineer</span>
                    <h1 className="hero-name">
                        Leviticus<br />Brandt
                    </h1>
                    <p className="hero-meta">D365 Developer at RSM &nbsp;&middot;&nbsp; Colorado State &apos;24</p>
                    <p className="hero-desc">
                        Enterprise ERP solutions by day. AI apps, a Rust browser,
                        and homelab infrastructure by night.
                    </p>
                    <div className="hero-actions">
                        <Link to="/projects" className="btn-primary">view work &rarr;</Link>
                        <div className="hero-links">
                            <a href="https://github.com/ticusb" target="_blank" rel="noreferrer">github &#8599;</a>
                            <a href="https://linkedin.com/in/ticusb" target="_blank" rel="noreferrer">linkedin &#8599;</a>
                            <a href="mailto:leviticusbrandt@outlook.com">email &#8599;</a>
                        </div>
                    </div>
                </div>
                <div className="scroll-hint" aria-hidden="true">
                    <span>scroll</span>
                    <div className="scroll-line" />
                </div>
            </section>
        </main>
    );
}

export default Home;
