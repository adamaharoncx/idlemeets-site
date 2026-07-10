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

})();
