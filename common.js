/*
  Shooting Stars: code shared by every page (helpers, film-making steps, progress maths).
  Everything is saved in the browser with localStorage.
*/
const GENRES = ["Action", "Adventure", "Animation", "Biography", "Comedy", "Crime", "Documentary", "Drama", "Experimental", "Family", "Fantasy", "Historical", "Horror", "Musical", "Mystery", "Romance", "Sci-Fi", "Sport", "Thriller", "War", "Western", "Other"];
// Every step of making a film. A step is either a checkbox ("c") or a 0-100% slider ("p")
const PHASES = [["Development", [["idea", "Idea and concept locked", "c"], ["script", "Script written", "p"], ["final", "Script revised and final", "c"], ["budget", "Budget planned", "c"], ["fund", "Funding secured", "c"]]],
    ["Pre-production", [["crew", "Director and crew hired", "c"], ["cast", "Cast decided", "c"], ["loc", "Locations scouted", "c"], ["sched", "Shooting schedule made", "c"], ["gear", "Equipment and permits arranged", "c"]]],
    ["Production", [["shoot", "Filming completed", "p"]]],
    ["Post-production", [["edit", "Editing", "p"], ["sound", "Sound design and music", "p"], ["color", "Colour grading", "p"], ["cut", "Final cut locked", "c"]]],
    ["Release", [["promo", "Poster and trailer made", "c"], ["submit", "Submitted to festival or platform", "c"], ["out", "Released", "c"]]]];
const ALL_STEP_IDS = PHASES.flatMap(p => p[1].map(s => s[0]));
const PROJECTS_KEY = "ss_projects", getEl = s => document.querySelector(s);
const escapeHtml = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const loadProjects = () => { try {
    return JSON.parse(localStorage.getItem(PROJECTS_KEY)) || [];
}
catch (e) {
    return [];
} };
const saveProjects = () => { try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(myProjects));
    return true;
}
catch (e) {
    return false;
} };
let sampleFilms = [], myProjects = loadProjects();
const stepValue = (p, id) => p.steps[id] || 0;
// Progress maths: each step counts 0-100, a phase or project is the average of its steps
const average = a => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0;
const projectPercent = p => average(ALL_STEP_IDS.map(i => stepValue(p, i)));
const phasePercent = (p, ph) => average(ph[1].map(s => stepValue(p, s[0])));
// Draws the circular progress meter as an SVG (the ring is a circle whose dash length matches the percentage)
const progressRing = (p, s = 84) => { const r = s / 2 - 7, c = 2 * Math.PI * r, m = s / 2; return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" role="img" aria-label="${p}% complete" style="flex:none"><circle cx="${m}" cy="${m}" r="${r}" fill="none" stroke="#26336e" stroke-width="7"/><circle cx="${m}" cy="${m}" r="${r}" fill="none" stroke="#ffd86b" stroke-width="7" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p / 100)}" transform="rotate(-90 ${m} ${m})"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" fill="#f4f1dc" font-size="${s / 4.2}" font-weight="700" font-family="Arial,sans-serif">${p}%</text></svg>`; };
const thumb = (src, cls = "thumb") => src ? `<img class="${cls}" src="${escapeHtml(src)}" alt="" loading="lazy">` : `<div class="${cls}"></div>`;
// Shrinks an uploaded picture so it fits inside localStorage
const shrinkImage = f => new Promise(res => { const r = new FileReader(); r.onload = () => { const i = new Image(); i.onload = () => { const k = Math.min(1, 600 / i.width), c = document.createElement("canvas"); c.width = i.width * k; c.height = i.height * k; c.getContext("2d").drawImage(i, 0, 0, c.width, c.height); res(c.toDataURL("image/jpeg", .8)); }; i.src = r.result; }; r.readAsDataURL(f); });

// Short random id for new items
const makeId = () => Math.random().toString(36).slice(2, 8);

// ----- Film festival helpers (used by the Home and Festivals pages) -----
const formatDate = d => new Date(d + "T00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const datesText = f => f.end ? formatDate(f.start) + " to " + formatDate(f.end) : "From " + formatDate(f.start);
// Works out whether a festival is over, happening now, or coming up (and how many days away)
function festivalState(f) {
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const start = new Date(f.start + "T00:00");
    const end = f.end ? new Date(f.end + "T23:59:59") : new Date(start.getTime() + 10 * 864e5);
    if (end < today) return { past: true };
    if (start <= today) return { now: true, text: "Happening now" };
    const days = Math.ceil((start - today) / 864e5);
    return { text: days === 1 ? "Starts tomorrow" : "Starts in " + days + " days" };
}
