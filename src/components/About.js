import { Link } from "react-router-dom";
import "./TextPage.css";

const STACK = [
    ["languages", "JavaScript, TypeScript, Python, Rust, Java, C#, C/C++, X++, SQL"],
    ["frontend", "React, Next.js, React Native, Tailwind, Vite"],
    ["backend", "Node.js, Fastify, Axum, Flask, Express"],
    ["infra", "AWS, Azure, Docker, Linux, Git"],
];

function About() {
    return (
        <main className="text-page" id="main-content">
            <h1>about</h1>
            <p className="text-page-lede">
                I'm Ticus. D365 developer &middot; Colorado State &apos;24.
            </p>
            <p>
                Enterprise ERP solutions by day. Creative of anything and
                everything by night.
            </p>
            <h2>what I work with</h2>
            <dl className="text-page-stack">
                {STACK.map(([k, v]) => (
                    <div key={k}>
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                    </div>
                ))}
            </dl>
            <h2>find me</h2>
            <ul className="text-page-links">
                <li>
                    <a href="https://git.ticusb.com/repos" target="_blank" rel="noreferrer">
                        git &#8599;
                    </a>
                </li>
                <li>
                    <a href="https://linkedin.com/in/ticus" target="_blank" rel="noreferrer">
                        linkedin &#8599;
                    </a>
                </li>
                <li>
                    <a href="mailto:LeviticusB02@gmail.com">email</a>
                </li>
            </ul>
            <p className="text-page-back">
                <Link to="/">&larr; back to the drawing</Link>
            </p>
        </main>
    );
}

export default About;
