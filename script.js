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

/* A progressive, reversible Discover → Host study. All copy and controls exist
   in ordinary document flow before enhancement. No wheel/touch interception. */
(function () {
  var sequence = document.querySelector('[data-motion-sequence]');
  if (!sequence || !window.requestAnimationFrame || !window.matchMedia) return;
  var discover = sequence.querySelector('#discover');
  var host = sequence.querySelector('#host');
  var discoverStage = sequence.querySelector('[data-discover-stage]');
  var hostStage = sequence.querySelector('.feature-stage-host');
  if (!discover || !host || !discoverStage || !hostStage) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var desktop = window.matchMedia('(min-width: 981px) and (min-height: 700px)');
  var rail = document.createElement('div');
  rail.className = 'motion-rail';
  var canvas = document.createElement('div');
  canvas.className = 'motion-canvas';
  rail.appendChild(canvas);
  sequence.appendChild(rail);
  var frame = 0;
  var mode = '';
  var geometry = null;
  var oldProgress = -1;
  var flyer = hostStage.querySelector('[data-feature-card="flyer"]');
  var hostAvailable = true;
  var clamp = function (n) { return Math.max(0, Math.min(1, n)); };
  var smooth = function (start, end, n) {
    var t = clamp((n - start) / (end - start));
    return t * t * (3 - 2 * t);
  };
  function set(name, value) { canvas.style.setProperty(name, value); }
  function exposeHost(available) {
    if (available === hostAvailable) return;
    hostAvailable = available;
    hostStage.inert = !available;
    if (available) hostStage.removeAttribute('aria-hidden');
    else hostStage.setAttribute('aria-hidden', 'true');
  }
  function measure() {
    // Layout reads happen on setup/resize, never once per moving fragment.
    var scroll = window.scrollY;
    var bounds = sequence.getBoundingClientRect();
    var d = discoverStage.getBoundingClientRect();
    var h = hostStage.getBoundingClientRect();
    var copyA = discover.querySelector('.product-chapter-copy').getBoundingClientRect();
    var copyB = host.querySelector('.product-chapter-copy').getBoundingClientRect();
    geometry = {
      top: bounds.top + scroll,
      end: bounds.bottom + scroll,
      start: copyA.top + scroll + copyA.height * .5 - window.innerHeight * .5,
      finish: copyB.top + scroll + copyB.height * .5 - window.innerHeight * .5,
      discoverTop: d.top + scroll,
      discoverHeight: d.height,
      hostTop: h.top + scroll,
      hostHeight: h.height,
      view: window.innerHeight
    };
    oldProgress = -1;
    requestPaint();
  }
  function setup() {
    var next = reduced.matches ? 'static' : desktop.matches ? 'desktop' : 'inline';
    if (next !== mode) {
      mode = next;
      sequence.classList.remove('is-motion-ready', 'is-motion-inline');
      discover.appendChild(discoverStage);
      host.appendChild(hostStage);
      canvas.removeAttribute('style');
      sequence.removeAttribute('style');
      exposeHost(true);
      if (flyer) { flyer.removeAttribute('tabindex'); flyer.inert = false; }
      if (mode === 'desktop') {
        canvas.appendChild(discoverStage);
        canvas.appendChild(hostStage);
        sequence.classList.add('is-motion-ready');
      } else if (mode === 'inline') {
        sequence.classList.add('is-motion-inline');
      }
    }
    measure();
  }
  function paint() {
    frame = 0;
    if (!geometry || mode === 'static' || document.hidden) return;
    var y = window.scrollY;
    if (y + geometry.view < geometry.top - 150 || y > geometry.end + 150) {
      canvas.classList.remove('is-in-view');
      return;
    }
    if (mode === 'inline') {
      var d = clamp((y + geometry.view - geometry.discoverTop) / (geometry.view + geometry.discoverHeight));
      var h = clamp((y + geometry.view - geometry.hostTop) / (geometry.view + geometry.hostHeight));
      sequence.style.setProperty('--inline-map-y', ((.5 - d) * 32).toFixed(2) + 'px');
      sequence.style.setProperty('--inline-map-scale', (.96 + d * .04).toFixed(4));
      sequence.style.setProperty('--inline-meet-y', ((.5 - d) * -24).toFixed(2) + 'px');
      sequence.style.setProperty('--inline-meet-scale', (.97 + d * .05).toFixed(4));
      sequence.style.setProperty('--inline-host-y', ((.5 - h) * 22).toFixed(2) + 'px');
      return;
    }
    canvas.classList.add('is-in-view');
    var progress = clamp((y - geometry.start) / Math.max(1, geometry.finish - geometry.start));
    if (Math.abs(progress - oldProgress) < .0001) return;
    oldProgress = progress;
    var gather = smooth(.05, .55, progress);
    var morph = smooth(.28, .78, progress);
    var transfer = smooth(.36, .6, progress);
    var support = smooth(.64, .95, progress);
    set('--map-x', (gather * -42).toFixed(2) + 'px');
    set('--map-y', (gather * 45).toFixed(2) + 'px');
    set('--map-scale', (1 - gather * .16).toFixed(4));
    set('--map-opacity', (1 - smooth(.1, .48, progress)).toFixed(4));
    set('--meet-x', (morph * -20).toFixed(2) + 'px');
    set('--meet-y', (morph * -100).toFixed(2) + 'px');
    set('--meet-scale', (1 - morph * .22).toFixed(4));
    set('--meet-opacity', (1 - transfer).toFixed(4));
    set('--host-x', ((1 - morph) * 24).toFixed(2) + 'px');
    set('--host-y', ((1 - morph) * 38).toFixed(2) + 'px');
    set('--host-scale', (1.11 - morph * .11).toFixed(4));
    set('--host-crop', ((1 - morph) * 27).toFixed(3) + '%');
    set('--host-opacity', transfer.toFixed(4));
    set('--flyer-x', ((1 - support) * -32).toFixed(2) + 'px');
    set('--flyer-y', ((1 - support) * 24).toFixed(2) + 'px');
    set('--flyer-scale', (.93 + support * .07).toFixed(4));
    set('--flyer-opacity', support.toFixed(4));
    // Hidden previews never enter the keyboard sequence or accessibility tree.
    exposeHost(progress >= .58);
    if (flyer) {
      flyer.tabIndex = support > .8 ? 0 : -1;
      flyer.inert = support < .15;
    }
  }
  function requestPaint() {
    if (!frame) frame = window.requestAnimationFrame(paint);
  }
  window.addEventListener('scroll', requestPaint, {passive: true});
  var resizeFrame = 0;
  window.addEventListener('resize', function () {
    if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(function () { resizeFrame = 0; setup(); });
  }, {passive: true});
  var listen = function (query) {
    if (query.addEventListener) query.addEventListener('change', setup);
    else if (query.addListener) query.addListener(setup);
  };
  listen(reduced);
  listen(desktop);
  document.addEventListener('visibilitychange', requestPaint);
  window.addEventListener('pageshow', setup);
  window.addEventListener('load', measure, {once: true});
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  setup();
}());
