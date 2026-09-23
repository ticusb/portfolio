import { useEffect } from "react";

export function useReveal(selector) {
    useEffect(() => {
        const elements = document.querySelectorAll(selector);
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            elements.forEach((element) => element.classList.add("visible"));
            return undefined;
        }

        const observer = new IntersectionObserver(
            (entries) =>
                entries.forEach((e) => {
                    if (e.isIntersecting) e.target.classList.add("visible");
                }),
            { threshold: 0.1 },
        );
        elements.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [selector]);
}
