const cfg = (typeof QUIZ_CONFIG !== "undefined") ? QUIZ_CONFIG : {};
const _title    = cfg.title    || "Quiz";
const _subtitle = cfg.subtitle || "";

// Preserve topics pre-registered by the inline stub in index.html
if (typeof window.TOPICS === "undefined") window.TOPICS = {};
const TOPICS = window.TOPICS;

function registerTopic(name, ...questions) {
  if (!TOPICS[name]) TOPICS[name] = [];
  TOPICS[name].push(...questions);
}
window.registerTopic = registerTopic;

let activeQuestions = [];
let order = [];
let current = 0;
let score = 0;
let answered = false;

function getSelectedTopics() {
  const checked = document.querySelectorAll(".topic-checkbox:checked");
  return Array.from(checked).map(cb => cb.value);
}

function buildActiveQuestions() {
  const selected = getSelectedTopics();
  activeQuestions = selected.flatMap(name => TOPICS[name] || []);
}

function updateQuestionCount() {
  const selected = getSelectedTopics();
  const count = selected.reduce((n, name) => n + (TOPICS[name]?.length || 0), 0);
  const el = document.getElementById("question-count");
  if (el) el.textContent = `${count} question${count !== 1 ? "s" : ""}`;
}

function buildTopicGroups(names) {
  // Count how many topics share a "Prefix - ..." pattern
  const prefixCounts = {};
  names.forEach(name => {
    const m = name.match(/^(.+?) - /);
    if (m) prefixCounts[m[1]] = (prefixCounts[m[1]] || 0) + 1;
  });
  const groupPrefixes = new Set(Object.keys(prefixCounts).filter(p => prefixCounts[p] >= 2));

  // Build ordered list preserving original topic order
  const items = [];
  const seenGroups = new Set();
  names.forEach(name => {
    const m = name.match(/^(.+?) - /);
    const prefix = m && groupPrefixes.has(m[1]) ? m[1] : null;
    if (prefix) {
      if (!seenGroups.has(prefix)) {
        seenGroups.add(prefix);
        items.push({ type: "group", prefix, members: names.filter(n => n.startsWith(prefix + " - ")) });
      }
    } else {
      items.push({ type: "topic", name });
    }
  });
  return items;
}

function renderTopicSelector() {
  const container = document.getElementById("topic-selector");
  if (!container) return;

  const names = Object.keys(TOPICS);
  const total = names.reduce((n, k) => n + TOPICS[k].length, 0);
  const items = buildTopicGroups(names);

  const allCheckbox = `
    <div class="topic-label-all-wrap">
      <label class="topic-label topic-label-all">
        <input type="checkbox" id="cb-all" checked onchange="toggleAll(this)" />
        <span class="topic-name">All topics</span>
        <span class="topic-count">${total}</span>
      </label>
    </div>`;

  const itemsHTML = items.map(item => {
    if (item.type === "topic") {
      return `<label class="topic-label">
        <input type="checkbox" class="topic-checkbox" value="${item.name}" checked onchange="onTopicChange()" />
        <span class="topic-name">${item.name}</span>
        <span class="topic-count">${TOPICS[item.name].length}</span>
      </label>`;
    } else {
      const groupCount = item.members.reduce((n, m) => n + TOPICS[m].length, 0);
      const subItems = item.members.map(name => `
        <label class="topic-label topic-label-sub">
          <input type="checkbox" class="topic-checkbox" value="${name}" checked onchange="onTopicChange()" />
          <span class="topic-name">${name.slice(item.prefix.length + 3)}</span>
          <span class="topic-count">${TOPICS[name].length}</span>
        </label>`).join("");
      return `
        <div class="topic-group">
          <div class="topic-label topic-label-group" onclick="toggleGroupExpand(this)">
            <input type="checkbox" class="topic-group-cb" data-group="${item.prefix}" checked
              onchange="toggleGroup(this)" onclick="event.stopPropagation()" />
            <span class="topic-name">${item.prefix}</span>
            <span style="flex:1"></span>
            <span class="topic-count topic-group-total">${groupCount}</span>
            <span class="topic-group-arrow">▾</span>
          </div>
          <div class="topic-group-children">${subItems}</div>
        </div>`;
    }
  }).join("");

  container.innerHTML = allCheckbox + itemsHTML;
  updateQuestionCount();
}

function toggleGroupExpand(headerEl) {
  headerEl.closest(".topic-group").classList.toggle("collapsed");
}

function toggleGroup(cb) {
  cb.closest(".topic-group").querySelectorAll(".topic-checkbox").forEach(c => { c.checked = cb.checked; });
  onTopicChange();
}

function toggleAll(allCb) {
  document.querySelectorAll(".topic-checkbox").forEach(cb => { cb.checked = allCb.checked; });
  document.querySelectorAll(".topic-group-cb").forEach(gcb => { gcb.checked = allCb.checked; gcb.indeterminate = false; });
  updateQuestionCount();
}

function onTopicChange() {
  // Sync group checkboxes
  document.querySelectorAll(".topic-group-cb").forEach(gcb => {
    const children = Array.from(gcb.closest(".topic-group").querySelectorAll(".topic-checkbox"));
    const n = children.filter(c => c.checked).length;
    gcb.checked = n === children.length;
    gcb.indeterminate = n > 0 && n < children.length;
  });
  // Sync "all" checkbox
  const all = Array.from(document.querySelectorAll(".topic-checkbox"));
  const nChecked = all.filter(c => c.checked).length;
  const allCb = document.getElementById("cb-all");
  if (allCb) {
    allCb.checked = nChecked === all.length;
    allCb.indeterminate = nChecked > 0 && nChecked < all.length;
  }
  updateQuestionCount();
}

function init() {
  // Topics are loaded after app.js; defer rendering to next tick
  setTimeout(() => {
    renderTopicSelector();
  }, 0);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startQuiz() {
  buildActiveQuestions();
  if (activeQuestions.length === 0) {
    alert("Please select at least one topic.");
    return;
  }
  order = shuffle(activeQuestions.map((_, i) => i));
  current = 0;
  score = 0;
  answered = false;
  document.getElementById("progress-wrap").classList.remove("hidden");
  document.getElementById("btn-restart").classList.remove("hidden");
  showQuestion();
}

function updateProgress() {
  const total = order.length;
  const pct = Math.round((current / total) * 100);
  document.getElementById("prog-label").textContent = `${current + 1} / ${total}`;
  document.getElementById("prog-score").textContent = `${score} correct`;
  document.getElementById("prog-fill").style.width = pct + "%";
}

function isMulti(q) {
  return Array.isArray(q.answer);
}

function showQuestion() {
  if (current >= order.length) { showResults(); return; }

  answered = false;
  updateProgress();

  const q = activeQuestions[order[current]];
  const labels = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

  if (q.type === "flashcard") {
    document.getElementById("quiz-area").innerHTML = `
      <div class="question-card">
        <div class="q-label">Flashcard</div>
        <div class="q-text">${q.question}</div>
        <div id="fc-body">
          <button class="btn-next" style="margin-left:0" onclick="revealFlashcard()">Reveal answer</button>
        </div>
        <div class="card-footer" id="card-footer"></div>
      </div>`;
    return;
  }

  let opts;
  if (q.type === "tf") {
    opts = [{ text: "True", orig: "true" }, { text: "False", orig: "false" }];
  } else {
    opts = shuffle(q.options.map((text, i) => ({ text, orig: String(i) })));
  }

  const optionsHTML = opts.map((o, i) => `
    <div class="opt" data-orig="${o.orig}" onclick="toggleOpt(this)">
      <div class="opt-ring">${labels[i]}</div>
      <div class="opt-txt">${o.text}</div>
    </div>`).join("");

  document.getElementById("quiz-area").innerHTML = `
    <div class="question-card">
      <div class="q-label">${q.type === "tf" ? "True / False" : q.type === "mcq" ? "Multiple Choice" : "Single Choice"}</div>
      <div class="q-text">${q.question}</div>
      <div class="options-list">${optionsHTML}</div>
      <div id="confirm-wrap" style="margin-top:12px">
        <button class="btn-next" onclick="confirmAnswer()">Confirm</button>
      </div>
      <div class="card-footer" id="card-footer"></div>
    </div>`;
}

function toggleOpt(el) {
  if (answered) return;
  const q = activeQuestions[order[current]];
  if (isMulti(q)) {
    el.classList.toggle("selected");
  } else {
    document.querySelectorAll(".opt").forEach(o => o.classList.remove("selected"));
    el.classList.add("selected");
  }
}

function confirmAnswer() {
  if (answered) return;

  const q = activeQuestions[order[current]];
  const selected = new Set(
    [...document.querySelectorAll(".opt.selected")].map(o => o.dataset.orig)
  );

  if (selected.size === 0) return;

  answered = true;

  let isCorrect;
  let correctSet;
  if (isMulti(q)) {
    correctSet = new Set(q.answer.map(String));
    isCorrect = correctSet.size === selected.size && [...correctSet].every(v => selected.has(v));
  } else if (q.type === "tf") {
    correctSet = new Set([String(q.answer)]);
    isCorrect = selected.has(String(q.answer));
  } else {
    correctSet = new Set([String(q.answer)]);
    isCorrect = selected.has(String(q.answer));
  }

  document.querySelectorAll(".opt").forEach(o => {
    o.classList.remove("selected");
    o.classList.add("disabled");
    o.style.pointerEvents = "none";
    const orig = o.dataset.orig;
    const wasSelected = selected.has(orig);
    const isCorrectOpt = correctSet.has(orig);
    if (wasSelected && isCorrectOpt) {
      o.classList.add("correct");
      o.insertAdjacentHTML("beforeend", `<span class="opt-tag tag-correct">✓ Correct</span>`);
    } else if (wasSelected && !isCorrectOpt) {
      o.classList.add("wrong");
      o.insertAdjacentHTML("beforeend", `<span class="opt-tag tag-wrong">✗ Wrong</span>`);
    } else if (!wasSelected && isCorrectOpt) {
      o.classList.add("also");
      o.insertAdjacentHTML("beforeend", `<span class="opt-tag tag-also">✓ Correct answer</span>`);
    }
  });

  const wrap = document.getElementById("confirm-wrap");
  if (wrap) wrap.remove();

  if (isCorrect) score++;
  current++;

  const badge = isCorrect
    ? `<span class="feedback-badge ok">✓ Correct!</span>`
    : `<span class="feedback-badge ko">✗ Wrong</span>`;
  const exp = q.explanation
    ? `<div class="feedback-explanation">${q.explanation}</div>` : "";
  const nextLabel = current >= order.length ? "See results" : "Next";

  document.getElementById("card-footer").innerHTML =
    `${badge}${exp}<button class="btn-next" onclick="showQuestion()">${nextLabel}</button>`;
}

function revealFlashcard() {
  const q = activeQuestions[order[current]];
  document.getElementById("fc-body").innerHTML = `
    <div class="fc-answer">${q.answer}</div>
    <div class="fc-actions">
      <button class="btn-fc-wrong" onclick="scoreFlashcard(false)">✗ Missed it</button>
      <button class="btn-fc-correct" onclick="scoreFlashcard(true)">✓ Got it</button>
    </div>`;
}

function scoreFlashcard(correct) {
  if (answered) return;
  answered = true;
  if (correct) score++;
  current++;
  showQuestion();
}

function showResults() {
  document.getElementById("progress-wrap").classList.add("hidden");
  document.getElementById("btn-restart").classList.add("hidden");

  const total = order.length;
  const pct = Math.round((score / total) * 100);
  const msg = pct === 100 ? "Perfect score!" : pct >= 80 ? "Great job!" : pct >= 60 ? "Not bad, keep going!" : "Needs more work...";

  document.getElementById("quiz-area").innerHTML = `
    <div class="results">
      <h2>Results</h2>
      <div class="big-score"><span>${score}</span> / ${total}</div>
      <div class="results-sub">${msg} — ${pct}%</div>
      <div class="results-grid">
        <div class="results-stat stat-correct"><div class="val">${score}</div><div class="lbl">Correct</div></div>
        <div class="results-stat stat-wrong"><div class="val">${total - score}</div><div class="lbl">Wrong</div></div>
        <div class="results-stat stat-total"><div class="val">${total}</div><div class="lbl">Total</div></div>
      </div>
      <button class="btn-primary" onclick="backToStart()">Change topics &amp; retry</button>
    </div>`;
}

function backToStart() {
  document.getElementById("progress-wrap").classList.add("hidden");
  document.getElementById("btn-restart").classList.add("hidden");
  document.getElementById("quiz-area").innerHTML = `
    <div class="start-screen">
      <div class="start-hero">
        <h2>Ready to review?</h2>
        <p>Select your answer(s), then click <strong>Confirm</strong>.</p>
        <div class="start-chips">
          <span class="chip chip-accent" id="question-count">… questions</span>
          <span class="chip">True/False &amp; MCQ</span>
          <span class="chip">Randomized</span>
        </div>
      </div>
      <div class="topic-body">
        <div class="topic-section-label">Topics</div>
        <div class="topic-selector" id="topic-selector"></div>
        <button class="btn-start-full" onclick="startQuiz()">Start</button>
      </div>
    </div>`;
  renderTopicSelector();
}

function buildShell() {
  document.title = _title;
  document.body.innerHTML = `
    <header>
      <div class="logo">
        <h1>${_title}</h1>
        ${_subtitle ? `<div class="subtitle">${_subtitle}</div>` : ""}
        ${cfg.repoUrl ? `<div class="last-updated" id="last-updated"></div>` : ""}
      </div>
      <button class="btn-restart hidden" id="btn-restart" onclick="backToStart()" title="Restart">↺</button>
    </header>
    <main>
      <div class="progress-wrap hidden" id="progress-wrap">
        <div class="progress-meta">
          <span id="prog-label">1 / ?</span>
          <span id="prog-score">0 correct</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" id="prog-fill"></div>
        </div>
      </div>
      <div id="quiz-area">
        <div class="start-screen">
          <div class="start-hero">
            <h2>Ready to review?</h2>
            <p>Select your answer(s), then click <strong>Confirm</strong>.</p>
            <div class="start-chips">
              <span class="chip chip-accent" id="question-count">… questions</span>
              <span class="chip">True/False &amp; MCQ</span>
              <span class="chip">Randomized</span>
            </div>
          </div>
          <div class="topic-body">
            <div class="topic-section-label">Topics</div>
            <div class="topic-selector" id="topic-selector"></div>
            <button class="btn-start-full" onclick="startQuiz()">Start</button>
          </div>
        </div>
      </div>
    </main>
    ${cfg.landingUrl ? `<footer style="position:relative;z-index:1;padding:1.5rem;font-size:.75rem;color:var(--text-muted);text-align:center">
      <a href="${cfg.landingUrl}" style="color:var(--accent);text-decoration:none">← All quizzes</a>
    </footer>` : ""}`;
}

function fetchLastUpdated() {
  if (!cfg.repoUrl) return;
  const match = cfg.repoUrl.match(/github\.com\/([^/]+\/[^/]+)/);
  if (!match) return;
  fetch(`https://api.github.com/repos/${match[1]}/commits?per_page=1`)
    .then(r => r.json())
    .then(data => {
      const date = data?.[0]?.commit?.committer?.date;
      if (!date) return;
      const el = document.getElementById("last-updated");
      if (el) el.textContent = "Updated " + new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    })
    .catch(() => {});
}

function _onReady() {
  if (document.getElementById("quiz-area")) return; // already initialized by onload
  buildShell(); init(); fetchLastUpdated();
}
if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", _onReady);
} else {
  _onReady();
}
