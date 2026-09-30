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

/* Progressive shared geometry across Discover, Host, Garage, Connections, Groups.
   Geometry is cached on resize. Scroll never intercepts wheel/touch or reads layout. */
(function () {
  var sequence = document.querySelector('[data-motion-sequence]');
  if (!sequence || !window.requestAnimationFrame || !window.matchMedia) return;
  var ids = ['discover', 'host', 'garage', 'connections', 'groups'];
  var chapters = ids.map(function (id) { return sequence.querySelector('#' + id); });
  if (chapters.some(function (chapter) { return !chapter; })) return;
  var stages = chapters.map(function (chapter) {
    return chapter.querySelector('[data-discover-stage], [data-feature-stage]');
  });
  if (stages.some(function (stage) { return !stage; })) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var desktop = window.matchMedia('(min-width: 981px) and (min-height: 700px)');
  var mobile = window.matchMedia('(max-width: 980px) and (min-height: 600px)');
  var mode = '', frame = 0, resizeFrame = 0, geometry, keyboardMode = false;
  var clamp = function (n) { return Math.max(0, Math.min(1, n)); };
  var smooth = function (start, end, n) {
    var t = clamp((n - start) / (end - start));
    return t * t * (3 - 2 * t);
  };
  function rail(type) {
    var element = document.createElement('div');
    element.className = 'motion-rail motion-rail-' + type;
    var canvas = document.createElement('div');
    canvas.className = 'motion-canvas';
    element.appendChild(canvas);
    return {element: element, canvas: canvas, progress: -1, index: -1};
  }
  stages.forEach(function (stage, index) {
    stage.classList.add('motion-visual');
    var primary = index === 0 ? stage.querySelector('.discover-fragment-meet') : stage.querySelector('.is-selected');
    if (!primary) primary = stage.querySelector('[data-feature-fragment]');
    var fragments = stage.querySelectorAll('[data-discover-fragment], [data-feature-fragment]');
    Array.prototype.forEach.call(fragments, function (fragment) {
      fragment.classList.add(fragment === primary ? 'motion-primary' : 'motion-secondary');
    });
  });
  var desktopRail = rail('desktop');
  sequence.appendChild(desktopRail.element);
  var mobileRails = stages.slice(1).map(function (incoming, index) {
    var item = rail('mobile');
    item.from = index === 0 ? stages[0] : stages[index].cloneNode(true);
    item.to = incoming;
    if (index > 0) {
      item.from.classList.add('is-decoration');
      item.from.setAttribute('aria-hidden', 'true');
      item.from.inert = true;
      Array.prototype.forEach.call(item.from.querySelectorAll('[aria-live]'), function (el) { el.removeAttribute('aria-live'); });
      Array.prototype.forEach.call(item.from.querySelectorAll('button'), function (el) { el.tabIndex = -1; });
      // Keep the next handover consistent with any preview the visitor selected.
      stages[index].addEventListener('click', function () {
        item.from.setAttribute('data-active-card', stages[index].getAttribute('data-active-card'));
        var originals = stages[index].querySelectorAll('[data-feature-fragment]');
        Array.prototype.forEach.call(item.from.querySelectorAll('[data-feature-fragment]'), function (copy, i) {
          copy.classList.toggle('is-selected', originals[i].classList.contains('is-selected'));
          copy.setAttribute('aria-pressed', originals[i].getAttribute('aria-pressed'));
        });
      });
    }
    sequence.insertBefore(item.element, chapters[index + 1]);
    return item;
  });
  function accessible(stage, enabled) {
    if (stage.classList.contains('is-decoration')) return;
    stage.inert = !enabled;
    if (enabled) stage.removeAttribute('aria-hidden');
    else stage.setAttribute('aria-hidden', 'true');
  }
  function visible(stage, show, incoming) {
    stage.classList.toggle('is-visible', show);
    stage.classList.toggle('is-incoming', show && incoming);
    stage.classList.toggle('is-outgoing', show && !incoming);
  }
  function property(stage, name, value) { stage.style.setProperty('--' + name, value); }
  function pair(outgoing, incoming, progress) {
    var gather = smooth(.05, .55, progress);
    var morph = smooth(.28, .78, progress);
    var transfer = smooth(.4, .62, progress);
    var unfold = smooth(.32, .78, progress);
    var support = smooth(.64, .95, progress);
    visible(outgoing, progress < 1, false);
    visible(incoming, progress > 0, true);
    property(outgoing, 'primary-x', (-20 * morph).toFixed(2) + 'px');
    property(outgoing, 'primary-y', (-100 * morph).toFixed(2) + 'px');
    property(outgoing, 'primary-scale', (1 - morph * .22).toFixed(4));
    property(outgoing, 'primary-opacity', (1 - transfer).toFixed(4));
    property(outgoing, 'primary-crop', '0%');
    property(outgoing, 'secondary-x', (-42 * gather).toFixed(2) + 'px');
    property(outgoing, 'secondary-y', (45 * gather).toFixed(2) + 'px');
    property(outgoing, 'secondary-scale', (1 - gather * .16).toFixed(4));
    property(outgoing, 'secondary-opacity', (1 - smooth(.1, .48, progress)).toFixed(4));
    property(incoming, 'primary-x', (24 * (1 - morph)).toFixed(2) + 'px');
    property(incoming, 'primary-y', (138 * (1 - unfold)).toFixed(2) + 'px');
    property(incoming, 'primary-scale', (1.11 - morph * .11).toFixed(4));
    property(incoming, 'primary-crop', (100 * (1 - unfold)).toFixed(3) + '%');
    property(incoming, 'primary-opacity', '1');
    property(incoming, 'secondary-x', (-32 * (1 - support)).toFixed(2) + 'px');
    property(incoming, 'secondary-y', (24 * (1 - support)).toFixed(2) + 'px');
    property(incoming, 'secondary-scale', (.93 + support * .07).toFixed(4));
    property(incoming, 'secondary-opacity', support.toFixed(4));
    accessible(outgoing, progress < .4);
    accessible(incoming, progress >= .58);
    var secondary = incoming.querySelector('.motion-secondary');
    if (secondary && secondary.tagName === 'BUTTON') {
      secondary.inert = support < .15;
      secondary.tabIndex = support > .8 ? 0 : -1;
    }
    var outgoingSecondary = outgoing.querySelector('.motion-secondary');
    if (outgoingSecondary && outgoingSecondary.tagName === 'BUTTON') {
      outgoingSecondary.inert = progress >= .35;
      outgoingSecondary.tabIndex = progress < .35 ? 0 : -1;
    }
  }
  function measure() {
    var y = window.scrollY, bounds = sequence.getBoundingClientRect();
    geometry = {top: bounds.top + y, bottom: bounds.bottom + y, view: window.innerHeight};
    if (mode === 'desktop') {
      geometry.centers = chapters.map(function (chapter) {
        var rect = chapter.querySelector('.product-chapter-copy').getBoundingClientRect();
        return rect.top + y + rect.height / 2 - geometry.view / 2;
      });
      desktopRail.progress = -1;
    } else if (mode === 'mobile') {
      mobileRails.forEach(function (item) {
        var rect = item.element.getBoundingClientRect();
        item.start = rect.top + y - 82;
        item.end = item.start + rect.height - item.canvas.getBoundingClientRect().height;
        item.progress = -1;
      });
    }
    requestPaint();
  }
  function setup() {
    var next = reduced.matches || keyboardMode ? 'static' : desktop.matches ? 'desktop' : mobile.matches ? 'mobile' : 'static';
    if (next !== mode) {
      mode = next;
      sequence.classList.remove('is-motion-ready', 'is-motion-mobile');
      stages.forEach(function (stage, index) {
        chapters[index].appendChild(stage);
        stage.removeAttribute('style');
        visible(stage, false, false);
        accessible(stage, true);
        Array.prototype.forEach.call(stage.querySelectorAll('button'), function (button) {
          button.inert = false; button.removeAttribute('tabindex');
        });
      });
      if (mode === 'desktop') {
        stages.forEach(function (stage) { desktopRail.canvas.appendChild(stage); accessible(stage, false); });
        sequence.classList.add('is-motion-ready');
      } else if (mode === 'mobile') {
        mobileRails.forEach(function (item) {
          item.canvas.appendChild(item.from); item.canvas.appendChild(item.to);
          accessible(item.to, false);
        });
        sequence.classList.add('is-motion-mobile');
      }
    }
    measure();
  }
  function paint() {
    frame = 0;
    if (!geometry || mode === 'static' || document.hidden) return;
    var y = window.scrollY;
    if (mode === 'desktop') {
      var centers = geometry.centers, index = 0;
      while (index < centers.length - 2 && y >= centers[index + 1]) index++;
      var progress = clamp((y - centers[index]) / Math.max(1, centers[index + 1] - centers[index]));
      desktopRail.canvas.classList.toggle('is-in-view', y + geometry.view >= geometry.top && y <= geometry.bottom);
      if (index === desktopRail.index && Math.abs(progress - desktopRail.progress) < .0001) return;
      desktopRail.index = index; desktopRail.progress = progress;
      stages.forEach(function (stage, i) { if (i !== index && i !== index + 1) { visible(stage, false, false); accessible(stage, false); } });
      pair(stages[index], stages[index + 1], progress);
    } else {
      mobileRails.forEach(function (item) {
        var progress = clamp((y - item.start) / Math.max(1, item.end - item.start));
        item.canvas.classList.toggle('is-in-view', y + geometry.view >= item.start && y <= item.end + geometry.view);
        if (Math.abs(progress - item.progress) < .0001) return;
        item.progress = progress;
        pair(item.from, item.to, progress);
      });
    }
  }
  function requestPaint() { if (!frame) frame = window.requestAnimationFrame(paint); }
  window.addEventListener('scroll', requestPaint, {passive: true});
  window.addEventListener('resize', function () {
    if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(function () { resizeFrame = 0; setup(); });
  }, {passive: true});
  [reduced, desktop, mobile].forEach(function (query) {
    if (query.addEventListener) query.addEventListener('change', setup);
    else if (query.addListener) query.addListener(setup);
  });
  // Restore original DOM/control order before the browser performs Tab navigation.
  // Keep the static layout for the rest of this visit to avoid moving focus targets.
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Tab' && !keyboardMode) {
      keyboardMode = true;
      var focused = document.activeElement;
      setup();
      if (focused && focused !== document.body && focused.focus) focused.focus({preventScroll: true});
    }
  });
  document.addEventListener('visibilitychange', requestPaint);
  window.addEventListener('pageshow', setup);
  window.addEventListener('load', measure, {once: true});
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  setup();
}());
