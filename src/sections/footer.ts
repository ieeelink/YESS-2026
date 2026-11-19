/** Footer-only link and CTA motion. The original link labels remain available to assistive tech. */
export function initFooter() {
  const mark = document.getElementById("footMark");
  if (mark) {
    if (!("IntersectionObserver" in window)) {
      mark.classList.add("is-revealed");
    } else {
      const reveal = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          mark.classList.add("is-revealed");
          reveal.disconnect();
        }
      }, { threshold: 0.25 });
      reveal.observe(mark);
    }
  }

  document.querySelectorAll<HTMLAnchorElement>(".foot .link").forEach(link => {
    const label = link.textContent?.trim();
    if (!label) return;

    link.setAttribute("aria-label", label);
    const visual = document.createElement("span");
    visual.className = "foot__link-visual";
    visual.setAttribute("aria-hidden", "true");
    let index = 0;

    label.split(" ").forEach((word, wordIndex) => {
      if (wordIndex) visual.append(document.createTextNode(" "));
      const wordWrap = document.createElement("span");
      wordWrap.className = "foot__word";
      [...word].forEach(char => {
        const charWrap = document.createElement("span");
        charWrap.className = "foot__char";
        charWrap.style.setProperty("--char-i", String(index++));

        const current = document.createElement("span");
        current.className = "foot__char-current";
        current.textContent = char;
        const next = document.createElement("span");
        next.className = "foot__char-next";
        next.textContent = char;
        charWrap.append(current, next);
        wordWrap.append(charWrap);
      });
      visual.append(wordWrap);
    });

    link.replaceChildren(visual);
  });
}
