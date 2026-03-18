import projects from "../data/projects";
import { useReveal } from "../hooks/useReveal";
import "./Projects.css";

function Projects() {
    useReveal(".project-section");

    return (
        <div className="projects-page">
            <header className="projects-header">
                <span className="projects-label">selected work</span>
                <h1 className="projects-title">Projects</h1>
            </header>
            {projects.map((project, i) => (
                <div className="project-section" key={project.name}>
                    <span className="project-bg-number" aria-hidden="true">
                        {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="project-content">
                        <p className="project-index">
                            {String(i + 1).padStart(2, "0")}
                        </p>
                        <h2 className="project-name">{project.name}</h2>
                        <p className="project-tagline">{project.tagline}</p>
                        <div className="project-tech">
                            {project.tech.map((t) => (
                                <span key={t}>{t}</span>
                            ))}
                        </div>
                        <div className="project-links">
                            {project.live && (
                                <a
                                    className="project-link"
                                    href={project.live}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    live site &#8599;
                                </a>
                            )}
                            {project.github && (
                                <a
                                    className="project-link"
                                    href={project.github}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    github &#8599;
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default Projects;
