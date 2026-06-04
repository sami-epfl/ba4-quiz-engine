# ba4-quiz-engine

Shared quiz engine for BA4 course quiz repos.

## Create a new course repo

1. Copy `config.example.js` → `config.js` and fill in your values
2. Create `index.html` loading `config.js`, the engine, and your topic scripts:

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

3. Create `topics/my-topic.js`:

```js
registerTopic("My Topic",
  {
    type: "mcq",
    question: "Question?",
    options: ["A", "B", "C", "D"],
    answer: 0,
    explanation: "Optional."
  },
  {
    type: "tf",
    question: "True or false?",
    answer: true,
    explanation: "Optional."
  }
);
```
4. Open `index.html` in a browser

## Example implementation

See [ba4-cs233-quiz](https://github.com/sami-epfl/ba4-cs233-quiz) — a full course repo using this engine, live at [sami-epfl.github.io/ba4-cs233-quiz](https://sami-epfl.github.io/ba4-cs233-quiz/).
