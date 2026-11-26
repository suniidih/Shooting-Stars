/* Single project page (project.html?id=...): progress steps, budget, festivals, feedback and notes */
// The page for a single project: progress steps, budget, festivals, feedback and notes
function openProjectPage(id) {
    const p = myProjects.find(x => x.id === id);
    if (!p) {
        location.href = "projects.html";
        return;
    }
    getEl("#v-detail").innerHTML = `<div class="wrap"><a class="back" href="projects.html">← Back to your projects</a>
  <div class="dhead">${thumb(p.image)}<div><h2>${escapeHtml(p.title)}</h2><p class="meta">${escapeHtml(p.type)} by ${escapeHtml(p.director)}, ${escapeHtml(p.year)}, ${escapeHtml(p.genre)}</p><p class="syn">${escapeHtml(p.synopsis)}</p>
  <label style="margin-top:.75rem;max-width:260px">Change image<input id="chimg" type="file" accept="image/*"></label></div><div id="big">${progressRing(projectPercent(p), 140)}</div></div>
  ${PHASES.map((ph, n) => `<div class="phase"><h3>${ph[0]}<span id="ph${n}">${phasePercent(p, ph)}%</span></h3>${ph[1].map(s => s[2] === "c"
        ? `<label class="step"><input type="checkbox" data-s="${s[0]}" ${stepValue(p, s[0]) ? "checked" : ""}><span class="lbl">${s[1]}</span></label>`
        : `<label class="step"><span class="lbl">${s[1]}</span><input type="range" min="0" max="100" step="5" data-s="${s[0]}" value="${stepValue(p, s[0])}"><output id="o-${s[0]}">${stepValue(p, s[0])}%</output></label>`).join("")}</div>`).join("")}
  <div id="extra">${renderExtraSections(p)}</div><label>Notes<textarea id="notes" rows="3">${escapeHtml(p.notes || "")}</textarea></label>
  <div class="row" style="margin:1rem 0 3rem"><button class="pill" id="sv">Save progress</button><button class="rm" id="dl">Delete project</button></div><p id="dmsg" role="status"></p></div>`;
    const v = getEl("#v-detail"), upd = () => { getEl("#big").innerHTML = progressRing(projectPercent(p), 140); PHASES.forEach((ph, n) => getEl("#ph" + n).textContent = phasePercent(p, ph) + "%"); };
    v.oninput = e => {
        const t = e.target;
        if (t.dataset.s) {
            p.steps[t.dataset.s] = t.type === "checkbox" ? (t.checked ? 100 : 0) : +t.value;
            const o = getEl("#o-" + t.dataset.s);
            if (o)
                o.textContent = t.value + "%";
            upd();
            saveProjects();
        }
        if (t.id === "notes") {
            p.notes = t.value;
            saveProjects();
        }
    };
    wireExtra(p);
    getEl("#sv").onclick = () => { getEl("#dmsg").textContent = saveProjects() ? "Progress saved." : "Storage is full. Remove a project or use a smaller image."; };
    getEl("#dl").onclick = () => { if (confirm("Delete this project?")) {
        myProjects = myProjects.filter(x => x.id !== id);
        saveProjects();
        location.href = "projects.html";
    } };
    getEl("#chimg").onchange = async (e) => { if (e.target.files[0]) {
        p.image = await shrinkImage(e.target.files[0]);
        saveProjects();
        openProjectPage(id);
    } };
}
/* Budget, festivals and feedback (project page) */
const formatNumber = n => Number(n).toLocaleString();
// Turns a deadline date into text like "12 days left"
function daysLeft(d) { const n = Math.ceil((new Date(d + "T00:00") - new Date().setHours(0, 0, 0, 0)) / 864e5); return n < 0 ? "deadline passed" : n === 0 ? "due today" : n + " days left"; }
function renderExtraSections(p) {
    const b = p.budget || { total: 0, items: [] }, spent = b.items.reduce((a, i) => a + i.amt, 0), left = b.total - spent, used = b.total ? Math.min(100, Math.round(spent / b.total * 100)) : 0;
    const fe = (p.fests || []).slice().sort((a, b) => a.deadline.localeCompare(b.deadline)), fb = p.feedback || [];
    return `<div class="phase"><h3>Budget<span>${used}% used</span></h3>
  <div class="step"><span class="lbl">Total budget</span><input type="number" min="0" id="btotal" value="${b.total || ""}"></div>
  <div class="bar"><i style="width:${used}%"></i></div>
  <p class="meta">Spent ${formatNumber(spent)}, ${left < 0 ? "over budget by " + formatNumber(-left) : "remaining " + formatNumber(left)}</p>
  ${b.items.map(i => `<div class="step"><span class="lbl">${escapeHtml(i.label)}</span><span>${formatNumber(i.amt)}</span><button class="rm" data-bdel="${i.id}">Remove</button></div>`).join("")}
  <div class="step"><input id="blabel" placeholder="Expense, e.g. camera hire" maxlength="60" aria-label="Expense"><input id="bamt" type="number" min="0" placeholder="Amount" aria-label="Amount"><button class="pill sm" id="badd">Add</button></div></div>
  <div class="phase"><h3>Festivals and submissions</h3>
  ${fe.map(f => `<div class="step"><span class="lbl">${escapeHtml(f.name)}</span><span class="meta">${escapeHtml(f.deadline)}, ${daysLeft(f.deadline)}${f.fee ? ", fee " + formatNumber(f.fee) : ""}</span><select data-fst="${f.id}" aria-label="Status">${["Planned", "Submitted", "Accepted", "Rejected"].map(x => `<option ${x === f.status ? "selected" : ""}>${x}</option>`).join("")}</select><button class="rm" data-fdel="${f.id}">Remove</button></div>`).join("") || '<p class="meta">No festivals added yet.</p>'}
  <div class="step"><input id="fname" placeholder="Festival or platform" maxlength="60" aria-label="Festival name"><input id="fdate" type="date" aria-label="Deadline"><input id="ffee" type="number" min="0" placeholder="Fee" aria-label="Fee"><button class="pill sm" id="fadd">Add</button></div></div>
  <div class="phase"><h3>Feedback</h3><p class="meta">Notes and comments from viewers and collaborators, saved in this browser.</p>
  ${fb.map(c => `<div class="step"><span class="lbl"><strong>${escapeHtml(c.name)}:</strong> ${escapeHtml(c.text)}</span><button class="rm" data-cdel="${c.id}">Remove</button></div>`).join("")}
  <div class="step"><input id="cname" placeholder="Name" maxlength="40" aria-label="Name"><input id="ctext" placeholder="Comment" maxlength="300" aria-label="Comment"><button class="pill sm" id="cadd">Add</button></div></div>`;
}
// Click and change handlers for the budget, festival and feedback boxes
function wireExtra(p) {
    const extraBox = getEl("#extra"), saveAndRefresh = () => { saveProjects(); extraBox.innerHTML = renderExtraSections(p); };
    extraBox.onclick = e => {
        const t = e.target, data = t.dataset;
        if (t.id === "badd") {
            const l = getEl("#blabel").value.trim(), a = +getEl("#bamt").value;
            if (l && a > 0) {
                (p.budget = p.budget || { total: 0, items: [] }).items.push({ id: makeId(), label: l, amt: a });
                saveAndRefresh();
            }
        }
        if (data.bdel) {
            p.budget.items = p.budget.items.filter(i => i.id !== data.bdel);
            saveAndRefresh();
        }
        if (t.id === "fadd") {
            const n = getEl("#fname").value.trim(), dt = getEl("#fdate").value;
            if (n && dt) {
                (p.fests = p.fests || []).push({ id: makeId(), name: n, deadline: dt, fee: +getEl("#ffee").value || 0, status: "Planned" });
                saveAndRefresh();
            }
        }
        if (data.fdel) {
            p.fests = p.fests.filter(f => f.id !== data.fdel);
            saveAndRefresh();
        }
        if (t.id === "cadd") {
            const x = getEl("#ctext").value.trim();
            if (x) {
                (p.feedback = p.feedback || []).unshift({ id: makeId(), name: getEl("#cname").value.trim() || "Anonymous", text: x });
                saveAndRefresh();
            }
        }
        if (data.cdel) {
            p.feedback = p.feedback.filter(c => c.id !== data.cdel);
            saveAndRefresh();
        }
    };
    extraBox.onchange = e => {
        const t = e.target;
        if (t.id === "btotal") {
            (p.budget = p.budget || { total: 0, items: [] }).total = Math.max(0, +t.value || 0);
            saveAndRefresh();
        }
        if (t.dataset.fst) {
            p.fests.find(f => f.id === t.dataset.fst).status = t.value;
            saveProjects();
        }
    };
}
// Which project to show comes from the address: project.html?id=p123
openProjectPage(new URLSearchParams(location.search).get("id"));
