// The crayon panel that opens over the world: the about card, the projects list, and a project's detail.
// Everything is built with textContent, never innerHTML; project data comes from src/data/projects.js.
export function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function link(href, text, external) { var a = el("a", null, text); a.href = href; if (external) { a.target = "_blank"; a.rel = "noreferrer"; } return a; }

export function createPanel(byId, PROJECTS, onPick) {
  var panelEl = byId("panel"), panelBody = byId("panel-body"), panelBack = byId("panel-close");
  function fillPanel(title, build) {
    panelBody.textContent = "";
    var h = el("h2", "panel-title", title); h.id = "panel-title"; h.tabIndex = -1;
    panelBody.appendChild(h); build(panelBody);
    panelEl.hidden = false; panelEl.scrollTop = 0; h.focus({ preventScroll: true });
  }
  function aboutPanel() {
    fillPanel("about", function (b) {
      b.appendChild(el("p", "panel-lede", "I'm Ticus. D365 developer · Colorado State ’24."));
      b.appendChild(el("p", null, "Enterprise ERP solutions by day. Creative of anything and everything by night."));
      b.appendChild(el("h3", null, "what I work with"));
      var dl = el("dl", "panel-stack");
      [["languages", "JavaScript, TypeScript, Python, Rust, Java, C#, C/C++, X++, SQL"], ["frontend", "React, Next.js, React Native, Tailwind, Vite"], ["backend", "Node.js, Fastify, Axum, Flask, Express"], ["infra", "AWS, Azure, Docker, Linux, Git"]].forEach(function (r) { var d = el("div"); d.appendChild(el("dt", null, r[0])); d.appendChild(el("dd", null, r[1])); dl.appendChild(d); });
      b.appendChild(dl);
      b.appendChild(el("h3", null, "find me"));
      var ul = el("ul", "panel-links");
      [["https://git.ticusb.com/repos", "git ↗", true], ["https://linkedin.com/in/ticus", "linkedin ↗", true], ["mailto:LeviticusB02@gmail.com", "email", false]].forEach(function (l) { var li = el("li"); li.appendChild(link(l[0], l[1], l[2])); ul.appendChild(li); });
      b.appendChild(ul);
    });
  }
  function projectsPanel(worldName) {
    fillPanel("projects", function (b) {
      b.appendChild(el("p", "panel-lede", worldName === "space" ? "Every constellation is something I made. Click one." : "Every snow sculpture is something I made. Click one."));
      var ul = el("ul", "panel-list");
      PROJECTS.forEach(function (p) {
        var li = el("li"), btn = el("button", null, p.name); btn.type = "button";
        btn.appendChild(el("span", "panel-status", p.status));
        btn.addEventListener("click", function () { onPick(p.slug); });
        li.appendChild(btn); ul.appendChild(li);
      });
      b.appendChild(ul);
      var more = el("p", "panel-more"); more.appendChild(link("#/projects", "see them all as a list →")); b.appendChild(more);
    });
  }
  // returns false for an unknown slug
  function projectPanel(slug) {
    var p = PROJECTS.find(function (x) { return x.slug === slug; });
    if (!p) return false;
    fillPanel(p.name, function (b) {
      b.appendChild(el("p", "panel-lede", p.summary));
      b.appendChild(el("p", "panel-meta", [p.status, p.period, p.role].filter(Boolean).join(" · ")));
      var links = el("ul", "panel-links");
      [["live", "live site"], ["store", "app store"], ["github", "github"]].forEach(function (k) {
        var href = p.links && p.links[k[0]];
        if (typeof href === "string" && /^https:\/\//.test(href)) { var li = el("li"); li.appendChild(link(href, k[1] + " ↗", true)); links.appendChild(li); }
      });
      if (links.children.length) b.appendChild(links);
      if (p.problem) { b.appendChild(el("h3", null, "why")); b.appendChild(el("p", null, p.problem)); }
      if (p.approach) { b.appendChild(el("h3", null, "how I built it")); b.appendChild(el("p", null, p.approach)); }
      if (p.outcome && p.outcome.length) { b.appendChild(el("h3", null, "where it's at")); var ol = el("ul", "panel-bullets"); p.outcome.forEach(function (o) { ol.appendChild(el("li", null, o)); }); b.appendChild(ol); }
      if (p.stack && p.stack.length) b.appendChild(el("p", "panel-meta", p.stack.join(" · ")));
      var more = el("p", "panel-more"); more.appendChild(link("#/work/" + p.slug, "read the whole thing →")); b.appendChild(more);
    });
    panelBack.textContent = "← all projects";
    return true;
  }
  return { el: panelEl, back: panelBack, about: aboutPanel, projects: projectsPanel, project: projectPanel };
}
