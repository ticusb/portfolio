export const PROJECT_STATUSES = ["live", "building", "shipped", "paused", "archived"];
export const AUDIENCES = ["hiring", "client"];

const projects = [
    {
        slug: "v1-ready",
        name: "V1 Ready",
        status: "live",
        period: "February 2026–present",
        role: "Developer",
        forWhom: "Airline pilots getting ready for interviews",
        summary: "An interview coach for airline pilots. It's on the App Store and people actually use it.",
        problem: "Pilot interview prep is scattered across question banks, flashcards, practicing out loud, and feedback that depends on who you ask. I wanted one place where you rehearse real answers and find out what's actually weak about how you deliver them.",
        approach: "It's an Expo and React Native app on iOS, backed by a Fastify API and Supabase. Every answer gets scored two ways: a rubric-driven model grades what you said, and a deterministic scorer grades how you said it, normalized for length so rambling doesn't win. RevenueCat handles subscriptions, PostHog and Sentry tell me what's going on in production, and the webhooks retry, because payments are not where you want to drop events.",
        outcome: [
            "Version 1.0 went live on the App Store in August 2026.",
            "11 ratings, all five stars, as of September 23, 2026.",
            "By the end of August it was serving 2,453 questions and 44 scenarios across 20 airlines."
        ],
        stack: [
            "React Native",
            "Expo",
            "TypeScript",
            "Fastify",
            "Supabase",
            "RevenueCat",
            "PostHog"
        ],
        links: {
            "live": "https://v1consultingco.com",
            "github": null,
            "store": "https://apps.apple.com/us/app/v1-ready/id6793141918"
        },
        evidence: [
            {
                "label": "Released",
                "value": "App Store version 1.0, August 25, 2026",
                "url": "https://apps.apple.com/us/app/v1-ready/id6793141918"
            },
            {
                "label": "Ratings",
                "value": "11 ratings at 5.0 stars, September 23, 2026",
                "url": "https://apps.apple.com/us/app/v1-ready/id6793141918"
            },
            {
                "label": "In production",
                "value": "23 profiles, 2,453 questions, 44 scenarios and 20 airlines on August 31, 2026",
                "url": null
            }
        ],
        featured: true,
        audience: [
            "hiring",
            "client"
        ],
        active: true,
        draft: false,
    },
    {
        slug: "qb-import",
        name: "qb-import",
        status: "shipped",
        period: "April–September 2026",
        role: "Developer (freelance)",
        forWhom: "A family friend who runs a group of quick-lube shops",
        summary: "Turns a day of oil-change sales into a QuickBooks entry with one click.",
        problem: "Every day someone had to take the sales and deposit reports out of AutoPoll, the shops' point-of-sale system, and key them into QuickBooks by hand, one line at a time, for every store.",
        approach: "AutoPoll doesn't have an API, so the tool logs in and reads the reports the same way a person would, with requests and BeautifulSoup. It maps every sales code, discount and payment type to the right QuickBooks account and writes a journal entry file ready to import. It started as a command-line script and became a Tkinter desktop app built into a Windows .exe by GitHub Actions, so nobody has to install Python. You pick a date and the stores, then click one button. Mappings are editable in the app, and it refuses to generate anything when sales and deposits don't balance.",
        outcome: [
            "Delivered as a double-click Windows app, with dates and stores already filled in for a normal day.",
            "A day that doesn't balance gets flagged instead of landing in the books.",
            "20 tests gate every change in CI."
        ],
        stack: [
            "Python",
            "Tkinter",
            "BeautifulSoup",
            "PyInstaller",
            "GitHub Actions",
            "pytest"
        ],
        links: {
            "live": null,
            "github": null,
            "store": null
        },
        evidence: [],
        featured: true,
        audience: [
            "hiring",
            "client"
        ],
        active: false,
        draft: false,
    },
    {
        slug: "habitgotchi",
        name: "HabitGotchi",
        status: "building",
        period: "April 2026–present",
        role: "Designer and developer",
        forWhom: "Me, and maybe other people someday",
        summary: "A Tamagotchi that lives or dies by your habits, on an e-paper handheld I'm building.",
        problem: "Habit apps are full of ads and skipping a day costs nothing. I wanted skipping to actually feel like something, so the thing that suffers is a little pet you're responsible for.",
        approach: "It's C++ on an ESP32-S3 with an 800x480 e-paper screen, built with PlatformIO. The board came with no real docs, so I worked out its screen, clock, battery chip and sensors by dumping the factory firmware. Habits are split into morning, evening and anytime blocks, and the pet grows as you keep them. It keeps real time on the onboard clock and drops to a sleep screen when you put it down. E-paper can't do fast animation, so everything is designed around one gesture in, one frame out. There's a Python pixel-art pipeline that turns drawings into sprites, a couple of mini games (Echo and Connect 4) written as plain testable logic, and an e-reader with its own book format. The case is a 3D-printed shell I'm adapting to stick to the back of my phone with MagSafe.",
        outcome: [
            "Running on the hardware: habit list, a pet that grows, a sleep screen and settings.",
            "Echo, Connect 4 and the e-reader are in, with unit tests.",
            "Next up is the MagSafe case and more games."
        ],
        stack: [
            "C++",
            "ESP32-S3",
            "PlatformIO",
            "E-paper",
            "Python",
            "3D printing"
        ],
        links: {
            "live": null,
            "github": null,
            "store": null
        },
        evidence: [],
        featured: false,
        audience: [
            "hiring"
        ],
        active: true,
        draft: false,
    },
    {
        slug: "this-is-art",
        name: "this-is-art",
        status: "live",
        period: "August 2025–present",
        role: "Artist and developer",
        forWhom: "Anyone who wants to look at my art",
        summary: "My artwork on an endless grid you drag around.",
        problem: "I wanted my art online as a place you wander around in, not a feed you scroll past.",
        approach: "It's a Next.js app that lays every piece out on a grid that keeps going in every direction, with the images served from Google Drive. Only the tiles on screen actually render, the ones nearby preload, and panning has momentum so it feels like sliding paper across a table. Mouse, scroll wheel, touch and arrow or WASD keys all work, and pieces tilt when you hover them.",
        outcome: [
            "Live at art.ticusb.com, and it's the Art page on this site too.",
            "Reworked in July 2026 to make it faster and let you select photos in place."
        ],
        stack: [
            "Next.js",
            "React",
            "Tailwind",
            "Google Drive API"
        ],
        links: {
            "live": "https://art.ticusb.com",
            "github": null,
            "store": null
        },
        evidence: [
            {
                "label": "Live",
                "value": "art.ticusb.com",
                "url": "https://art.ticusb.com"
            }
        ],
        featured: false,
        audience: [
            "hiring"
        ],
        active: false,
        draft: false,
    },
    {
        slug: "rust-http-client",
        name: "Rust HTTP client",
        status: "paused",
        period: "May–October 2024",
        role: "Developer",
        forWhom: "Me, mostly. It's how I'm learning Rust",
        summary: "Chapter one of building a web browser from scratch, in Rust.",
        problem: "I wanted to know what a browser actually does when you hit enter, and I needed an excuse to learn Rust properly.",
        approach: "I'm working through the browser.engineering textbook in Rust instead of the book's Python, which is harder in exactly the ways I was hoping for. So far it parses URLs and loads http, https, file, data and view-source addresses through one shared trait, decodes HTML entities, and prints a page's text or its raw source. Clippy and the unit tests run in GitHub Actions, mostly so Clippy can yell at me.",
        outcome: [
            "Chapter one is done: it fetches a page over HTTP or HTTPS and shows you the text.",
            "Layout and rendering are next, whenever I get back to it."
        ],
        stack: [
            "Rust",
            "TCP",
            "TLS",
            "HTTP",
            "GitHub Actions"
        ],
        links: {
            "live": null,
            "github": "https://github.com/ticusb/browser",
            "store": null
        },
        evidence: [
            {
                "label": "Source",
                "value": "github.com/ticusb/browser",
                "url": "https://github.com/ticusb/browser"
            }
        ],
        featured: false,
        audience: [
            "hiring"
        ],
        active: false,
        draft: false,
    },
    {
        slug: "homelab-server",
        name: "Homelab Server",
        status: "live",
        period: "Ongoing",
        role: "Builder and the only admin",
        forWhom: "My household, plus family and friends I share media with",
        summary: "A 2010 Mac Pro running way more of my life than it should.",
        problem: "I wanted my media, passwords and documents to be mine instead of rented, and I wanted to reach them from anywhere without opening up more than I had to.",
        approach: "It runs Arch Linux on a 2010 Mac Pro, with the OS on mirrored SSDs and media on a mirrored 8 TB array. Everything lives in Docker Compose: Jellyfin with GPU transcoding, a music server, the *arr stack, Vaultwarden, Paperless-ngx and Pi-hole. Anything admin-facing stays behind WireGuard, certificates come from DNS challenges, and guests get a VPN profile that can only see the media front end. And yes, I keep adding services it doesn't need.",
        outcome: [
            "Streams movies, TV and music to my family's TVs and phones.",
            "Encrypted backups go offsite every night, and I've actually tested a full restore (July 2026).",
            "Runs a small crew of AI agents that sort my mail, plan my running and handle routine maintenance."
        ],
        stack: [
            "Arch Linux",
            "Docker",
            "WireGuard",
            "Pi-hole",
            "Jellyfin",
            "Nginx Proxy Manager"
        ],
        links: {
            "live": null,
            "github": null,
            "store": null
        },
        evidence: [],
        featured: false,
        audience: [
            "hiring"
        ],
        active: true,
        draft: false,
    },
    {
        slug: "ozzy-portfolio",
        name: "ozzy portfolio",
        status: "shipped",
        period: "May–October 2025",
        role: "Developer",
        forWhom: "Ozzy Tague, 3D animator and VFX artist",
        summary: "A portfolio for a 3D animator that he runs himself.",
        problem: "My friend Ozzy needed a portfolio for his animation and design work that he could update on his own, instead of texting me every time he finished something.",
        approach: "React and Vite up front, with Supabase for the database, file storage and login. Visitors get a responsive grid and a full-screen page for every video or image. Ozzy gets a hidden admin dashboard where he adds, edits and removes his own work. The way in is an easter egg, because of course it is.",
        outcome: [
            "Shipped on Vercel and handed off for Ozzy to run himself."
        ],
        stack: [
            "React",
            "Vite",
            "Supabase",
            "Tailwind"
        ],
        links: {
            "live": null,
            "github": null,
            "store": null
        },
        evidence: [],
        featured: false,
        audience: [
            "hiring",
            "client"
        ],
        active: false,
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

export function getActiveProjects() {
    return projects.filter((project) => project.active);
}

export function getProjectPath(project) {
    return `/work/${project.slug}`;
}

export default projects;