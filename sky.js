/*
  Night sky for Shooting Stars: twinkling stars, a crescent moon,
  and a shooting star that flies across every time the page opens.
  Click the Shooting Stars title to launch another one.
*/
(function () {
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Build the sky: a fixed layer behind the whole page
    var sky = document.createElement("div");
    sky.id = "sky";
    sky.setAttribute("aria-hidden", "true");

    var starCount = Math.min(160, Math.round(window.innerWidth * window.innerHeight / 9000));
    for (var i = 0; i < starCount; i++) {
        var star = document.createElement("span");
        var size = Math.random() * 2 + 1;
        star.className = "star";
        star.style.cssText = "left:" + Math.random() * 100 + "%;top:" + Math.random() * 100 + "%;" +
            "width:" + size + "px;height:" + size + "px;" +
            "--d:" + (3 + Math.random() * 4) + "s;--delay:" + Math.random() * 5 + "s";
        sky.appendChild(star);
    }

    var moon = document.createElement("div");
    moon.className = "moon";
    sky.appendChild(moon);
    document.body.prepend(sky);

    // One shooting star: starts top right, flies down to the left
    function shootStar() {
        if (reduceMotion || !document.body.animate) return;
        var streak = document.createElement("div");
        streak.className = "shooting-star";
        streak.style.left = (55 + Math.random() * 40) + "vw";
        streak.style.top = (4 + Math.random() * 26) + "vh";
        document.body.appendChild(streak);

        var animation = streak.animate([
            { transform: "translate(0, 0) rotate(-30deg)", opacity: 0 },
            { transform: "translate(-120px, 70px) rotate(-30deg)", opacity: 1, offset: 0.12 },
            { transform: "translate(-700px, 404px) rotate(-30deg)", opacity: 1, offset: 0.7 },
            { transform: "translate(-950px, 548px) rotate(-30deg)", opacity: 0 }
        ], { duration: 1500, easing: "ease-in", fill: "forwards" });
        animation.onfinish = function () { streak.remove(); };
    }

    window.shootStar = shootStar;
    setTimeout(shootStar, 700);

    document.addEventListener("click", function (e) {
        if (e.target.closest && e.target.closest("img[src*='shooting-stars']")) shootStar();
    });
})();
