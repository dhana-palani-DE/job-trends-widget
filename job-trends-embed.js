/**
 * job-trends-embed.js
 * -------------------
 * Drop this file into your GitHub repo alongside index.html.
 *
 * Then in WordPress Custom HTML block, paste:
 *
 *   <div id="job-trends-widget"></div>
 *   <script src="https://raw.githubusercontent.com/dhana-palani-DE/job-trends-widget/main/job-trends-embed.js"></script>
 *
 * The script injects the full widget (styles + chart + narrative) into
 * the #job-trends-widget div on the page — no iframe needed.
 */

(function () {
  const DATA_URL = "https://raw.githubusercontent.com/dhana-palani-DE/job-trends-widget/main/trends.json";
  const ROLES = ["All", "Data Analyst", "Data Scientist", "ML Engineer", "AI Engineer", "Data Engineer"];

  // ── Inject styles ──────────────────────────────────────────────────────────
  const style = document.createElement("style");
  style.textContent = `
    #job-trends-widget { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1a1a1a; padding-bottom: 2rem; }
    #job-trends-widget * { box-sizing: border-box; }
    .jt-header { border-bottom: 1px solid #e8e8e8; padding: 1.75rem 0 1.25rem; margin-bottom: 1.5rem; }
    .jt-header-meta { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: #999; margin-bottom: 6px; }
    .jt-header-title { font-size: 22px; font-weight: 600; color: #111; margin-bottom: 4px; }
    .jt-header-sub { font-size: 13px; color: #777; }
    .jt-badge { display: inline-block; font-size: 11px; padding: 2px 8px; background: #f2f2f0; border-radius: 20px; color: #888; border: 1px solid #e5e5e3; margin-left: 8px; }
    .jt-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-bottom: 1.5rem; }
    .jt-stat { border-radius: 8px; padding: .875rem 1rem; }
    .jt-stat:nth-child(1) { background: #E1F5EE; }
    .jt-stat:nth-child(2) { background: #E6F1FB; }
    .jt-stat:nth-child(3) { background: #FAEEDA; }
    .jt-stat-label { font-size: 11px; margin-bottom: 5px; text-transform: uppercase; letter-spacing: .05em; font-weight: 500; }
    .jt-stat:nth-child(1) .jt-stat-label { color: #0F6E56; }
    .jt-stat:nth-child(2) .jt-stat-label { color: #185FA5; }
    .jt-stat:nth-child(3) .jt-stat-label { color: #854F0B; }
    .jt-stat-value { font-size: 20px; font-weight: 600; }
    .jt-stat:nth-child(1) .jt-stat-value { color: #085041; }
    .jt-stat:nth-child(2) .jt-stat-value { color: #0C447C; }
    .jt-stat:nth-child(3) .jt-stat-value { color: #633806; }
    .jt-filters { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 1.5rem; }
    .jt-pill { padding: 5px 14px; font-size: 13px; border: 1px solid #ddd; border-radius: 20px; background: transparent; color: #666; cursor: pointer; transition: all .15s; font-family: inherit; }
    .jt-pill:hover { background: #f5f5f3; }
    .jt-pill.active { background: #111; color: #fff; border-color: #111; }
    .jt-chart-wrap { position: relative; width: 100%; }
    .jt-narrative { margin-top: 1.75rem; padding-top: 1.5rem; border-top: 1px solid #e8e8e8; }
    .jt-narrative-label { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: #999; margin-bottom: 12px; }
    .jt-narrative-text { font-size: 15px; line-height: 1.8; color: #444; }
    .jt-narrative-text p { margin-bottom: 1rem; }
    .jt-footer { margin-top: 1.25rem; font-size: 11px; color: #bbb; display: flex; justify-content: space-between; }
    .jt-loading { text-align: center; padding: 3rem 0; color: #aaa; font-size: 14px; }
    @media (max-width: 480px) { .jt-stats { grid-template-columns: repeat(2, 1fr); } .jt-stat:last-child { display: none; } }
  `;
  document.head.appendChild(style);

  // ── Inject HTML ────────────────────────────────────────────────────────────
  const root = document.getElementById("job-trends-widget");
  if (!root) { console.error("job-trends-widget: #job-trends-widget div not found"); return; }

  root.innerHTML = `
    <div class="jt-header">
      <p class="jt-header-meta">UK Data &amp; AI job market</p>
      <h2 class="jt-header-title">Skills in demand <span class="jt-badge" id="jt-date-badge">Loading...</span></h2>
      <p class="jt-header-sub">Extracted from live job postings · updated monthly</p>
    </div>
    <div id="jt-loading" class="jt-loading">Loading job trends data...</div>
    <div id="jt-content" style="display:none">
      <div class="jt-stats">
        <div class="jt-stat"><div class="jt-stat-label">Jobs analysed</div><div class="jt-stat-value" id="jt-stat-jobs">—</div></div>
        <div class="jt-stat"><div class="jt-stat-label">Top skill</div><div class="jt-stat-value" id="jt-stat-top">—</div></div>
        <div class="jt-stat"><div class="jt-stat-label">Trending</div><div class="jt-stat-value" id="jt-stat-trend">—</div></div>
      </div>
      <div class="jt-filters" id="jt-filters"></div>
      <div class="jt-chart-wrap" id="jt-chart-wrap"><canvas id="jt-chart"></canvas></div>
      <div class="jt-narrative" id="jt-narrative" style="display:none">
        <p class="jt-narrative-label">Analysis</p>
        <div class="jt-narrative-text" id="jt-narrative-text"></div>
      </div>
      <div class="jt-footer">
        <span>Source: Adzuna UK · Skills extracted by AI · <span id="jt-footer-date"></span></span>
        <span>% of job postings</span>
      </div>
    </div>
  `;

  // ── Load Chart.js then data ────────────────────────────────────────────────
  const chartScript = document.createElement("script");
  chartScript.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
  chartScript.onload = () => loadData();
  document.head.appendChild(chartScript);

  let db = {}, chart = null;

  async function loadData() {
    try {
      const res = await fetch(DATA_URL);
      db = await res.json();
      document.getElementById("jt-loading").style.display = "none";
      document.getElementById("jt-content").style.display = "block";
      const date = db.generated_at
        ? new Date(db.generated_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
        : "Recent";
      document.getElementById("jt-date-badge").textContent = date;
      document.getElementById("jt-footer-date").textContent = "Generated " + date;
      buildFilters();
      setRole("All");
    } catch (e) {
      document.getElementById("jt-loading").textContent = "Failed to load data. Please try again later.";
    }
  }

  function buildFilters() {
    const wrap = document.getElementById("jt-filters");
    ROLES.forEach(role => {
      if (!db[role]) return;
      const btn = document.createElement("button");
      btn.className = "jt-pill" + (role === "All" ? " active" : "");
      btn.textContent = role === "All" ? "All roles" : role;
      btn.addEventListener("click", () => setRole(role));
      wrap.appendChild(btn);
    });
  }

  function setRole(role) {
    document.querySelectorAll(".jt-pill").forEach(b =>
      b.classList.toggle("active", b.textContent === (role === "All" ? "All roles" : role))
    );
    const d = db[role];
    if (!d) return;
    document.getElementById("jt-stat-jobs").textContent = d.total;
    document.getElementById("jt-stat-top").textContent = d.skills[0]?.n || "—";
    document.getElementById("jt-stat-trend").textContent = d.trending || "—";
    updateChart(d);
    updateNarrative(d);
  }

  function updateChart(d) {
    const sorted = [...d.skills].sort((a, b) => b.c - a.c);
    const labels = sorted.map(s => s.n);
    const counts = sorted.map(s => s.c);
    const total = d.total;
    const h = Math.max(labels.length * 38 + 80, 200);
    document.getElementById("jt-chart-wrap").style.height = h + "px";
    if (chart) { chart.destroy(); chart = null; }
    chart = new Chart(document.getElementById("jt-chart"), {
      type: "bar",
      data: { labels, datasets: [{ data: counts, backgroundColor: "#1D9E75", borderRadius: 3, barThickness: 22 }] },
      options: {
        indexAxis: "y", responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.raw} jobs · ${Math.round(ctx.raw / total * 100)}%` } } },
        scales: {
          x: { grid: { color: "rgba(0,0,0,.06)" }, border: { display: false }, ticks: { color: "#999", font: { size: 12 }, callback: v => Math.round(v / total * 100) + "%" } },
          y: { grid: { display: false }, border: { display: false }, ticks: { color: "#333", font: { size: 13 } } }
        }
      }
    });
  }

  function updateNarrative(d) {
    const wrap = document.getElementById("jt-narrative");
    const text = document.getElementById("jt-narrative-text");
    if (d.narrative) {
      text.innerHTML = d.narrative.split(/\n\n+/).filter(Boolean).map(p => `<p>${p}</p>`).join("");
      wrap.style.display = "block";
    } else {
      wrap.style.display = "none";
    }
  }
})();
