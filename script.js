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
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: "0px 0px -12% 0px",
      threshold: 0.08
    });

    revealItems.forEach(function (item) {
      observer.observe(item);
    });
  }

  var productStage = document.querySelector("[data-product-stage]");
  var discoverStage = document.querySelector("[data-discover-stage]");

  function attachPointerParallax(stage, fragmentSelector, xDistance, yDistance) {
    if (!stage || reduceMotion.matches || !window.matchMedia("(pointer: fine)").matches) return;

    var stageFragments = Array.prototype.slice.call(stage.querySelectorAll(fragmentSelector));
    var stageFrame = 0;
    var targetStageX = 0;
    var targetStageY = 0;
    var currentStageX = 0;
    var currentStageY = 0;

    function paint() {
      currentStageX += (targetStageX - currentStageX) * 0.12;
      currentStageY += (targetStageY - currentStageY) * 0.12;
      stageFragments.forEach(function (fragment) {
        var depth = Number(fragment.getAttribute("data-depth")) || 1;
        fragment.style.setProperty("--fragment-x", (currentStageX * xDistance * depth).toFixed(2) + "px");
        fragment.style.setProperty("--fragment-y", (currentStageY * yDistance * depth).toFixed(2) + "px");
      });

      if (Math.abs(targetStageX - currentStageX) > 0.002 || Math.abs(targetStageY - currentStageY) > 0.002) {
        stageFrame = window.requestAnimationFrame(paint);
      } else {
        stageFrame = 0;
      }
    }

    function requestStagePaint() {
      if (!stageFrame) stageFrame = window.requestAnimationFrame(paint);
    }

    stage.addEventListener("pointermove", function (event) {
      var bounds = stage.getBoundingClientRect();
      targetStageX = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2));
      targetStageY = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2));
      stage.classList.add("is-active");
      requestStagePaint();
    }, { passive: true });

    stage.addEventListener("pointerleave", function () {
      targetStageX = 0;
      targetStageY = 0;
      stage.classList.remove("is-active");
      requestStagePaint();
    }, { passive: true });

    if (!stageFragments.length) stage.classList.remove("is-active");
  }

  attachPointerParallax(discoverStage, "[data-discover-fragment]", 12, 8);

  var featureStages = Array.prototype.slice.call(document.querySelectorAll("[data-feature-stage]"));

  featureStages.forEach(function (stage) {
    var stageFragments = Array.prototype.slice.call(stage.querySelectorAll("[data-feature-fragment]"));
    var stageStatus = stage.querySelector("[data-feature-status]");
    var activeFeatureCard = stage.getAttribute("data-active-card") || (stageFragments[0] && stageFragments[0].getAttribute("data-feature-card"));
    var stagePressTimer = 0;

    function showFeatureCard(cardName, shouldAnnounce) {
      var card = stageFragments.find(function (fragment) {
        return fragment.getAttribute("data-feature-card") === cardName;
      });
      if (!card) return;

      activeFeatureCard = cardName;
      stage.setAttribute("data-active-card", cardName);

      stageFragments.forEach(function (fragment) {
        var isSelected = fragment === card;
        fragment.classList.toggle("is-selected", isSelected);
        fragment.setAttribute("aria-pressed", String(isSelected));
      });

      if (stageStatus && shouldAnnounce) {
        stageStatus.textContent = (card.getAttribute("data-card-label") || "Feature") + " preview selected.";
      }
    }

    stageFragments.forEach(function (fragment, index) {
      fragment.addEventListener("click", function () {
        var cardName = fragment.getAttribute("data-feature-card");

        if (cardName === activeFeatureCard && stageFragments.length > 1) {
          cardName = stageFragments[(index + 1) % stageFragments.length].getAttribute("data-feature-card");
        }

        showFeatureCard(cardName, true);
      });
    });

    stage.addEventListener("pointerdown", function () {
      window.clearTimeout(stagePressTimer);
      stage.classList.add("is-pressed");
      stagePressTimer = window.setTimeout(function () {
        stage.classList.remove("is-pressed");
      }, 180);
    }, { passive: true });

    stage.addEventListener("pointercancel", function () {
      stage.classList.remove("is-pressed");
    }, { passive: true });

    attachPointerParallax(stage, "[data-feature-fragment]", 11, 8);
    showFeatureCard(activeFeatureCard, false);
  });

  if (!productStage) return;

  var fragments = Array.prototype.slice.call(productStage.querySelectorAll("[data-product-fragment]"));
  var productStatus = productStage.querySelector("[data-product-status]");
  var cardOrder = ["meet", "profile", "map"];
  var activeCard = productStage.getAttribute("data-active-card") || cardOrder[0];
  var cycleTimer = 0;

  function showCard(cardName, shouldAnnounce) {
    var card = fragments.find(function (fragment) {
      return fragment.getAttribute("data-product-card") === cardName;
    });
    if (!card) return;

    activeCard = cardName;
    productStage.setAttribute("data-active-card", cardName);
    productStage.classList.add("is-cycling");

    fragments.forEach(function (fragment) {
      var isActive = fragment === card;
      fragment.setAttribute("aria-pressed", String(isActive));
    });

    if (productStatus && shouldAnnounce) {
      productStatus.textContent = (card.getAttribute("data-card-label") || "Product") + " preview selected.";
    }

    window.clearTimeout(cycleTimer);
    cycleTimer = window.setTimeout(function () {
      productStage.classList.remove("is-cycling");
    }, reduceMotion.matches ? 0 : 660);
  }

  fragments.forEach(function (fragment) {
    fragment.addEventListener("click", function () {
      var cardName = fragment.getAttribute("data-product-card");
      var nextCard = cardName;

      if (cardName === activeCard) {
        var activeIndex = cardOrder.indexOf(activeCard);
        nextCard = cardOrder[(activeIndex + 1) % cardOrder.length];
      }

      showCard(nextCard, true);
    });
  });

  showCard(activeCard, false);

  if (reduceMotion.matches) return;

  var finePointer = window.matchMedia("(pointer: fine)");
  var targetX = 0;
  var targetY = 0;
  var currentX = 0;
  var currentY = 0;
  var frame = 0;
  var pressTimer = 0;

  function paintStage() {
    currentX += (targetX - currentX) * 0.14;
    currentY += (targetY - currentY) * 0.14;

    fragments.forEach(function (fragment) {
      var depth = Number(fragment.getAttribute("data-depth")) || 1;
      fragment.style.setProperty("--move-x", (currentX * 11 * depth).toFixed(2) + "px");
      fragment.style.setProperty("--move-y", (currentY * 8 * depth).toFixed(2) + "px");
      fragment.style.setProperty("--tilt-x", (-currentY * 1.15 * depth).toFixed(2) + "deg");
      fragment.style.setProperty("--tilt-y", (currentX * 1.55 * depth).toFixed(2) + "deg");
    });

    if (Math.abs(targetX - currentX) > 0.002 || Math.abs(targetY - currentY) > 0.002) {
      frame = window.requestAnimationFrame(paintStage);
    } else {
      frame = 0;
    }
  }

  function requestPaint() {
    if (!frame) frame = window.requestAnimationFrame(paintStage);
  }

  function updatePointer(event) {
    var bounds = productStage.getBoundingClientRect();
    targetX = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2));
    targetY = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2));
    productStage.classList.add("is-active");
    requestPaint();
  }

  function settleStage() {
    targetX = 0;
    targetY = 0;
    productStage.classList.remove("is-active");
    requestPaint();
  }

  function pressStage(event) {
    window.clearTimeout(pressTimer);
    productStage.classList.add("is-pressed");
    if (!finePointer.matches) updatePointer(event);
    pressTimer = window.setTimeout(function () {
      productStage.classList.remove("is-pressed");
      if (!finePointer.matches) settleStage();
    }, 180);
  }

  if (finePointer.matches) {
    productStage.addEventListener("pointermove", updatePointer, { passive: true });
    productStage.addEventListener("pointerleave", settleStage, { passive: true });
  }

  productStage.addEventListener("pointerdown", pressStage, { passive: true });
  productStage.addEventListener("pointercancel", settleStage, { passive: true });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) settleStage();
  });
})();
