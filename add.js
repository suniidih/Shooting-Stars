/* Add Project page */
let pendingImage = "";
getEl("[name=genre]").innerHTML = '<option value="">Choose a genre</option>' + GENRES.map(g => `<option>${g}</option>`).join("");
getEl("#img").onchange = async (e) => { pendingImage = e.target.files[0] ? await shrinkImage(e.target.files[0]) : ""; };
getEl("#form").addEventListener("submit", e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target)), errors = {}, y = +d.year;
    if (!d.title.trim())
        errors.title = "Enter the project title.";
    if (!d.director.trim())
        errors.director = "Enter the director or creator.";
    if (!d.genre)
        errors.genre = "Choose a genre.";
    if (!y || y < 1990 || y > 2035)
        errors.year = "Enter a year between 1990 and 2035.";
    if (d.synopsis.trim().length < 20)
        errors.synopsis = "Write at least 20 characters.";
    document.querySelectorAll(".err").forEach(s => s.textContent = errors[s.dataset.for] || "");
    if (Object.keys(errors).length)
        return;
    myProjects.unshift({ id: "p" + Date.now(), title: d.title.trim(), type: d.type, director: d.director.trim(), genre: d.genre, year: y, synopsis: d.synopsis.trim(), image: pendingImage, steps: {}, notes: "" });
    const ok = saveProjects();
    e.target.reset();
    pendingImage = "";
    getEl("#msg").textContent = ok ? "Project saved. Go to Your Projects to open it and update your progress." : "Storage is full. Try a smaller image.";
});