import assert from "node:assert/strict";
import test from "node:test";

import projects, {
    AUDIENCES,
    PROJECT_STATUSES,
    getProjectBySlug,
    getProjectPath,
} from "../src/data/projects.js";

const requiredStringFields = [
    "slug",
    "name",
    "period",
    "role",
    "forWhom",
    "summary",
    "problem",
    "approach",
];
const linkNames = ["live", "github", "store"];

function assertNullableUrl(value, field) {
    assert.ok(value === null || typeof value === "string", `${field} is nullable text`);
    if (value !== null) assert.doesNotThrow(() => new URL(value), `${field} is a URL`);
}

test("every project matches the case-study model", () => {
    assert.ok(projects.length > 0);

    for (const project of projects) {
        for (const field of requiredStringFields) {
            assert.equal(typeof project[field], "string", `${project.name}.${field}`);
            assert.ok(project[field].trim(), `${project.name}.${field} is not empty`);
        }

        assert.match(project.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
        assert.ok(PROJECT_STATUSES.includes(project.status), `${project.name}.status`);
        assert.ok(Array.isArray(project.outcome), `${project.name}.outcome`);
        assert.ok(project.outcome.every((item) => typeof item === "string" && item.trim()));
        assert.ok(Array.isArray(project.stack) && project.stack.length > 0, `${project.name}.stack`);
        assert.ok(project.stack.every((item) => typeof item === "string" && item.trim()));
        assert.equal(typeof project.links, "object", `${project.name}.links`);
        for (const link of linkNames) assertNullableUrl(project.links[link], `${project.name}.links.${link}`);
        assert.ok(Array.isArray(project.evidence), `${project.name}.evidence`);
        assert.ok(
            project.evidence.every(
                (item) =>
                    typeof item?.label === "string" &&
                    item.label.trim() &&
                    typeof item?.value === "string" &&
                    item.value.trim(),
            ),
            `${project.name}.evidence entries`,
        );
        assert.equal(typeof project.featured, "boolean", `${project.name}.featured`);
        assert.ok(Array.isArray(project.audience) && project.audience.length > 0);
        assert.ok(project.audience.every((item) => AUDIENCES.includes(item)));
        assert.equal(typeof project.draft, "boolean", `${project.name}.draft`);
    }
});

test("project slugs are unique", () => {
    const slugs = projects.map(({ slug }) => slug);
    assert.equal(new Set(slugs).size, slugs.length);
});

test("every featured project has an outcome", () => {
    for (const project of projects.filter(({ featured }) => featured)) {
        assert.ok(project.outcome.length > 0, project.name);
    }
});

test("every project route resolves to its project", () => {
    for (const project of projects) {
        assert.equal(getProjectPath(project), `/work/${project.slug}`);
        assert.equal(getProjectBySlug(project.slug), project);
    }
});

test("invalid and unknown route slugs do not resolve", () => {
    for (const slug of [undefined, "", "../admin", "V1 Ready", "not-a-project"]) {
        assert.equal(getProjectBySlug(slug), null);
    }
});

test("published case studies are complete", () => {
    for (const project of projects.filter(({ draft }) => !draft)) {
        assert.notEqual(project.problem, "TODO", project.name);
        assert.notEqual(project.approach, "TODO", project.name);
        assert.ok(project.outcome.length > 0, project.name);
    }

    const v1 = getProjectBySlug("v1-ready");
    assert.ok(v1.links.store);
    assert.ok(v1.evidence.length > 0);
});

test("draft stubs stay visibly unfinished", () => {
    for (const stub of projects.filter(({ draft }) => draft)) {
        assert.equal(stub.problem, "TODO");
        assert.equal(stub.approach, "TODO");
        assert.deepEqual(stub.outcome, []);
    }
});
