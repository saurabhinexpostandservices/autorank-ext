(function () {
    const STATE_KEY = "serp_rank_state";

    function getQuery() {
        return new URL(location.href).searchParams.get("q") || "__unknown__";
    }

    function getStart() {
        return parseInt(new URL(location.href).searchParams.get("start") || "0", 10);
    }

    function loadState() {
        return JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
    }

    function saveState(state) {
        localStorage.setItem(STATE_KEY, JSON.stringify(state));
    }

    function getOrganicResults() {
        return Array.from(document.querySelectorAll(".g, .MjjYud")).filter(el =>
            el.querySelector("a[href]:has(h3)") &&
            !el.closest("[data-text-ad]") &&
            !el.querySelector("g-section-with-header") &&
            !el.querySelector(".VjDLd") &&
            !el.querySelector(".fP1Qef") &&
            !el.querySelector(".Wt5Tfe")
        );
    }

    function calculateBaseRank(pages, currentStart) {
        let base = 0;
        Object.keys(pages)
            .map(Number)
            .filter(start => start < currentStart)
            .sort((a, b) => a - b)
            .forEach(start => {
                base += pages[start];
            });
        return base;
    }

    function rankSERP() {
        const query = getQuery();
        const start = getStart();
        const state = loadState();

        if (!state[query]) {
            state[query] = { pages: {} };
        }

        const results = getOrganicResults();

        // Save page result count ONCE
        if (!state[query].pages[start]) {
            state[query].pages[start] = results.length;
            saveState(state);
        }

        const baseRank = calculateBaseRank(state[query].pages, start);

        results.forEach((result, index) => {
            if (result.querySelector(".rank-number")) return;

            const h3 = result.querySelector("h3");
            if (!h3) return;

            const badge = document.createElement("span");
            badge.className = "rank-number";
            badge.textContent = `#${baseRank + index + 1} `;
            badge.style.fontWeight = "bold";
            badge.style.color = "#a8cf45";
            badge.style.marginRight = "6px";

            h3.prepend(badge);
        });
    }

    rankSERP();
    setInterval(rankSERP, 1500);
})();
