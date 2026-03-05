import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const STACK = [
    { category: 'languages', items: ['JavaScript', 'TypeScript', 'Python', 'Rust', 'Java', 'C#', 'X++', 'SQL'] },
    { category: 'frontend',  items: ['React', 'Next.js', 'React Native', 'Tailwind', 'Vite'] },
    { category: 'backend',   items: ['Node.js', 'Fastify', 'Axum', 'Flask', 'Express'] },
    { category: 'infra',     items: ['AWS', 'Azure', 'Docker', 'Linux', 'Git'] },
];

const BUILDING = [
    {
        name: 'FlightDeck',
        desc: 'AI interview coach for aspiring airline pilots — voice simulation, Whisper transcription, GPT-scored STAR responses.',
        tech: 'React Native · Fastify · OpenAI',
    },
    {
        name: 'Trophies Joy',
        desc: 'Full-stack CBD e-commerce with serverless AWS backend and NMI payment processing.',
        tech: 'Next.js · AWS Lambda · DynamoDB',
    },
    {
        name: 'Homelab Server',
        desc: 'Bare-metal Arch Linux server — reverse proxy, WireGuard VPN, Pi-hole DNS, n8n automation.',
        tech: 'Docker · Nginx · WireGuard',
    },
];

function Home() {
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => entries.forEach(e => {
                if (e.isIntersecting) e.target.classList.add('visible');
            }),
            { threshold: 0.1 }
        );
        document.querySelectorAll('.home-reveal').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, []);

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

            <section className="about-section home-reveal">
                <div className="about-grid">
                    <div className="about-text">
                        <span className="section-label">about</span>
                        <p>
                            Software engineer based in Denver, CO. I build enterprise D365 Finance &amp; Operations
                            solutions at RSM — owning everything from environment setup to production deployment
                            for large-scale clients.
                        </p>
                        <p>
                            I studied computer science at Colorado State, where I also taught intro Python as an
                            undergraduate TA. I&apos;m drawn to the full stack of a problem: tracing X++ batch job
                            bottlenecks, building mobile apps with voice AI, writing a browser engine in Rust from
                            scratch, or wiring up homelab infrastructure just to see how it all fits together.
                        </p>
                    </div>
                    <div className="about-stack">
                        <span className="section-label">stack</span>
                        <div className="stack-groups">
                            {STACK.map(({ category, items }) => (
                                <div className="stack-group" key={category}>
                                    <p className="stack-category">{category}</p>
                                    <div className="stack-pills">
                                        {items.map(item => (
                                            <span key={item}>{item}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="building-section home-reveal">
                <span className="section-label">currently building</span>
                <ul className="building-list">
                    {BUILDING.map(({ name, desc, tech }) => (
                        <li className="building-item" key={name}>
                            <div className="building-dot" aria-hidden="true" />
                            <div className="building-body">
                                <p className="building-name">{name}</p>
                                <p className="building-desc">{desc}</p>
                                <p className="building-tech">{tech}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </section>

        </main>
    );
}

export default Home;
