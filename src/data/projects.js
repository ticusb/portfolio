const projects = [
    {
        name: "FlightDeck",
        tagline:
            "AI-powered pilot interview prep — voice simulation, real-time Whisper transcription, and GPT-scored STAR responses. Supports 8 major US airlines with per-airline question banks and streak tracking.",
        tech: [
            "React Native",
            "Expo",
            "Node.js",
            "Fastify",
            "OpenAI",
            "Supabase",
        ],
        github: "https://github.com/ticusb/flightDeck",
        live: null,
    },
    {
        name: "Trophe's Joy Joy",
        tagline:
            "Full-stack CBD e-commerce — product catalog, variant filtering, cart, and multi-step checkout on a serverless AWS backend with NMI payment processing.",
        tech: ["Next.js", "React", "Tailwind", "AWS Lambda", "DynamoDB", "NMI"],
        github: "https://github.com/ticusb/trophes-joy",
        live: null,
    },
    {
        name: "Rust Web Browser",
        tagline:
            "A web browser built from scratch — HTTP client, HTML/CSS parsers, layout engine, and GUI rendering with minifb.",
        tech: ["Rust", "HTTP", "HTML Parser", "CSS Engine", "minifb"],
        github: "https://github.com/ticusb/browser",
        live: null,
    },
    {
        name: "Homelab Server",
        tagline:
            "Bare-metal Arch Linux server running Docker Compose services — Nginx reverse proxy, Pi-hole DNS, WireGuard VPN, n8n workflow automation, SSL, and security hardening.",
        tech: ["Arch Linux", "Docker", "WireGuard", "Nginx", "Pi-hole", "n8n"],
        github: null,
        live: null,
    },
    {
        name: "ozzy portfolio",
        tagline:
            "Portfolio CMS for a 3D animator — public gallery with admin dashboard for managing content.",
        tech: ["React", "Vite", "Supabase", "Tailwind"],
        github: "https://github.com/ticusb/ozzy-portfolio",
        live: null,
    },
    {
        name: "mediaForge",
        tagline:
            "Media editing platform with JWT auth and an async Redis job queue for processing.",
        tech: ["React", "Rust", "Axum", "PostgreSQL", "Redis"],
        github: "https://github.com/ticusb/mediaForge",
        live: null,
    },
];

export default projects;
