/* Home page: show the next three film festivals */
(async () => {
    const box = getEl("#nextFests");
    try {
        const data = await (await fetch("festivals.json")).json();
        const next = data.festivals.map(f => ({ f, st: festivalState(f) })).filter(x => !x.st.past)
            .sort((a, b) => a.f.start.localeCompare(b.f.start)).slice(0, 3);
        box.innerHTML = next.map(({ f, st }) => `<a class="card" href="festivals.html" style="text-decoration:none">
            <span class="badge ${st.now ? "now" : ""}">${escapeHtml(st.text)}</span>
            <h3>${escapeHtml(f.name)}</h3><p class="meta">${escapeHtml(f.city)}, ${escapeHtml(f.country)}</p>
            <p class="syn">${escapeHtml(datesText(f))}</p></a>`).join("");
    } catch (e) {
        box.innerHTML = '<p class="empty">The festival list could not be loaded.</p>';
    }
})();
