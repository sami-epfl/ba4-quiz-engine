(function () {
  var base = window._engineBase;

  // Inject engine stylesheet
  var link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = base + "/style.css";
  document.head.appendChild(link);

  // Buffer topic registrations until app.js is ready
  window._topicBuffer = [];
  window.registerTopic = function (name) {
    var qs = Array.prototype.slice.call(arguments, 1);
    window._topicBuffer.push([name, qs]);
  };

  // Load engine after all topic scripts have executed
  window.addEventListener("DOMContentLoaded", function () {
    var s = document.createElement("script");
    s.src = base + "/app.js";
    s.onload = function () {
      if (typeof registerTopic === "function" && window._topicBuffer) {
        window._topicBuffer.forEach(function (t) {
          registerTopic.apply(null, [t[0]].concat(t[1]));
        });
      }
      if (typeof buildShell === "function" && !document.getElementById("quiz-area")) {
        buildShell();
        init();
      }
    };
    document.body.appendChild(s);
  });
})();
