import React from 'react';
import projects from '../data/projects';
import './Projects.css';

function Projects() {
    return (
        <div className="projects-page">
            {projects.map((project, i) => (
                <div className="project-section" key={project.name}>
                    <div className="project-content">
                        <p className="project-index">0{i + 1}</p>
                        <h2 className="project-name">{project.name}</h2>
                        <p className="project-tagline">{project.tagline}</p>
                        <p className="project-tech">
                            {project.tech.map(t => (
                                <span key={t}>{t}</span>
                            ))}
                        </p>
                        {project.live && (
                            <a className="project-link" href={project.live} target="_blank" rel="noreferrer">
                                live site →
                            </a>
                        )}
                        {project.live && project.github && (
                            <span style={{ margin: '0 1rem', color: '#ddd' }}>|</span>
                        )}
                        {project.github && (
                            <a className="project-link" href={project.github} target="_blank" rel="noreferrer">
                                github →
                            </a>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default Projects;
