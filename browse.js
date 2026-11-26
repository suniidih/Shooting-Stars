/* Browse page: search movies and shows, see cast, creators and synopsis */
const OMDB_KEY = ""; // optional: free key from omdbapi.com/apikey.aspx enables movie search
let shownResults = [];
// TVMaze sends the synopsis with HTML tags in it, so remove them
const stripHtml = h => new DOMParser().parseFromString(h || "", "text/html").body.textContent.trim();
// Sample films from data.json plus the user's own projects
const getLocalFilms = () => [...myProjects, ...sampleFilms].map(f => ({ src: "local", title: f.title, type: f.type || "Movie", year: f.year, image: f.image || "", syn: f.synopsis, creators: [f.director], cast: [] }));
const card = (f, i) => `<button class="card" data-i="${i}">${f.image ? thumb(f.image) : ""}<h3>${escapeHtml(f.title)}</h3><p class="meta">${escapeHtml(f.type)}${f.year ? ", " + escapeHtml(f.year) : ""}</p></button>`;
function showList(list, note) { shownResults = list; getEl("#bnote").textContent = note || ""; getEl("#grid").innerHTML = list.length ? list.map(card).join("") : (note ? '<p class="empty">Nothing here yet. Search for a movie or show above, or add your own project.</p>' : '<p class="empty">Nothing found. Try another title.</p>'); }
getEl("#sform").addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = getEl("#q").value.trim(), t = getEl("#type").value;
    if (!q) {
        showList(getLocalFilms(), "Featured projects");
        return;
    }
    getEl("#bnote").textContent = "Searching…";
    let out = getLocalFilms().filter(f => f.title.toLowerCase().includes(q.toLowerCase()) && (!t || f.type.toLowerCase() === t)), note = "";
    try {
        if (t !== "movie") {
            const r = await (await fetch("https://api.tvmaze.com/search/shows?q=" + encodeURIComponent(q))).json();
            out = out.concat(r.map(({ show: s }) => ({ src: "tv", id: s.id, title: s.name, type: "Show", year: (s.premiered || "").slice(0, 4), image: s.image?.medium || "", syn: stripHtml(s.summary) })));
        }
        if (t !== "show") {
            if (OMDB_KEY) {
                const r = await (await fetch(`https://www.omdbapi.com/?apikey=${OMDB_KEY}&type=movie&s=${encodeURIComponent(q)}`)).json();
                out = out.concat((r.Search || []).map(m => ({ src: "omdb", id: m.imdbID, title: m.Title, type: "Movie", year: m.Year, image: m.Poster !== "N/A" ? m.Poster : "" })));
            }
            else
                note = "Movie search needs a free OMDb key (see OMDB_KEY at the top of the script). Shows and your projects are searched.";
        }
    }
    catch (err) {
        note = "Could not reach the search service. Check your connection.";
    }
    showList(out, note);
});
getEl("#grid").addEventListener("click", async (e) => {
    const b = e.target.closest("[data-i]");
    if (!b)
        return;
    let f = { ...shownResults[+b.dataset.i] };
    const d = getEl("#dlg");
    d.innerHTML = "<p>Loading…</p>";
    d.showModal();
    try {
        if (f.src === "tv") {
            const s = await (await fetch(`https://api.tvmaze.com/shows/${f.id}?embed[]=cast&embed[]=crew`)).json();
            f.cast = s._embedded.cast.slice(0, 12).map(c => c.person.name + (c.character ? " as " + c.character.name : ""));
            f.creators = s._embedded.crew.filter(c => c.type === "Creator").map(c => c.person.name);
            f.image = s.image?.original || f.image;
        }
        if (f.src === "omdb") {
            const m = await (await fetch(`https://www.omdbapi.com/?apikey=${OMDB_KEY}&i=${f.id}&plot=full`)).json();
            f.cast = (m.Actors || "").split(", ").filter(x => x && x !== "N/A");
            f.creators = [m.Director, m.Writer].join(", ").split(", ").filter(x => x && x !== "N/A");
            f.syn = m.Plot;
        }
    }
    catch (err) { }
    d.innerHTML = `<h2>${escapeHtml(f.title)}</h2><p class="meta">${escapeHtml(f.type)}${f.year ? ", " + escapeHtml(f.year) : ""}</p>
  <div class="dl">${f.image ? `<img src="${escapeHtml(f.image)}" alt="Poster for ${escapeHtml(f.title)}">` : ""}<div style="flex:1;min-width:200px"><h3>Creators</h3><p>${escapeHtml((f.creators || []).join(", ") || "Not listed")}</p><h3 style="margin-top:.75rem">Cast</h3><p>${escapeHtml((f.cast || []).join(", ") || "Not listed")}</p></div></div>
  <h3>Synopsis</h3><p>${escapeHtml(f.syn || "No synopsis available.")}</p><button class="pill sm" style="margin-top:1rem" onclick="this.closest('dialog').close()">Close</button>`;
});

(async () => {
    try { sampleFilms = await (await fetch("data.json")).json(); } catch (e) { }
    showList(getLocalFilms(), "Featured projects");
})();
