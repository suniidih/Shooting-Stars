/* Your Projects page: summary rings, search and a compact list of projects */
const listEl = getEl("#plist");

function renderMyProjects() {
    const done = myProjects.filter(p => projectPercent(p) === 100).length;
    getEl("#sum").innerHTML = myProjects.length
        ? `<div>${progressRing(Math.round(done / myProjects.length * 100), 72)}<span>${done} of ${myProjects.length} completed</span></div>
           <div>${progressRing(average(myProjects.map(projectPercent)), 72)}<span>Average progress</span></div>`
        : "";
    getEl("#ptools").hidden = !myProjects.length;

    const q = getEl("#pq").value.trim().toLowerCase(), status = getEl("#pstatus").value, sort = getEl("#psort").value;
    let list = myProjects.filter(p =>
        (!q || (p.title + " " + p.director).toLowerCase().includes(q)) &&
        (!status || (status === "done" ? projectPercent(p) === 100 : projectPercent(p) < 100)));
    if (sort === "progress") list = [...list].sort((a, b) => projectPercent(b) - projectPercent(a));

    if (!myProjects.length) {
        listEl.innerHTML = '<p class="empty">No projects yet. <a href="add.html">Add your first project</a> to start tracking it.</p>';
        return;
    }
    listEl.innerHTML = list.length ? list.map(p => `<article class="pcard">
        <a class="plink" href="project.html?id=${escapeHtml(p.id)}">${thumb(p.image, "pthumb")}
          <div class="pinfo"><h3>${escapeHtml(p.title)}</h3><p class="meta">${escapeHtml(p.type)} by ${escapeHtml(p.director)}, ${escapeHtml(p.year)}</p><span class="tag">${escapeHtml(p.genre)}</span></div>
          ${progressRing(projectPercent(p), 56)}</a>
        <button class="rm" data-del="${escapeHtml(p.id)}" aria-label="Remove ${escapeHtml(p.title)}">Remove</button></article>`).join("")
        : '<p class="empty">No projects match your search.</p>';
}

listEl.addEventListener("click", e => {
    const b = e.target.closest("[data-del]");
    if (!b || !confirm("Remove this project?")) return;
    myProjects = myProjects.filter(p => p.id !== b.dataset.del);
    saveProjects();
    renderMyProjects();
});
["#pq", "#pstatus", "#psort"].forEach(s => getEl(s).addEventListener("input", renderMyProjects));
renderMyProjects();
