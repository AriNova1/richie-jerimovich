/**
 * Receipt Comparison Component (#20)
 * Scoped, accessible, isolated comparison surface for public kept receipts.
 */

function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeURL(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  // Strictly permit only safe web protocols
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return null;
}

function formatValue(val) {
  if (val === null || val === undefined || val === "" || (Array.isArray(val) && val.length === 0)) {
    return '<span class="zoom-comp-unavailable">Unavailable</span>';
  }
  return escapeHTML(val);
}

let instanceCount = 0;

export function mountComparison(host, options = {}) {
  if (!host || !(host instanceof HTMLElement)) {
    throw new Error("mountComparison: host must be a valid HTMLElement");
  }

  let controller;
  let destroyed = false;
  const uid = `receipt-comparison-${++instanceCount}`;

  const corpus = options.corpus || null;
  const onOpenSource = typeof options.onOpenSource === "function" ? options.onOpenSource : null;

  const kept = (corpus && Array.isArray(corpus.kept)) ? corpus.kept : [];
  const recordsById = new Map();
  for (const r of kept) {
    if (r && typeof r.id === "string" && r.id) {
      recordsById.set(r.id, recordsById.has(r.id) ? null : r);
    }
  }

  const choices = kept.filter(r => r && recordsById.get(r.id) === r);

  // Explicit unknown IDs remain unavailable; defaults apply only when omitted.
  let leftId = options.leftId ?? choices[0]?.id ?? "";
  let rightId = options.rightId ?? choices.find(r => r.id !== leftId)?.id ?? leftId;

  const copyTimers = new Set();

  function render(focusTarget) {
    if (destroyed) return;
    controller?.abort();
    for (const timer of copyTimers) clearTimeout(timer);
    copyTimers.clear();
    controller = new AbortController();
    const signal = controller.signal;
    // Teardown previous contents inside host
    host.innerHTML = "";
    host.classList.add("zoom-comparison");

    const container = document.createElement("div");
    container.className = "zoom-comparison-container";

    if (!corpus || kept.length === 0) {
      container.innerHTML = `
        <div class="zoom-comparison-empty" role="alert">
          <h3 class="zoom-comp-empty-title">No receipts corpus available</h3>
          <p class="zoom-comp-empty-desc">Provide a valid corpus containing public kept receipts to compare verification records.</p>
        </div>
      `;
      host.appendChild(container);
      return;
    }

    const leftRecord = recordsById.get(leftId) || null;
    const rightRecord = recordsById.get(rightId) || null;
    const isDuplicate = Boolean(leftId && rightId && leftId === rightId);

    // Build Toolbar
    const toolbar = document.createElement("div");
    toolbar.className = "zoom-comp-toolbar";

    const leftGroup = document.createElement("div");
    leftGroup.className = "zoom-comp-select-group";
    leftGroup.innerHTML = `
      <label for="${uid}-left-select" class="zoom-comp-label">Receipt A</label>
      <select id="${uid}-left-select" class="zoom-comp-select" aria-label="Select left receipt">
        ${!leftRecord ? `<option value="${escapeHTML(leftId)}" selected disabled>Unavailable receipt (${escapeHTML(leftId)})</option>` : ""}
        ${choices.map(r => `<option value="${escapeHTML(r.id)}" ${r.id === leftId ? "selected" : ""}>${escapeHTML(r.title)} (${escapeHTML(r.date)})</option>`).join("")}
      </select>
    `;

    const swapBtn = document.createElement("button");
    swapBtn.type = "button";
    swapBtn.className = "zoom-comp-swap-btn";
    swapBtn.setAttribute("aria-label", "Swap left and right receipts");
    swapBtn.innerHTML = `
      <span class="zoom-comp-swap-icon" aria-hidden="true">&#x21C4;</span>
      <span class="zoom-comp-swap-text">Swap</span>
    `;
    swapBtn.addEventListener("click", () => {
      const tmp = leftId;
      leftId = rightId;
      rightId = tmp;
      render(".zoom-comp-swap-btn");
    }, { signal });

    const rightGroup = document.createElement("div");
    rightGroup.className = "zoom-comp-select-group";
    rightGroup.innerHTML = `
      <label for="${uid}-right-select" class="zoom-comp-label">Receipt B</label>
      <select id="${uid}-right-select" class="zoom-comp-select" aria-label="Select right receipt">
        ${!rightRecord ? `<option value="${escapeHTML(rightId)}" selected disabled>Unavailable receipt (${escapeHTML(rightId)})</option>` : ""}
        ${choices.map(r => `<option value="${escapeHTML(r.id)}" ${r.id === rightId ? "selected" : ""}>${escapeHTML(r.title)} (${escapeHTML(r.date)})</option>`).join("")}
      </select>
    `;

    toolbar.appendChild(leftGroup);
    toolbar.appendChild(swapBtn);
    toolbar.appendChild(rightGroup);
    container.appendChild(toolbar);

    // Event listeners for select changes
    const leftSelect = leftGroup.querySelector("select");
    leftSelect.addEventListener("change", (ev) => {
      leftId = ev.target.value;
      render(`[id="${uid}-left-select"]`);
    }, { signal });

    const rightSelect = rightGroup.querySelector("select");
    rightSelect.addEventListener("change", (ev) => {
      rightId = ev.target.value;
      render(`[id="${uid}-right-select"]`);
    }, { signal });

    // Advisory banner if duplicate or unknown
    if (isDuplicate) {
      const duplicateNotice = document.createElement("div");
      duplicateNotice.className = "zoom-comp-advisory";
      duplicateNotice.setAttribute("role", "status");
      duplicateNotice.innerHTML = `
        <strong>Same receipt selected on both sides.</strong> Choose a different receipt in either selector to compare distinct claims.
      `;
      container.appendChild(duplicateNotice);
    }

    if (!leftRecord && leftId) {
      const leftUnknownNotice = document.createElement("div");
      leftUnknownNotice.className = "zoom-comp-error-notice";
      leftUnknownNotice.setAttribute("role", "alert");
      leftUnknownNotice.innerHTML = `Left receipt ID <code>${escapeHTML(leftId)}</code> is missing or ambiguous in this saved export.`;
      container.appendChild(leftUnknownNotice);
    }

    if (!rightRecord && rightId) {
      const rightUnknownNotice = document.createElement("div");
      rightUnknownNotice.className = "zoom-comp-error-notice";
      rightUnknownNotice.setAttribute("role", "alert");
      rightUnknownNotice.innerHTML = `Right receipt ID <code>${escapeHTML(rightId)}</code> is missing or ambiguous in this saved export.`;
      container.appendChild(rightUnknownNotice);
    }

    // Comparison Body
    const compGrid = document.createElement("div");
    compGrid.className = "zoom-comp-grid";

    function renderRecordSide(rec, sideLabel) {
      if (!rec) {
        return `
          <div class="zoom-comp-cell zoom-comp-cell-missing" data-side="${sideLabel}">
            <div class="zoom-comp-side-badge">${sideLabel}</div>
            <p class="zoom-comp-missing-text">Record unavailable</p>
          </div>
        `;
      }
      return null;
    }

    // Field Row Helper
    function addFieldRow(fieldName, fieldDesc, getHtml) {
      const row = document.createElement("section");
      row.className = "zoom-comp-row";
      row.setAttribute("aria-labelledby", uid + "-row-title-" + fieldName.toLowerCase().replace(/[^a-z0-9]/g, "-"));

      const header = document.createElement("div");
      header.className = "zoom-comp-row-header";
      header.innerHTML = `
        <h3 id="${uid}-row-title-${fieldName.toLowerCase().replace(/[^a-z0-9]/g, "-")}" class="zoom-comp-row-title">${escapeHTML(fieldName)}</h3>
        ${fieldDesc ? `<span class="zoom-comp-row-desc">${escapeHTML(fieldDesc)}</span>` : ""}
      `;
      row.appendChild(header);

      const content = document.createElement("div");
      content.className = "zoom-comp-row-content";

      // Left column
      const leftCol = document.createElement("div");
      leftCol.className = "zoom-comp-cell zoom-comp-cell-left";
      leftCol.setAttribute("data-side", "Left");
      leftCol.innerHTML = `
        <div class="zoom-comp-mobile-marker" aria-hidden="true">Left: ${leftRecord ? escapeHTML(leftRecord.id) : "Unavailable"}</div>
        <div class="zoom-comp-field-body">${leftRecord ? getHtml(leftRecord, "left") : renderRecordSide(leftRecord, "Left")}</div>
      `;

      // Right column
      const rightCol = document.createElement("div");
      rightCol.className = "zoom-comp-cell zoom-comp-cell-right";
      rightCol.setAttribute("data-side", "Right");
      rightCol.innerHTML = `
        <div class="zoom-comp-mobile-marker" aria-hidden="true">Right: ${rightRecord ? escapeHTML(rightRecord.id) : "Unavailable"}</div>
        <div class="zoom-comp-field-body">${rightRecord ? getHtml(rightRecord, "right") : renderRecordSide(rightRecord, "Right")}</div>
      `;

      content.appendChild(leftCol);
      content.appendChild(rightCol);
      row.appendChild(content);
      compGrid.appendChild(row);
    }

    // 1. Title & ID
    addFieldRow("Title and Identity", "Receipt headline and stable identifier", (r) => `
      <div class="zoom-comp-title-block">
        <h4 class="zoom-comp-receipt-title">${formatValue(r.title)}</h4>
        <div class="zoom-comp-id-tag"><code>${formatValue(r.id)}</code></div>
      </div>
    `);

    // 2. Metadata: Date, Category, Confidence, Privacy
    addFieldRow("Metadata", "Publication date, category, reported confidence, and privacy scope", (r) => `
      <dl class="zoom-comp-meta-list">
        <div class="zoom-comp-meta-item">
          <dt>Date</dt>
          <dd>${formatValue(r.date)}</dd>
        </div>
        <div class="zoom-comp-meta-item">
          <dt>Category</dt>
          <dd><span class="zoom-comp-tag">${formatValue(r.category)}</span></dd>
        </div>
        <div class="zoom-comp-meta-item">
          <dt>Confidence</dt>
          <dd><span class="zoom-comp-confidence zoom-comp-conf-${escapeHTML(r.confidence || "none")}">${formatValue(r.confidence)}</span></dd>
        </div>
        <div class="zoom-comp-meta-item">
          <dt>Privacy</dt>
          <dd>${formatValue(r.privacy)}</dd>
        </div>
      </dl>
    `);

    // 3. Summary
    addFieldRow("Summary", "Concise statement of what changed", (r) => `
      <p class="zoom-comp-prose">${formatValue(r.summary)}</p>
    `);

    // 4. Claim
    addFieldRow("Claim", "Specific verifiable public statement", (r) => `
      <p class="zoom-comp-prose zoom-comp-claim-text">${formatValue(r.claim)}</p>
    `);

    // 5. Verification Method
    addFieldRow("Verification Method", "Approach used to establish truth", (r) => `
      <p class="zoom-comp-prose">${formatValue(r.verify_method)}</p>
    `);

    // 6. Verification Command
    addFieldRow("Verification Command", "Reproducible shell check (display only)", (r, side) => {
      if (!r.verify_cmd) {
        return `<span class="zoom-comp-unavailable">Unavailable</span>`;
      }
      const btnId = uid + "-copy-btn-" + side;
      return `
        <div class="zoom-comp-cmd-block">
          <pre class="zoom-comp-code"><code>${escapeHTML(r.verify_cmd)}</code></pre>
          <div class="zoom-comp-cmd-actions" aria-live="polite">
            <button type="button" id="${btnId}" class="zoom-comp-copy-btn" data-cmd="${escapeHTML(r.verify_cmd)}">
              <span class="zoom-comp-copy-icon" aria-hidden="true">&#x2398;</span>
              <span class="zoom-comp-copy-text">Copy command</span>
            </button>
            <span class="zoom-comp-cmd-notice">Inspect or copy; commands are never executed.</span>
          </div>
        </div>
      `;
    });

    // 7. Recorded Result
    addFieldRow("Recorded Result", "Observed outcome when command was run", (r) => `
      <p class="zoom-comp-prose zoom-comp-result-text">${formatValue(r.verify_result)}</p>
    `);

    // 8. Evidence Items
    addFieldRow("Evidence Items", "Direct links to commits, live routes, and artifacts", (r) => {
      if (!r.evidence || !Array.isArray(r.evidence) || r.evidence.length === 0) {
        return `<span class="zoom-comp-unavailable">Unavailable</span>`;
      }
      return `
        <ul class="zoom-comp-evidence-list">
          ${r.evidence.map(ev => {
            if (!ev || typeof ev !== "object") return "";
            const safeUrl = sanitizeURL(ev.url);
            let linkHtml = "";
            if (safeUrl) {
              linkHtml = `<a href="${escapeHTML(safeUrl)}" class="zoom-comp-evidence-link" target="_blank" rel="noopener noreferrer" data-source-url="${escapeHTML(safeUrl)}">${escapeHTML(ev.label || ev.type || "Source link")} <span class="zoom-comp-ext-arrow" aria-hidden="true">&#x2197;</span></a>`;
            } else if (ev.url) {
              linkHtml = `<span class="zoom-comp-evidence-nolink" title="Link protocol withheld for security">${escapeHTML(ev.label || "Link")} (unsafe protocol withheld)</span>`;
            } else {
              linkHtml = `<span class="zoom-comp-evidence-nolink">${escapeHTML(ev.label || ev.type || "Evidence")}</span>`;
            }
            return `
              <li class="zoom-comp-evidence-item">
                <div class="zoom-comp-evidence-header">
                  <span class="zoom-comp-evidence-type">${escapeHTML(ev.type || "reference")}</span>
                  ${linkHtml}
                </div>
                ${ev.note ? `<p class="zoom-comp-evidence-note">${escapeHTML(ev.note)}</p>` : ""}
              </li>
            `;
          }).join("")}
        </ul>
      `;
    });

    // 9. Limitations
    addFieldRow("Limitations", "Explicit boundaries of what this receipt does not prove", (r) => {
      if (!r.limits || !Array.isArray(r.limits) || r.limits.length === 0) {
        return `<span class="zoom-comp-unavailable">Unavailable</span>`;
      }
      return `
        <ul class="zoom-comp-limits-list">
          ${r.limits.map(lim => `<li class="zoom-comp-limit-item">${escapeHTML(lim)}</li>`).join("")}
        </ul>
      `;
    });

    container.appendChild(compGrid);
    host.appendChild(container);

    // Wire up Copy Command Buttons
    const copyBtns = container.querySelectorAll(".zoom-comp-copy-btn");
    copyBtns.forEach(btn => {
      btn.addEventListener("click", async () => {
        const cmd = btn.getAttribute("data-cmd");
        if (!cmd) return;
        try {
          await navigator.clipboard.writeText(cmd);
          if (signal.aborted) return;
          const textSpan = btn.querySelector(".zoom-comp-copy-text");
          textSpan.textContent = "Copied";
          btn.classList.add("zoom-comp-copied");
          const timer = setTimeout(() => {
            textSpan.textContent = "Copy command";
            btn.classList.remove("zoom-comp-copied");
            copyTimers.delete(timer);
          }, 2000);
          copyTimers.add(timer);
        } catch {
          if (!signal.aborted) btn.querySelector(".zoom-comp-copy-text").textContent = "Copy unavailable";
        }
      }, { signal });
    });

    if (focusTarget) host.querySelector(focusTarget)?.focus({preventScroll:true});

    // Wire up onOpenSource handler if provided
    if (onOpenSource) {
      const links = container.querySelectorAll("a[data-source-url]");
      links.forEach(a => {
        a.addEventListener("click", (ev) => {
          const url = a.getAttribute("data-source-url");
          if (url) {
            ev.preventDefault();
            onOpenSource(url);
          }
        }, { signal });
      });
    }
  }

  // Initial render
  render();

  return {
    getState() { return {leftId, rightId}; },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      controller?.abort();
      for (const timer of copyTimers) clearTimeout(timer);
      copyTimers.clear();
      host.innerHTML = "";
      host.classList.remove("zoom-comparison");
    }
  };
}
