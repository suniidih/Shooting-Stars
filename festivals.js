/* Festivals page: upcoming film festivals from festivals.json */
let festivals = [], festivalsUpdated = "";

function renderFestivals() {
    const q = getEl("#fq").value.trim().toLowerCase(), type = getEl("#ftype").value;
    const list = festivals
        .map(f => ({ f, st: festivalState(f) }))
        .filter(x => !x.st.past && (!type || x.f.types.includes(type)) &&
            (!q || (x.f.name + " " + x.f.city + " " + x.f.country).toLowerCase().includes(q)))
        .sort((a, b) => a.f.start.localeCompare(b.f.start));

    getEl("#fgrid").innerHTML = list.length ? list.map(({ f, st }) => `<article class="card">
        <span class="badge ${st.now ? "now" : ""}">${escapeHtml(st.text)}</span>
        <h3>${escapeHtml(f.name)}</h3>
        <p class="meta">${escapeHtml(f.city)}, ${escapeHtml(f.country)}</p>
        <p class="syn">${escapeHtml(datesText(f))}</p>
        <p class="meta">${escapeHtml(f.note || "")}</p>
        <div class="chips">${f.types.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>
        <div class="row">${f.website ? `<a class="rm" href="${escapeHtml(f.website)}" target="_blank" rel="noopener">Official website</a>` : "<span></span>"}
        <button class="pill sm" data-add="${escapeHtml(f.id)}">Add to project</button></div></article>`).join("")
        : '<p class="empty">No upcoming festivals match your search.</p>';
}

// Project picker: festivals are added to the project's Festivals list on its project page
const picker = getEl("#fproj");
picker.innerHTML = myProjects.length
    ? '<option value="">Choose a project</option>' + myProjects.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.title)}</option>`).join("")
    : '<option value="">No projects yet</option>';

getEl("#fgrid").addEventListener("click", e => {
    const b = e.target.closest("[data-add]");
    if (!b) return;
    const msg = getEl("#fmsg"), project = myProjects.find(p => p.id === picker.value), f = festivals.find(x => x.id === b.dataset.add);
    if (!project) { msg.textContent = "Choose one of your projects first (at the top of the page)."; return; }
    project.fests = project.fests || [];
    if (project.fests.some(x => x.name === f.name)) { msg.textContent = f.name + " is already in " + project.title + "."; return; }
    project.fests.push({ id: makeId(), name: f.name, deadline: f.start, fee: 0, status: "Planned" });
    saveProjects();
    msg.textContent = "Added " + f.name + " to " + project.title + ". The date is the festival start, so check the official site for the submission deadline.";
});

["#fq", "#ftype"].forEach(s => getEl(s).addEventListener("input", renderFestivals));

(async () => {
    try {
        const data = await (await fetch("festivals.json")).json();
        festivals = data.festivals;
        festivalsUpdated = data.updated;
        getEl("#fupdated").textContent = "List last updated " + formatDate(festivalsUpdated) + ". Festivals disappear from the list automatically once they have finished.";
    } catch (e) {
        getEl("#fgrid").innerHTML = '<p class="empty">The festival list could not be loaded.</p>';
        return;
    }
    renderFestivals();
})();
