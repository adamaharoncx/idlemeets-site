(function () {
  var page = document.querySelector(".landing-page");
  if (!page) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var revealItems = Array.prototype.slice.call(document.querySelectorAll([
    "[data-reveal]",
    ".feature-strip article",
    ".showcase-card",
    ".cta-panel"
  ].join(",")));
  var seen = new Set();

  revealItems = revealItems.filter(function (item) {
    if (seen.has(item)) return false;
    seen.add(item);
    return true;
  });

  revealItems.forEach(function (item, index) {
    item.classList.add("js-reveal");
    item.style.setProperty("--reveal-delay", Math.min((index % 3) * 90, 180) + "ms");
  });

  function reveal(item) {
    item.classList.add("is-revealed");
  }

  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    revealItems.forEach(reveal);
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      reveal(entry.target);
      observer.unobserve(entry.target);
    });
  }, {
    rootMargin: "0px 0px -12% 0px",
    threshold: 0.16
  });

  revealItems.forEach(function (item) {
    observer.observe(item);
  });
})();
