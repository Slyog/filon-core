const HISTORY_PATH = "../history.json";
const REPORT_DIR = "../reports/";
const SNAP_DIR = "../../tests/__snapshots__/autosave/";

const state = {
  history: [],
  filtered: [],
  filter: "all",
  searchTerm: "",
};

const selectors = {
  timeline: document.getElementById("timeline"),
  filters: document.getElementById("filter-buttons"),
  activeFilter: document.getElementById("active-filter"),
  searchInput: document.getElementById("search-input"),
  metadata: document.getElementById("metadata"),
  lightbox: document.getElementById("lightbox"),
  lightboxImage: document.getElementById("lightbox-image"),
  lightboxCaption: document.getElementById("lightbox-caption"),
  lightboxClose: document.getElementById("lightbox-close"),
};

function uniqueEvents(history) {
  const events = new Set();
  history.forEach((entry) => {
    if (entry.event) events.add(entry.event);
  });
  return Array.from(events.values()).sort();
}

function basename(filepath = "") {
  if (!filepath) return "";
  return filepath.replace(/\\/g, "/").split("/").filter(Boolean).pop() ?? "";
}

async function loadHistory() {
  try {
    const response = await fetch(HISTORY_PATH, { cache: "no-store" });
    if (!response.ok) throw new Error(`Response ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("[FILON QA Viewer] Unable to load history:", error);
    return [];
  }
}

function applyFilters() {
  const { history, filter, searchTerm } = state;
  const term = searchTerm.trim().toLowerCase();

  state.filtered = history.filter((entry) => {
    const matchesFilter = filter === "all" || entry.event === filter;
    if (!matchesFilter) return false;

    if (!term) return true;

    const haystack = [
      entry.event,
      entry.branch,
      entry.status,
      entry.commit,
      entry.report,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(term);
  });
}

function renderMetadata(history) {
  const count = history.length;
  if (count === 0) {
    selectors.metadata.textContent = "No QA runs recorded yet.";
    return;
  }

  const lastRun = history[history.length - 1];
  const lastDate = lastRun?.date ? new Date(lastRun.date).toLocaleString() : "–";

  selectors.metadata.innerHTML = `
    <span class="px-2 py-1 bg-[#10161B] border border-cyan-400/20 rounded">
      Runs: <strong class="text-cyan-300">${count}</strong>
    </span>
    <span class="px-2 py-1 bg-[#10161B] border border-cyan-400/20 rounded">
      Last Run: <strong class="text-cyan-300">${lastDate}</strong>
    </span>
  `;
}

function renderFilters(history) {
  const events = uniqueEvents(history);
  const container = selectors.filters;
  container.innerHTML = "";

  const filters = ["all", ...events];
  filters.forEach((event) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.event = event;
    const label = event === "all" ? "All Events" : event;
    btn.textContent = label;
    btn.className = [
      "px-3 py-1 rounded-md text-xs font-medium border transition",
      state.filter === event
        ? "bg-cyan-500/20 border-cyan-400 text-cyan-200"
        : "bg-[#0C1218] border-cyan-400/20 text-gray-300 hover:border-cyan-400/40 hover:text-cyan-200",
    ].join(" ");
    container.appendChild(btn);
  });

  selectors.activeFilter.textContent =
    state.filter === "all"
      ? "Showing all recorded runs."
      : `Filter active: ${state.filter}`;
}

function buildTimelineEntry(entry) {
  const date = entry.date ? new Date(entry.date).toLocaleString() : "Unknown";
  const event = entry.event ?? "manual";
  const branch = entry.branch ?? "unknown";
  const status = entry.status ?? "unknown";
  const commit = entry.commit ?? "";
  const report = entry.report ? `${REPORT_DIR}${entry.report}` : null;
  const screenshots = Array.isArray(entry.screenshots)
    ? entry.screenshots
    : entry.screenshot
    ? [entry.screenshot]
    : [];

  const block = document.createElement("article");
  block.className =
    "border border-cyan-400/20 rounded-lg p-4 bg-[#10161B]/70 backdrop-blur-sm hover:border-cyan-400/40 transition space-y-3";

  const statusBadge =
    status.toLowerCase() === "passed"
      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
      : status.toLowerCase() === "failed"
      ? "bg-rose-500/20 text-rose-300 border border-rose-400/30"
      : "bg-cyan-500/10 text-cyan-200 border border-cyan-400/20";

  block.innerHTML = `
    <header class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="font-medium text-cyan-300">${event}</h2>
        <p class="text-xs text-gray-400">Branch: ${branch}</p>
      </div>
      <div class="flex flex-wrap gap-2 items-center text-xs">
        <span class="px-2 py-1 rounded ${statusBadge}">${status}</span>
        <span class="text-gray-400">${date}</span>
      </div>
    </header>
    ${
      commit
        ? `<p class="text-xs text-gray-400 break-all">Commit: <span class="text-cyan-200">${commit}</span></p>`
        : ""
    }
    <div class="text-sm text-gray-300 space-y-2">
      ${
        report
          ? `<p>Report: <a href="${report}" class="text-cyan-400 underline" target="_blank" rel="noopener">Open HTML report</a></p>`
          : "<p>No HTML report archived for this run.</p>"
      }
      ${
        screenshots.length
          ? `<div class="space-y-2">
              <p class="text-xs text-gray-400 uppercase tracking-wide">Snapshots</p>
              <div class="flex flex-wrap gap-3">
                ${screenshots
                  .map((shot) => {
                    const filename = basename(shot);
                    const url = `${SNAP_DIR}${filename}`;
                    return `
                      <figure class="max-w-[200px]">
                        <img
                          src="${url}"
                          alt="${filename}"
                          data-src="${url}"
                          data-caption="${event} — ${filename}"
                          class="rounded border border-cyan-400/10 hover:border-cyan-400/40 cursor-zoom-in transition snapshot-thumb"
                        />
                        <figcaption class="text-[10px] text-gray-500 mt-1 break-all">${filename}</figcaption>
                      </figure>
                    `;
                  })
                  .join("")}
              </div>
            </div>`
          : ""
      }
    </div>
  `;

  return block;
}

function renderTimeline(entries) {
  const container = selectors.timeline;
  container.innerHTML = "";

  if (!entries.length) {
    container.innerHTML = `<p class="text-gray-400 text-sm">No QA history found. Run the QA pipeline to populate this view.</p>`;
    return;
  }

  entries
    .slice()
    .sort((a, b) => new Date(b.date ?? 0) - new Date(a.date ?? 0))
    .forEach((entry) => {
      container.appendChild(buildTimelineEntry(entry));
    });
}

function setupLightbox() {
  const { lightbox, lightboxImage, lightboxCaption, lightboxClose } =
    selectors;

  function close() {
    lightbox.classList.add("hidden");
    lightboxImage.src = "";
    lightboxCaption.textContent = "";
    document.body.classList.remove("overflow-hidden");
  }

  lightboxClose.addEventListener("click", close);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) close();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !lightbox.classList.contains("hidden")) {
      close();
    }
  });

  selectors.timeline.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.classList.contains("snapshot-thumb")) return;

    const src = target.dataset.src;
    if (!src) return;

    const caption = target.dataset.caption ?? "";
    lightboxImage.src = src;
    lightboxCaption.textContent = caption;
    lightbox.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
  });
}

function wireControls() {
  selectors.filters.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const eventType = target.dataset.event;
    if (!eventType) return;
    state.filter = eventType;
    applyFilters();
    renderFilters(state.history);
    renderTimeline(state.filtered);
  });

  selectors.searchInput.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    state.searchTerm = target.value;
    applyFilters();
    renderTimeline(state.filtered);
  });
}

async function init() {
  state.history = await loadHistory();
  renderMetadata(state.history);
  renderFilters(state.history);
  applyFilters();
  renderTimeline(state.filtered);
  setupLightbox();
  wireControls();
}

init();

