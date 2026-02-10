(() => {
    const STATE_KEY = "serp_rank_state";
    let TARGET_SITE = null;

    function loadWebsite() {
        return new Promise(resolve => {
            chrome.storage.local.get("website", d => {
                TARGET_SITE = d.website || "";
                resolve();
            });
        });
    }


    function getQuery() {
        return new URL(location.href).searchParams.get("q") || "";
    }

    function getStart() {
        return parseInt(new URL(location.href).searchParams.get("start") || "0", 10);
    }

    function loadState() {
        return JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
    }

    function saveState(s) {
        localStorage.setItem(STATE_KEY, JSON.stringify(s));
    }

    function getResults() {
        // Hum sirf un main containers ko target kar rahe hain jo organic results hain
        const allBlocks = Array.from(document.querySelectorAll(".g, .MjjYud, .A6K0A"));

        return allBlocks.filter(el => {
            // 1. Check karein ki result ke andar h3 (Title) aur organic link hai
            const hasTitle = el.querySelector("h3");
            const hasLink = el.querySelector("a[href]");

            // 2. Main fix: Yeh check karta hai ki ye container kisi aur 
            // organic result ke ANDAR to nahi hai (Double counting rokne ke liye)
            const isNested = el.parentElement.closest(".g, .MjjYud, .A6K0A");

            // 3. Unwanted widgets aur Ads ko bahar nikalna
            const isAd = el.closest("[data-text-ad]");
            const isWidget = el.querySelector("g-section-with-header, .VjDLd, .fP1Qef, .Wt5Tfe");

            return hasTitle && hasLink && !isNested && !isAd && !isWidget;
        });
    }


    function baseRank(pages, start) {
        return Object.keys(pages)
            .map(Number)
            .filter(s => s < start)
            .reduce((a, s) => a + pages[s], 0);
    }

    function normalizeDomain(url) {
        return url
            .replace(/^https?:\/\//, "")
            .replace(/^www\./, "")
            .split("/")[0];
    }

    function findRank(results, base) {
        if (!TARGET_SITE) return null;

        const target = normalizeDomain(TARGET_SITE);

        for (let i = 0; i < results.length; i++) {
            const link = results[i].querySelector("a[href]");
            if (!link) continue;

            try {
                const resultDomain = normalizeDomain(link.href);
                if (resultDomain === target) {
                    return base + i + 1;
                }
            } catch (e) { }
        }
        return null;
    }


    function navigate(step) {
        const url = new URL(location.href);
        const s = parseInt(url.searchParams.get("start") || "0", 10);
        url.searchParams.set("start", Math.max(0, s + step));
        location.href = url.toString();
    }

    function banner({ site, keyword, rank }) {
        let container = document.getElementById("seo-banner");

        if (!container) {
            container = document.createElement("div");
            container.id = "seo-banner";
            container.style.position = "fixed";
            container.style.top = "90px";
            container.style.right = "20px";
            container.style.zIndex = "99999";
            document.body.appendChild(container);
        }

        container.innerHTML = `
  <div style="
    width:320px;
    background:#111827;
    color:#fff;
    border-radius:14px;
    padding:18px;
    font-family:system-ui;
    box-shadow:0 10px 25px rgba(0,0,0,.35)
  ">
    <div style="display:flex;justify-content:space-between;border-bottom:1px solid #333;padding-bottom:8px;margin-bottom:12px">
      <span style="opacity:.7">Website</span>
      <b>${site || "Not set"}</b>
    </div>

    <div style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="opacity:.7">Keyword</div>
        <b style="color:#60a5fa">${keyword}</b>
      </div>

      <div style="
        width:60px;height:60px;border-radius:50%;
        background:${rank ? "#22c55e" : "#374151"};
        display:flex;align-items:center;justify-content:center;
        font-size:20px;font-weight:700
      ">
        ${rank ? "#" + rank : "--"}
      </div>
    </div>

    <div style="display:flex;margin-top:14px">
      <button id="prev" style="flex:1;margin-right:6px">← Prev</button>
      <button id="next" style="flex:1;margin-left:6px">Next →</button>
    </div>
  </div>
  `;

        document.getElementById("prev").onclick = () => navigate(-10);
        document.getElementById("next").onclick = () => navigate(10);
    }


    function run() {
        const q = getQuery();
        const s = getStart();
        const state = loadState();
        state[q] ||= { pages: {} };

        const results = getResults();
        if (!state[q].pages[s]) {
            state[q].pages[s] = results.length;
            saveState(state);
        }

        const base = baseRank(state[q].pages, s);

        results.forEach((r, i) => {
            if (r.querySelector(".rank-number")) return;
            const h3 = r.querySelector("h3");
            if (!h3) return;
            const span = document.createElement("span");
            span.className = "rank-number";
            span.textContent = `#${base + i + 1} `;
            h3.prepend(span);
        });

        banner({
            site: TARGET_SITE,
            keyword: q,
            rank: findRank(results, base)
        });
    }

    (async () => {
        await loadWebsite();
        run();
        setInterval(run, 1500);
    })();

})();

// function getResults() {
//         return Array.from(document.querySelectorAll(".g, .MjjYud, .A6K0A")).filter(el =>
//             el.querySelector("a[href]:has(h3)") &&              // must have organic title link
//             !el.closest("[data-text-ad]") &&                    // exclude ads
//             !el.querySelector("g-section-with-header") &&       // exclude featured sections
//             !el.querySelector(".VjDLd") &&                      // exclude people also ask
//             !el.querySelector(".fP1Qef") &&                     // exclude carousels
//             !el.querySelector(".Wt5Tfe")                         // exclude other widgets
//         );
//     }