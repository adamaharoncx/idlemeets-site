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
    var catalogPath = root.getAttribute("data-help-search-catalog");

    if (!form || !input || !clearButton || !status || !emptyState) return;

    var items = [];
    var groups = [];
    var catalogReady = !catalogPath;
    var catalogFailed = false;

    function itemTarget(item) {
      try {
        return new URL(item.getAttribute("href") || "", window.location.href).href;
      } catch (error) {
        return item.getAttribute("href") || item.textContent;
      }
    }

    function refreshIndex() {
      items = Array.prototype.slice.call(root.querySelectorAll(".article-card"));
      groups = [];

      items.forEach(function (item) {
        item.helpSearchText = normalize([
          item.textContent,
          item.getAttribute("href") || "",
          item.getAttribute("data-search-terms") || ""
        ].join(" "));
        item.helpSearchWords = item.helpSearchText.split(" ");
        item.helpSearchTarget = itemTarget(item);

        var group = item.closest("section");
        if (group && groups.indexOf(group) === -1) groups.push(group);
      });

      groups.forEach(function (group) {
        group.setAttribute("data-help-search-group", "");
      });
    }

    function topicCount() {
      var targets = {};
      items.forEach(function (item) {
        targets[item.helpSearchTarget] = true;
      });
      return Object.keys(targets).length;
    }

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
          var target = item.helpSearchTarget;
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
        var isCatalogGroup = group.hasAttribute("data-help-search-catalog-group");
        group.hidden = (!isSearching && isCatalogGroup) || (isSearching && !visibleItem);
      });

      root.classList.toggle("is-help-searching", isSearching);
      clearButton.hidden = !isSearching;
      emptyState.hidden = !isSearching || matchCount > 0;

      if (!isSearching) {
        if (!catalogReady) {
          status.textContent = "Loading all help topics.";
        } else if (catalogFailed) {
          status.textContent = "Type to filter " + topicCount() + " support topics. Open the Help Center to browse every article.";
        } else {
          status.textContent = "Type to filter " + topicCount() + " help topics.";
        }
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

    refreshIndex();
    update();

    if (catalogPath) {
      var catalogURL = new URL(catalogPath, window.location.href);

      fetch(catalogURL.href)
        .then(function (response) {
          if (!response.ok) throw new Error("Help Center returned " + response.status);
          return response.text();
        })
        .then(function (html) {
          var documentCopy = new DOMParser().parseFromString(html, "text/html");
          var sourceItems = Array.prototype.slice.call(documentCopy.querySelectorAll(".help-section .article-card"));
          var existingTargets = {};
          var catalogSection = document.createElement("section");
          var catalogList = document.createElement("div");
          var contentMain = root.querySelector(".content-main");

          if (!sourceItems.length) throw new Error("Help Center catalog is empty");

          items.forEach(function (item) {
            existingTargets[item.helpSearchTarget] = true;
          });

          catalogSection.className = "help-search-catalog";
          catalogSection.setAttribute("data-help-search-catalog-group", "");
          catalogSection.hidden = true;
          catalogList.className = "article-link-grid compact-help-grid article-row-list";

          sourceItems.forEach(function (sourceItem) {
            var sourceHref = sourceItem.getAttribute("href") || "";
            var target = new URL(sourceHref, catalogURL).href;
            if (existingTargets[target]) return;

            var item = sourceItem.cloneNode(true);
            item.setAttribute("href", target);
            item.setAttribute("data-help-search-catalog-item", "");
            catalogList.appendChild(item);
            existingTargets[target] = true;
          });

          if (contentMain && catalogList.children.length) {
            catalogSection.appendChild(catalogList);
            contentMain.appendChild(catalogSection);
          }

          catalogReady = true;
          refreshIndex();
          update();
        })
        .catch(function () {
          catalogReady = true;
          catalogFailed = true;
          update();
        });
    }
  });
})();
