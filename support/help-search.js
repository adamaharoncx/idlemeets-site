(function () {
  "use strict";

  function normalize(value) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  document.querySelectorAll("[data-help-search-root]").forEach(function (root) {
    var form = root.querySelector("[data-help-search]");
    var input = form && form.querySelector("[data-help-search-input]");
    var clearButton = form && form.querySelector("[data-help-search-clear]");
    var status = form && form.querySelector("[data-help-search-status]");
    var emptyState = form && form.querySelector("[data-help-search-empty]");

    if (!form || !input || !clearButton || !status || !emptyState) return;

    var items = Array.prototype.slice.call(root.querySelectorAll(".article-card"));
    var groups = [];

    items.forEach(function (item) {
      item.helpSearchText = normalize([
        item.textContent,
        item.getAttribute("href") || "",
        item.getAttribute("data-search-terms") || ""
      ].join(" "));
      item.helpSearchWords = item.helpSearchText.split(" ");

      var group = item.closest("section");
      if (group && groups.indexOf(group) === -1) groups.push(group);
    });

    groups.forEach(function (group) {
      group.setAttribute("data-help-search-group", "");
    });

    function update() {
      var query = input.value.trim();
      var terms = normalize(query).split(" ").filter(Boolean);
      var isSearching = terms.length > 0;
      var matchCount = 0;
      var matchedTargets = {};

      items.forEach(function (item) {
        var matches = !isSearching || terms.every(function (term) {
          return item.helpSearchWords.some(function (word) {
            return word.indexOf(term) === 0;
          });
        });

        if (matches && isSearching) {
          var target = item.getAttribute("href") || item.helpSearchText;
          if (matchedTargets[target]) {
            matches = false;
          } else {
            matchedTargets[target] = true;
          }
        }

        item.hidden = !matches;
        if (matches && isSearching) matchCount += 1;
      });

      groups.forEach(function (group) {
        var visibleItem = Array.prototype.some.call(group.querySelectorAll(".article-card"), function (item) {
          return !item.hidden;
        });
        group.hidden = isSearching && !visibleItem;
      });

      root.classList.toggle("is-help-searching", isSearching);
      clearButton.hidden = !isSearching;
      emptyState.hidden = !isSearching || matchCount > 0;

      if (!isSearching) {
        status.textContent = "Type to filter " + items.length + " help topics.";
        return;
      }

      status.textContent = matchCount + (matchCount === 1 ? " result" : " results") + " for \u201c" + query + "\u201d.";
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
    });

    input.addEventListener("input", update);
    input.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || !input.value) return;
      input.value = "";
      update();
    });

    clearButton.addEventListener("click", function () {
      input.value = "";
      update();
      input.focus();
    });

    update();
  });
})();
