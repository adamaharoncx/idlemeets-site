(() => {
  const APP_ID = "6762639080";
  const CACHE_KEY = "idle-app-store-rating-v1";
  const CACHE_MAX_AGE = 6 * 60 * 60 * 1000;
  const CALLBACK_NAME = "__idleAppStoreLookup";
  const FALLBACK_RATING = 5;
  const FALLBACK_COUNT = 15;

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
      const application = data["@type"] === "MobileApplication"
        ? data
        : data["@graph"]?.find((entry) => entry["@type"] === "MobileApplication");

      if (!application) return;

      application.aggregateRating = {
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

    document.querySelectorAll("[data-rating-status]").forEach((status) => {
      if (source === "live") {
        status.textContent = `App Store rating updated: ${ratingText} from ${countText} ${noun}.`;
      }
    });

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
