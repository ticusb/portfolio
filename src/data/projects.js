export const PROJECT_STATUSES = ["live", "shipped", "archived"];
export const AUDIENCES = ["hiring", "client"];

const projects = [
    {
        slug: "v1-ready",
        name: "V1 Ready",
        status: "live",
        period: "February 2026–present",
        role: "Developer",
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
        period: "August 2025–present",
        role: "Artist and developer",
        forWhom: "Anyone browsing my artwork",
        problem:
            "I wanted my artwork online as something to explore, not a feed to scroll or a static grid to click through.",
        approach:
            "A Next.js app that lays the pieces out on an endless grid you drag around, pulled straight from a Google Drive folder. Only the tiles in view are rendered, nearby images preload, and panning carries momentum. It works with mouse drag, scroll wheel, touch, and arrow or WASD keys, and pieces tilt under the cursor.",
        outcome: [
            "Live at art.ticusb.com and embedded on this site's Art page.",
            "Reworked in July 2026 for performance, with photos you can select in place.",
        ],
        stack: ["Next.js", "React", "Tailwind", "Google Drive API"],
        links: {
            live: "https://art.ticusb.com",
            github: null,
            store: null,
        },
        evidence: [
            {
                label: "Live site",
                value: "art.ticusb.com",
                url: "https://art.ticusb.com",
            },
        ],
        featured: false,
        audience: ["hiring"],
        draft: false,
    },
    {
        slug: "rust-http-client",
        name: "Rust HTTP client",
        status: "archived",
        period: "May–October 2024",
        role: "Developer",
        forWhom: "Myself, as a way to learn Rust and how browsers work",
        problem:
            "I wanted to understand what a browser actually does, starting from the network request, and to learn Rust properly along the way.",
        approach:
            "Working through the browser.engineering textbook in Rust instead of the book's Python. It parses URLs and loads http, https, file, data and view-source addresses behind one shared trait, decodes HTML entities, and prints a page's text or its source. Unit tests and a Clippy lint check run in GitHub Actions.",
        outcome: [
            "Chapter one is complete: it fetches a page over HTTP or HTTPS and displays its text.",
        ],
        stack: ["Rust", "TCP", "TLS", "HTTP", "GitHub Actions"],
        links: {
            live: null,
            github: "https://github.com/ticusb/browser",
            store: null,
        },
        evidence: [
            {
                label: "Source",
                value: "github.com/ticusb/browser",
                url: "https://github.com/ticusb/browser",
            },
        ],
        featured: false,
        audience: ["hiring"],
        draft: false,
    },
    {
        slug: "homelab-server",
        name: "Homelab Server",
        status: "live",
        period: "Ongoing",
        role: "Builder and sole admin",
        forWhom: "My household, plus family and friends I share media with",
        problem:
            "I wanted to own my media, passwords and documents instead of renting them, and reach them from anywhere without exposing more than I have to.",
        approach:
            "Arch Linux on a repurposed 2010 Mac Pro, with the OS on mirrored SSDs and media on a mirrored 8 TB array. Services run in Docker Compose: Jellyfin with GPU transcoding, a self-hosted music server, the *arr automation stack, Vaultwarden, Paperless-ngx and Pi-hole. Everything admin-facing sits behind a WireGuard VPN with certificates issued through DNS challenges, and guests get a locked-down VPN profile that reaches only the media front end.",
        outcome: [
            "Streams movies, TV and music to family members' TVs and phones.",
            "Encrypted nightly backups go offsite, and a full restore was tested in July 2026.",
            "Runs a small crew of self-hosted AI agents that triage mail, plan training and handle routine maintenance.",
        ],
        stack: [
            "Arch Linux",
            "Docker",
            "WireGuard",
            "Pi-hole",
            "Jellyfin",
            "Nginx Proxy Manager",
        ],
        links: { live: null, github: null, store: null },
        evidence: [],
        featured: false,
        audience: ["hiring"],
        draft: false,
    },
    {
        slug: "ozzy-portfolio",
        name: "ozzy portfolio",
        status: "archived",
        period: "May–October 2025",
        role: "Developer",
        forWhom: "Ozzy Tague, a 3D animator and VFX artist",
        problem:
            "Ozzy needed a portfolio for his animation and design work that he could update himself, without waiting on a developer every time he finished a piece.",
        approach:
            "React and Vite on the front end, with Supabase for the database, file storage and login. Visitors get a responsive media grid and full-screen pages for each video or image. Ozzy gets a hidden admin dashboard where he adds, edits and removes his own work.",
        outcome: [
            "Shipped on Vercel and handed over for Ozzy to manage himself.",
        ],
        stack: ["React", "Vite", "Supabase", "Tailwind"],
        links: {
            live: null,
            github: null,
            store: null,
        },
        evidence: [],
        featured: false,
        audience: ["hiring", "client"],
        draft: false,
    },
    {
        slug: "mediaforge",
        name: "mediaForge",
        status: "archived",
        period: "October 2025",
        role: "Developer",
        forWhom: "Creators and small businesses (MVP concept)",
        problem:
            "Quick image and video edits like format conversion, background removal and color grading usually mean desktop software or a pile of single-purpose websites.",
        approach:
            "Wrote the product requirements, spec and task plan first, then built the MVP with AI assistance: a Rust and Axum API with JWT auth and PostgreSQL, a Redis-backed job queue whose workers do the processing, per-tier usage quotas, and LUT-based color grading. A React front end handles uploads and job status.",
        outcome: [
            "A working MVP of the job pipeline and front end, built over five days, then paused.",
        ],
        stack: ["React", "Rust", "Axum", "PostgreSQL", "Redis"],
        links: {
            live: null,
            github: null,
            store: null,
        },
        evidence: [],
        featured: false,
        audience: ["hiring"],
        draft: false,
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