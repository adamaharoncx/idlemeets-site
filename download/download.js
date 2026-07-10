(() => {
  const proof = document.querySelector("[data-app-store-proof]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (proof) {
    const layers = [...proof.querySelectorAll("[data-proof-layer]")];
    const state = { x: 0, y: 0, targetX: 0, targetY: 0, frame: 0 };

    const render = () => {
      state.x += (state.targetX - state.x) * 0.12;
      state.y += (state.targetY - state.y) * 0.12;

      layers.forEach((layer) => {
        const depth = Number(layer.dataset.depth) || 1;
        layer.style.setProperty("--proof-x", `${state.x * 13 * depth}px`);
        layer.style.setProperty("--proof-y", `${state.y * 10 * depth}px`);
        layer.style.setProperty("--proof-tilt-x", `${state.y * -2.4 * depth}deg`);
        layer.style.setProperty("--proof-tilt-y", `${state.x * 3.2 * depth}deg`);
      });

      if (Math.abs(state.targetX - state.x) > 0.002 || Math.abs(state.targetY - state.y) > 0.002) {
        state.frame = requestAnimationFrame(render);
      } else {
        state.frame = 0;
      }
    };

    const move = (event) => {
      if (reducedMotion.matches) return;

      const bounds = proof.getBoundingClientRect();
      state.targetX = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2));
      state.targetY = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2));
      proof.style.setProperty("--glow-x", `${50 + state.targetX * 20}%`);
      proof.style.setProperty("--glow-y", `${48 + state.targetY * 18}%`);
      proof.classList.add("is-active");

      if (!state.frame) state.frame = requestAnimationFrame(render);
    };

    const reset = () => {
      state.targetX = 0;
      state.targetY = 0;
      proof.style.setProperty("--glow-x", "56%");
      proof.style.setProperty("--glow-y", "48%");
      proof.classList.remove("is-active", "is-pressed");
      if (!state.frame) state.frame = requestAnimationFrame(render);
    };

    proof.addEventListener("pointermove", move);
    proof.addEventListener("pointerleave", reset);
    proof.addEventListener("pointerdown", () => proof.classList.add("is-pressed"));
    proof.addEventListener("pointerup", () => proof.classList.remove("is-pressed"));
    proof.addEventListener("pointercancel", reset);
    reducedMotion.addEventListener("change", reset);
  }

  const APP_ID = "6762639080";
  const CACHE_KEY = "idle-app-store-rating-v1";
  const CACHE_MAX_AGE = 6 * 60 * 60 * 1000;
  const CALLBACK_NAME = "__idleAppStoreLookup";
  const FALLBACK_RATING = 5;
  const FALLBACK_COUNT = 10;

  const readCache = () => {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (!cached || !Number.isFinite(cached.rating) || !Number.isFinite(cached.count)) return null;
      return cached;
    } catch {
      return null;
    }
  };

  const writeCache = (rating, count) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ rating, count, savedAt: Date.now() }));
    } catch {
      // The page still renders the live result when storage is unavailable.
    }
  };

  const updateSchema = (rating, count) => {
    const schema = document.querySelector("#idle-app-schema");
    if (!schema) return;

    try {
      const data = JSON.parse(schema.textContent);
      data.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: rating.toFixed(1),
        ratingCount: count,
        bestRating: "5",
        worstRating: "1"
      };
      schema.textContent = JSON.stringify(data);
    } catch {
      // Keep the server-rendered structured data when it cannot be parsed.
    }
  };

  const renderRating = (rating, count, source = "fallback") => {
    const safeRating = Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : FALLBACK_RATING;
    const safeCount = Number.isFinite(count) && count >= 0 ? Math.round(count) : FALLBACK_COUNT;
    const ratingText = safeRating.toFixed(1);
    const countText = new Intl.NumberFormat("en-US").format(safeCount);
    const noun = safeCount === 1 ? "rating" : "ratings";
    const filledStars = Math.max(0, Math.min(5, Math.round(safeRating)));

    document.querySelectorAll("[data-rating-value]").forEach((node) => { node.textContent = ratingText; });
    document.querySelectorAll("[data-rating-count]").forEach((node) => { node.textContent = countText; });
    document.querySelectorAll("[data-rating-noun]").forEach((node) => { node.textContent = noun; });
    document.querySelectorAll("[data-rating-stars]").forEach((node) => {
      node.textContent = `${"★".repeat(filledStars)}${"☆".repeat(5 - filledStars)}`;
    });

    const proofLink = document.querySelector("[data-app-store-proof]");
    if (proofLink) {
      proofLink.setAttribute(
        "aria-label",
        `View Idle: Car Meets on the App Store. Rated ${ratingText} from ${countText} ${noun}.`
      );
    }

    const status = document.querySelector("[data-rating-status]");
    if (status && source === "live") {
      status.textContent = `App Store rating updated: ${ratingText} from ${countText} ${noun}.`;
    }

    updateSchema(safeRating, safeCount);
  };

  const cached = readCache();
  if (cached) renderRating(cached.rating, cached.count, "cache");

  if (cached && Date.now() - cached.savedAt < CACHE_MAX_AGE) return;

  let lookupScript;
  let timeout;

  const cleanupLookup = () => {
    window.clearTimeout(timeout);
    lookupScript?.remove();
    delete window[CALLBACK_NAME];
  };

  window[CALLBACK_NAME] = (payload) => {
    const app = payload?.results?.[0];
    const rating = Number(app?.averageUserRating);
    const count = Number(app?.userRatingCount);

    if (Number.isFinite(rating) && Number.isFinite(count) && count >= 0) {
      renderRating(rating, count, "live");
      writeCache(rating, count);
    }

    cleanupLookup();
  };

  lookupScript = document.createElement("script");
  lookupScript.src = `https://itunes.apple.com/lookup?id=${APP_ID}&country=us&callback=${CALLBACK_NAME}`;
  lookupScript.async = true;
  lookupScript.onerror = cleanupLookup;
  document.head.appendChild(lookupScript);
  timeout = window.setTimeout(cleanupLookup, 7000);
})();
