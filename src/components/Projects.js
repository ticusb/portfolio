import { Link } from "react-router-dom";
import projects, { getProjectPath } from "../data/projects";
import { useReveal } from "../hooks/useReveal";
import "./Projects.css";

function Projects() {
    useReveal(".project-section");

    return (
        <main className="projects-page" id="main-content">
            <header className="projects-header">
                <span className="projects-label">selected work</span>
                <h1 className="projects-title">Projects</h1>
            </header>
            {projects.map((project, i) => (
                <article className="project-section" key={project.slug}>
                    <span className="project-bg-number" aria-hidden="true">
                        {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="project-content">
                        <p className="project-index">
                            {String(i + 1).padStart(2, "0")}
                        </p>
                        <h2 className="project-name">{project.name}</h2>
                        <p className="project-status">
                            {project.status} &middot; {project.period}
                        </p>
                        <p className="project-tagline">
                            {project.summary}
                        </p>
                        <div className="project-tech">
                            {project.stack.map((t) => (
                                <span key={t}>{t}</span>
                            ))}
                        </div>
                        <div className="project-links">
                            <Link
                                className="project-link project-link--detail"
                                to={getProjectPath(project)}
                            >
                                cat README &rarr;
                            </Link>
                            {project.links.live && (
                                <a
                                    className="project-link"
                                    href={project.links.live}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    live site &#8599;
                                </a>
                            )}
                            {project.links.github && (
                                <a
                                    className="project-link"
                                    href={project.links.github}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    github &#8599;
                                </a>
                            )}
                        </div>
                    </div>
                </article>
            ))}
        </main>
    );
}

export default Projects;
