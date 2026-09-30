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
    if (productStage.classList.contains('is-mobile-controlled')) return;
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
    if (productStage.classList.contains('is-mobile-controlled')) return;
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
  var copies = chapters.map(function (chapter) { return chapter.querySelector('.product-chapter-copy'); });
  var mobileRail = rail('mobile');
  var mobileStory = document.createElement('div'); mobileStory.className = 'motion-mobile-story';
  var mobileCopy = document.createElement('div'); mobileCopy.className = 'motion-mobile-copy';
  mobileStory.appendChild(mobileCopy); mobileStory.appendChild(mobileRail.canvas);
  mobileRail.element.appendChild(mobileStory); sequence.appendChild(mobileRail.element);
  var mobileAssetsReady=stages.map(function(){return false;}),mobileAssetsRequested=[];
  function warmMobileStage(index){
    if(index<0||index>=stages.length||mobileAssetsRequested[index])return;
    mobileAssetsRequested[index]=true;
    var images=Array.prototype.slice.call(stages[index].querySelectorAll('img'));
    Promise.all(images.map(function(img){
      img.loading='eager';
      if(img.decode)return img.decode().catch(function(){});
      if(img.complete)return Promise.resolve();
      return new Promise(function(resolve){img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});});
    })).then(function(){mobileAssetsReady[index]=true;mobileRail.progress=-1;requestPaint();});
  }

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
      var copyHeight = Math.ceil(Math.max.apply(null, copies.map(function (copy) { return copy.offsetHeight; })));
      mobileStory.style.setProperty('--mobile-copy-height', copyHeight + 'px');
      var rect = mobileRail.element.getBoundingClientRect(), storyHeight = mobileStory.offsetHeight;
      var step = Math.max(340, window.innerHeight * .48);
      mobileRail.element.style.height = (storyHeight + step * (stages.length - 1)) + 'px';
      geometry.centers = stages.map(function (_, i) { return rect.top + y - 76 + i * step; });
      geometry.bottom = rect.top + y + storyHeight + step * (stages.length - 1);
      mobileRail.progress = -1;

    }
    requestPaint();
  }
  function setup() {
    var next = reduced.matches || keyboardMode ? 'static' : desktop.matches ? 'desktop' : mobile.matches ? 'mobile' : 'static';
    if (next !== mode) {
      mode = next;
      sequence.classList.remove('is-motion-ready', 'is-motion-mobile');
      copies.forEach(function (copy, index) {
        chapters[index].insertBefore(copy, chapters[index].firstChild);
        copy.removeAttribute('style');
      });
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
        copies.forEach(function (copy) { mobileCopy.appendChild(copy); });
        stages.forEach(function (stage) { mobileRail.canvas.appendChild(stage); accessible(stage, false); });
        sequence.classList.add('is-motion-mobile');
        warmMobileStage(0);warmMobileStage(1);
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
      var centers = geometry.centers, index = 0;
      while (index < centers.length - 2 && y >= centers[index + 1]) index++;
      warmMobileStage(index);warmMobileStage(index+1);warmMobileStage(index+2);
      while(index>0&&!mobileAssetsReady[index])index--;
      var progress = clamp((y - centers[index]) / Math.max(1, centers[index + 1] - centers[index]));
      if(!mobileAssetsReady[index+1])progress=Math.min(progress,.28);
      mobileRail.canvas.classList.toggle('is-in-view', y + geometry.view >= geometry.top && y <= geometry.bottom);
      if (index === mobileRail.index && Math.abs(progress - mobileRail.progress) < .0001) return;
      mobileRail.index = index; mobileRail.progress = progress;
      stages.forEach(function (stage, i) { if (i !== index && i !== index + 1) { visible(stage, false, false); accessible(stage, false); } });
      pair(stages[index], stages[index + 1], progress);
      copies.forEach(function (copy, i) {
        var opacity = i === index ? 1 - smooth(.34, .50, progress) : i === index + 1 ? smooth(.48, .65, progress) : 0;
        copy.style.opacity = opacity.toFixed(4);
        copy.style.transform = 'translate3d(0,' + (i === index ? -18 * (1 - opacity) : 18 * (1 - opacity)).toFixed(2) + 'px,0)';
        copy.style.pointerEvents = opacity > .8 ? 'auto' : 'none';
        copy.style.zIndex = opacity > .5 ? '2' : '1';
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
  function followChapterHash() {
    var index = ids.indexOf(window.location.hash.slice(1));
    if (mode === 'mobile' && geometry && index >= 0) window.scrollTo({top: geometry.centers[index], behavior: 'instant'});
  }
  window.addEventListener('hashchange', followChapterHash);
  window.addEventListener('load', followChapterHash, {once: true});
  document.addEventListener('idle:hero-layout', measure);
  window.addEventListener('load', measure, {once: true});
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  setup();
}());

/* Whole-card choreography. Decode/visibility gates only the decorative entrance,
   never the product message or actions. Scroll is native and geometry cached. */
(function () {
  var hero = document.querySelector('.hero-scene'), stage = hero && hero.querySelector('[data-product-stage]');
  if (!stage || !window.matchMedia || !window.requestAnimationFrame) return;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)'), wide = matchMedia('(min-width:981px) and (min-height:700px)');
  var cards = ['map','meet','profile'].map(function (name) { return stage.querySelector('.product-fragment-' + name); });
  var frame = 0, measureFrame = 0, geometry, keyboard = false, ready = false, inView = false, entered = false;
  var explicitSelection = false, mobilePose = null, lastPaintTime = 0, clickMeasureTimer = 0, selectionMotionUntil = 0;
  var narrow = matchMedia('(max-width:980px)'), mobileLayout = false;
  var indexSection = document.querySelector('.product-index');
  var afterword = document.createElement('section'); afterword.className='site-shell mobile-afterword'; afterword.hidden=true;
  indexSection.parentNode.insertBefore(afterword,indexSection.nextSibling);
  var relocated = [indexSection.querySelector('.editorial-header'),hero.querySelector('.hero-body'),hero.querySelector('.button-secondary'),hero.querySelector('.platform-note'),document.querySelector('.home-proof-band')].map(function(node){
    var anchor=document.createComment('Original content position');node.parentNode.insertBefore(anchor,node);return{node:node,anchor:anchor};
  });
  var placeholder=document.createElement('div');placeholder.className='hero-stage-placeholder';placeholder.setAttribute('aria-hidden','true');stage.parentNode.insertBefore(placeholder,stage);
  function arrangeMobileLayout(){
    if(mobileLayout===narrow.matches)return;
    mobileLayout=narrow.matches; afterword.hidden=!mobileLayout;
    relocated.forEach(function(item){if(mobileLayout)afterword.appendChild(item.node);else item.anchor.parentNode.insertBefore(item.node,item.anchor.nextSibling);});
    document.body.classList.toggle('has-mobile-summary',mobileLayout);
  }
  function mobileCarryGeometry(sr,discover,canvas){
    var saved=discover.getAttribute('style');discover.removeAttribute('style');
    var cr=canvas.getBoundingClientRect();
    var targets=['map','meet'].map(function(name){var r=discover.querySelector('.discover-fragment-'+name+' img').getBoundingClientRect();return{x:r.left,y:r.top,w:r.width,h:r.height};});
    if(saved===null)discover.removeAttribute('style');else discover.setAttribute('style',saved);
    var savedCards=cards.map(function(card){return card.getAttribute('style');});resetCards();
    var factors=[[-.268,-.152,1.508,1086/1448],[-.209,-.263,1.398,1024/1536],[-.155,-.353,1.29,900/1748]];
    var bases=cards.map(function(card,i){var r=card.getBoundingClientRect(),f=factors[i],w=r.width*f[2];return{x:r.left+r.width*f[0],y:r.top+r.height*f[1],w:w,h:w*f[3],cx:r.left+r.width/2,cy:r.top+r.height/2};});
    cards.forEach(function(card,i){if(savedCards[i]===null)card.removeAttribute('style');else card.setAttribute('style',savedCards[i]);});
    var poses=targets.map(function(t,i){var b=bases[i],scale=t.w/b.w;return[t.x-b.x-(b.x-b.cx)*(scale-1),t.y-b.y-(b.y-b.cy)*(scale-1),scale,1];});
    var rail=canvas.closest('.motion-rail-mobile'),end=rail.getBoundingClientRect().top+scrollY-76;
    var cta=hero.querySelector('.button-primary').getBoundingClientRect();
    return{mobile:true,carry:true,stage:sr,start:0,end:Math.max(200,end),dockY:Math.max(92,Math.min(cr.top,innerHeight-sr.h-16)),targets:poses,discover:discover,copyStart:Math.max(70,cta.bottom+scrollY-70)};
  }

  var clamp = function (n) { return Math.max(0, Math.min(1, n)); };
  var ease = function (n) { n = clamp(n); return n*n*(3-2*n); };
  var mix = function (a,b,p) { return a+(b-a)*p; };
  cards.forEach(function (card) {
    var plane = document.createElement('span'); plane.className = 'hero-plane';
    plane.appendChild(card.querySelector('picture')); card.appendChild(plane);
  });
  function entrance() {
    if (!ready || !inView || entered || reduced.matches || keyboard || (narrow.matches && innerHeight>=600)) return;
    entered = true; stage.classList.add('is-hero-entering');
    setTimeout(function () { stage.classList.remove('is-hero-entering'); }, 1050);
  }
  Promise.all(cards.map(function (card) {
    var img = card.querySelector('img'); return img.decode ? img.decode().catch(function(){}) : Promise.resolve();
  })).then(function () { ready = true; entrance(); measureSoon(); });
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) { inView = entries[0].isIntersecting; entrance(); }, {threshold:.2}); observer.observe(stage);
  } else { inView = true; entrance(); }
  var transfer = document.createElement('div'); transfer.className = 'hero-transfer'; transfer.inert = true; transfer.setAttribute('aria-hidden','true'); document.body.appendChild(transfer);
  var copies = cards.map(function(card) {
    var picture = card.querySelector('picture').cloneNode(true), img = picture.querySelector('img');
    img.removeAttribute('fetchpriority'); transfer.appendChild(picture); return img;
  });
  function rect(el) { var r=el.getBoundingClientRect(); return {x:r.left,y:r.top+scrollY,w:r.width,h:r.height}; }
  function restore() {
    transfer.classList.remove('is-visible'); stage.style.visibility='';
    var d=document.querySelector('[data-discover-stage]'); if(d)d.style.visibility='';
  }
  function resetCards() { cards.forEach(function(card) { ['--scene-x','--scene-y','--scene-scale','--scene-opacity'].forEach(function(p){card.style.removeProperty(p);}); card.style.removeProperty('z-index'); card.inert=false; }); }
  function measure() {
    arrangeMobileLayout();
    var enabled = wide.matches && !reduced.matches && !keyboard;
    var mobileSequence=document.querySelector('.motion-sequence.is-motion-mobile');
    var carrying=narrow.matches && innerHeight>=600 && !reduced.matches && !keyboard && !!mobileSequence;
    restore(); stage.inert=false; stage.removeAttribute('aria-hidden');
    document.body.classList.toggle('has-mobile-handoff',carrying);
    document.body.classList.toggle('is-mobile-hero-bridge',carrying);
    stage.classList.toggle('is-mobile-controlled', !wide.matches);
    if(carrying){
      var pr=placeholder.getBoundingClientRect(),qr=mobileSequence.getBoundingClientRect();
      stage.style.setProperty('--carry-left',pr.left+'px');stage.style.setProperty('--carry-width',pr.width+'px');stage.style.setProperty('--carry-height',pr.height+'px');
      document.body.style.setProperty('--mobile-story-left',qr.left+'px');document.body.style.setProperty('--mobile-story-width',qr.width+'px');
    }else{['--carry-left','--carry-width','--carry-height'].forEach(function(name){stage.style.removeProperty(name);});}

    if (wide.matches) { resetCards(); mobilePose = null; }
    document.body.classList.toggle('has-hero-transfer',enabled);
    document.dispatchEvent(new Event('idle:hero-layout'));
    var sr=rect(carrying?placeholder:stage);
    if(!wide.matches) {
      var md=document.querySelector('[data-discover-stage]'),mc=md&&md.closest('.motion-rail-mobile .motion-canvas');
      geometry=carrying&&mc?mobileCarryGeometry(sr,md,mc):{mobile:true,stage:sr,start:Math.max(0,sr.y-innerHeight*.62)};
      if(frame)cancelAnimationFrame(frame);frame=0;paint();return;
    }
    if(reduced.matches || keyboard) { geometry=null; return; }
    var discover=document.querySelector('[data-discover-stage]'),canvas=discover&&discover.closest('.motion-canvas');
    if(!canvas){geometry=null;return;}
    var top=parseFloat(getComputedStyle(canvas).top)||96, saved=discover.getAttribute('style'); discover.removeAttribute('style');
    var cr=rect(canvas),rr=rect(canvas.parentElement);
    var targets=['map','meet'].map(function(name){var r=rect(discover.querySelector('.discover-fragment-'+name+' img'));return{x:r.x,y:r.y-cr.y+top,w:r.w,h:r.h};});
    if(saved===null)discover.removeAttribute('style');else discover.setAttribute('style',saved);
    var f=[[-.268,-.152,1.508,1086/1448],[-.209,-.263,1.398,1024/1536],[-.155,-.353,1.29,900/1748]];
    var sources=cards.map(function(card,i){var r=rect(card),w=r.w*f[i][2];return{x:r.x+r.w*f[i][0],y:r.y+r.h*f[i][1],w:w,h:w*f[i][3]};});
    geometry={start:Math.max(0,sr.y-top),end:rr.y-top,sources:sources,targets:targets,discover:discover,layers:cards.map(function(c){return getComputedStyle(c).zIndex;})};
    copies.forEach(function(img,i){img.style.width=sources[i].w+'px';img.style.height=sources[i].h+'px';}); requestPaint();
  }
  function measureSoon(){if(measureFrame)cancelAnimationFrame(measureFrame);measureFrame=requestAnimationFrame(function(){measureFrame=requestAnimationFrame(function(){measureFrame=0;measure();});});}
  function paint(timestamp){
    frame=0;if(!geometry||document.hidden)return;
    var y=scrollY;
    if(geometry.mobile){
      var p=reduced.matches || keyboard ? 0 : geometry.carry?clamp(y/geometry.end):clamp((y-geometry.start)/Math.max(260,geometry.stage.h*.9));
      var open=geometry.carry?0:ease((p-.03)/.30)*(1-ease((p-.64)/.32));
      var phone=innerWidth<601, w=geometry.stage.w, h=geometry.stage.h;
      var selected=stage.getAttribute('data-active-card') || 'meet';
      var values=[[-(phone?38:72)*open,(phone?66:90)*open,1+.20*open,1],[0,w*.28*open,1-.22*open,1-.10*open],[0,48*open,1-.08*open,1-ease(open/.75)]];
      var layers=[open>.3?6:1,4,2];
      if(explicitSelection){
        if(selected==='map'){values=[[-w*.16,h*.14,1.24,1],[-w*.02,h*.22,.8,.55],[0,0,.9,.4]];layers=[6,3,2];}
        else if(selected==='profile'){values=[[0,0,.94,.4],[0,h*.15,.78,.55],[0,-h*.38,1.15,1]];layers=[2,3,6];}
        else {values=[[0,0,.98,.7],[0,0,1,1],[0,0,1,.8]];layers=[2,6,3];}
      }
      if(geometry.carry){
        var bridging=y<geometry.end;
        document.body.classList.toggle('is-mobile-hero-bridge',bridging);
        document.body.style.setProperty('--bridge-copy-opacity',ease((y-geometry.copyStart)/90).toFixed(4));
        document.body.style.setProperty('--bridge-copy-visibility',y>geometry.copyStart?'visible':'hidden');
        stage.style.visibility=bridging?'':'hidden';stage.inert=!bridging||p>.35;
        if(stage.inert)stage.setAttribute('aria-hidden','true');else stage.removeAttribute('aria-hidden');
        geometry.discover.style.visibility=bridging?'hidden':'';
        var stageY=mix(geometry.stage.y,geometry.dockY,ease(y/Math.min(220,geometry.end*.4)));
        var settle=ease((p-.35)/.25),dock=ease((p-.60)/.40);
        values=values.map(function(v,i){
          var x=mix(v[0],0,settle),localY=mix(v[1],0,settle),scale=mix(v[2],1,settle),opacity=mix(v[3],1,settle);
          if(i<2){var t=geometry.targets[i];return[mix(x,t[0],dock),mix(stageY+localY,t[1],dock),mix(scale,t[2],dock),mix(opacity,1,dock)];}
          return[x,stageY+localY,scale,opacity*(1-dock)];
        });
        if(settle>.99)layers=[1,4,2];
      }
      var now=timestamp||performance.now();
      var instant=reduced.matches || keyboard || !mobilePose || (geometry.carry && (!bridging || p>.6 || now>selectionMotionUntil));
      var dt=lastPaintTime && timestamp ? Math.min(64,Math.max(1,timestamp-lastPaintTime)) : 16.7;
      lastPaintTime=timestamp || 0;
      var amount=instant?1:1-Math.exp(-dt/65), unsettled=false;
      if(!mobilePose)mobilePose=values.map(function(v){return v.slice();});
      cards.forEach(function(card,i){
        var v=values[i],pose=mobilePose[i];
        pose.forEach(function(n,j){pose[j]=mix(n,v[j],amount);if(Math.abs(pose[j]-v[j])>(j<2?.05:.0005))unsettled=true;else pose[j]=v[j];});
        card.style.setProperty('--scene-x',pose[0].toFixed(2)+'px');card.style.setProperty('--scene-y',pose[1].toFixed(2)+'px');
        card.style.setProperty('--scene-scale',pose[2].toFixed(4));card.style.setProperty('--scene-opacity',pose[3].toFixed(4));
        card.style.zIndex=String(layers[i]);card.inert=pose[3]<.05 && !(explicitSelection && card.getAttribute('data-product-card')===selected);
      });
      if(unsettled)requestPaint();return;
    }

    if(y<=geometry.start||y>=geometry.end){restore();return;}
    var p=clamp((y-geometry.start)/Math.max(1,geometry.end-geometry.start)),travel=ease(p),open=ease((p-.03)/.27)*(1-ease((p-.63)/.32));
    stage.style.visibility='hidden';geometry.discover.style.visibility='hidden';transfer.classList.add('is-visible');
    copies.forEach(function(img,i){
      var s=geometry.sources[i],t=geometry.targets[Math.min(i,1)],scale=i===2?1-.1*travel:mix(1,t.w/s.w,travel),x=i===2?s.x:mix(s.x,t.x,travel),posY=i===2?s.y-geometry.start:mix(s.y-geometry.start,t.y,travel);
      if(i===0){x-=90*open;posY-=40*open;scale*=1+.20*open;}if(i===1){posY+=200*open;scale*=1-.22*open;}
      if(i===2)posY+=70*travel;
      img.style.transform='translate3d('+x.toFixed(2)+'px,'+posY.toFixed(2)+'px,0) scale('+scale.toFixed(4)+')';
      img.style.opacity=i===2?(1-ease(p/.25)).toFixed(4):i===1?(1-.10*open).toFixed(4):'1';
      img.style.zIndex=String(p<.02?geometry.layers[i]:i===0&&open>.3?6:i===1?4:2);
    });
  }
  function requestPaint(){if(!frame)frame=requestAnimationFrame(paint);}
  addEventListener('scroll',requestPaint,{passive:true});addEventListener('resize',measureSoon,{passive:true});addEventListener('load',measureSoon,{once:true});addEventListener('pageshow',measureSoon);
  [wide,reduced,narrow].forEach(function(q){if(q.addEventListener)q.addEventListener('change',measureSoon);else q.addListener(measureSoon);});
  document.addEventListener('keydown',function(e){if(e.key==='Tab'&&!keyboard){keyboard=true;stage.classList.remove('is-hero-entering');measure();}});
  stage.addEventListener('pointerdown',function(){if(wide.matches)stage.classList.remove('is-hero-entering');});
  stage.addEventListener('click',function(){
    if(!wide.matches){
      explicitSelection=true; selectionMotionUntil=performance.now()+400; requestPaint();
    } else {
      clearTimeout(clickMeasureTimer); clickMeasureTimer=setTimeout(measureSoon,680);
    }
  });
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(measureSoon);measureSoon();
}());
