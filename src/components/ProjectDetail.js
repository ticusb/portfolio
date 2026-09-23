import { Link, useParams } from "react-router-dom";
import { getProjectBySlug } from "../data/projects";
import NotFound from "./NotFound";
import "./ProjectDetail.css";

const LINK_LABELS = {
    live: "website",
    github: "github",
    store: "app store",
};

function ProjectLinks({ links }) {
    const availableLinks = Object.entries(links).filter(([, url]) => url);

    if (availableLinks.length === 0) return null;

    return (
        <div className="case-study-links" aria-label="Project links">
            {availableLinks.map(([name, url]) => (
                <a key={name} href={url} target="_blank" rel="noreferrer">
                    {LINK_LABELS[name]} &#8599;
                </a>
            ))}
        </div>
    );
}

function ProjectDetail() {
    const { slug } = useParams();
    const project = getProjectBySlug(slug);

    if (!project) return <NotFound />;

    if (project.draft) {
        return (
            <main className="case-study-page" id="main-content">
                <div className="case-study-shell case-study-draft">
                    <Link to="/projects" className="case-study-back">
                        &larr; all projects
                    </Link>
                    <p className="case-study-kicker">{project.status}</p>
                    <h1>{project.name}</h1>
                    <p className="case-study-draft-note">
                        This case study is a validated data stub. Its story, proof,
                        and final place in the portfolio are intentionally left for
                        Ticus to decide.
                    </p>
                    <div className="case-study-stack" aria-label="Technology stack">
                        {project.stack.map((item) => (
                            <span key={item}>{item}</span>
                        ))}
                    </div>
                    <ProjectLinks links={project.links} />
                </div>
            </main>
        );
    }

    return (
        <main className="case-study-page" id="main-content">
            <article className="case-study-shell">
                <Link to="/projects" className="case-study-back">
                    &larr; all projects
                </Link>
                <header className="case-study-header">
                    <p className="case-study-kicker">
                        {project.status} &middot; {project.period}
                    </p>
                    <h1>{project.name}</h1>
                    <p className="case-study-for">For {project.forWhom}</p>
                    <p className="case-study-role">{project.role}</p>
                    <ProjectLinks links={project.links} />
                </header>

                <div className="case-study-body">
                    <section aria-labelledby="case-study-problem">
                        <p className="case-study-section-label">01 / problem</p>
                        <h2 id="case-study-problem">The problem</h2>
                        <p>{project.problem}</p>
                    </section>

                    <section aria-labelledby="case-study-approach">
                        <p className="case-study-section-label">02 / approach</p>
                        <h2 id="case-study-approach">The approach</h2>
                        <p>{project.approach}</p>
                    </section>

                    <section aria-labelledby="case-study-outcomes">
                        <p className="case-study-section-label">03 / outcome</p>
                        <h2 id="case-study-outcomes">What shipped</h2>
                        <ul className="case-study-outcomes">
                            {project.outcome.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </section>

                    <section aria-labelledby="case-study-evidence">
                        <p className="case-study-section-label">04 / evidence</p>
                        <h2 id="case-study-evidence">Proof</h2>
                        <dl className="case-study-evidence">
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

                    <section aria-labelledby="case-study-stack">
                        <p className="case-study-section-label">05 / stack</p>
                        <h2 id="case-study-stack">Built with</h2>
                        <div className="case-study-stack">
                            {project.stack.map((item) => (
                                <span key={item}>{item}</span>
                            ))}
                        </div>
                    </section>
                </div>
            </article>
        </main>
    );
}

export default ProjectDetail;
