/* Find crew */
const ROLES = ["Actor", "Director of Photography", "Editor", "Sound Designer", "Composer", "Screenwriter", "Production Designer", "Colourist", "VFX Artist", "Producer", "Other"];

// OPTIONAL: fill in these two lines to share crew calls with every visitor (uses a free Firebase project).
// Leave them empty and the board runs in demo mode: calls are only saved in the visitor's own browser.
const FIREBASE_PROJECT_ID = "shooting-stars-2af48";
const FIREBASE_API_KEY = "AIzaSyDXYt5crj0IUPYaCEX5CVaMlYBDAL4rL58";
const sharedMode = Boolean(FIREBASE_PROJECT_ID && FIREBASE_API_KEY);
const CREW_API = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/crewCalls`;

const CREW_KEY = "ss_crew";
let crewCalls = (() => { try {
    return JSON.parse(localStorage.getItem(CREW_KEY)) || [];
}
catch (e) {
    return [];
} })();
let sharedCalls = [];
const saveCrewCalls = () => { try {
    localStorage.setItem(CREW_KEY, JSON.stringify(crewCalls));
}
catch (e) { } };

getEl("#crole").innerHTML = '<option value="">All roles</option>' + ROLES.map(r => `<option>${r}</option>`).join("");
getEl("#cform [name=role]").innerHTML = ROLES.map(r => `<option>${r}</option>`).join("");
getEl("#cnote").textContent = sharedMode
    ? "Calls here are shared with everyone who visits the site."
    : "Demo mode: calls you post are saved in this browser only, so other visitors cannot see them.";
getEl("#cwarn").textContent = sharedMode
    ? "Anything you post, including your contact details, can be seen by every visitor. Posted calls cannot be edited or deleted."
    : "";

// Shared mode: read all calls from Firestore (newest first)
async function loadSharedCalls() {
    if (!sharedMode)
        return;
    try {
        const res = await fetch(`${CREW_API}?pageSize=100&orderBy=createdAt%20desc&key=${FIREBASE_API_KEY}`);
        if (!res.ok)
            throw new Error(res.status);
        const data = await res.json();
        sharedCalls = (data.documents || []).map(doc => {
            const f = doc.fields || {};
            const text = key => (f[key] && f[key].stringValue) || "";
            return { id: doc.name.split("/").pop(), role: text("role"), project: text("project"), pay: text("pay"), contact: text("contact"), details: text("details") };
        });
    }
    catch (err) {
        getEl("#cnote").textContent = "Could not load the shared calls. Check your connection and refresh.";
    }
    renderCrew();
}

// Shared mode: add one call to Firestore
async function postSharedCall(call) {
    const field = value => ({ stringValue: value });
    const body = { fields: { role: field(call.role), project: field(call.project), pay: field(call.pay), contact: field(call.contact), details: field(call.details), createdAt: { integerValue: String(Date.now()) } } };
    const res = await fetch(`${CREW_API}?key=${FIREBASE_API_KEY}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok)
        throw new Error(res.status);
}

// Shows the crew calls, filtered by the selected role
function renderCrew() {
    const r = getEl("#crole").value, source = sharedMode ? sharedCalls : crewCalls, list = source.filter(c => !r || c.role === r);
    getEl("#cgrid").innerHTML = list.length ? list.map(c => `<article class="card"><h3>${escapeHtml(c.role)}</h3><p class="meta">For “${escapeHtml(c.project)}”</p><p class="syn">${escapeHtml(c.details)}</p><p class="meta">Contact: ${escapeHtml(c.contact)}</p><div class="row"><span class="tag">${escapeHtml(c.pay)}</span>${!sharedMode && c.id ? `<button class="rm" data-cd="${c.id}">Remove</button>` : ""}</div></article>`).join("") : '<p class="empty">No calls posted yet. Use the form below to post the first one.</p>';
}
getEl("#crole").onchange = renderCrew;
getEl("#cgrid").onclick = e => { const b = e.target.closest("[data-cd]"); if (b) {
    crewCalls = crewCalls.filter(c => c.id !== b.dataset.cd);
    saveCrewCalls();
    renderCrew();
} };
getEl("#cform").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target, d = Object.fromEntries(new FormData(form)), errors = {}, msg = getEl("#cmsg");
    if (!d.project.trim())
        errors.project = "Enter the project title.";
    if (!d.contact.trim())
        errors.contact = "Add a way to contact you.";
    if (d.details.trim().length < 15)
        errors.details = "Write at least 15 characters.";
    form.querySelectorAll(".err").forEach(s => s.textContent = errors[s.dataset.for] || "");
    if (Object.keys(errors).length)
        return;
    const call = { role: d.role, project: d.project.trim(), pay: d.pay, contact: d.contact.trim(), details: d.details.trim() };
    if (sharedMode) {
        // simple spam guard: one post every 30 seconds per browser
        if (Date.now() - (+localStorage.getItem("ss_last_call") || 0) < 30000) {
            msg.textContent = "Please wait a few seconds before posting another call.";
            return;
        }
        msg.textContent = "Posting…";
        try {
            await postSharedCall(call);
            localStorage.setItem("ss_last_call", String(Date.now()));
            form.reset();
            msg.textContent = "Your call is posted and visible to everyone.";
            await loadSharedCalls();
        }
        catch (err) {
            msg.textContent = "Could not post your call. Please try again.";
        }
        return;
    }
    crewCalls.unshift({ id: "c" + Date.now(), ...call });
    saveCrewCalls();
    form.reset();
    renderCrew();
    msg.textContent = "Your call is saved in this browser only (demo mode).";
});
renderCrew();
loadSharedCalls();

