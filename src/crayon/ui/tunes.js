// The music line: what I'm playing (/api/now-playing), and a box to recommend me a song
// (/api/search-songs, /api/add-song). It only shows at home; the rec box opens when asked.
export function createTunes(byId, listen, isAlive, onCleanup) {
  var tunesEl = byId("tunes"), tunesTrack = byId("tunes-track"), tunesLabel = byId("tunes-label");
  var recToggle = byId("rec-toggle");
  var recForm = byId("rec-form"), recQ = byId("rec-q"), recList = byId("rec-results"), recStatus = byId("rec-status");
  var tunesTimer = 0, searchTimer = 0, searchSeq = 0, recBusy = false;
  onCleanup(function () { clearInterval(tunesTimer); clearTimeout(searchTimer); });
  function loadPlaying() {
    fetch("/api/now-playing")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!isAlive()) return;
        var tr = d && (d.current || (d.recent && d.recent[0]));
        if (!tr) { tunesLabel.textContent = "now playing"; tunesTrack.textContent = "nothing right now"; return; }
        tunesLabel.textContent = d.current ? "now playing" : "last played";
        tunesTrack.textContent = tr.title + (tr.artist ? " — " + tr.artist : "");
      })
      .catch(function () { if (isAlive()) tunesTrack.textContent = "the radio's off right now"; });
  }
  function setRecOpen(open) {
    recForm.hidden = !open;
    recToggle.setAttribute("aria-expanded", String(open));
    recToggle.textContent = open ? "never mind" : "rec me a song \u2192";
    if (open) recQ.focus(); else { closeResults(); recStatus.textContent = ""; }
  }
  listen(recToggle, "click", function () { setRecOpen(recForm.hidden); });
  function showTunes(on) {
    tunesEl.hidden = !on;
    if (!on && !recForm.hidden) setRecOpen(false);
    clearInterval(tunesTimer);
    if (on) { loadPlaying(); tunesTimer = setInterval(function () { if (!document.hidden) loadPlaying(); }, 30000); }
  }
  function closeResults() { recList.hidden = true; recList.textContent = ""; }
  function addSong(track) {
    if (recBusy) return;
    recBusy = true; closeResults(); recQ.value = ""; recStatus.textContent = "sending…";
    fetch("/api/add-song", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uri: track.uri, name: track.name, artist: track.artist }) })
      .then(function (r) {
        if (!isAlive()) return;
        recStatus.textContent = r.ok ? "added “" + track.name + "” to my recs. thank you!" : r.status === 429 ? "that's a lot of recs. try again later." : "couldn't add that one. try again?";
      })
      .catch(function () { if (isAlive()) recStatus.textContent = "couldn't reach the server. try again?"; })
      .then(function () { recBusy = false; });
  }
  function renderResults(tracks) {
    recList.textContent = "";
    tracks.slice(0, 5).forEach(function (t) {
      if (!t || typeof t.uri !== "string" || typeof t.name !== "string") return;
      var li = document.createElement("li"), b = document.createElement("button");
      b.type = "button"; b.textContent = t.name + (t.artist ? " — " + t.artist : "");
      b.addEventListener("click", function () { addSong(t); });
      li.appendChild(b); recList.appendChild(li);
    });
    recList.hidden = !recList.children.length;
    if (!recList.children.length) recStatus.textContent = "no matches";
  }
  listen(recQ, "input", function () {
    var q = recQ.value.trim().slice(0, 100);
    clearTimeout(searchTimer); recStatus.textContent = "";
    if (!q) { closeResults(); return; }
    searchTimer = setTimeout(function () {
      var seq = ++searchSeq;
      fetch("/api/search-songs?q=" + encodeURIComponent(q))
        .then(function (r) {
          // a 429 or an outage isn't "no matches"
          if (r.ok) return r.json();
          throw new Error(r.status === 429 ? "busy" : "down");
        })
        .then(function (d) { if (isAlive() && seq === searchSeq) renderResults((d && Array.isArray(d.tracks)) ? d.tracks : []); })
        .catch(function (err) {
          if (!isAlive() || seq !== searchSeq) return;
          closeResults();
          recStatus.textContent = err && err.message === "busy" ? "that's a lot of searching. try again in a minute." : "search is down right now";
        });
    }, 350);
  });
  listen(recQ, "keydown", function (e) { if (e.key === "Escape") { if (!recList.hidden) closeResults(); else { setRecOpen(false); recToggle.focus(); } } });
  listen(recForm, "submit", function (e) { e.preventDefault(); var first = recList.querySelector("button"); if (first) first.click(); });
  return showTunes;
}
