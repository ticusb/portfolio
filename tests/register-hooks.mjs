import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath } from "node:url";

const dataModule = fileURLToPath(
    new URL("../src/data/projects.js", import.meta.url),
);

registerHooks({
    load(url, context, nextLoad) {
        if (url.startsWith("file:") && fileURLToPath(url) === dataModule) {
            return {
                format: "module",
                shortCircuit: true,
                source: readFileSync(dataModule, "utf8"),
            };
        }

        return nextLoad(url, context);
    },
});
