import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath } from "node:url";

// The package stays CommonJS for CRA, so load only these ESM sources as modules:
// the case-study data file and the Vercel functions under api/.
const dataModule = fileURLToPath(
    new URL("../src/data/projects.js", import.meta.url),
);
const apiRoot = new URL("../api/", import.meta.url).href;

registerHooks({
    load(url, context, nextLoad) {
        if (url.startsWith("file:") && fileURLToPath(url) === dataModule) {
            return {
                format: "module",
                shortCircuit: true,
                source: readFileSync(dataModule, "utf8"),
            };
        }

        if (url.startsWith(apiRoot) && new URL(url).pathname.endsWith(".js")) {
            return nextLoad(url, { ...context, format: "module" });
        }

        return nextLoad(url, context);
    },
});
