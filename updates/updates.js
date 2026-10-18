(() => {
  function revealLinkedRelease() {
    if (!window.location.hash) return;
    let id;
    try {
      id = decodeURIComponent(window.location.hash.slice(1));
    } catch {
      return; // Malformed URL fragments cannot identify a release.
    }
    const target = document.getElementById(id);
    const archive = target?.closest("details.update-archive");
    if (!archive || archive.open) return;
    archive.open = true;
    window.requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
  }

  window.addEventListener("hashchange", revealLinkedRelease);
  revealLinkedRelease();
})();
