const QUIZ_TITLE = "CS-233 Review";

const TOPICS = {};

function registerTopic(name, ...questions) {
  if (!TOPICS[name]) TOPICS[name] = [];
  TOPICS[name].push(...questions);
}

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

function renderTopicSelector() {
  const container = document.getElementById("topic-selector");
  if (!container) return;

  const names = Object.keys(TOPICS);

  const allCheckbox = `
    <label class="topic-label topic-label-all">
      <input type="checkbox" id="cb-all" checked onchange="toggleAll(this)" />
      <span class="topic-name">All topics</span>
      <span class="topic-count">${names.reduce((n, k) => n + TOPICS[k].length, 0)}</span>
    </label>`;

  const topicCheckboxes = names.map(name => `
    <label class="topic-label">
      <input type="checkbox" class="topic-checkbox" value="${name}" checked onchange="onTopicChange()" />
      <span class="topic-name">${name}</span>
      <span class="topic-count">${TOPICS[name].length}</span>
    </label>`).join("");

  container.innerHTML = allCheckbox + topicCheckboxes;
  updateQuestionCount();
}

function toggleAll(allCb) {
  document.querySelectorAll(".topic-checkbox").forEach(cb => {
    cb.checked = allCb.checked;
  });
  updateQuestionCount();
}

function onTopicChange() {
  const checkboxes = document.querySelectorAll(".topic-checkbox");
  const allChecked = Array.from(checkboxes).every(cb => cb.checked);
  const allCb = document.getElementById("cb-all");
  if (allCb) allCb.checked = allChecked;
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

function showQuestion() {
  if (current >= order.length) { showResults(); return; }

  answered = false;
  updateProgress();

  const q = activeQuestions[order[current]];
  const labels = ["A", "B", "C", "D", "E"];

  let opts = q.options
    ? shuffle(q.options.map((text, i) => ({ text, orig: i })))
    : null;

  const optionsHTML = q.type === "tf"
    ? [{ text: "True", orig: true }, { text: "False", orig: false }]
        .map((o, i) => `
          <div class="opt" data-orig="${o.orig}" onclick="pick(this, ${o.orig === q.answer})">
            <div class="opt-ring">${labels[i]}</div>
            <div class="opt-txt">${o.text}</div>
          </div>`).join("")
    : opts.map((o, i) => `
        <div class="opt" data-orig="${o.orig}" onclick="pick(this, ${o.orig === q.answer})">
          <div class="opt-ring">${labels[i]}</div>
          <div class="opt-txt">${o.text}</div>
        </div>`).join("");

  document.getElementById("quiz-area").innerHTML = `
    <div class="question-card">
      <div class="q-label">${q.type === "tf" ? "True / False" : "Multiple Choice"}</div>
      <div class="q-text">${q.question}</div>
      <div class="options-list">${optionsHTML}</div>
      <div class="card-footer" id="card-footer"></div>
    </div>`;
}

function pick(el, isCorrect) {
  if (answered) return;
  answered = true;

  const q = activeQuestions[order[current]];

  document.querySelectorAll(".opt").forEach(o => {
    o.classList.add("disabled");
    o.style.pointerEvents = "none";
  });

  el.classList.add(isCorrect ? "correct" : "wrong");
  el.insertAdjacentHTML("beforeend",
    `<span class="opt-tag ${isCorrect ? "tag-correct" : "tag-wrong"}">${isCorrect ? "✓ Correct" : "✗ Wrong"}</span>`);

  if (!isCorrect) {
    document.querySelectorAll(".opt").forEach(o => {
      const orig = o.dataset.orig;
      const isCorrectOrig = q.type === "tf"
        ? (orig === String(q.answer))
        : (parseInt(orig) === q.answer);
      if (isCorrectOrig) {
        o.classList.add("also");
        o.insertAdjacentHTML("beforeend", `<span class="opt-tag tag-also">✓ Correct answer</span>`);
      }
    });
  }

  if (isCorrect) score++;
  current++;

  const badge = isCorrect
    ? `<span class="feedback-badge ok">✓ Correct!</span>`
    : `<span class="feedback-badge ko">✗ Wrong</span>`;
  const exp = q.explanation
    ? `<div class="feedback-explanation">${q.explanation}</div>` : "";
  const nextLabel = current >= order.length ? "See results →" : "Next →";

  document.getElementById("card-footer").innerHTML =
    `${badge}${exp}<button class="btn-next" onclick="showQuestion()">${nextLabel}</button>`;
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
      <h2>Ready to review?</h2>
      <p>Click an answer to validate it.<br>The correct answer is shown immediately.</p>
      <div class="start-chips">
        <span class="chip chip-accent" id="question-count">… questions</span>
        <span class="chip">True/False &amp; MCQ</span>
        <span class="chip">Randomized</span>
      </div>
      <div class="topic-selector" id="topic-selector"></div>
      <button class="btn-primary" onclick="startQuiz()">Start</button>
    </div>`;
  renderTopicSelector();
}

window.addEventListener("DOMContentLoaded", init);
