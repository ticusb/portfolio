import { useEffect } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

const STACK = [
    {
        category: "languages",
        items: [
            "JavaScript",
            "TypeScript",
            "Python",
            "Rust",
            "Java",
            "C#",
            "C/C++",
            "X++",
            "SQL",
        ],
    },
    {
        category: "frontend",
        items: ["React", "Next.js", "React Native", "Tailwind", "Vite"],
    },
    {
        category: "backend",
        items: ["Node.js", "Fastify", "Axum", "Flask", "Express"],
    },
    { category: "infra", items: ["AWS", "Azure", "Docker", "Linux", "Git"] },
];

const BUILDING = [
    {
        name: "FlightDeck",
        desc: "AI interview coach for aspiring airline pilots — voice simulation, Whisper transcription, GPT-scored STAR responses.",
        tech: "React Native · Fastify · OpenAI",
    },
    {
        name: "Trophe's Joy",
        desc: "Full-stack CBD e-commerce with serverless AWS backend and NMI payment processing.",
        tech: "Next.js · AWS Lambda · DynamoDB",
    },
    {
        name: "Homelab Server",
        desc: "Bare-metal Arch Linux server — reverse proxy, WireGuard VPN, Pi-hole DNS, n8n automation.",
        tech: "Docker · Nginx · WireGuard",
    },
];

function Home() {
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) =>
                entries.forEach((e) => {
                    if (e.isIntersecting) e.target.classList.add("visible");
                }),
            { threshold: 0.1 },
        );
        document
            .querySelectorAll(".home-reveal")
            .forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return (
        <main className="home">
            <section className="hero">
                <div className="hero-inner">
                    <span className="hero-label">software engineer</span>
                    <h1 className="hero-name">
                        Ticus
                        <br />
                        Brandt
                    </h1>
                    <p className="hero-pronunciation">
                        / tee&nbsp;&middot;&nbsp;kus /
                    </p>
                    <p className="hero-meta">
                        D365 Developer &nbsp;&middot;&nbsp; Colorado State
                        &apos;24
                    </p>
                    <p className="hero-desc">
                        Enterprise ERP solutions by day. Creative of anything
                        and everything by night.
                    </p>
                    <div className="hero-actions">
                        <Link to="/projects" className="btn-primary">
                            view work &rarr;
                        </Link>
                        <div className="hero-links">
                            <a
                                href="https://github.com/ticusb"
                                target="_blank"
                                rel="noreferrer"
                            >
                                github &#8599;
                            </a>
                            <a
                                href="https://linkedin.com/in/ticus"
                                target="_blank"
                                rel="noreferrer"
                            >
                                linkedin &#8599;
                            </a>
                            <a href="mailto:LeviticusB02@gmail.com">
                                email &#8599;
                            </a>
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
                            Denver-based developer with a bad habit of pulling
                            on threads until I understand the whole machine.
                            Professionally, I ship ERP solutions from first
                            environment to production. Unprofessionally, I'm
                            building a browser engine in Rust, tinkering with
                            voice AI, and adding one more service to the homelab
                            even though it definitely doesn't need one.
                        </p>
                        <p>
                            I studied computer science at Colorado State, though
                            my roots go back to middle school{" "}
                            <a href="https://www.firstinspires.org/robotics/ftc">
                                #FTC
                            </a>
                            . After years of dealing with poorly designed
                            software, I figured it was time to do something
                            about it. I believe software should be built with
                            the user in mind — reliable solutions that simply
                            work.
                        </p>
                    </div>
                    <div className="about-stack">
                        <span className="section-label">stack</span>
                        <div className="stack-groups">
                            {STACK.map(({ category, items }) => (
                                <div className="stack-group" key={category}>
                                    <p className="stack-category">{category}</p>
                                    <div className="stack-pills">
                                        {items.map((item) => (
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
