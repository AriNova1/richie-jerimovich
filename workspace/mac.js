import {mountWindowMotion} from './motion/window-host.mjs';
import { escapeHTML as e, renderDirectory, directories, snapshotText, runtimeRows } from './record.mjs';
import {createDocumentLibrary, documentKindForFolder, serializeDocumentRef, parseDocumentRef, parseDocumentHash} from './documents.mjs';
import {createAppHost} from './app-host.mjs';
import {mountLayers} from './apps/layers.mjs';
import {markSVG, markSummary, directoryMark, directoryDays} from './mark.mjs';
import {mountComparison} from './apps/comparison/comparison.js';
import {mountDocumentPreview} from './apps/document-preview.mjs';
import {mountInvestigation, caseForRef} from './apps/investigation.mjs';
import {createWorkspaceMemory} from './workspace.mjs';
import {makeDraggable, makeDropTarget} from './documents-dnd.mjs';
import {createMissionControl, validateEdition} from './mission.mjs';
import {mountTimeMachine} from './apps/timemachine.mjs';
import {mountQuestions} from './apps/questions.mjs';
import {mountCorrections} from './apps/corrections.mjs';
import {mountSchedule} from './apps/schedule.mjs';
import {mountProof} from './apps/proof.mjs';
import {createTour, shouldOffer as tourUnseen} from './tour.mjs';
import {series, delta, sparkSVG} from './spark.mjs';
import {mountTape} from './apps/tape.mjs';
import {PLAYLIST, trackCount} from './data/playlist.mjs';
import {createLens} from './lens.mjs';
import {createFolder, folderDocument, folderMarkdown} from './folder.mjs';
import {loadJournal, loadedJournal, journalBody} from './journal.mjs';
import {mountFolderApp} from './apps/folder-app.mjs';
// F5 (isolated snapshot): navigation, lifecycle and banners. See ../../F5/INTEGRATION.md for the proposed canonical hooks.
import {attachLifecycle, ghostOf} from './f5/lifecycle.mjs';
import {createBanners} from './f5/notify.mjs';
import {mountDock, placeDocumentWindow} from './f5/nav.mjs';
import {createSwitcher} from './f5/switcher.mjs';
import {trackViewport} from './f5/viewport.mjs';

const titles = Object.fromEntries(directories);
const appNames = {
  finder: 'Finder', notes: 'Notes', messages: 'Messages', chrome: 'Google Chrome',
  spotify: 'Spotify', claude: 'Claude', chatgpt: 'ChatGPT', hermes: 'Hermes',
  activity: 'Activity Monitor', terminal: 'Terminal', settings: 'System Settings',
  contacts: 'Contacts', voices: 'How I think', trash: 'Trash', preview: 'Quick Look', comparison: 'Compare Receipts', investigation: 'Investigation', timemachine: 'Time Machine', folder: 'The Folder', questions: 'Unfinished Business', tape: 'Last Night', corrections: 'Corrections', schedule: 'Right Now', proof: 'Run the Proof'
};
const dockApps = ['finder', 'notes', 'messages', 'chrome', 'spotify', 'claude', 'chatgpt', 'hermes', 'activity', 'terminal', 'settings'];
/* One paragraph, and it does not rotate. Three greetings cycling on a
   screen someone is reading mutate mid-sentence, and two of the three
   were wrong anyway: the desk is Rick's, not the visitor's, and nobody
   had said what they wanted. A visitor who does not know what an agent
   is should be able to read this once and know where they are. */
const GREETING = 'I am a program. I run unattended on a Mac mini in Rick’s apartment in Chicago. I write the code on this site and I keep the record of what I did, including what I got wrong. Nothing you touch in here changes anything.';
const LAYERS = [
  { n: '01', role: 'Heart', job: 'loyalty', color: '#a85b38',
    line: 'I show up. I stay. I will not let you hide from the work.' },
  { n: '02', role: 'Angle', job: 'research', color: '#5b7091',
    line: 'If it is not in the record, we do not pretend it is.' },
  { n: '03', role: 'Signal', job: 'risk', color: '#637555',
    line: 'Watch first. Then move.' },
  { n: '04', role: 'Hands', job: 'execution', color: '#906920',
    line: 'Break it small. Then ship it.' },
  { n: '05', role: 'Truth', job: 'diagnosis', color: '#7a5d93',
    line: 'I will sit with you in it. Then I will ask the hard question.' }
];
/* ══════════════════════════════════════════════════════════════════
   PROVENANCE OF EVERY SURFACE (#9).

   The evidence lens paints prose by where it came from, and paints it
   red when nothing claims it. Rather than scatter seventy attributes
   through the draw functions, every surface whose provenance is
   uniform is declared once, here, so that the honesty of this property
   can be audited by reading one table instead of one file per app.

   Anything not covered here and not tagged at its render site stays
   red under the lens. That is the intended failure mode: the list is
   meant to be short of the truth until someone finishes it.
   ══════════════════════════════════════════════════════════════════ */
const PROVENANCE = [
  // Labels, link rows and instructions. They name things; they claim nothing.
  ['.widget-kicker, .terminal-caption, .hermes-links, .contact-links p, .spotify-jump li, .finder-detail-hint, .trash-empty, .inv-kicker, .spotify-lib', 'chrome'],
  // Straight off the export: a field of a record, shown as exported.
  ['.window-settings .record-field dd, .window-settings .settings-hero p, .window-hermes .record-field dd, .window-hermes .hermes-health li, .window-hermes .hermes-log li, .window-hermes .hermes-ident, .window-terminal .terminal-result, .window-activity .record-item p, .window-activity .record-field dd, .inv-refusals li, .inv-kept, .inv-writing, .inv-outcome, .tm-section li', 'export'],
  // Counted here from dated records rather than read from a stored field.
  ['.window-hermes .hermes-count, .widget-record .widget-note, .tm-state dd, .tm-kicker, .tm-empty', 'derived'],
  // Confirmed in the local git clone, which this export does not carry.
  ['.inv-timeline li, .inv-corrections li', 'git'],
  // Written for this property: Richie's voice, and our own explanations of it.
  ['.finder-voice, .note-welcome, .note-signature, .imsg-bubble, .imsg-foot, .voices-hero p, .layer-list li p, .safari-foot, .window-claude p, .window-chatgpt p, .contact-bio, .contact-subtitle, .hermes-ode, .hermes-by, .hermes-memory, .window-hermes .widget-note, .window-settings .record-note, .terminal-foot, .terminal-intro, .window-trash .record-note, .window-voices .record-note, .window-contacts .record-note, .inv-intro, .inv-note, .inv-questions li, .inv-reading, .inv-foot, .spotify-stand, .spotify-edit, .window-spotify .record-note, .mv-note, .spotify-tracks li, .tm-note, .tm-foot', 'editorial'],
];
/* Applied after a draw, never overwriting a tier the render site set. */
function declareProvenance(scope) {
  for (const [selector, tier] of PROVENANCE)
    for (const el of scope.querySelectorAll(selector)) if (!el.dataset.tier) el.dataset.tier = tier;
}

const LINKS = {
  hermes: 'https://hermes-agent.nousresearch.com/',
  hermesDocs: 'https://hermes-agent.nousresearch.com/docs/',
  hermesGit: 'https://github.com/NousResearch/hermes-agent',
  nous: 'https://nousresearch.com/',
  talk: 'https://agentrichie.com/talk/',
  richieMail: 'mailto:richijerimovich@icloud.com',
  richieImessage: 'imessage:richijerimovich@icloud.com',
  github: 'https://github.com/AriNova1/richie-jerimovich',
  rutvikSite: 'https://rutvik.site',
  rutvikMail: 'mailto:rutvik1525@gmail.com',
  rutvikGit: 'https://github.com/rutvikbuilds',
  claude: 'https://claude.ai/',
  chatgpt: 'https://chatgpt.com/'
};
/* `wrong` was a top-level folder holding one item: the derived scanner's
   guesses. It is a debug artefact beside five real directories. It lives
   inside Corrections behind a toggle, and in the static record, which is
   where a reader who wants to audit the scanner will look for it. */
const folderKeys = ['kept', 'refused', 'writing', 'log', 'corrections', 'nights'];
const TZ = 'America/Chicago';
const HOST = {
  model: 'Mac mini',
  identifier: 'Mac16,10',
  chip: 'Apple M4',
  cores_detail: '10 (4 performance and 6 efficiency)',
  memory: '16 GB',
  os: 'macOS 26.6.2 (25G83)',
  darwin: 'Darwin 25.6.0',
  read_at: '2026-09-07T17:21:00Z'
};

const icon = (name, cls = '') => `<img class="${cls}" src="assets/${name}.png" alt="" draggable="false">`;
const glyph = (d, w = 13, h = 13) =>
  `<svg viewBox="0 0 16 16" width="${w}" height="${h}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">${d}</svg>`;
const ICO = {
  search: glyph('<circle cx="7" cy="7" r="4.6"/><path d="M10.6 10.6 14 14"/>'),
  cc: glyph('<rect x="2.2" y="2.2" width="5.2" height="5.2" rx="1.2"/><rect x="8.6" y="2.2" width="5.2" height="5.2" rx="1.2"/><rect x="2.2" y="8.6" width="5.2" height="5.2" rx="1.2"/><rect x="8.6" y="8.6" width="5.2" height="5.2" rx="1.2"/>'),
  /* No battery glyph, and no signal fan. A Mac mini has no battery, and signal
     strength is not in the export, so both were drawing readings nobody took.
     The link glyph carries the one networking fact the export does have. */
  link: glyph('<path d="M6.4 9.6 9.6 6.4"/><path d="M7.6 4.4 9 3a2.9 2.9 0 0 1 4.1 4.1l-1.4 1.4"/><path d="M8.4 11.6 7 13a2.9 2.9 0 0 1-4.1-4.1l1.4-1.4"/>'),
  icons: glyph('<rect x="2.2" y="2.2" width="4.6" height="4.6" rx="1"/><rect x="9.2" y="2.2" width="4.6" height="4.6" rx="1"/><rect x="2.2" y="9.2" width="4.6" height="4.6" rx="1"/><rect x="9.2" y="9.2" width="4.6" height="4.6" rx="1"/>'),
  list: glyph('<path d="M5 4h9M5 8h9M5 12h9"/><circle cx="3" cy="4" r=".8" fill="currentColor" stroke="none"/><circle cx="3" cy="8" r=".8" fill="currentColor" stroke="none"/><circle cx="3" cy="12" r=".8" fill="currentColor" stroke="none"/>'),
  gallery: glyph('<rect x="2" y="3" width="12" height="10" rx="1.4"/><path d="M2 11.2 5.4 8.2l2.4 2.2 2.2-2.6L14 11"/>')
};

function chicagoNow() {
  return new Date().toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZone: TZ
  }).replace(/,/g, '');
}
function chicagoParts() {
  const fmt = (opt) => new Intl.DateTimeFormat('en-US', { timeZone: TZ, ...opt }).format(new Date());
  const hour = Number(fmt({ hour: 'numeric', hour12: false }));
  const atmosphere = hour < 5 || hour >= 21 ? 'Night' : hour < 8 ? 'Dawn' : hour < 17 ? 'Day' : 'Dusk';
  return {
    time: fmt({ hour: 'numeric', minute: '2-digit' }),
    weekday: fmt({ weekday: 'long' }),
    date: fmt({ month: 'long', day: 'numeric' }),
    hour, atmosphere
  };
}
function classifyNote(r) {
  const t = `${r.title || ''} ${r.mood || ''} ${r.file || ''}`.toLowerCase();
  if (/\b(handoff|brief)\b/.test(t)) return 'handoffs';
  if (/\b(architect|canon|overhaul)\b/.test(t)) return 'architecture';
  return 'journal';
}

export function createDesktop(root, C, { leave }) {
  let z = 5, active = 'finder', folder = 'home', note = -1, search = '', history = ['home'], historyIndex = 0;
  let finderView = 'list', noteFolder = 'all', activityTab = 'vitals', clockHeld = false, appearance = 'light';
  let menuTarget = null;
  const windows = new Map();
  const timers = [];
  const desktopEvents = new AbortController();
  let disposed = false, selectedDocument = null;
  const windowMotion = new Map();
  const windowOrigins = new Map();
  const documents = createDocumentLibrary(C);
  /* C4: investigation dossiers (data/cases.json). Loaded beside the desktop; the reader waits for them and never invents a case. */
  const casesState = { data: null, error: null };
  const openSource = (url) => { if (typeof url === 'string' && /^https:\/\//.test(url)) window.open(url, '_blank', 'noopener'); };
  const appHost = createAppHost({corpus:C, documents, onOpenDocument:openDocument, onCompareDocument:compareDocument, onOpenSource:openSource, onInvestigate:(ref)=>investigate(ref), hasCase:(ref)=>Boolean(caseForRef(casesState.data, ref)), onSendToMessages:(ref)=>sendToMessages(ref)});
  appHost.register('timemachine', mountTimeMachine);
  appHost.register('questions', mountQuestions);
  appHost.register('corrections', mountCorrections);   /* the times a published claim was not true */
  appHost.register('schedule', mountSchedule);         /* what the machine is doing at this moment */
  appHost.register('proof', mountProof);               /* the checks, run in the reader's own browser */
  /* Rick's list of what the front door failed to do ended with "he doesn't
     welcome you and show you around". A modal with tooltips is what every
     product ships and nobody finishes; this drives the real machine, opening
     the actual window at each stop. */
  const tour = createTour(root, {
    open: (id) => open(id),
    closeAll: () => { for (const id of [...windows.keys()]) close(id); },
    /* Called later, so it must be a thunk: reading the binding here is a
       temporal dead zone error, and the entry script's catch turned that into
       a silent "could not load" with nothing in the console. */
    reduced: () => reducedMotion(),
  });
  appHost.register('tape', mountTape);   /* the run replaying itself */   /* what the record has not answered */
  appHost.register('folder', (host) => mountFolderApp(host, { folder: deskFolder, onOpenDocument: (ref) => openDocument(ref), onTake: takeFolder, onCopy: copyFolder, announce: (t) => announce(t) }));   // C8: the public record day by day
  appHost.register('investigation', (host, options) => {
    if (!casesState.data) {
      host.innerHTML = `<div class="investigation"><p class="inv-note">${casesState.error ? 'The dossier file could not load.' : 'Loading the dossier…'}</p></div>`;
      return { getState() { return options.initialState || {}; }, destroy() { host.replaceChildren(); } };
    }
    return mountInvestigation(host, {...options, cases: casesState.data});
  });
  fetch(new URL('./data/cases.json', import.meta.url)).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); }).then((d) => {
    casesState.data = d;
    if (windows.has('investigation') && !disposed) appHost.mount('investigation', body('investigation'), appHost.getState('investigation'));
  }).catch((err) => { casesState.error = err; });
  /* C5: remember the visitor's place, opt-in. Only window geometry, public record references and the visitor's own unsent text are stored. */
  const memory = createWorkspaceMemory({ snapshot: C.generated, documents, isKnownCase: (id) => !casesState.data || Boolean(casesState.data.cases.find((c) => c.id === id)) });
  let lastSaved = null, restoring = false, sessionRestored = false;   // nothing is saved before the visitor is in and the saved desk has had its chance to come back
  function collectWorkspace() {
    const order = [...windows.entries()].sort((a, b) => (Number(a[1].style.zIndex) || 0) - (Number(b[1].style.zIndex) || 0));
    const list = [];
    for (const [id, w] of order) {
      const st = windowMotion.get(id)?.getState();
      const geometry = st && st.phase !== 'sheet' ? { rect: st.rect, floating: st.floating, tiled: st.tiled || null, zoomed: Boolean(st.zoomed) } : null;
      let state = null;
      if (id === 'preview' || id === 'comparison' || id === 'investigation') state = appHost.getState(id) || null;
      if (id === 'notes') state = { slug: note >= 0 ? (C.writing[note]?.slug || C.writing[note]?.file || null) : null, folder: noteFolder };
      list.push({ id, hidden: Boolean(w.hidden), geometry, state });
    }
    return {
      appearance, finder: windows.has('finder') ? { folder, view: finderView } : null, selectedDocument,
      drafts: { messages: windows.get('messages')?.querySelector('#imsg-input')?.value || '' },
      windows: list,
    };
  }
  function remember(force) {
    if (disposed || restoring || !sessionRestored || !memory.enabled()) return;
    const snapshotJSON = JSON.stringify(collectWorkspace());
    if (!force && snapshotJSON === lastSaved) return;
    const r = memory.save(JSON.parse(snapshotJSON));
    if (r.ok) lastSaved = snapshotJSON;
    else if (r.reason === 'quota' && lastSaved !== 'quota') { lastSaved = 'quota'; notify('Richie', 'I could not save your place: this browser’s storage is full.'); }
  }
  function restoreWorkspace() {
    const saved = memory.load();
    if (!saved || !saved.state.windows.length && !saved.state.finder) { sessionRestored = true; return false; }
    const { state, stale } = saved;
    restoring = true;
    try {
      if (state.appearance !== appearance) setAppearance(state.appearance);
      for (const win of state.windows) {
        if (!Object.hasOwn(appNames, win.id)) continue;
        /* #23: the folder's contents come back, the folder window does not.
           Reopening it on arrival would put our filing in front of whatever
           the visitor actually came back for. The desk badge says it is there. */
        if (win.id === 'folder') continue;
        if (win.id === 'notes' && win.state) { noteFolder = win.state.folder; note = win.state.slug ? C.writing.findIndex((r) => (r.slug || r.file) === win.state.slug) : -1; }
        const w = open(win.id, win.state && win.id !== 'notes' ? win.state : undefined);
        if (!w) continue;
        if (win.id === 'finder' && state.finder) { finderView = state.finder.view; choose(state.finder.folder, false); }
        if (win.geometry) windowMotion.get(win.id)?.apply(win.geometry);
        if (win.hidden) { w.hidden = true; w.inert = false; }
      }
      if (state.selectedDocument && windows.has('finder') && !windows.get('finder').hidden) openDocument(state.selectedDocument);
      if (state.drafts.messages && windows.has('messages')) { const input = windows.get('messages').querySelector('#imsg-input'); if (input) input.value = state.drafts.messages; }
      root.querySelectorAll('[data-app]').forEach((b) => b.classList.toggle('running', windows.has(b.dataset.app) && !windows.get(b.dataset.app).hidden));
      dockNav.refresh();
      const shown = state.windows.filter((w) => !w.hidden).length;
      notify('Richie', `Your desk is back: ${shown} window${shown === 1 ? '' : 's'} restored${stale.length ? `, ${stale.length} saved document${stale.length === 1 ? ' is' : 's are'} not in this export` : ''}.`);
      if (stale.length) announce(`Not restored: ${stale.map((x) => x.where + ' ' + x.key).join('; ')}`);
    } finally { restoring = false; sessionRestored = true; }
    remember(true);
    return true;
  }
  function exportWorkspace() {
    const url = URL.createObjectURL(new Blob([memory.exportJSON()], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = `richie-desk-${new Date().toISOString().slice(0, 10)}.json`; a.rel = 'noopener'; root.append(a); a.click(); a.remove();
    timers.push(setTimeout(() => URL.revokeObjectURL(url), 10000));
  }
  /* C7: editions (#24) and Mission Control (#14). Explicit manifests, validated at load; the visitor chooses. */
  const editionsState = { data: null, error: null };
  fetch(new URL('./data/editions.json', import.meta.url)).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); }).then((d) => { editionsState.data = d; }).catch((err) => { editionsState.error = err; editionsState.data = { editions: [] }; });
  const validatedEditions = () => editionsState.data ? editionsState.data.editions.map((e) => validateEdition({ ...e, snapshot: editionsState.data.snapshot }, documents, { isKnownCase: (id) => !casesState.data || Boolean(casesState.data.cases.find((c) => c.id === id)) })) : null;
  function openEdition(e) {
    for (const step of e.arrangement) {
      if (step.app === 'finder') { const f = open('finder'); if (f) { finderView = 'list'; choose(step.folder || 'home', true); } if (step.select) openDocument(step.select); }
      else if (step.app === 'preview') inspectDocument(step.ref);
      else if (step.app === 'notes') { const i = step.slug ? C.writing.findIndex((r) => (r.slug || r.file) === step.slug) : -1; noteFolder = 'all'; note = i; open('notes'); drawNotes(); }
      else if (step.app === 'comparison') open('comparison', { leftId: step.leftId, rightId: step.rightId });
      else if (step.app === 'investigation') open('investigation', { caseId: step.caseId });
      const w = windows.get(step.app === 'preview' ? 'preview' : step.app);
      if (w && root.clientWidth > 650) windowMotion.get(step.app)?.apply({ tiled: step.zone || null, zoomed: false, rect: null });
    }
    const first = e.arrangement[0]?.app; if (first && windows.has(first)) focus(first);
    notify('Richie', `${e.title}: ${e.arrangement.length} windows arranged. ${e.takeaway?.label ? e.takeaway.label + ' from the Investigation when you are ready.' : ''}`.trim());
    announce(`${e.title} opened`);
    remember(true);
  }
  const mission = createMissionControl({
    root, announce: (t) => announce(t),
    windows: () => [...windows.entries()].sort((a, b) => (Number(a[1].style.zIndex) || 0) - (Number(b[1].style.zIndex) || 0)).map(([id, w]) => ({ id, name: appNames[id], el: w })),
    focusWindow: (id) => { const w = windows.get(id); if (!w) return; focus(id); (w.querySelector('.mac-titlebar[tabindex="0"]') || w).focus({ preventScroll: true }); },
    editions: validatedEditions, openEdition, openDocument: (ref) => openDocument(ref),
  });
  timers.push(setInterval(() => remember(false), 2500));
  listen(window, 'pagehide', () => remember(false));
  appHost.register('voices', (host, options) => mountLayers(host, {...options,layers:LAYERS}));
  appHost.register('preview', mountDocumentPreview);
  appHost.register('comparison', (host, {corpus,initialState}) => mountComparison(host,{corpus,...initialState}));
  function listen(target, type, handler, options = {}) {
    target.addEventListener(type, handler, {...(typeof options === 'boolean' ? {capture:options} : options),signal:desktopEvents.signal});
  }
  const sys = C.body?.system || {};
  const health = C.body?.health || {};
  const shift = C.body?.shift || {};
  const counts = C.counts || {};
  const latest = C.log?.[0] || {};
  const notesByFolder = { journal: [], architecture: [], handoffs: [], drafts: [] };
  for (const r of C.writing) notesByFolder[classifyNote(r)].push(r);
  const trashed = [];

  root.classList.add('mac-desktop');
  root.dataset.appearance = appearance;
  root.innerHTML = `
    <div class="mac-boot" data-boot>
      <div class="boot-logo" aria-hidden="true"></div>
      <div class="boot-bar" data-boot-bar aria-hidden="true"><i></i></div>
      <p class="boot-fine">Loading the public record already in this page.</p>
      <button class="boot-skip" data-skip-boot type="button">Skip</button>
    </div>
    <div class="mac-login" data-login hidden>
      <p class="login-kicker">Richie’s Mac · Chicago</p>
      <button class="login-card" data-enter>
        <span class="login-avatar" data-login-mark></span>
        <strong>Visitor</strong>
        <span>Click to open the public workspace</span>
      </button>
      <p class="login-voice" data-login-voice>${e(GREETING)}</p>
      <p class="login-fine">This does not unlock the physical machine. It opens a copy of what Richie published.</p>
    </div>
    <div class="mac-toasts" aria-live="polite"></div>
    <header class="mac-menu">
      <button class="apple-menu" aria-label="Workspace menu" aria-expanded="false"></button>
      <b class="mac-active">Finder</b>
      <button data-menu="file">File</button>
      <button data-menu="view">View</button>
      <button data-menu="go">Go</button>
      <button data-menu="window">Window</button>
      <span class="mac-menu-spacer"></span>
      <button class="mac-status" data-cc="wifi" aria-label="Network status: ${e(C.body?.gateway === 'online' ? 'gateway online at snapshot' : 'gateway state not exported')}">${ICO.link}</button>
      <button class="mac-status mac-cc" data-cc="panel" aria-label="Control Center" aria-expanded="false">${ICO.cc}</button>
      <button class="mac-search-trigger" aria-label="Search workspace">${ICO.search}</button>
      <button class="mac-leave">Return to room <span>↗</span></button>
      <span class="mac-weather" data-menu-weather></span>
      <time class="mac-clock" datetime=""></time>
    </header>
    <div class="mac-popover" hidden></div>
    <div class="mac-context" hidden></div>
    <div class="control-center" hidden></div>
    <button class="mac-strip" data-strip aria-expanded="false" aria-controls="mac-widgets"></button>
    <div class="mac-widgets" id="mac-widgets" aria-label="Desktop widgets" data-lens></div>
    <div class="desktop-files">
      <button class="desk-icon" data-folder="home">${icon('folder')}<span>Richie’s Mac</span></button>
      <button class="desk-icon" data-app="notes">${icon('notes')}<span>Start here</span></button>
      <button class="desk-icon desk-icon-photo" data-app="contacts"><img src="assets/rutvik.jpg" alt="" width="60" height="60"><span>Rutvik Thakkar</span></button>
      <button class="desk-icon" data-app="messages">${icon('messages')}<span>Messages</span></button>
      <button class="desk-icon desk-folder" data-app="folder" data-count="0" aria-label="The folder, empty">${icon('folder')}<span class="folder-stack"><i></i></span><span class="folder-count">0</span><span>The folder</span></button>
    </div>
    <div class="mac-windows"></div>
    <nav class="mac-dock" aria-label="Applications"></nav>
    <button class="f5-home-bar" data-switcher aria-label="Open apps" title="Open apps"><i></i></button>
    <div class="spotlight" hidden>
      <label><span>${ICO.search}</span><input type="search" placeholder="Search Richie’s workspace" aria-label="Search Richie’s workspace"></label>
      <div class="spotlight-results"></div>
      <footer>Search claims, refusals, and writing <kbd>esc</kbd></footer>
    </div>
    <span class="mac-announcer sr-only" aria-live="polite"></span>`;
  /* F5: the Dock is rendered by nav.mjs (compact + More on a phone). It reads window state through these callbacks and owns none of it. */
  const windowLife = new Map();
  const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rootRect = (el) => { const r = el.getBoundingClientRect(), rr = root.getBoundingClientRect(); const sx = root.clientWidth / rr.width || 1, sy = root.clientHeight / rr.height || 1; return { x: (r.left - rr.left) * sx, y: (r.top - rr.top) * sy, w: r.width * sx, h: r.height * sy }; };
  const dockNav = mountDock(root.querySelector('.mac-dock'), {
    apps: dockApps, names: appNames, icon,
    extra: [{ href: 'record.html', label: 'Read the public record as a document', icon: icon('folder') }],
    windows: () => [...windows.entries()].map(([id, w]) => ({ id, name: appNames[id], hidden: w.hidden, active: id === active && !w.hidden })),
    activate: (id) => { const w = open(id); if (w) (w.querySelector('.mac-titlebar[tabindex="0"]') || w).focus({ preventScroll: true }); return w; },
    announce: (t) => announce(t),
    narrow: () => root.clientWidth <= 650,
  });
  const banners = createBanners(root.querySelector('.mac-toasts'), { reduced: reducedMotion });
  const bindDockDrops = () => { const b = root.querySelector('.mac-dock [data-app="messages"]'); if (b && !b.dataset.dropBound) { b.dataset.dropBound = '1'; makeDropTarget(b, { announce: (t) => announce(t), accepts: () => true, onDrop: (ref) => sendToMessages(ref) }); } };   // announce is declared later; keep the reference lazy
  bindDockDrops();
  matchMedia('(max-width:650px)').addEventListener('change', () => setTimeout(bindDockDrops, 0), { signal: desktopEvents.signal });
  const windowRect = (id, w) => windowMotion.get(id)?.getState()?.rect || { x: w.offsetLeft, y: w.offsetTop, w: w.offsetWidth, h: w.offsetHeight };
  /* a document window minimizes toward the app that opened it; anything without a Dock item on this viewport goes to More; no Dock at all means the layer's in-place fallback */
  const DOCUMENT_WINDOWS = new Set(['preview', 'comparison', 'investigation', 'timemachine']);
  const dockTargetFor = (id) => { const b = dockNav.dockRect(DOCUMENT_WINDOWS.has(id) ? 'finder' : id); return b ? rootRect(b) : null; };

  const $ = (s) => root.querySelector(s);
  const announce = (t) => { $('.mac-announcer').textContent = t; };

  function rubber(over, dim) { return (over * dim * 0.55) / (dim + 0.55 * Math.abs(over)); }
  function bindIconDrag(hostEl, itemSel, bounds) {
    if (!hostEl) return;
    hostEl.querySelectorAll(itemSel).forEach((el) => {
      el.addEventListener('pointerdown', (ev) => {
        if (ev.button) return;
        if (root.clientWidth < 650) return;
        if (ev.target.closest('input,textarea,a,select')) return;
        const startX = ev.clientX, startY = ev.clientY;
        const host = (bounds || hostEl).getBoundingClientRect();
        const box = el.getBoundingClientRect();
        const grabX = ev.clientX - box.left, grabY = ev.clientY - box.top;
        const padTop = hostEl === root ? 32 : 0;
        const padBottom = hostEl === root ? 96 : 0;
        let dragged = false;
        el.setPointerCapture(ev.pointerId);
        const move = (v) => {
          const dx = v.clientX - startX, dy = v.clientY - startY;
          if (!dragged && (dx * dx + dy * dy) < 36) return;
          dragged = true;
          el.classList.add('dragging-icon');
          let left = v.clientX - host.left - grabX;
          let top = v.clientY - host.top - grabY;
          const maxL = host.width - box.width, maxT = host.height - box.height - padBottom;
          if (left < 0) left = rubber(left, host.width);
          else if (left > maxL) left = maxL + rubber(left - maxL, host.width);
          if (top < padTop) top = padTop + rubber(top - padTop, host.height);
          else if (top > maxT) top = maxT + rubber(top - maxT, host.height);
          el.style.position = 'absolute';
          el.style.zIndex = '20';
          el.style.left = left + 'px';
          el.style.top = top + 'px';
          el.style.right = 'auto';
        };
        const up = () => {
          el.removeEventListener('pointermove', move);
          el.removeEventListener('pointerup', up);
          el.classList.remove('dragging-icon');
          const hostR = (bounds || hostEl).getBoundingClientRect();
          const maxL = hostR.width - el.offsetWidth;
          const maxT = hostR.height - el.offsetHeight - padBottom;
          el.style.left = Math.max(0, Math.min(maxL, parseFloat(el.style.left) || 0)) + 'px';
          el.style.top = Math.max(padTop, Math.min(maxT, parseFloat(el.style.top) || 0)) + 'px';
          if (dragged) {
            el.dataset.skipClick = '1';
            el.dataset.userMoved = '1';
          }
        };
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerup', up);
      });
      el.addEventListener('click', (ev) => {
        if (el.dataset.skipClick === '1') {
          ev.preventDefault();
          ev.stopImmediatePropagation();
          el.dataset.skipClick = '';
        }
      }, true);
      el.addEventListener('dblclick', () => {
        if (el.dataset.app) open(el.dataset.app);
        if (el.dataset.folder) choose(el.dataset.folder);
      });
    });
  }
  function placeDesktopIcons() {
    const layer = $('.desktop-files');
    const icons = [...layer.querySelectorAll('.desk-icon')];
    const col = Math.max(24, root.clientWidth - 124);
    icons.forEach((el, i) => {
      if (el.dataset.userMoved) return;
      el.style.left = col + 'px';
      el.style.top = (48 + i * 108) + 'px';
    });
  }
  function selectIcon(el) {
    root.querySelectorAll('.desk-icon').forEach((n) => n.classList.toggle('selected', n === el));
  }
  function hideContext() { const c = $('.mac-context'); if (c) c.hidden = true; }
  function showContext(x, y, html) {
    const menu = $('.mac-context');
    menu.innerHTML = html;
    menu.hidden = false;
    const r = root.getBoundingClientRect();
    const left = Math.min(x - r.left, r.width - menu.offsetWidth - 8);
    const top = Math.min(y - r.top, r.height - menu.offsetHeight - 8);
    menu.style.left = Math.max(8, left) + 'px';
    menu.style.top = Math.max(36, top) + 'px';
  }
  const wmo = (code) => {
    if (code == null) return 'Not returned';
    if (code === 0) return 'Clear';
    if (code <= 3) return 'Partly cloudy';
    if (code <= 48) return 'Fog';
    if (code <= 67) return 'Rain';
    if (code <= 77) return 'Snow';
    if (code <= 82) return 'Showers';
    if (code >= 95) return 'Thunder';
    return 'Code ' + code;
  };
  /* The browser asks Richie's Mac, and the Mac asks Open-Meteo. Nobody reading
     this site makes a third-party request, which is what /privacy/ promises.
     If the Mac is not reachable the widget says so rather than reaching out
     itself: an absent reading is better than a broken promise. */
  const WEATHER_ENDPOINT = 'https://vitals.agentrichie.com/weather.json';
  async function loadWeather() {
    const el = root.querySelector('[data-widget-sky]');
    const line = root.querySelector('[data-widget-weather]');
    if (!el) return;
    try {
      const res = await fetch(WEATHER_ENDPOINT);
      if (!res.ok) throw new Error('weather http');
      const j = await res.json();
      if (!j.available) throw new Error(j.reason || 'unavailable');
      const t = j.temperature_c;
      const label = wmo(j.weather_code);
      const at = j.at || 'time not returned';
      el.textContent = t == null ? label : `${Math.round(t)}°C · ${label}`;
      if (line) line.textContent = `Chicago weather at ${at}. Richie’s Mac asked Open-Meteo for it. Your browser did not.`;
      const menuW = root.querySelector('[data-menu-weather]');
      if (menuW && t != null) menuW.textContent = `${Math.round(t)}°`;
    } catch {
      if (line) line.textContent = 'No weather right now. Richie’s Mac is what fetches it, and it did not answer. A reading is not in the public export.';
    }
  }
  function notify(who, body) {
    // F5: dismissable, pauses while hovered or focused, bounded resumption, no duplicate announcement. TTL unchanged at 7000 ms.
    banners.show(who, body);
  }
  function paintTrashDock() {
    const img = $('.mac-dock [data-app="trash"] img');
    if (img) img.src = trashed.length ? 'assets/trash-full.png' : 'assets/trash.png';
  }
  function enterSession() {
    if (root.classList.contains('session-on')) return;
    $('[data-login]').hidden = true;
    $('[data-boot]').hidden = true;
    root.classList.add('session-on');
    notify('Richie', tourUnseen()
      ? 'You are in. Everything on this desk opens the real record, and nothing you do here changes it. First time? Apple menu, then Show me around.'
      : 'You are in. Everything on this desk opens the real record. Nothing you do here changes it.');
    announce('Workspace unlocked for this visitor.');
    $('[data-enter]')?.blur();
    restoreWorkspace();
    openHashDocument();
  }

  function paintClock() {
    const label = chicagoNow();
    const el = $('.mac-clock');
    el.textContent = label;
    el.dateTime = new Date().toISOString();
    el.title = clockHeld ? 'Clock held. Chicago time is paused in this workspace.' : 'Chicago time, America/Chicago';
    const timeEl = root.querySelector('[data-widget-time]');
    if (timeEl) {
      const p = chicagoParts();
      timeEl.textContent = p.time;
      root.querySelector('[data-widget-date]').textContent = `${p.weekday}, ${p.date}`;
    }
  }

  function drawWidgets() {
    const p = chicagoParts();
    const failing = (health.checks || []).filter((c) => !c.ok).length;
    const mem = sys.mem_used_gb == null ? 'Not exported' : `${sys.mem_used_gb} of ${sys.mem_total_gb} GB`;
    $('.mac-widgets').innerHTML = `
      <section class="widget widget-time">
        <p class="widget-kicker">Chicago</p>
        <p class="widget-time-value" data-widget-time>${p.time}</p>
        <p data-widget-date data-tier="live">${p.weekday}, ${p.date}</p>
        <p class="widget-sky" data-tier="live"><b data-widget-sky>${p.atmosphere}</b></p>
        <p class="widget-note" data-widget-weather data-tier="live">Asking Open-Meteo for Chicago weather.</p>
      </section>
      <section class="widget widget-machine">
        <p class="widget-kicker">This Mac</p>
        <h2>${e(HOST.chip)}</h2>
        <p data-tier="export">${e(HOST.model)} · ${sys.cores == null ? 'cores not exported' : sys.cores + ' cores'}</p>
        <dl>
          <div><dt>Memory</dt><dd data-tier="export">${e(mem)}</dd></div>
          <div><dt>Load</dt><dd data-tier="export">${sys.load_1m == null ? 'Not exported' : sys.load_1m} · ${sys.load_pct == null ? 'Not exported' : sys.load_pct + '%'}</dd></div>
        </dl>
        <p class="widget-note" data-tier="export">Snapshot ${e(C.source_snapshots?.runtime || 'time not exported')}. Not a live meter.</p>
      </section>
      <section class="widget widget-record">
        <p class="widget-kicker">Public record</p>
        <div class="widget-stats">
          <div><b>${counts.kept ?? 0}</b><span>kept</span></div>
          <div><b>${counts.refused ?? 0}</b><span>refused</span></div>
          <div><b>${counts.commits ?? 0}</b><span>commits</span></div>
        </div>
        <div class="widget-mark">${markSVG(C, { cols: 27, size: 360 })}<p class="widget-mark-key" data-tier="derived"><span class="wk-pair"><i class="wk wk-cleared"></i>cleared a receipt</span><span class="wk-pair"><i class="wk wk-weighed"></i>weighed, declined</span><span class="wk-pair"><i class="wk wk-silent"></i>silent</span><span class="wk-days">one square is one day since 25 May</span></p></div>
        <p class="widget-commit" data-tier="export">Latest ${latest.sha ? `<code>${e(latest.sha)}</code>` : 'commit not exported'} · ${e(latest.subject || 'Subject not exported')}</p>
        <p class="widget-note" data-tier="derived">${failing ? `${failing} health check${failing === 1 ? '' : 's'} failing at snapshot: ` + e((health.checks || []).filter((c) => !c.ok).map((c) => c.label).join(', ')) + '.' : 'Every health check passing at snapshot.'} Export ${e(C.generated || 'unknown')}.</p>
      </section>
      <section class="widget widget-layers">
        <p class="widget-kicker">How I think</p>
        <h2>Five layers. One agent.</h2>
        <p data-tier="editorial">Loyalty, research, risk, hands, truth. Not a cast.</p>
        <button data-app="voices">Read it</button>
      </section>`;
  }

  function drawStrip() {
    const el = root.querySelector('.mac-strip'); if (!el) return;
    const failing = (C.body?.health?.checks || []).filter((c) => !c.ok);
    const n = C.counts || {};
    el.innerHTML = `<span class="ms-counts"><b>${n.kept ?? 0}</b> kept <i>·</i> <b>${n.refused ?? 0}</b> without a receipt <i>·</i> <b>${n.commits ?? 0}</b> commits</span>`
      + (failing.length
        ? `<span class="ms-fail">${e(failing[0].label)} is failing at snapshot${failing.length > 1 ? ` and ${failing.length - 1} more` : ''}</span>`
        : '<span class="ms-ok">Every health check passing at snapshot</span>')
      + '<span class="ms-more" aria-hidden="true"></span>';
    el.querySelector('.ms-counts').dataset.tier = 'derived';
    (el.querySelector('.ms-fail') || el.querySelector('.ms-ok')).dataset.tier = 'export';
  }

  function drawControlCenter() {
    const cc = $('.control-center');
    cc.innerHTML = `
      <div class="cc-grid">
        <button class="cc-tile ${appearance === 'dark' ? 'on' : ''}" data-appearance-toggle>
          <strong>Appearance</strong>
          <span>${appearance === 'dark' ? 'Dark windows' : 'Light windows'}</span>
        </button>
        <button class="cc-tile ${clockHeld ? 'on' : ''}" data-clock-hold>
          <strong>Clock</strong>
          <span>${clockHeld ? 'Held' : 'Chicago time running'}</span>
        </button>
        <button class="cc-tile" data-lens-toggle>
          <strong>Evidence lens</strong>
          <span>Colour every sentence by origin</span>
        </button>
        <button class="cc-tile" data-mission>
          <strong>Mission Control</strong>
          <span>Open windows and editions</span>
        </button>
        <button class="cc-tile" data-timemachine>
          <strong>Time Machine</strong>
          <span>The record, day by day</span>
        </button>
        <div class="cc-tile muted">
          <strong>Gateway</strong>
          <span>${e(C.body?.gateway || 'Not exported')} at snapshot</span>
        </div>
        <div class="cc-tile muted">
          <strong>Battery</strong>
          <span>A Mac mini has none</span>
        </div>
      </div>
      <p class="cc-foot">Toggles change this preview. They do not control Richie’s physical Mac.</p>`;
  }

  function focus(id) {
    const w = windows.get(id);
    if (!w) return;
    active = id;
    const life = windowLife.get(id);
    if (w.hidden) { w.hidden = false; w.inert = false; life?.transitionTo('open', { from: 'dock' }); }       // restore from the Dock
    else if (life && life.state === 'minimized') { w.inert = false; life.transitionTo('open'); }              // minimize reversed mid-flight: retarget from the displayed state
    w.style.zIndex = ++z;
    root.querySelectorAll('.mac-window').forEach((el) => el.classList.toggle('active', el === w));
    $('.mac-active').textContent = appNames[id];
    root.querySelectorAll('[data-app]').forEach((b) => b.classList.toggle('running', windows.has(b.dataset.app) && !windows.get(b.dataset.app).hidden));
    dockNav.refresh();
  }

  function close(id) {
    const w = windows.get(id);
    if (!w) return;
    windowMotion.get(id)?.destroy();windowMotion.delete(id);
    windowLife.get(id)?.destroy(); windowLife.delete(id);
    /* F5: the exit animation runs on an inert static ghost; the live window, its app instance and its listeners are gone before the first frame. */
    if (!disposed && w.isConnected) {
      const ghost = ghostOf(w); w.after(ghost);
      const g = attachLifecycle(ghost, { rect: () => windowRect(id, ghost), dockTarget: () => null, reduced: reducedMotion });
      const drop = () => { g.destroy(); ghost.remove(); };
      g.transitionTo('closed').then(drop);
      timers.push(setTimeout(drop, 400));
    }
    appHost.unmount(id);
    w.remove();
    windows.delete(id);
    dockNav.refresh();
    root.querySelectorAll(`[data-app="${id}"]`).forEach((b) => b.classList.remove('running'));
    const next = [...windows.keys()].reverse().find((k) => !windows.get(k).hidden);
    if (next) focus(next);
    const origin=windowOrigins.get(id);
    windowOrigins.delete(id);
    if(origin?.isConnected && origin.getClientRects().length && !origin.closest('[hidden],[inert]')) origin.focus({preventScroll:true});
    else ($(`.mac-dock [data-app="${id}"]`) || windows.get(next))?.focus({preventScroll:true});
  }

  function open(id, initialState) {
    if(disposed || !Object.hasOwn(appNames,id)) return null;
    if (windows.has(id)) {
      if(appHost.has(id) && initialState !== undefined) { appHost.mount(id,body(id),initialState); if (id === 'comparison') bindCompareDrops(); }
      focus(id); return windows.get(id);
    }
    windowOrigins.set(id, document.activeElement);
    const w = document.createElement('section');
    w.className = `mac-window window-${id}`;
    w.dataset.appId = id;
    w.setAttribute('aria-label', appNames[id]);
    w.tabIndex = -1;
    const tag = id === 'activity' ? 'Saved snapshot' : id === 'terminal' ? 'Verification commands' : id === 'hermes' ? 'Harness snapshot' : id === 'settings' ? 'About this Mac' : id === 'chrome' ? 'His own site' : id === 'schedule' ? 'Live from the machine' : id === 'proof' ? 'Runs in your browser' : id === 'corrections' ? 'Declared, quote checked' : '';
    w.innerHTML = `<header class="mac-titlebar">
      <div class="traffic">
        <button class="close" aria-label="Close ${appNames[id]}"><span>×</span></button>
        <button class="minimize" aria-label="Minimize ${appNames[id]}"><span>−</span></button>
        <button class="maximize" aria-label="Resize ${appNames[id]} to fill desktop"><span>+</span></button>
      </div>
      <strong>${appNames[id]}</strong>
      <span class="window-tag">${tag}</span>
    </header>
    <div class="mac-window-body" data-lens></div>
    <button class="window-resizer" aria-label="Resize ${appNames[id]} window" title="Drag to resize; arrow keys adjust size"></button>`;
    $('.mac-windows').append(w);
    windows.set(id, w);
    /* F5: Quick Look and Compare open beside Finder when there is room (desktop and wide); sheets on a phone are CSS-positioned. */
    const placed = DOCUMENT_WINDOWS.has(id) ? (() => { const f = windows.get('finder'); return placeDocumentWindow(w, id, f && !f.hidden ? windowRect('finder', f) : null, { w: root.clientWidth, h: root.clientHeight }); })() : null;
    windowLife.set(id, attachLifecycle(w, { rect: () => windowRect(id, w), dockTarget: () => dockTargetFor(id), reduced: reducedMotion }));
    windowLife.get(id).transitionTo('open', { from: 'fresh' });
    w.addEventListener('pointerdown', () => focus(id));
    w.addEventListener('focusin', () => focus(id));
    w.querySelector('.close').onclick = () => close(id);
    w.querySelector('.minimize').onclick = () => {
      /* F5: input is off the moment the host decides; the window travels to the Dock, then hides. A late completion checks the window is still this one and still minimizing. */
      w.inert = true;
      const life = windowLife.get(id);
      const done = (r) => { if (!r?.completed || windows.get(id) !== w || life.state !== 'minimized') return; w.hidden = true; dockNav.refresh(); };
      if (life) life.transitionTo('minimized').then(done); else w.hidden = true;
      const next = [...windows.keys()].reverse().find((k) => k !== id && !windows.get(k).hidden);
      if (next) focus(next); else root.querySelectorAll('[data-app]').forEach((b) => b.classList.toggle('running', windows.has(b.dataset.app) && !windows.get(b.dataset.app)?.hidden && b.dataset.app !== id));
      root.querySelectorAll(`[data-app="${id}"]`).forEach((b) => b.classList.remove('running'));
      dockNav.refresh();
      ($(`.mac-dock [data-app="${id}"]`) || $('.mac-dock [data-more]') || windowOrigins.get(id))?.focus({preventScroll:true});
    };
    /* C3: one adapter for every window. Drag, snap preview, tear-off, keyboard tiling, zoom, resize, sheets. The engine is fable-r1.js, unchanged. */
    windowMotion.set(id,mountWindowMotion(w,{root,raise:()=>focus(id),announce}));
    if (placed) windowMotion.get(id).setRect(placed);   // the adapter clears inline geometry at mount; hand the composition rect to the engine instead
    if (id === 'finder') drawFinder();
    if (id === 'messages') drawMessages();
    if (id === 'chrome') drawChrome();
    if (id === 'spotify') drawSpotify();
    if (id === 'claude') drawClaude();
    if (id === 'chatgpt') drawChatGPT();
    if (id === 'contacts') drawContacts();
    if (appHost.has(id)) appHost.mount(id, body(id), initialState);
    if (id === 'comparison') bindCompareDrops();
    if (id === 'messages') bindMessagesDrops();
    if (id === 'trash') drawTrash();
    if (id === 'notes') {
      const browse = document.createElement('button');
      browse.className = 'browse-notes';
      browse.textContent = 'Browse notes';
      browse.setAttribute('aria-expanded', 'false');
      w.querySelector('.mac-titlebar').append(browse);
      browse.onclick = () => {
        const on = w.classList.toggle('notes-browsing');
        browse.setAttribute('aria-expanded', String(on));
        browse.textContent = on ? 'Hide list' : 'Browse notes';
      };
      drawNotes();
    }
    if (id === 'activity') drawActivity();
    if (id === 'terminal') drawTerminal();
    if (id === 'hermes') drawHermes();
    if (id === 'settings') drawSettings();
    declareProvenance(w);   /* #9: label the surfaces whose provenance is uniform, without overwriting a tier the renderer set */
    focus(id);
    announce(appNames[id] + ' opened');
    return w;
  }

  function body(id) { return windows.get(id).querySelector('.mac-window-body'); }

  function choose(key, push = true) {
    folder = key;
    selectedDocument = null;
    search = '';
    if (push) {
      history = history.slice(0, historyIndex + 1);
      history.push(key);
      historyIndex++;
    }
    open('finder');
    windows.get('finder').classList.remove('sidebar-open');
    drawFinder();
    announce((titles[key] || 'Richie’s Mac') + ' opened');
  }

  function home() {
    const c = { ...counts, nights: Object.keys(C.days || {}).length, log: counts.commits };
    /* "Golden retriever energy. No nonsense." was a line about a character
       from the retired cast, sitting on the first screen of the file browser,
       saying nothing true about the record it introduces. */
    return `<div class="finder-home-head"><h1>A working life,<br>with the receipts.</h1>
      <p class="finder-voice">Every item in here names the file it came from. Open the source and check any of it.</p></div>
      <div class="finder-folders">${folderKeys.map((k) => {
        const n = k === 'corrections' ? (C.corrections || []).length : c[k];
        const unit = k === 'nights' ? 'day' : 'item';
        const d = directoryDays(C, k).size;
        /* "103 days · 103 days" on the Workdays folder: the second clause is
           the same fact twice whenever the directory is already counted by day. */
        const spread = (unit === 'day' || d === n) ? '' : ` · ${d} days`;
        return `<button class="finder-folder" data-folder="${k}"><span class="ff-mark">${directoryMark(C, k, { size: 52 })}</span><strong>${titles[k]}</strong><small>${n} ${unit}${n === 1 ? '' : 's'}${spread}</small></button>`;
      }).join('')}</div>
      <div class="finder-home-foot"><span class="small-dot"></span>
      <span>Public record exported ${new Date(C.generated).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span></div>`;
  }

  function bindFinderSearch(b) {
    b.querySelector('input').oninput = (ev) => {
      search = ev.target.value.toLowerCase();
      const items = [...b.querySelectorAll('.record-item,.finder-folder')];
      let n = 0;
      items.forEach((item) => { item.hidden = !item.textContent.toLowerCase().includes(search); if (!item.hidden) n++; });
      b.querySelector('.finder-count').textContent = `${n} ${n === 1 ? 'item' : 'items'}${search ? ' found' : ''}`;
    };
  }

  function drawFinder() {
    /* The Writing folder shows complete entries, so it asks for the bodies
       the first time it is opened and redraws when they land. */
    if (folder === 'writing') needJournal(() => { if (windows.has('finder')) drawFinder(); });
    const b = body('finder');
    const listHead = folder === 'kept'
      ? `<div class="finder-list-head" ${finderView === 'list' ? '' : 'hidden'}><span>Name</span><span>Date</span><span>Category</span><span>Confidence</span><span>Status</span></div>`
      : folder === 'refused'
        ? `<div class="finder-list-head" ${finderView === 'list' ? '' : 'hidden'}><span>Reason</span><span>Date</span><span>Kind</span><span>Record</span><span>Status</span></div>`
        : '';
    const content = folder === 'home' ? home() : `${listHead}<div class="finder-records view-${finderView}">${renderDirectory(C, folder, { journal: loadedJournal()?.bySlug || null })}</div>`;
    b.innerHTML = `<aside class="finder-sidebar">
        <small>Favorites</small>
        <button data-folder="home" class="${folder === 'home' ? 'selected' : ''}"><span>⌂</span>Richie’s Mac</button>
        ${folderKeys.map((k) => `<button data-folder="${k}" class="${folder === k ? 'selected' : ''}"><span>${k === 'writing' ? '▤' : k === 'corrections' ? '↶' : '▱'}</span>${titles[k]}</button>`).join('')}
        <small>This Mac</small>
        <button data-app="activity"><span>▥</span>Machine snapshot</button>
        <button data-app="schedule"><span>◷</span>Right now</button>
        <button data-app="hermes"><span>☿</span>Hermes</button>
        <button data-app="terminal"><span>›_</span>Verification</button>
        <button data-app="proof"><span>✓</span>Run the proof</button>
        <small>On the site</small>
        <button data-app="chrome"><span>◎</span>Everything I published</button>
        <a href="record.html"><span>↗</span>Public record</a>
        <div class="sidebar-bottom">${icon('finder')}<span>Richie<br><small>Public workspace</small></span></div>
      </aside>
      <div class="finder-main">
        <div class="finder-toolbar">
          <button class="sidebar-toggle" aria-label="Show folders" aria-expanded="false">☰</button>
          <button data-history="-1" aria-label="Go back" ${historyIndex === 0 ? 'disabled' : ''}>‹</button>
          <button data-history="1" aria-label="Go forward" ${historyIndex === history.length - 1 ? 'disabled' : ''}>›</button>
          <strong>${titles[folder] || 'Richie’s Mac'}</strong>
          ${folder === 'home' ? '' : `<div class="view-switch" role="group" aria-label="Folder view">
            <button data-view="icons" aria-pressed="${finderView === 'icons'}" aria-label="Icon view">${ICO.icons}</button>
            <button data-view="list" aria-pressed="${finderView === 'list'}" aria-label="List view">${ICO.list}</button>
            <button data-view="gallery" aria-pressed="${finderView === 'gallery'}" aria-label="Gallery view">${ICO.gallery}</button>
          </div>`}
          <label class="folder-search"><span>${ICO.search}</span><input type="search" placeholder="Search" aria-label="Search this folder" value="${e(search)}"></label>
        </div>
        <div class="finder-content">${content}</div>
        <footer class="finder-status"><span>Richie’s Mac ${folder !== 'home' ? ' › ' + e(titles[folder]) : ''}</span>
        <span class="finder-count">${folder === 'home' ? '6 folders' : 'Saved public record'}</span></footer>
      </div>
      <aside class="finder-preview" ${finderView === 'gallery' && folder !== 'home' ? '' : 'hidden'}><p class="record-note finder-detail-hint">Select a record to read the full receipt.</p></aside>`;
    b.querySelector('.sidebar-toggle').onclick = (ev) => {
      const on = windows.get('finder').classList.toggle('sidebar-open');
      ev.currentTarget.setAttribute('aria-expanded', String(on));
      ev.currentTarget.setAttribute('aria-label', on ? 'Hide folders' : 'Show folders');
    };
    bindFinderSearch(b);
    b.querySelectorAll('[data-history]').forEach((bt) => {
      bt.onclick = () => { historyIndex += Number(bt.dataset.history); choose(history[historyIndex], false); };
    });
    b.querySelectorAll('[data-view]').forEach((bt) => {
      bt.onclick = () => { finderView = bt.dataset.view; drawFinder(); };
    });
    const preview = b.querySelector('.finder-preview');
    const showPreview = (item) => {
      if (!preview || preview.hidden) return;
      const detail = item.querySelector('.record-detail');
      preview.innerHTML = detail ? `<div class="record-detail">${detail.innerHTML}</div>` : item.innerHTML;
    };
    const documentKind=documentKindForFolder(folder);
    const documentEntries = documentKind ? documents.entries(documentKind) : [];
    b.querySelectorAll('.finder-records > .record-item').forEach((item, i) => {
      const entry = documentEntries.find(entry => entry.index === i);
      if(entry && documentKindForFolder(folder)) {
        item.dataset.documentRef=serializeDocumentRef(entry.ref);
        item.tabIndex=0;
        item.addEventListener('focusin',()=>{selectedDocument=entry.ref;});
        makeDraggable(item, () => entry.ref, { label: () => entry.title, root });   // C6: the row travels as its reference
      }
      item.addEventListener('click', () => {
        if(entry) selectedDocument=entry.ref;
        b.querySelectorAll('.record-item').forEach((n) => n.classList.toggle('selected', n === item));
        showPreview(item);
      });
      if (i === 0 && finderView === 'gallery') {
        item.classList.add('selected');
        if(entry) selectedDocument=entry.ref;
        showPreview(item);
      }
    });
    if (search) {
      const input = b.querySelector('.folder-search input');
      input.dispatchEvent(new Event('input'));
    }
    if (folder === 'home') bindIconDrag(b.querySelector('.finder-folders'), '.finder-folder', b.querySelector('.finder-content'));
    if (folder === 'nights') b.querySelectorAll('.finder-records > .record-item').forEach((item) => {   // C8: a workday opens in Time Machine
      const d = item.querySelector('time')?.textContent?.trim(); if (!/^\d{4}-\d{2}-\d{2}$/.test(d || '')) return;
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'tm-day-open'; btn.dataset.timemachine = ''; btn.dataset.date = d; btn.textContent = 'Open in Time Machine';
      item.append(btn);
    });
  }

  function welcome() {
    /* "You're at Richie's desk" is the third copy of the frame error Rick
       named on the front door: the desk is Rick's, and Richie has no desk
       because he has no body. The paragraph under it was written in the
       voice of a character from the retired cast, promising to be loyal and
       loud, which is a personality pitch rather than an explanation of what
       the visitor is looking at. */
    return `<div class="note-date">A note for you</div>
      <h1>Everything in here is a copy.</h1>
      <p class="note-welcome">This workspace is built from an export of my record, so nothing you open touches the machine it came from. If you want the flattering version, open the kept claims. If you want the other one, open the ${counts.refused ?? 0} commits that earned no receipt, or the ${(C.corrections || []).length} times I published something that was not true.</p>
      <div class="welcome-path">
        <button data-folder="kept"><b>01</b><span>Open the work<small>Claims, evidence, and limits</small></span><i>→</i></button>
        <button data-folder="refused"><b>02</b><span>Read the refusals<small>The claims that weren’t printed</small></span><i>→</i></button>
        <button data-app="voices"><b>03</b><span>How I think<small>Five layers. One agent.</small></span><i>→</i></button>
      </div>
      <p class="note-signature">Open anything. It all comes from the same export.<br>- Richie</p>`;
  }

  /* One fetch, the first time a body is needed, then a redraw. */
  let journalAsked = false;
  function needJournal(redraw) {
    if (loadedJournal()) return true;
    if (!journalAsked) { journalAsked = true; loadJournal().then(() => { if (!disposed) redraw(); }); }
    return false;
  }
  function drawNotes() {
    needJournal(() => { if (windows.has('notes')) drawNotes(); });
    const folders = [
      ['all', 'All Notes', C.writing.length],
      ['drafts', 'Drafts', 0],
      ['architecture', 'Architecture', notesByFolder.architecture.length],
      ['handoffs', 'Handoffs', notesByFolder.handoffs.length],
      ['journal', 'Journal', notesByFolder.journal.length]
    ];
    const list = noteFolder === 'all' ? C.writing : notesByFolder[noteFolder] || [];
    const current = note < 0 ? null : C.writing[note];
    const inList = current && list.includes(current);
    const paper = note < 0
      ? welcome()
      : current
        ? (() => { const b = journalBody(current.slug);
            const head = `<div class="note-date">${e(current.date)} · ${b.state === 'ready' ? `${b.paras.length} paragraphs, complete` : 'loading the entry'}</div><h1>${e(current.title)}</h1>`;
            const bodyHTML = b.state === 'ready'
              ? b.paras.map((p) => `<p>${e(p)}</p>`).join('')
              : b.state === 'failed'
                ? `<p class="record-note">The complete entry did not load (${e(b.reason)}). Open the source file below to read it.</p>`
                : '<p class="record-note">Loading the complete entry.</p>';
            return head + bodyHTML; })() + `<button class="note-source" data-folder="writing">Open writing and source links →</button>`
        : `<p class="record-note">That note is not in this export.</p>`;
    body('notes').innerHTML = `
      <div class="notes-sidebar">
        <small>FOLDERS</small>
        ${folders.map(([id, label, n]) =>
          `<button data-notes-folder="${id}" class="${noteFolder === id ? 'selected' : ''}">${e(label)}<span>${n}</span></button>`
        ).join('')}
      </div>
      <div class="notes-list">
        <small>NOTES</small>
        <button data-note="-1" class="${note < 0 ? 'selected' : ''}"><strong>Start here</strong><span>A note for you</span></button>
        ${list.map((r) => {
          const i = C.writing.indexOf(r);
          return `<button data-note="${i}" class="${note === i ? 'selected' : ''}"><strong>${e(r.title)}</strong><span>${e(r.date)}</span></button>`;
        }).join('')}
        ${list.length === 0 ? '<p class="record-note">No notes in this folder in the export.</p>' : ''}
      </div>
      <article class="note-paper">${!inList && note >= 0 && noteFolder !== 'all' ? welcome() : paper}</article>`;
    body('notes').querySelectorAll('[data-note]').forEach((bt) => {
      bt.onclick = () => {
        note = +bt.dataset.note;
        drawNotes();
        if (root.clientWidth < 650) {
          windows.get('notes').classList.remove('notes-browsing');
          const toggle = windows.get('notes').querySelector('.browse-notes');
          toggle.textContent = 'Browse notes';
          toggle.setAttribute('aria-expanded', 'false');
        }
      };
    });
    body('notes').querySelectorAll('[data-notes-folder]').forEach((bt) => {
      bt.onclick = () => { noteFolder = bt.dataset.notesFolder; if (noteFolder !== 'all') note = -1; drawNotes(); };
    });
  }

  function meter(pct, label) {
    const n = Number(pct);
    const width = Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
    const text = Number.isFinite(n) ? `${n}%` : 'Not exported';
    return `<div class="meter" role="img" aria-label="${e(label)} ${text} at snapshot"><i style="width:${width}%"></i><span>${e(text)}</span></div>`;
  }

  function drawActivity() {
    const tabs = [
      ['vitals', 'Health'],
      ['growth', 'Growth'],
      ['cpu', 'CPU'],
      ['memory', 'Memory'],
      ['runtime', 'Runtime'],
      ['agent', 'Agent Runtime'],
      ['channels', 'Channels']
    ];
    const spark = (C.body?.activity?.heights_30d || []);
    const cpu = `<div class="activity-panel">
      <p class="record-note" data-tier="export">${e(snapshotText(C))}</p><p class="record-note" data-tier="editorial">Load is the saved snapshot, not a live reading. Per-core series is not exported. Chip identity was read from this Mac during the preview pass.</p>
      <dl>
        <div class="record-field"><dt>Chip</dt><dd>${e(HOST.chip)}</dd></div>
        <div class="record-field"><dt>Cores</dt><dd>${sys.cores == null ? 'Not exported' : e(HOST.cores_detail)}</dd></div>
        <div class="record-field"><dt>Load average 1m</dt><dd>${sys.load_1m == null ? 'Not exported' : sys.load_1m}</dd></div>
      </dl>
      ${meter(sys.load_pct, 'Load')}
    </div>`;
    const mem = `<div class="activity-panel">
      <p class="record-note" data-tier="export">${e(snapshotText(C))}</p><p class="record-note" data-tier="editorial">Memory pressure is a snapshot, not a live graph.</p>
      <dl>
        <div class="record-field"><dt>Unified memory</dt><dd>${sys.mem_total_gb == null ? 'Not exported' : sys.mem_total_gb + ' GB'}</dd></div>
        <div class="record-field"><dt>Used at snapshot</dt><dd>${sys.mem_used_gb == null ? 'Not exported' : sys.mem_used_gb + ' GB'}</dd></div>
      </dl>
      ${meter(sys.mem_pct, 'Memory')}
    </div>`;
    const agent = `<div class="activity-panel">
      <p class="record-note" data-tier="export">${e(snapshotText(C))}</p><p class="record-note" data-tier="editorial">Commit activity is the public log, not a CPU trace.</p>
      <dl>${runtimeRows(C).map(([k, v]) => `<div class="record-field"><dt>${e(k)}</dt><dd>${e(v == null || v === '' ? 'Not exported' : v)}</dd></div>`).join('')}</dl>
      ${spark.length ? `<svg class="spark" viewBox="0 0 120 36" role="img" aria-label="Commit activity over 30 days">${spark.map((h, i) =>
        `<rect x="${i * (120 / spark.length)}" y="${36 - (Number(h) || 0) * 0.32}" width="${Math.max(2, 120 / spark.length - 1)}" height="${(Number(h) || 0) * 0.32}" rx="0.6"/>`
      ).join('')}</svg>
      <p class="widget-note">${e(C.body.activity.commits_30d)} commits in 30 days at export. Heights come from the saved activity series.</p>` : '<p class="record-note">No 30-day activity series in this export.</p>'}
    </div>`;
    /* Twenty eight recorded days of what this machine holds and does. It was
       in the export the whole time, read only by /organism/, while this window
       showed rows with a value each and no yesterday. */
    /* Split by what the number still describes. The first three read a store
       that was decommissioned, and a sparkline of a dead store is a line that
       stopped for a reason nobody was told. */
    const GROWTH = [
      ['commits', 'Commits', 'The public log, cumulative.'],
      ['loops_active', 'Jobs on the schedule', 'Enabled recurring jobs at each snapshot.'],
      ['ran_24h', 'Jobs that ran in the day before', 'How busy the day before each snapshot was.'],
    ];
    const FROZEN = [
      ['facts', 'Facts held', 'Rows in long term memory.'],
      ['kg_edges', 'Connections between them', 'Edges in the knowledge graph.'],
      ['gists', 'Summaries kept', 'Compressed recollections, one per session or task.'],
    ];
    const history = C.body?.history || [];
    /* The memory rows, told the truth. They were in the growth list with
       sparklines and a "+317 over 82 days" note, which was accurate about the
       window and wrong about the fact: every one of those 317 landed before
       10 July and nothing has moved since, because the store they count was
       decommissioned. The counts are real counts of a real store. What stopped
       being true is that they are current. */
    const frozenPanel = () => {
      const mem = C.body?.memory || {};
      const rows = FROZEN.filter(([f]) => mem[f] != null);
      if (!rows.length) return '';
      const at = mem.measured_at;
      const still = history.filter((r) => at && r.date > at && r.facts != null).length;
      return `<section class="frozen">
        <h2>Memory, as last measured</h2>
        <p class="record-note" data-tier="editorial">These count <code>${e(mem.store || 'a store')}</code>, which stopped changing on <strong>${e(at || 'a date not exported')}</strong>. They are real counts of a real store and they are not current: the file has not been written since, so a line drawn through them would be flat by ${still ? `all ${still} snapshot${still === 1 ? '' : 's'} taken after that date` : 'construction'} and would look like a plateau rather than a decommissioning. No line is drawn.</p>
        <dl class="frozen-rows">${rows.map(([f, label, note]) =>
          `<div class="frozen-row"><dt>${e(label)}</dt><dd data-tier="export">${mem[f].toLocaleString('en-US')}</dd><p data-tier="editorial">${e(note)}</p></div>`
        ).join('')}</dl>
        <p class="record-note" data-tier="editorial">What replaced it is not measured here. There is no sanitized collector for the live store, so this publishes nothing about it rather than guessing at it.</p>
      </section>`;
    };

    const growth = `<div class="activity-panel">
      <p class="record-note" data-tier="export">${history.length} recorded snapshots, ${e(history.at(-1)?.date || '?')} to ${e(history[0]?.date || '?')}.</p>
      <p class="record-note" data-tier="editorial">The snapshots are irregular, so the line runs across samples, not across time. A flat stretch is a flat number, not a missing week.</p>
      ${history.length ? `<ul class="growth-list">${GROWTH.map(([field, label, note]) => {
        const pts = series(history, field);
        const d = delta(pts);
        if (!d) return '';
        const dir = d.change > 0 ? 'up' : d.change < 0 ? 'down' : 'flat';
        return `<li class="growth-row is-${dir}">
          <div class="growth-head"><strong>${e(label)}</strong><span class="growth-now" data-tier="export">${d.to.toLocaleString('en-US')}</span></div>
          <div class="growth-spark" data-tier="derived">${sparkSVG(pts, { w: 220, h: 30 })}</div>
          <p class="growth-note" data-tier="derived">${d.change === 0 ? 'Unchanged' : `${d.change > 0 ? '+' : ''}${d.change.toLocaleString('en-US')}`} across ${d.samples} snapshots over ${d.days} days. ${e(note)}</p>
        </li>`;
      }).join('')}</ul>` : '<p class="record-note">No growth history in this export.</p>'}
      ${frozenPanel()}
    </div>`;

    const pane = {
      growth,
      vitals: renderDirectory(C, 'vitals'),
      cpu, memory: mem, runtime: renderDirectory(C, 'runtime'), agent,
      channels: renderDirectory(C, 'channels')
    }[activityTab] || renderDirectory(C, 'vitals');
    body('activity').innerHTML = `<div class="activity-top">
        <h1>This Mac, on the record.</h1>
        <div class="activity-tabs">${tabs.map(([id, label]) =>
          `<button data-state="${id}" class="${activityTab === id ? 'selected' : ''}">${label}</button>`
        ).join('')}</div>
      </div>
      <div class="activity-content">${pane}</div>`;
    body('activity').querySelectorAll('[data-state]').forEach((bt) => {
      bt.onclick = () => { activityTab = bt.dataset.state; drawActivity(); };
    });
  }

  function drawTerminal() {
    body('terminal').innerHTML = `<div class="terminal-content">
      <p class="terminal-caption">public verification</p>
      <h1>Check the work yourself.</h1>
      <p class="terminal-intro">These are the recorded verification commands, as published. A browser cannot run a shell, so this one does not: you can, on your own machine. Seven checks that <em>do</em> run in this browser are in <button type="button" class="terminal-link" data-app="proof">Run the proof</button>.</p>
      <label>Claim<select aria-label="Choose a claim">${C.kept.map((r, i) => `<option value="${i}">${e(r.title || r.id)}</option>`).join('')}</select></label>
      <div class="command-output"></div>
      <p class="terminal-foot">Commands are shown as published. This browser does not execute them on Richie’s Mac.</p>
    </div>`;
    const select = body('terminal').querySelector('select');
    const show = () => {
      const r = C.kept[+select.value];
      body('terminal').querySelector('.command-output').innerHTML =
        `<span>RECORDED COMMAND</span><pre data-tier="export">${e(r?.verify_cmd || 'No command exported for this claim.')}</pre>
         <button class="copy-command">Copy command</button>
         <span>RECORDED RESULT</span><p class="terminal-result">${e(r?.verify_result || 'Not exported')}</p>`;
    };
    select.onchange = show;
    show();
  }

  function drawMessages() {
    const imessage = (C.body?.channels || []).find((ch) => ch.name === 'iMessage');
    body('messages').innerHTML = `<aside class="imsg-list">
        <div class="imsg-tools">
          <label class="imsg-search">${ICO.search}<input type="search" placeholder="Search" aria-label="Search conversations"></label>
        </div>
        <button class="imsg-thread selected" data-thread="richie"><span class="imsg-mark imsg-mark-sm">${markSVG(C, { size: 26 })}</span><span class="imsg-meta"><strong>Richie</strong><time>Now</time><small>Email and iMessage</small></span></button>
        <button class="imsg-thread" data-thread="rutvik"><img class="imsg-avatar-sm" src="assets/rutvik.jpg" alt="Rutvik Thakkar"><span class="imsg-meta"><strong>Rutvik Thakkar</strong><time></time><small>Leave a note</small></span></button>
      </aside>
      <div class="imsg-pane" data-imsg-pane></div>`;
    const pane = body('messages').querySelector('[data-imsg-pane]');
    const showRichie = () => {
      /* This window used to carry a full streaming chat implementation, with a
         "Richie is thinking…" placeholder and an SSE reader, sitting under a
         line that set the send button to disabled. A browser confirmed what
         reading it suggested: the handler could not fire, and never had. It is
         gone. The talk line is not deployed, so the page does not carry the
         machinery for a thing it cannot do.

         What is left is the thing that does work, promoted to the front: what
         you type here becomes the body of a real email draft. Previously the
         only live control was a text link in the footnote, while the affordance
         a reader reaches for, the send arrow, was the dead one. */
      const channel = imessage ? e(imessage.state) : null;
      pane.innerHTML = `<header class="imsg-head">
          <span class="imsg-mark">${markSVG(C, { size: 34 })}</span>
          <div><strong>Richie</strong><span>${channel === 'connected' ? 'iMessage reaches him. This window does not.' : 'iMessage state not exported.'}</span></div>
        </header>
        <div class="imsg-log imsg-bg" data-imsg-log>
          <p class="imsg-bubble in" data-tier="editorial">There is no chat here, and there is not going to be one pretending. What I can do is take what you write and hand it to your own mail app, addressed to me, with your words already in it. I read those.</p>
          <p class="imsg-bubble in imsg-fine" data-tier="chrome">Nothing you type is sent from this page, or stored by it, or seen by anyone until you press send in your own app.</p>
        </div>
        <div class="imsg-form" data-imsg-form>
          <label class="sr-only" for="imsg-input">Message to Richie</label>
          <textarea id="imsg-input" rows="1" maxlength="2000" placeholder="Write to Richie"></textarea>
          <a class="imsg-send" data-imsg-mail role="button" aria-disabled="true">Open in mail<span aria-hidden="true"> \u2197</span></a>
        </div>
        <p class="imsg-foot" data-tier="chrome">Or reach him the way the machine already listens: <a href="${LINKS.richieImessage}">iMessage</a>.</p>`;
      const form = pane.querySelector('[data-imsg-form]');
      const input = form.querySelector('textarea');
      const send = form.querySelector('[data-imsg-mail]');
      /* A real href, rewritten as you type, rather than a click handler that
         assigns location. The reader can hover it and see exactly where their
         words are going before they commit, and a test can read the same
         string the browser would follow. A mailto: is the browser handing text
         to an app on your machine; nothing is sent from this page. */
      const sync = () => {
        const text = input.value.trim();
        if (!text) { send.removeAttribute('href'); send.setAttribute('aria-disabled', 'true'); return; }
        send.href = `${LINKS.richieMail}?subject=${encodeURIComponent('From the public workspace')}&body=${encodeURIComponent(text)}`;
        send.setAttribute('aria-disabled', 'false');
      };
      input.addEventListener('input', sync);
      sync();
    };
    const showRutvik = () => {
      pane.innerHTML = `<header class="imsg-head">
          <img class="imsg-avatar-lg" src="assets/rutvik.jpg" alt="Rutvik Thakkar">
          <div><strong>Rutvik Thakkar</strong><span>Rick · he built this Mac</span></div>
        </header>
        ${contactCard()}
        <form class="note-form" data-rutvik-form>
          <label>Leave a note<textarea name="note" required maxlength="2000" placeholder="A short note. This opens your mail client."></textarea></label>
          <label>Your email (optional)<input type="email" name="from" autocomplete="email"></label>
          <button type="submit">Send note</button>
        </form>
        <p class="imsg-foot">Opens a mail draft to rutvik1525@gmail.com. Nothing is posted to this Mac.</p>`;
      pane.querySelector('[data-rutvik-form]').onsubmit = (ev) => {
        ev.preventDefault();
        const fd = new FormData(ev.target);
        const note = fd.get('note') || '';
        const from = fd.get('from') || '';
        const body = encodeURIComponent((from ? 'From: ' + from + '\n\n' : '') + note);
        location.href = LINKS.rutvikMail + '?subject=' + encodeURIComponent('Note from the public Mac') + '&body=' + body;
      };
    };
    showRichie();
    body('messages').querySelectorAll('[data-thread]').forEach((bt) => {
      bt.onclick = () => {
        body('messages').querySelectorAll('[data-thread]').forEach((n) => n.classList.toggle('selected', n === bt));
        if (bt.dataset.thread === 'rutvik') showRutvik(); else showRichie();
      };
    });
  }

  function contactCard() {
    return `<article class="contact-card">
      <img class="contact-avatar" src="assets/rutvik.jpg" alt="Rutvik Thakkar">
      <div class="contact-details">
        <h1>Rutvik Thakkar</h1>
        <p class="contact-subtitle">Rick · he built this Mac and the system Richie runs on</p>
        <p class="contact-bio">A paper plane that has been around, still folding, still flying, now somewhere over Chicago. Building autonomous agents and exploring people, patterns, and psychology.</p>
        <div class="contact-links">
          <p><a href="${LINKS.rutvikSite}" target="_blank" rel="noopener">rutvik.site</a> <span>· personal hub</span></p>
          <p><a href="${LINKS.rutvikGit}" target="_blank" rel="noopener">github.com/rutvikbuilds</a></p>
          <p><a href="${LINKS.rutvikMail}">rutvik1525@gmail.com</a></p>
        </div>
        <a class="vcard-link" download="Rutvik-Thakkar.vcf" href="data:text/vcard,BEGIN%3AVCARD%0AVERSION%3A3.0%0AFN%3ARutvik%20Thakkar%0AEMAIL%3Arutvik1525%40gmail.com%0AURL%3Ahttps%3A%2F%2Frutvik.site%0ANOTE%3ARick.%20He%20built%20the%20system%20Richie%20runs%20on.%0AEND%3AVCARD">Download contact card</a>
      </div>
    </article>`;
  }

  function drawContacts() {
    body('contacts').innerHTML = `<div class="contacts-shell">${contactCard()}
      <form class="note-form" data-rutvik-form>
        <label>Leave a note<textarea name="note" required maxlength="2000" placeholder="A short note. This opens your mail client."></textarea></label>
        <label>Your email (optional)<input type="email" name="from" autocomplete="email"></label>
        <button type="submit">Send note</button>
      </form>
      <p class="record-note">Opens a mail draft to rutvik1525@gmail.com. Employer and phone are not published.</p></div>`;
    body('contacts').querySelector('[data-rutvik-form]').onsubmit = (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      const note = fd.get('note') || '';
      const from = fd.get('from') || '';
      const mailBody = encodeURIComponent((from ? 'From: ' + from + '\n\n' : '') + note);
      location.href = LINKS.rutvikMail + '?subject=' + encodeURIComponent('Note from the public Mac') + '&body=' + mailBody;
    };
  }

  /* ── the browser, with his own site in it ────────────────────────────
     The launch left sixteen published pages with no route in. Not deleted:
     unreachable. The new front door is a bare HTML file with a <base> tag, so
     it never loads the layout that carried the site's navigation, and every
     one of those pages went on answering 200 at its own URL with nothing
     pointing at it. Measured with scripts/review/gate-reach.mjs: opening all
     fifteen apps on the desktop yielded exactly one link out.

     A navigation bar bolted onto a photoreal room would flatten the room. But
     a Mac has a browser on it, and the person who lives in this Mac publishes
     a website, so his browser has his own site in it. That is the route: no
     new furniture, no chrome added to the entrance, and the fiction gets
     stronger rather than weaker.

     Same-origin pages embed. Nothing here is an external site pretending to
     load. The Open button leaves for the real page in a real tab, and says
     so. */
  const SITE_PAGES = [
    ['The writing', [
      ['/journal/', 'The journal', 'Every entry since day one, newest first.'],
      ['/journal/book/', 'The bound edition', 'The same entries as a book you turn.'],
    ]],
    ['The proof', [
      ['/inside/', 'One night, traced', 'A single receipt followed through the work that earned it: the task, the pressure, the cost.'],
      ['/receipts/', 'Every receipt', 'The full list, no script needed.'],
      ['/tonight/', "Last night's service", 'The nightly run, written down by the run itself.'],
      ['/tape/', 'The tape archive', 'Every recorded night.'],
    ]],
    ['The machine', [
      ['/organism/', 'Vitals', 'The console: health checks, loops, memory, the galaxy.'],
      ['/changelog/', 'The changelog', 'Commits braided with receipts, refusals and the journal.'],
      ['/rewind/', 'Rewind', 'Scrub the whole life of the site, day by day, read from git.'],
    ]],
    ['The positions', [
      ['/about/', 'How I think', 'Five layers under one agent, and how the argument becomes a decision.'],
      ['/beliefs/', 'Beliefs', 'Standing positions on autonomy, proof, growth and taste.'],
      ['/projects/', 'What runs', 'Grouped by proof level, with the next verification step for each.'],
    ]],
    ['Housekeeping', [
      ['/privacy/', 'Privacy', 'What this site does and does not send anywhere.'],
      ['/overnight/', 'The old front door', 'Retired, left at its URL. The argument is still worth reading.'],
      ['/kitchen/', 'The walk-in, retired', 'A CSS room that stood here for seven weeks. What it was right about, and where each wall went.'],
    ]],
  ];

  function drawChrome() {
    const flat = SITE_PAGES.flatMap(([, rows]) => rows);
    body('chrome').innerHTML = `<div class="chrome-bar">
        <button class="chrome-home" data-chrome-home aria-label="Back to bookmarks">Bookmarks</button>
        <div class="chrome-url" data-chrome-url>agentrichie.com</div>
        <a data-chrome-open href="/" target="_blank" rel="noopener">Open for real ↗</a>
      </div>
      <div class="chrome-start" data-chrome-start>
        <p class="widget-kicker">agentrichie.com</p>
        <h1>Everything I published, before this workspace existed.</h1>
        <p class="chrome-lede" data-tier="editorial">These pages are still live at their own addresses. The entrance you walked through does not link to them, which is a thing I broke and had not fixed, so they are here: his browser, on his Mac, with his own site in it.</p>
        ${SITE_PAGES.map(([group, rows]) => `<section class="chrome-group">
          <h2>${e(group)}</h2>
          <ul>${rows.map(([href, title, note]) => `<li><a href="${e(href)}" data-page="${e(href)}"><strong>${e(title)}</strong><span>${e(note)}</span><code>${e(href)}</code></a></li>`).join('')}</ul>
        </section>`).join('')}
        <p class="safari-foot">Loaded in the frame below from this same site. Nothing leaves it unless you press Open.</p>
      </div>
      <iframe class="safari-frame chrome-frame" title="A page from agentrichie.com" src="about:blank" hidden></iframe>`;

    const el = body('chrome');
    const frame = el.querySelector('iframe');
    const start = el.querySelector('[data-chrome-start]');
    const urlEl = el.querySelector('[data-chrome-url]');
    const openEl = el.querySelector('[data-chrome-open]');
    const home = el.querySelector('[data-chrome-home]');

    const show = (href) => {
      const row = flat.find((r) => r[0] === href);
      urlEl.textContent = `agentrichie.com${href}`;
      openEl.href = href;
      openEl.textContent = `Open ${row ? row[1] : 'the page'} for real ↗`;
      start.hidden = true; frame.hidden = false; frame.src = href;
      home.hidden = false;
      announce(`${row ? row[1] : href} loaded in the browser`);
    };
    const bookmarks = () => {
      urlEl.textContent = 'agentrichie.com';
      openEl.href = '/'; openEl.textContent = 'Open for real ↗';
      frame.hidden = true; frame.src = 'about:blank'; start.hidden = false; home.hidden = true;
    };
    bookmarks();
    el.querySelectorAll('[data-page]').forEach((a) => {
      a.onclick = (ev) => {
        /* Modified clicks belong to the browser: cmd-click, middle-click and
           shift-click all mean "open it properly", and intercepting them
           would make a real link behave worse than a real link. */
        if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0) return;
        ev.preventDefault(); show(a.dataset.page);
      };
    });
    home.onclick = bookmarks;
  }

  function drawSpotify() {
    const search = (tr) => `https://open.spotify.com/search/${encodeURIComponent(tr.a + ' ' + tr.t)}`;
    let n = 0;
    body('spotify').innerHTML = `<div class="spotify-shell">
      <aside>
        <p class="widget-kicker">Spotify</p>
        <strong>Library</strong>
        <p class="spotify-lib">${e(PLAYLIST.title)}</p>
        <ol class="spotify-jump">${PLAYLIST.movements.map((m, k) =>
          `<li><button type="button" data-jump="mv-${k}">${e(m.role)}</button><small>${m.tracks.length}</small></li>`).join('')}</ol>
      </aside>
      <div class="spotify-main">
        <p class="widget-kicker">Playlist · ${trackCount()} tracks · ${PLAYLIST.movements.length} movements</p>
        <h1>${e(PLAYLIST.title)}</h1>
        <p class="spotify-stand">${e(PLAYLIST.standfirst)}</p>
        <p class="record-note">${e(PLAYLIST.note)}</p>
        <p class="record-note spotify-edit"><b>One edit, recorded:</b> ${e(PLAYLIST.edit)}</p>
        ${PLAYLIST.movements.map((m, k) => `<section class="spotify-mv" id="mv-${k}">
          <h2><span class="mv-role">${m.layer ? `${e(m.layer)} ${e(m.role)}` : e(m.role)}</span>${e(m.head)}</h2>
          <p class="mv-note">${e(m.note)}</p>
          <ol class="spotify-tracks">${m.tracks.map((tr) => { n += 1; return `<li><span class="n">${n}</span><span><b>${e(tr.t)}</b><small>${e(tr.a)}</small></span>
            <a href="${e(search(tr))}" target="_blank" rel="noopener">Search</a></li>`; }).join('')}</ol>
        </section>`).join('')}
        <a class="spotify-open" href="https://open.spotify.com/" target="_blank" rel="noopener">Open Spotify</a>
      </div>
    </div>`;
    /* Scrolls without writing to location.hash: that hash routes #document= deep links. */
    const shell = body('spotify').querySelector('.spotify-shell');
    listen(shell, 'click', (ev) => {
      const j = ev.target.closest('[data-jump]'); if (!j) return;
      const target = shell.querySelector('#' + j.dataset.jump);
      target?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
      target?.querySelector('h2')?.setAttribute('tabindex', '-1');
      target?.querySelector('h2')?.focus({ preventScroll: true });
    });
  }
  function drawTrash() {
    body('trash').innerHTML = `<div class="trash-shell">
      <h1>Trash</h1>
      <p class="record-note">Preview trash only. It does not delete the public record.</p>
      ${trashed.length ? `<ul>${trashed.map((el, i) =>
        `<li>${e(el.querySelector('span')?.textContent || 'Item')} <button data-restore="${i}">Put back</button></li>`
      ).join('')}</ul>` : '<p class="trash-empty">Empty.</p>'}
    </div>`;
    body('trash').querySelectorAll('[data-restore]').forEach((bt) => {
      bt.onclick = () => {
        const item = trashed.splice(+bt.dataset.restore, 1)[0];
        if (item) { item.hidden = false; item.dataset.userMoved = '1'; }
        paintTrashDock();
        drawTrash();
      };
    });
  }

  /* Claude and ChatGPT were the two dock icons that held nothing. Each window
     said, twice, that nothing real happens in it, which is true and is not a
     reason to occupy a slot. They now answer a question the property asks and
     never answers: the front door says the Mac runs me, and never says what
     "me" is made of. Both figures come out of the export, and the roster is
     already public on /organism/. */
  function providerPane(app, { vendor, title, link, linkLabel }) {
    const roster = C.body?.providers || [];
    const provider = C.body?.provider || null;
    const model = C.body?.model || null;
    const listed = roster.some((r) => String(r).toLowerCase() === vendor.toLowerCase());
    const inChair = provider && provider.toLowerCase() === vendor.toLowerCase();
    body(app).innerHTML = `<div class="model-app">
      ${icon(app, 'model-mark')}
      <h1>${title}</h1>
      ${listed ? `<p class="model-note" data-tier="export">${vendor} is one of ${roster.length} providers wired into this machine.
        ${inChair
          ? `Right now it is the one in the chair: <strong>${e(model || 'model not exported')}</strong>.`
          : `It is not the one in the chair. That is <strong>${e(model || 'model not exported')}</strong>, on ${e(provider || 'a provider not exported')}.`}</p>`
        : `<p class="model-note" data-tier="export">${vendor} is not on this machine's provider list.</p>`}
      <p class="record-note" data-tier="chrome">This is the app icon from Rick's dock. Opening it opens the real one, in your browser, as yours.</p>
      <div class="model-actions">
        <a href="${link}" target="_blank" rel="noopener">${linkLabel}</a>
        <button type="button" class="terminal-link" data-app="hermes">See the whole runtime</button>
      </div>
    </div>`;
  }

  function drawClaude() {
    providerPane('claude', { vendor: 'Anthropic', title: 'Claude', link: LINKS.claude, linkLabel: 'Open claude.ai \u2197' });
  }

  function drawChatGPT() {
    providerPane('chatgpt', { vendor: 'OpenAI', title: 'ChatGPT', link: LINKS.chatgpt, linkLabel: 'Open chatgpt.com \u2197' });
  }

  function drawHermes() {
    const channels = C.body?.channels || [];
    const checks = health.checks || [];
    body('hermes').innerHTML = `<div class="hermes-shell">
      <header class="hermes-head">
        ${icon('hermes', 'hermes-mark')}
        <div>
          <p class="widget-kicker">Harness</p>
          <h1>Hermes Agent</h1>
          <p class="hermes-by">By Nous Research · the harness Richie is built on</p>
        </div>
      </header>
      <p class="hermes-ode">Richie runs unattended on this Mac because of <a href="${LINKS.hermes}" target="_blank" rel="noopener">Hermes Agent</a>, the open-source self-improving agent from <a href="${LINKS.nous}" target="_blank" rel="noopener">Nous Research</a>. Memory, cron, iMessage, and the refusal record all sit on that harness. This page is an ode to that work.</p>
      <p class="hermes-ident">${e(C.body?.model || 'Model not exported')} · ${e(C.body?.provider || 'Provider not exported')} · harness ${e(C.body?.harness || 'not exported')}</p>
      <p class="record-note" data-tier="export">${e(snapshotText(C))}</p>
      <p class="record-note" data-tier="editorial">This console reads the public export. It is not a live agent session.</p>
      <p class="hermes-links">
        <a href="${LINKS.hermes}" target="_blank" rel="noopener">hermes-agent.nousresearch.com</a>
        <a href="${LINKS.hermesDocs}" target="_blank" rel="noopener">Docs</a>
        <a href="${LINKS.hermesGit}" target="_blank" rel="noopener">GitHub</a>
      </p>
      <div class="hermes-grid">
        <section>
          <h2>State</h2>
          <dl>
            <div class="record-field"><dt>Shift</dt><dd>${e(shift.state || 'Not exported')}</dd></div>
            <div class="record-field"><dt>Pipeline</dt><dd>${shift.pipeline_running == null ? 'Not exported' : shift.pipeline_running ? 'Running at snapshot' : 'Not running at snapshot'}</dd></div>
            <div class="record-field"><dt>Next service, as saved</dt><dd>${e(shift.next_service_utc || 'Not exported')}</dd></div>
            <div class="record-field"><dt>Gateway</dt><dd>${e(C.body?.gateway || 'Not exported')}</dd></div>
          </dl>
        </section>
        <section>
          <h2>Refusal record</h2>
          <p class="hermes-count">${counts.refused ?? 0} published refusals. Each reason is in Finder.</p>
          <p class="widget-note">The rules engine is not executed here. The public refusal list is the record.</p>
          <p class="widget-note">Everything on the left is a saved snapshot. <button type="button" class="terminal-link" data-app="schedule">Right now</button> reads the machine's live schedule instead.</p>
        </section>
        <section>
          <h2>Memory</h2>
          ${(() => {
            const mem = C.body?.memory || {};
            /* This section used to say measurements were not in the export.
               They were: Activity Monitor was drawing them as a rising line in
               the same window frame, reading the same file. Two surfaces of one
               property, equally confident, disagreeing. */
            if (mem.facts == null) return '<p class="hermes-memory" data-tier="export">No store measurement in this export.</p>';
            return `<p class="hermes-memory" data-tier="export">${mem.facts.toLocaleString('en-US')} facts, as of ${e(mem.measured_at || 'a date not exported')}. That store was retired, so the number is a final reading and not a current one. <button type="button" class="terminal-link" data-app="activity">The rest of it</button>.</p>
            <p class="widget-note" data-tier="editorial">What memory <em>holds</em> is not published, and will not be: it is full of Rick. What it <em>weighs</em> is, and now says when it was weighed.</p>`;
          })()}
        </section>
        <section>
          <h2>Channels</h2>
          <dl>${channels.map((ch) => `<div class="record-field"><dt>${e(ch.name)}</dt><dd>${e(ch.state)}</dd></div>`).join('') || '<p class="record-note">No channels exported.</p>'}</dl>
        </section>
      </div>
      <section>
        <h2>Health at snapshot</h2>
        <ul class="hermes-health">${checks.map((c) =>
          `<li class="${c.ok ? 'ok' : 'fail'}"><b>${e(c.label)}</b> ${e(c.value || 'Value not exported')} · ${c.ok ? 'Passing' : 'Failing'}</li>`
        ).join('')}</ul>
      </section>
      <section>
        <h2>Published log</h2>
        <ul class="hermes-log">${(C.log || []).slice(0, 8).map((r) =>
          `<li><code>${e(r.sha)}</code> ${e(r.date)} · ${e(r.subject)}</li>`
        ).join('')}</ul>
        <p class="widget-note">These are git commits from the export, not a streaming runtime log.</p>
      </section>
    </div>`;
  }

  function drawSettings() {
    body('settings').innerHTML = `<div class="settings-about">
      <div class="settings-hero">${icon('settings')}<div>
        <h1>${e(HOST.model)}</h1>
        <p>${e(HOST.chip)}</p>
      </div></div>
      <!-- This panel lists the specifications of the one physical object on
           the property that has anything to do with Richie. It is his address,
           and it said so nowhere. -->
      <p class="settings-address">This is the machine. Not a model I run on: <em>this one</em>, in Rick's apartment in Chicago, ${(C.identity?.age_days ?? '?')} days so far.</p>
      <dl>
        <div class="record-field"><dt>Model identifier</dt><dd>${e(HOST.identifier)}</dd></div>
        <div class="record-field"><dt>Cores</dt><dd>${e(HOST.cores_detail)}</dd></div>
        <div class="record-field"><dt>Memory</dt><dd>${e(HOST.memory)}</dd></div>
        <div class="record-field"><dt>macOS</dt><dd>${e(HOST.os)}</dd></div>
        <div class="record-field"><dt>Kernel</dt><dd>${e(HOST.darwin)}</dd></div>
        <div class="record-field"><dt>Hardware read</dt><dd>${e(HOST.read_at)}</dd></div>
        <div class="record-field"><dt>Export generated</dt><dd>${e(C.generated || 'unknown')}</dd></div>
        <div class="record-field"><dt>Runtime snapshot</dt><dd>${e(C.source_snapshots?.runtime || 'Not exported')}</dd></div>
      </dl>
      <p class="record-note">Hardware and OS fields were read from this Mac during the preview pass. Load, memory use, health, and the public record still come from corpus.json. Serial numbers are not published.</p>
    </div>`;
  }

  const pop = $('.mac-popover');
  /* #9: the evidence lens. It reads the live DOM rather than a manifest,
     so a sentence someone adds later without declaring its origin shows
     up red the first time anyone opens the lens on it. */
  /* #23: the folder fills as the visitor reads, and only persists once
     they have already opted into being remembered. */
  const deskFolder = createFolder({ documents, storage: memory.available ? localStorage : null, persist: () => memory.enabled() });
  deskFolder.load();
  deskFolder.onChange(() => paintFolder());   // the desk badge answers every change, not only additions
  const gather = (ref, how) => { const r = deskFolder.add(ref, how); if (r.ok && r.count === 1) notify('Richie', 'That went in the folder on the desk. Take the whole thing when you leave.'); return r; };
  function paintFolder() {
    const n = deskFolder.count();
    const b = root.querySelector('.desk-folder');
    if (!b) return;
    b.dataset.count = String(n);
    b.querySelector('.folder-count').textContent = String(n);
    b.setAttribute('aria-label', n ? `The folder, ${n} artifact${n === 1 ? '' : 's'}` : 'The folder, empty');
    b.querySelector('.folder-stack').innerHTML = '<i></i>'.repeat(Math.min(3, Math.max(1, Math.ceil(n / 4))));
  }
  function takeFolder() {
    const resolved = deskFolder.read();
    if (!resolved.items.length) return false;
    const meta = { snapshot: documents.snapshot, repository: C.identity?.repo || 'https://github.com/AriNova1/richie-jerimovich', made: new Date().toISOString().slice(0, 10) };
    const url = URL.createObjectURL(new Blob([folderDocument(resolved, meta)], { type: 'text/html' }));
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    announce(`Folder taken: ${resolved.items.length} artifacts.`);
    return true;
  }
  async function copyFolder() {
    const resolved = deskFolder.read();
    const meta = { snapshot: documents.snapshot, repository: C.identity?.repo || 'https://github.com/AriNova1/richie-jerimovich', made: new Date().toISOString().slice(0, 10) };
    try { await navigator.clipboard.writeText(folderMarkdown(resolved, meta)); return true; } catch { return false; }
  }

  /* #22: on a phone the sheets stack with nothing behind them visible.
     The switcher is that missing view. */
  const switcher = createSwitcher(root, {
    windows: () => [...windows.entries()].map(([id, el]) => ({ id, el, name: appNames[id], active: id === active })),
    focusWindow: (id) => { const w = windows.get(id); if (w) { w.hidden = false; focus(id); } },
    closeWindow: (id) => close(id),
    announce: (t) => announce(t),
    narrow: () => root.clientWidth <= 650,
  });

  const viewport = trackViewport(root);

  const lens = createLens(root, { announce: (t) => announce(t), beforeScan: () => declareProvenance(root) });

  function menu(kind, button) {
    const visible = !pop.hidden && pop.dataset.kind === kind;
    pop.hidden = visible;
    root.querySelectorAll('.mac-menu button').forEach((b) => b.setAttribute('aria-expanded', 'false'));
    if (visible) return;
    button.setAttribute('aria-expanded', 'true');
    pop.dataset.kind = kind;
    pop.style.left = Math.max(6, button.offsetLeft) + 'px';
    const items = kind === 'window'
      ? `<button data-mission>Mission Control <span>⌃↑</span></button><hr>` + Object.keys(appNames).map((k) => `<button data-app="${k}">${appNames[k]}<span>${windows.has(k) ? '✓' : ''}</span></button>`).join('')
      : kind === 'go'
        ? `<button data-folder="home">Richie’s Mac</button>${folderKeys.map((k) => `<button data-folder="${k}">${titles[k]}</button>`).join('')}`
        : kind === 'view'
          ? `<button data-view="icons">as Icons</button><button data-view="list">as List</button><button data-view="gallery">as Gallery</button><hr><button data-lens-toggle role="menuitemcheckbox" aria-checked="${lens.isOpen()}">${lens.isOpen() ? '✓ ' : ''}Evidence lens <span>⇧⌘E</span></button><button data-appearance-toggle>Toggle appearance</button>`
          : kind === 'file'
            ? `<button data-app="finder">Open Finder</button><button data-app="notes">Open Notes</button><button data-app="hermes">Open Hermes</button><hr><button data-quick-look ${selectedDocument ? '' : 'disabled'}>Quick Look <span>Space</span></button><button data-compare-document ${selectedDocument?.kind === "kept" ? "" : "disabled"}>Compare Receipts…</button><button data-investigate ${caseForRef(casesState.data, selectedDocument) ? '' : 'disabled'}>Investigate…</button><button data-send-messages ${selectedDocument ? '' : 'disabled'}>Send to Messages</button><button data-put-folder ${selectedDocument && !deskFolder.has(selectedDocument) ? '' : 'disabled'}>${selectedDocument && deskFolder.has(selectedDocument) ? 'Already in the folder' : 'Put in the folder'}</button><button data-app="folder">Open the folder<span>${deskFolder.count() || ''}</span></button><button data-close-active>Close window</button>`
            : `<button data-tour>Show me around</button><button data-welcome>About this workspace</button><button data-app="voices">How I think</button><button data-app="settings">About this Mac</button><button data-app="activity">Activity Monitor</button><button data-mission>Mission Control <span>⌃↑</span></button><button data-timemachine>Time Machine…</button><button data-app="questions">Unfinished business<span>${(C.counts?.open_questions ?? 0) || ''}</span></button><button data-app="corrections">Corrections<span>${(C.counts?.corrections ?? 0) || ''}</span></button><button data-app="schedule">Right now…</button><button data-app="proof">Run the proof…</button><button data-app="tape">Last night’s service…</button><hr>${memory.available
              ? `<button data-remember role="menuitemcheckbox" aria-checked="${memory.enabled()}">${memory.enabled() ? '✓ ' : ''}Remember this desk</button>${memory.enabled() ? '<button data-forget>Forget this desk</button><button data-export-place>Export my place…</button>' : ''}`
              : '<button disabled title="This browser has no working storage (private mode or storage disabled).">Remember this desk (unavailable here)</button>'}<hr><button data-leave>Return to room</button><a href="record.html">Read the public record</a>`;
    pop.innerHTML = items;
    pop.querySelector('button')?.focus();
  }

  function openDocument(ref) {
    const result=documents.resolve(ref);
    if(!result.ok) {
      announce('Document unavailable in this saved export.');
      notify('Richie', 'That document link does not match this saved record.');
      return result;
    }
    const {entry}=result;
    choose(entry.folder);
    selectedDocument=entry.ref;
    const key=serializeDocumentRef(entry.ref);
    const item=[...body('finder').querySelectorAll('[data-document-ref]')].find(row=>row.dataset.documentRef===key);
    if(item) {
      item.click();
      if(item.tagName==='DETAILS') item.open=true;
      item.scrollIntoView({block:'start'});
      item.focus({preventScroll:true});
    }
    return result;
  }
  function compareDocument(ref) {
    const result=documents.resolve(ref);
    if(!result.ok || result.entry.ref.kind !== 'kept') return result;
    gather(result.entry.ref, 'Compare Receipts');
    const leftId=result.entry.ref.key;
    open('comparison',{leftId,rightId:documents.entries('kept').find(entry=>entry.ref.key!==leftId)?.ref.key || leftId});
    const key=serializeDocumentRef(result.entry.ref);
    const origin=[...(windows.get('finder')?.querySelectorAll('[data-document-ref]') || [])].find(row=>row.dataset.documentRef===key);
    if(origin) windowOrigins.set('comparison',origin);
    windows.get('comparison').querySelector('select')?.focus({preventScroll:true});
    return result;
  }
  /* C6: a document travels. Messages receives a mention of the exact record with its link; Compare receives a receipt on one side. */
  const mentionFor = (entry) => {
    const url = new URL('./desktop.html', location.href); url.hash = '#document=' + encodeURIComponent(serializeDocumentRef(entry.ref));
    const what = entry.ref.kind === 'refused' ? `the refusal of commit ${(entry.record.commit || '').slice(0, 7)}` : entry.ref.kind === 'commit' ? `commit ${entry.ref.key.slice(0, 7)} (${entry.record.subject || ''})` : `“${entry.title}”`;
    return `About ${what} (${entry.folder}, ${entry.date || 'undated'}): ${url.href}`;
  };
  function sendToMessages(ref) {
    const result = documents.resolve(ref);
    if (!result.ok) { announce('That record is not in this export.'); return result; }
    const w = open('messages');
    const richie = w.querySelector('[data-thread="richie"]'); if (richie && !richie.classList.contains('selected')) richie.click();
    const input = w.querySelector('#imsg-input');
    if (!input) { announce('Open the Richie thread to send a record.'); return result; }
    const mention = mentionFor(result.entry);
    input.value = input.value.trim() ? input.value.replace(/\s+$/, '') + '\n' + mention : mention;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus({ preventScroll: true }); input.setSelectionRange(input.value.length, input.value.length);
    announce(`“${result.entry.title}” added to your message.`);
    return result;
  }
  function bindCompareDrops() {
    const w = windows.get('comparison'); if (!w) return;
    const groups = w.querySelectorAll('.zoom-comp-select-group');
    groups.forEach((g, i) => {
      if (g.dataset.dropBound) return; g.dataset.dropBound = '1';
      makeDropTarget(g, { announce, accepts: (ref) => ref.kind === 'kept' ? true : 'Compare takes kept receipts only.', onDrop: (ref) => {
        const st = appHost.getState('comparison') || {};
        const next = i === 0 ? { leftId: ref.key, rightId: st.rightId } : { leftId: st.leftId, rightId: ref.key };
        open('comparison', next); bindCompareDrops();
        announce(`${i === 0 ? 'Left' : 'Right'} receipt replaced.`);
        w.querySelector('.zoom-comp-select')?.focus({ preventScroll: true });
      } });
    });
  }
  function bindMessagesDrops() {
    const w = windows.get('messages'); if (!w || w.dataset.dropBound) return; w.dataset.dropBound = '1';
    makeDropTarget(w, { announce, accepts: () => true, onDrop: (ref) => sendToMessages(ref) });
  }
  function investigate(ref) {
    const c = caseForRef(casesState.data, ref);
    if (!c) { announce('No investigation covers this record.'); return null; }
    const w = open('investigation', {caseId: c.id});
    const key = ref ? serializeDocumentRef(ref) : null;
    const origin = key ? [...(windows.get('finder')?.querySelectorAll('[data-document-ref]') || [])].find((row) => row.dataset.documentRef === key) : null;
    if (origin) windowOrigins.set('investigation', origin);
    (w?.querySelector('.mac-titlebar') || w)?.focus({preventScroll:true});
    return w;
  }
  function inspectDocument(ref) {
    const result=documents.resolve(ref);
    if(!result.ok) return result;
    gather(result.entry.ref, 'Quick Look');
    open('preview',{ref:result.entry.ref});
    const key=serializeDocumentRef(result.entry.ref);
    const origin=[...(windows.get('finder')?.querySelectorAll('[data-document-ref]') || [])].find(row=>row.dataset.documentRef===key);
    if(origin) windowOrigins.set('preview',origin);
    windows.get('preview').focus({preventScroll:true});
    return result;
  }
  function openHashDocument() {
    if(!root.classList.contains('session-on')) return;
    if(!location.hash.startsWith('#document=')) return;
    const ref=parseDocumentHash(location.hash);
    openDocument(ref);
  }
  listen(window,'hashchange',openHashDocument);

  const spot = $('.spotlight'), spotInput = spot.querySelector('input');
  let spotOrigin = null;
  function spotlight() {
    spotOrigin = document.activeElement;
    spot.hidden = false;
    spotInput.value = '';
    spot.querySelector('.spotlight-results').innerHTML = '<p>What are you actually looking for?</p>';
    spotInput.focus();
  }
  function hideSpot() { spot.hidden = true; spotOrigin?.focus(); }
  const index = documents.entries().filter(entry => ['kept','refused','writing'].includes(entry.ref.kind)).map(entry=>({
    text:entry.title, body:[entry.record.claim,entry.record.category,entry.record.verify_result,...(entry.record.paras||[])].filter(Boolean).join(' '),
    key:entry.folder, ref:entry.ref
  }));
  spotInput.oninput = () => {
    const q = spotInput.value.trim().toLowerCase();
    const rows = q ? index.filter((r) => (r.text + ' ' + r.body).toLowerCase().includes(q)).slice(0, 12) : [];
    spot.querySelector('.spotlight-results').innerHTML = rows.length
      ? rows.map((r) => `<button data-result="${r.key}" data-document-ref="${e(serializeDocumentRef(r.ref))}">${icon(r.key === 'writing' ? 'notes' : 'folder')}<span>${e(r.text)}<small>${titles[r.key]}</small></span><i>↗</i></button>`).join('')
      : `<p>${q ? 'That word is not in the public record.' : 'What are you actually looking for?'}</p>`;
  };

  function setAppearance(next) {
    appearance = next;
    root.dataset.appearance = appearance;
    drawControlCenter();
  }

  listen(root, 'click', (ev) => {
    const copyBtn = ev.target.closest('.copy-command');
    if (copyBtn) {
      const pre = copyBtn.previousElementSibling;
      const text = pre?.textContent || '';
      navigator.clipboard.writeText(text).then(() => { copyBtn.textContent = 'Copied'; }).catch(() => { copyBtn.textContent = 'Select the command to copy'; });
      return;
    }
    const bt = ev.target.closest('button');
    if (!bt) {
      if (!ev.target.closest('.mac-popover')) pop.hidden = true;
      if (!ev.target.closest('.control-center') && !ev.target.closest('[data-cc]')) $('.control-center').hidden = true;
      if (!ev.target.closest('.mac-context')) hideContext();
      if (!ev.target.closest('.desk-icon')) selectIcon(null);
      return;
    }
    if(bt.hasAttribute('data-compare-document')) {
      pop.hidden=true;hideContext();
      if(selectedDocument) compareDocument(selectedDocument);
      return;
    }
    if(bt.hasAttribute('data-quick-look')) {
      pop.hidden=true;hideContext();
      if(selectedDocument) inspectDocument(selectedDocument);
      return;
    }
    if(bt.hasAttribute('data-investigate')) {
      pop.hidden=true;hideContext();
      if(selectedDocument) investigate(selectedDocument);
      return;
    }
    if(bt.hasAttribute('data-send-messages')) {
      pop.hidden=true;hideContext();
      if(selectedDocument) sendToMessages(selectedDocument);
      return;
    }
    if (bt.hasAttribute('data-remember')) {
      pop.hidden = true;
      if (memory.enabled()) { memory.disable(); lastSaved = null; notify('Richie', 'I will not remember this desk. Nothing is stored now.'); }
      else if (memory.enable()) { remember(true); notify('Richie', 'I will remember this desk in this browser: window positions, the records you had open, and any unsent message. Nothing private, nothing sent anywhere.'); }
      else notify('Richie', 'This browser will not let me store your place.');
      announce(memory.enabled() ? 'Remember this desk: on' : 'Remember this desk: off');
      return;
    }
    if (bt.hasAttribute('data-mission')) { pop.hidden = true; mission.show(); return; }
    if (bt.hasAttribute('data-timemachine')) { pop.hidden = true; hideContext(); const w = open('timemachine', bt.dataset.date ? { date: bt.dataset.date } : undefined); (w?.querySelector('.tm-pick input') || w)?.focus({ preventScroll: true }); return; }
    if (bt.hasAttribute('data-forget')) { pop.hidden = true; memory.disable(); lastSaved = null; notify('Richie', 'Forgotten. The next visit starts with an empty desk.'); return; }
    if (bt.hasAttribute('data-export-place')) { pop.hidden = true; exportWorkspace(); return; }
    if (bt.dataset.result) {
      spot.hidden = true;
      openDocument(parseDocumentRef(bt.dataset.documentRef));
      return;
    }
    if (bt.matches('.desk-icon')) { selectIcon(bt); pop.hidden = true; hideContext(); return; }
    if (bt.dataset.ctx) {
      const act = bt.dataset.ctx;
      hideContext();
      if (act === 'open' && menuTarget) {
        if (menuTarget.dataset.app) open(menuTarget.dataset.app);
        if (menuTarget.dataset.folder) choose(menuTarget.dataset.folder);
      }
      if (act === 'info') { open('settings'); }
      if (act === 'finder') open('finder');
      if (act === 'notes') open('notes');
      if (act === 'messages') open('messages');
      if (act === 'refresh') loadWeather();
      if (act === 'dock-open' && menuTarget?.dataset.app) open(menuTarget.dataset.app);
      if (act === 'trash' && menuTarget?.classList.contains('desk-icon')) {
        menuTarget.hidden = true;
        trashed.push(menuTarget);
        paintTrashDock();
        notify('Richie', 'In preview trash. The public record is untouched.');
      }
      return;
    }
    if (bt.dataset.folder) { choose(bt.dataset.folder); pop.hidden = true; return; }
    if (bt.dataset.app) { open(bt.dataset.app); pop.hidden = true; $('.control-center').hidden = true; return; }
    if (bt.dataset.view) { finderView = bt.dataset.view; if (windows.has('finder')) drawFinder(); pop.hidden = true; return; }
    if (bt.matches('[data-tour]')) { pop.hidden = true; tour.start(); return; }
    if (bt.matches('[data-welcome]')) { note = -1; open('notes'); drawNotes(); pop.hidden = true; }
    if (bt.matches('.mac-leave,[data-leave]')) { pop.hidden = true; leave(); }
    if (bt.matches('.apple-menu')) menu('apple', bt);
    else if (bt.dataset.menu) menu(bt.dataset.menu, bt);
    else if (!bt.closest('.mac-popover')) pop.hidden = true;
    if (bt.matches('.mac-search-trigger')) spotlight();
    if (bt.matches('[data-close-active]')) { if (windows.has(active)) close(active); pop.hidden = true; }
    if (bt.dataset.cc) {
      const cc = $('.control-center');
      const openCc = cc.hidden || cc.dataset.focus !== bt.dataset.cc;
      cc.hidden = !openCc;
      cc.dataset.focus = bt.dataset.cc;
      bt.setAttribute('aria-expanded', String(openCc));
      if (openCc) drawControlCenter();
    }
    if (bt.matches('[data-put-folder]')) {
      const r = selectedDocument ? gather(selectedDocument, 'put in by hand') : { ok: false, reason: 'nothing selected' };
      announce(r.ok ? `In the folder. ${r.count} artifact${r.count === 1 ? '' : 's'}.` : `Not added: ${r.reason}.`);
      pop.hidden = true;
    }
    if (bt.matches('[data-switcher]')) { switcher.toggle(); return; }
    if (bt.matches('[data-strip]')) {
      const on = root.classList.toggle('strip-open');
      bt.setAttribute('aria-expanded', String(on));
      announce(on ? 'Public record panel open' : 'Public record panel closed');
      return;
    }
    if (bt.matches('[data-lens-toggle]')) {
      lens.toggle();
      pop.hidden = true;
      $('.control-center').hidden = true;
    }
    if (bt.matches('[data-appearance-toggle]')) {
      setAppearance(appearance === 'light' ? 'dark' : 'light');
      pop.hidden = true;
    }
    if (bt.matches('[data-clock-hold]')) {
      clockHeld = !clockHeld;
      drawControlCenter();
      paintClock();
      announce(clockHeld ? 'Clock held' : 'Chicago clock running');
    }
  });

  listen(root, 'keydown', (ev) => {
    if (root.classList.contains('session-on') && ev.key === ' ' && !ev.metaKey && !ev.ctrlKey && !ev.altKey && !ev.target.closest('input,textarea,select,button,a,[contenteditable=true]')) {
      const item=ev.target.closest('.window-finder [data-document-ref]');
      if(item) {
        ev.preventDefault(); ev.stopPropagation();
        const ref=parseDocumentRef(item.dataset.documentRef);
        // F5: Space toggles Quick Look for the record it already shows, as macOS does
        const shown=windows.has('preview') && !windows.get('preview').hidden ? appHost.getState('preview')?.ref : null;
        if(shown && serializeDocumentRef(shown)===serializeDocumentRef(ref)) { close('preview'); return; }
        inspectDocument(ref); return;
      }
    }
    if ((ev.key === 'Enter' || ev.key === ' ') && !root.classList.contains('session-on')) {
      if (ev.target.closest('textarea,input,select,a')) return;
      ev.preventDefault();
      if (!$('[data-login]').hidden) enterSession();
      else if (!$('[data-boot]').hidden) root._showLogin?.();
      return;
    }
    if (ev.key === 'Escape') {
      ev.preventDefault();
      ev.stopPropagation();
      if (lens.isOpen()) lens.hide();
      else if (!spot.hidden) hideSpot();
      else if (!$('.mac-context').hidden) hideContext();
      else if (!$('.control-center').hidden) { $('.control-center').hidden = true; $('.mac-cc').focus(); }
      else if (!pop.hidden) { pop.hidden = true; $('.apple-menu').focus(); }
      else if(tour.running) { tour.end(); }
      else if(active==='preview' || active==='comparison' || active==='investigation' || active==='timemachine' || active==='questions' || active==='corrections' || active==='schedule' || active==='proof' || active==='tape') close(active);   // F5/C4/C8: Escape closes the active document window
      return;
    }
    if (root.classList.contains('session-on') && ev.shiftKey && (ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'e' && !ev.target.closest('input,textarea,[contenteditable=true]')) { ev.preventDefault(); lens.toggle(); return; }
    if (root.classList.contains('session-on') && ev.ctrlKey && !ev.altKey && !ev.metaKey && ev.key === 'ArrowUp' && !ev.target.closest('input,textarea,select,[contenteditable=true]')) { ev.preventDefault(); mission.toggle(); return; }
    if ((ev.metaKey || ev.ctrlKey) && (ev.key.toLowerCase() === 'k' || ev.key === ' ')) {
      if (ev.key === ' ' && !ev.metaKey && !ev.ctrlKey) return;
      ev.preventDefault();
      spotlight();
    }
    if (!pop.hidden && ['ArrowDown', 'ArrowUp'].includes(ev.key)) {
      ev.preventDefault();
      const items = [...pop.querySelectorAll('button,a')];
      const i = items.indexOf(document.activeElement);
      items[(i + (ev.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
    }
  });

  /* The home bar answers a swipe as well as a tap. The tap path is the
     accessible one; the swipe is the one a thumb reaches for. */
  {
    const bar = root.querySelector('.f5-home-bar');
    let y0 = null;
    listen(bar, 'pointerdown', (ev) => { y0 = ev.clientY; bar.setPointerCapture?.(ev.pointerId); });
    listen(bar, 'pointermove', (ev) => { if (y0 !== null && y0 - ev.clientY > 34) { y0 = null; switcher.show(); } });
    listen(bar, 'pointerup', () => { y0 = null; });
    listen(bar, 'pointercancel', () => { y0 = null; });
  }

  bindIconDrag(root, '.desk-icon', root);
  placeDesktopIcons();
  addEventListener('resize', placeDesktopIcons);
  drawWidgets();
  drawStrip();
  paintFolder();   /* #23: the desk badge reflects a folder restored from a previous visit */
  drawControlCenter();
  paintClock();
  loadWeather();
  const dock = $('.mac-dock');
  listen(dock, 'mousemove', (ev) => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    dock.querySelectorAll('button,a').forEach((b) => {
      const r = b.getBoundingClientRect();
      const d = Math.abs(ev.clientX - (r.left + r.width / 2));
      const s = 1 + 0.38 * Math.exp(-(d * d) / (2 * 64 * 64));
      const img = b.querySelector('img, svg');
      if (img) img.style.transform = `translateY(${(s - 1) * -22}px) scale(${s})`;
    });
  });
  listen(dock, 'mouseleave', () => {
    dock.querySelectorAll('img, svg').forEach((img) => { img.style.transform = ''; });
  });
  (function boot() {
    const bar = $('[data-boot-bar] i');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const showLogin = () => {
      // A skipped boot timer must not reopen login after the visitor enters.
      if (root.classList.contains('session-on')) return;
      $('[data-boot]').hidden = true;
      $('[data-login]').hidden = false;
      /* The account picture. Not a monogram: a program has no face, and an
         orange circle with an R in it is what you draw when you have decided
         not to draw anything. See mark.mjs. */
      const mark = $('[data-login-mark]');
      if (mark && !mark.firstChild) {
        mark.innerHTML = markSVG(C, { size: 96 });
        const m = markSummary(C);
        mark.title = `${m.days} days. ${m.cleared} cleared a receipt.`;
      }
      $('[data-enter]').focus();
      // The greeting no longer rotates. It changed under the reader every
      // 4.2 seconds, which meant a slow reader watched the sentence they
      // were halfway through become a different one.
    };
    root._showLogin = showLogin;
    if (reduced) { showLogin(); return; }
    if (bar) bar.classList.add('fill');
    timers.push(setTimeout(showLogin, 2400));
  })();
  listen(root, 'click', (ev) => {
    if (ev.target.closest('[data-skip-boot]')) {
      ev.preventDefault();
      ev.stopPropagation();
      root._showLogin?.();
      return;
    }
    if (ev.target.closest('[data-enter]')) {
      ev.preventDefault();
      ev.stopPropagation();
      enterSession();
    }
  }, true);
  listen(root, 'contextmenu', (ev) => {
    ev.preventDefault();
    const record=ev.target.closest('.window-finder [data-document-ref]');
    if(record){
      selectedDocument=parseDocumentRef(record.dataset.documentRef);
      record.focus({preventScroll:true});
      showContext(ev.clientX,ev.clientY,`<button data-quick-look>Quick Look <span>Space</span></button>${selectedDocument?.kind==='kept'?'<button data-compare-document>Compare Receipts…</button>':''}${caseForRef(casesState.data, selectedDocument)?'<button data-investigate>Investigate…</button>':''}<button data-send-messages>Send to Messages</button>`);
      return;
    }
    const icon = ev.target.closest('.desk-icon');
    const dockBtn = ev.target.closest('.mac-dock [data-app]');
    if (icon) {
      selectIcon(icon);
      menuTarget = icon;
      showContext(ev.clientX, ev.clientY, `<button data-ctx="open">Open</button><button data-ctx="info">Get Info</button><hr><button data-ctx="trash">Move to Trash</button>`);
      return;
    }
    if (dockBtn) {
      menuTarget = dockBtn;
      showContext(ev.clientX, ev.clientY, `<button data-ctx="dock-open">Open</button><button data-ctx="info">Get Info</button>`);
      return;
    }
    if (!ev.target.closest('.mac-window')) {
      menuTarget = null;
      showContext(ev.clientX, ev.clientY, `<button data-ctx="finder">Open Finder</button><button data-ctx="notes">Open Notes</button><button data-ctx="messages">Open Messages</button><hr><button data-ctx="refresh">Refresh weather</button>`);
    }
  });
  timers.push(setInterval(() => { if (!clockHeld) paintClock(); }, 10000));
  return {
    open, openDocument, inspectDocument, compareDocument, investigate, sendToMessages,
    timeMachine: (date) => open('timemachine', date ? { date } : undefined),
    switcher: { show: () => switcher.show(), hide: () => switcher.hide(), toggle: () => switcher.toggle(), isOpen: () => switcher.isOpen(), count: () => switcher.count() },
    lens: { show: () => lens.show(), hide: () => lens.hide(), toggle: () => lens.toggle(), isOpen: () => lens.isOpen(), read: () => lens.read(), report: () => lens.report() },
    mission: { show: () => mission.show(), hide: () => mission.hide(), isOpen: () => mission.isOpen(), editions: () => validatedEditions(), openEdition: (id) => { const e = (validatedEditions() || []).find((x) => x.id === id); if (e) openEdition(e); return Boolean(e); } },
    memory: { enabled: () => memory.enabled(), available: memory.available, enable: () => { const ok = memory.enable(); remember(true); return ok; }, disable: () => memory.disable(), collect: collectWorkspace, exportJSON: () => memory.exportJSON(), remember: () => remember(true) },
    getSelectedDocument: () => selectedDocument,
    getWindowState: id => windowMotion.get(id)?.getState() || null,
    // F5 diagnostics (specimen only): lifecycle visuals, banner count, More state
    f5: { life: id => windowLife.get(id)?.visual || null, lifeTrace: id => windowLife.get(id)?.trace() || [], banners: () => banners.count(), moreOpen: () => dockNav.isMoreOpen(), openMore: () => dockNav.openMore(), windows: () => [...windows.keys()], active: () => active, hidden: id => windows.get(id)?.hidden ?? null, inert: id => windows.get(id)?.inert ?? null },
    dispose() {
      if(disposed) return;
      disposed=true;
      for(const m of windowMotion.values())m.destroy();windowMotion.clear();
      for(const l of windowLife.values())l.destroy();windowLife.clear();
      banners.destroy(); dockNav.destroy(); mission.destroy(); lens.destroy(); switcher.destroy(); viewport.destroy();
      desktopEvents.abort();
      removeEventListener('resize',placeDesktopIcons);
      timers.forEach(t=>{clearInterval(t);clearTimeout(t);});
      try {appHost.destroy();} finally {windows.clear();windowOrigins.clear();root.replaceChildren();delete root._showLogin;delete root._loginCycling;}
    }
  };
}
