export const PROJECT_STATUSES = ["live", "shipped", "archived"];
export const AUDIENCES = ["hiring", "client"];

const projects = [
    {
        slug: "v1-ready",
        name: "V1 Ready",
        status: "live",
        period: "February 2026–present",
        role: "Product engineer (exact ownership split pending confirmation)",
        forWhom: "Airline pilots preparing for interviews",
        problem:
            "Pilot interview preparation is spread across question banks, flashcards, spoken practice, and subjective feedback. Candidates need one place to rehearse realistic answers and understand where their delivery needs work.",
        approach:
            "Built an Expo and React Native iOS client backed by a Fastify API and Supabase. The coaching path combines rubric-driven model evaluation with deterministic, duration-normalized delivery scoring, while RevenueCat entitlements, PostHog analytics, Sentry, and retry-aware webhook handling support the production product.",
        outcome: [
            "Released version 1.0 on the App Store in August 2026.",
            "Reached 11 public ratings at 5.0 stars by September 23, 2026.",
            "Served a production catalog of 2,453 published questions, 44 scenarios, and 20 active airlines in the August 31 snapshot.",
        ],
        stack: [
            "React Native",
            "Expo",
            "TypeScript",
            "Fastify",
            "Supabase",
            "RevenueCat",
            "PostHog",
        ],
        links: {
            live: "https://v1consultingco.com",
            github: null,
            store: "https://apps.apple.com/us/app/v1-ready/id6793141918",
        },
        evidence: [
            {
                label: "Public release",
                value: "App Store version 1.0, released August 25, 2026",
                url: "https://apps.apple.com/us/app/v1-ready/id6793141918",
            },
            {
                label: "Public response",
                value: "11 ratings at 5.0 stars on September 23, 2026",
                url: "https://apps.apple.com/us/app/v1-ready/id6793141918",
            },
            {
                label: "Production snapshot",
                value:
                    "23 profiles, 2,453 published questions, 44 published scenarios, and 20 active airlines on August 31, 2026",
                url: null,
            },
        ],
        featured: true,
        audience: ["hiring", "client"],
        draft: false,
    },
    {
        slug: "this-is-art",
        name: "this-is-art",
        status: "live",
        period: "TODO",
        role: "TODO",
        forWhom: "TODO",
        problem: "TODO",
        approach: "TODO",
        outcome: [],
        stack: ["Next.js", "React", "Tailwind"],
        links: {
            live: "https://art.ticusb.com",
            github: null,
            store: null,
        },
        evidence: [],
        featured: false,
        audience: ["hiring"],
        draft: true,
    },
    {
        slug: "rust-http-client",
        name: "Rust HTTP client",
        status: "archived",
        period: "TODO",
        role: "TODO",
        forWhom: "TODO",
        problem: "TODO",
        approach: "TODO",
        outcome: [],
        stack: ["Rust", "TCP", "TLS", "HTTP"],
        links: {
            live: null,
            github: "https://github.com/ticusb/browser",
            store: null,
        },
        evidence: [],
        featured: false,
        audience: ["hiring"],
        draft: true,
    },
    {
        slug: "homelab-server",
        name: "Homelab Server",
        status: "live",
        period: "TODO",
        role: "TODO",
        forWhom: "TODO",
        problem: "TODO",
        approach: "TODO",
        outcome: [],
        stack: ["Arch Linux", "Docker", "WireGuard", "Nginx", "Pi-hole"],
        links: { live: null, github: null, store: null },
        evidence: [],
        featured: false,
        audience: ["hiring"],
        draft: true,
    },
    {
        slug: "ozzy-portfolio",
        name: "ozzy portfolio",
        status: "archived",
        period: "TODO",
        role: "TODO",
        forWhom: "TODO",
        problem: "TODO",
        approach: "TODO",
        outcome: [],
        stack: ["React", "Vite", "Supabase", "Tailwind"],
        links: {
            live: null,
            github: "https://github.com/ticusb/ozzy-portfolio",
            store: null,
        },
        evidence: [],
        featured: false,
        audience: ["hiring"],
        draft: true,
    },
    {
        slug: "mediaforge",
        name: "mediaForge",
        status: "archived",
        period: "TODO",
        role: "TODO",
        forWhom: "TODO",
        problem: "TODO",
        approach: "TODO",
        outcome: [],
        stack: ["React", "Rust", "Axum", "PostgreSQL", "Redis"],
        links: {
            live: null,
            github: "https://github.com/ticusb/mediaForge",
            store: null,
        },
        evidence: [],
        featured: false,
        audience: ["hiring"],
        draft: true,
    },
];

export function getProjectBySlug(slug) {
    if (
        typeof slug !== "string" ||
        slug.length > 80 ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
    ) {
        return null;
    }

    return projects.find((project) => project.slug === slug) ?? null;
}

export function getProjectPath(project) {
    return `/work/${project.slug}`;
}

export default projects;