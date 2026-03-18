import { useEffect } from "react";

export function useReveal(selector) {
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) =>
                entries.forEach((e) => {
                    if (e.isIntersecting) e.target.classList.add("visible");
                }),
            { threshold: 0.1 },
        );
        document
            .querySelectorAll(selector)
            .forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [selector]);
}
