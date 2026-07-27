(function () {
  var mobileBreakpoint = window.matchMedia("(max-width: 720px)");
  var headers = Array.prototype.slice.call(document.querySelectorAll(".site-header"));

  if (!headers.length) return;

  document.documentElement.classList.add("has-mobile-nav");

  headers.forEach(function (header, index) {
    var navShell = header.querySelector(".nav");
    var navLinks = header.querySelector(".nav-links");

    if (!navShell || !navLinks || navShell.querySelector(".mobile-nav-actions")) return;

    var navigationID = navLinks.id || "site-navigation-" + (index + 1);
    var downloadLink = Array.prototype.find.call(navLinks.querySelectorAll("a"), function (link) {
      return link.getAttribute("href") && link.getAttribute("href").indexOf("download") !== -1;
    });
    var mobileActions = document.createElement("div");
    var mobileCTA = document.createElement("a");
    var toggle = document.createElement("button");

    navLinks.id = navigationID;
    mobileActions.className = "mobile-nav-actions";
    mobileCTA.className = "mobile-nav-cta";
    mobileCTA.href = downloadLink ? downloadLink.getAttribute("href") : "/download/";
    mobileCTA.textContent = "Get Idle";
    toggle.className = "nav-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-controls", navigationID);
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation menu");
    toggle.innerHTML = '<span class="nav-toggle-icon" aria-hidden="true"><span></span><span></span></span>';

    mobileActions.appendChild(mobileCTA);
    mobileActions.appendChild(toggle);
    navShell.insertBefore(mobileActions, navLinks);

    function setOpen(open, restoreFocus) {
      var shouldOpen = Boolean(open && mobileBreakpoint.matches);

      navLinks.classList.toggle("is-open", shouldOpen);
      header.classList.toggle("nav-open", shouldOpen);
      document.documentElement.classList.toggle("mobile-nav-open", shouldOpen);
      toggle.setAttribute("aria-expanded", String(shouldOpen));
      toggle.setAttribute("aria-label", shouldOpen ? "Close navigation menu" : "Open navigation menu");

      if (mobileBreakpoint.matches) {
        navLinks.setAttribute("aria-hidden", String(!shouldOpen));
      } else {
        navLinks.removeAttribute("aria-hidden");
      }

      if (!shouldOpen && restoreFocus) {
        toggle.focus();
      }
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true", false);
    });

    navLinks.addEventListener("click", function (event) {
      if (event.target === navLinks || event.target.closest("a")) {
        setOpen(false, false);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false, true);
      }
    });

    mobileBreakpoint.addEventListener("change", function () {
      setOpen(false, false);
    });

    setOpen(false, false);
  });
})();
