import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProjectBySlug } from "../data/projects";
import NotFound from "./NotFound";
import "./ProjectDetail.css";

const COMMAND = "cat README.md";
const TYPE_SPEED = 45;

const LINK_LABELS = {
    live: "website",
    github: "github",
    store: "app store",
};

// Fake-but-stable commit hashes so the outcome log looks like `git log --oneline`.
function shortHash(text) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, "0").slice(0, 7);
}

function TypedCommand() {
    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;
    const [typed, setTyped] = useState(reducedMotion ? COMMAND : "");

    useEffect(() => {
        if (typed.length >= COMMAND.length) return undefined;
        const t = setTimeout(
            () => setTyped(COMMAND.slice(0, typed.length + 1)),
            TYPE_SPEED,
        );
        return () => clearTimeout(t);
    }, [typed]);

    return (
        <>
            <span className="sr-only">{COMMAND}</span>
            <span aria-hidden="true">{typed}</span>
        </>
    );
}

function ProjectLinks({ links }) {
    const available = Object.entries(links).filter(([, url]) => url);
    if (available.length === 0) return null;

    return (
        <div className="readme-meta-row">
            <dt>links</dt>
            <dd className="readme-links">
                {available.map(([name, url]) => (
                    <a key={name} href={url} target="_blank" rel="noreferrer">
                        [{LINK_LABELS[name]} &#8599;]
                    </a>
                ))}
            </dd>
        </div>
    );
}

function Heading({ id, children }) {
    return (
        <h2 id={id}>
            <span className="readme-mark" aria-hidden="true">
                ##{" "}
            </span>
            {children}
        </h2>
    );
}

function ProjectDetail() {
    const { slug } = useParams();
    const project = getProjectBySlug(slug);

    if (!project) return <NotFound />;

    return (
        <main className="readme-page" id="main-content">
            <article className="readme" aria-labelledby="readme-title">
                <p className="readme-prompt">
                    <Link to="/projects" aria-label="All projects">
                        ~/work
                    </Link>
                    <span className="readme-path">/{project.slug}</span>
                    <span className="readme-dollar" aria-hidden="true">
                        {" "}
                        ${" "}
                    </span>
                    <TypedCommand />
                </p>
                <div className="readme-rule" aria-hidden="true" />

                <div className="readme-body">
                    <header>
                        <h1 id="readme-title">
                            <span className="readme-mark" aria-hidden="true">
                                #{" "}
                            </span>
                            {project.name}
                        </h1>
                        <p className="readme-summary">{project.summary}</p>
                        <dl className="readme-meta">
                            <div className="readme-meta-row">
                                <dt>status</dt>
                                <dd>
                                    <span
                                        className={`readme-status readme-status--${project.status}`}
                                    >
                                        {project.status}
                                    </span>{" "}
                                    &middot; {project.period}
                                </dd>
                            </div>
                            <div className="readme-meta-row">
                                <dt>role</dt>
                                <dd>{project.role}</dd>
                            </div>
                            <div className="readme-meta-row">
                                <dt>for</dt>
                                <dd>{project.forWhom}</dd>
                            </div>
                            <ProjectLinks links={project.links} />
                        </dl>
                    </header>

                    {project.draft ? (
                        <section aria-labelledby="readme-todo">
                            <Heading id="readme-todo">TODO</Heading>
                            <p>Still writing this one up. Check back soon.</p>
                        </section>
                    ) : (
                        <>
                            <section aria-labelledby="readme-why">
                                <Heading id="readme-why">Why</Heading>
                                <p>{project.problem}</p>
                            </section>

                            <section aria-labelledby="readme-how">
                                <Heading id="readme-how">How I built it</Heading>
                                <p>{project.approach}</p>
                            </section>

                            <section aria-labelledby="readme-log">
                                <Heading id="readme-log">Where it's at</Heading>
                                <p className="readme-cmd" aria-hidden="true">
                                    $ git log --oneline
                                </p>
                                <ul className="readme-log">
                                    {project.outcome.map((item) => (
                                        <li key={item}>
                                            <span
                                                className="readme-hash"
                                                aria-hidden="true"
                                            >
                                                {shortHash(item)}
                                            </span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        </>
                    )}

                    {project.evidence.length > 0 && (
                        <section aria-labelledby="readme-receipts">
                            <Heading id="readme-receipts">Receipts</Heading>
                            <dl className="readme-receipts">
                                {project.evidence.map((item) => (
                                    <div key={`${item.label}-${item.value}`}>
                                        <dt>{item.label}</dt>
                                        <dd>
                                            {item.url ? (
                                                <a
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    {item.value} &#8599;
                                                </a>
                                            ) : (
                                                item.value
                                            )}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </section>
                    )}

                    <section aria-labelledby="readme-stack">
                        <Heading id="readme-stack">Built with</Heading>
                        <p className="readme-cmd" aria-hidden="true">
                            $ ls stack/
                        </p>
                        <ul className="readme-stack">
                            {project.stack.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </section>

                    <p className="readme-exit">
                        <Link to="/projects">
                            <span aria-hidden="true">$ </span>cd ..
                            <span className="sr-only"> (back to all projects)</span>
                        </Link>
                        <span className="readme-cursor" aria-hidden="true" />
                    </p>
                </div>
            </article>
        </main>
    );
}

export default ProjectDetail;
