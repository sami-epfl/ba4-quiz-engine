# ba4-quiz-engine

Shared quiz engine for BA4 course quiz repos. A lightweight, zero-dependency quiz that runs entirely in the browser — write your questions in plain JavaScript files, open `index.html`, and get a polished quiz UI with topic selection, randomized questions, scoring, and explanations.

---

## Create a new course repo

### Step 1 — Set up `config.js`

Copy `config.example.js` to `config.js` and fill in your values:

```js
const QUIZ_CONFIG = {
  title: "CS-233",                        // shown in the header (required)
  subtitle: "Intro to ML",                // smaller text below the title (optional)
  engineCdn: "https://cdn.jsdelivr.net/gh/sami-epfl/ba4-quiz-engine@main",
  engineLocal: "../ba4-quiz-engine",      // path to this repo when running locally
  landingUrl: "https://...",              // optional: adds a "← All quizzes" footer link
};
```

`engineCdn` / `engineLocal` are picked automatically — the HTML snippet uses `engineLocal` when you open the file directly (`file://`) and `engineCdn` when served over HTTP.

### Step 2 — Create `index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Quiz</title>
  <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="config.js"></script>
  <script>
    var _base = location.protocol === "file:" ? QUIZ_CONFIG.engineLocal : QUIZ_CONFIG.engineCdn;
    var _link = document.createElement("link");
    _link.rel = "stylesheet"; _link.href = _base + "/style.css";
    document.head.appendChild(_link);
    document.write('<script src="' + _base + '/app.js"><\/script>');
  </script>
</head>
<body>
  <script src="topics/my-topic.js"></script>
</body>
</html>
```

Add one `<script>` tag in `<body>` per topic file.

### Step 3 — Write topic files

Each file calls `registerTopic(name, ...questions)`. The name becomes the label in the topic selector. Create a `topics/` folder and add one file per topic.

#### Question types

**Single-choice (`scq`)** — one correct answer; `answer` is the index of the correct option:

```js
registerTopic("My Topic",
  {
    type: "scq",
    question: "What does CPU stand for?",
    options: ["Central Processing Unit", "Core Power Unit", "Control Program Utility"],
    answer: 0,
    explanation: "CPU = Central Processing Unit."   // optional
  }
);
```

**Multiple-choice (`mcq`)** — multiple correct answers; `answer` is an array of correct indices:

```js
{
  type: "mcq",
  question: "Which are RISC architectures?",
  options: ["ARM", "x86", "MIPS", "AVR"],
  answer: [0, 2, 3],
  explanation: "ARM, MIPS, and AVR are RISC; x86 is CISC."
}
```

**True/False (`tf`)** — `answer` is `true` or `false`; no `options` needed:

```js
{
  type: "tf",
  question: "A cache hit is faster than a cache miss.",
  answer: true,
  explanation: "Cache hits avoid the slower main memory access."
}
```

**Flashcard (`flashcard`)** — shows the question and hides the answer until the user clicks "Reveal answer", then the user self-reports whether they got it:

```js
{
  type: "flashcard",
  question: "What is Amdahl's Law?",
  answer: "Speedup is limited by the sequential fraction of the program."
}
```

### Step 4 — Open in a browser

Open `index.html` directly in any browser — no server, no build step, no npm required. The engine auto-detects `file://` and loads assets from `engineLocal` instead of the CDN.

---

## Topic grouping

If at least two topics share the same `"Prefix - ..."` naming pattern, the engine automatically groups them in the selector under a collapsible header:

```js
registerTopic("Week 1 - Caches", ...);
registerTopic("Week 1 - Pipelines", ...);
registerTopic("Week 2 - Memory", ...);
// → "Week 1" group with collapsible children; "Week 2 - Memory" is standalone
```

The group checkbox supports three states: all checked, none checked, and indeterminate (some checked).

---

## Examples of implementation

See [ba4-cs233-quiz](https://github.com/sami-epfl/ba4-cs233-quiz) — a full course repo using this engine, live at [sami-epfl.github.io/ba4-cs233-quiz](https://sami-epfl.github.io/ba4-cs233-quiz/).

See [ba4-cs202-quiz](https://github.com/sami-epfl/ba4-cs202-quiz) — a full course repo using this engine, live at [sami-epfl.github.io/ba4-cs202-quiz](https://sami-epfl.github.io/ba4-cs202-quiz/).
