const copyrightYear = document.getElementById("copyright-year");
if (copyrightYear) {
  copyrightYear.textContent = new Date().getFullYear();
}

const nav = document.getElementById("nav");
window.addEventListener("scroll", () => {
  nav.classList.toggle("scrolled", window.scrollY > 50);
});
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        observer.unobserve(e.target);
      }
    });
  },
  { threshold: 0.15 },
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
document.getElementById("mobileToggle").addEventListener("click", () => {
  document.getElementById("navLinks").classList.toggle("open");
});

const testimonialTrack = document.getElementById("testimonialTrack");
const testimonialDotsWrap = document.getElementById("testimonialDots");
const testimonialViewport = document.querySelector(".testimonial-carousel");
if (testimonialTrack && testimonialDotsWrap && testimonialViewport) {
  const pages = testimonialTrack.querySelectorAll(".testimonial-page");
  if (pages.length > 1) {
    pages.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = "dot" + (i === 0 ? " active" : "");
      dot.setAttribute("aria-label", `Testimonials, page ${i + 1}`);
      testimonialDotsWrap.appendChild(dot);
    });
  }
  const testimonialDots = testimonialDotsWrap.querySelectorAll(".dot");
  let current = 0;

  const pageWidth = () => testimonialViewport.getBoundingClientRect().width;
  const setPosition = (px) => {
    testimonialTrack.style.transform = `translateX(${px}px)`;
  };

  const goTo = (index) => {
    current = (index + pages.length) % pages.length;
    setPosition(-current * pageWidth());
    testimonialDots.forEach((dot, i) =>
      dot.classList.toggle("active", i === current),
    );
  };

  testimonialDots.forEach((dot, i) =>
    dot.addEventListener("click", () => goTo(i)),
  );
  window.addEventListener("resize", () => {
    testimonialTrack.style.transition = "none";
    setPosition(-current * pageWidth());
    testimonialTrack.offsetHeight; // force reflow before re-enabling transition
    testimonialTrack.style.transition = "";
  });

  // Click-and-drag (mouse) or touch drag.
  let dragStartX = 0;
  let isDragging = false;
  testimonialTrack.addEventListener("pointerdown", (e) => {
    isDragging = true;
    dragStartX = e.clientX;
    testimonialTrack.style.transition = "none";
  });
  testimonialTrack.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    const diff = e.clientX - dragStartX;
    setPosition(-current * pageWidth() + diff);
  });
  const endDrag = (e) => {
    if (!isDragging) return;
    isDragging = false;
    testimonialTrack.style.transition = "";
    const diff = e.clientX - dragStartX;
    if (diff < -60) goTo(current + 1);
    else if (diff > 60) goTo(current - 1);
    else goTo(current);
  };
  testimonialTrack.addEventListener("pointerup", endDrag);
  testimonialTrack.addEventListener("pointerleave", endDrag);

  // Trackpad two-finger swipe (fires as a horizontal wheel event).
  let wheelLocked = false;
  testimonialTrack.addEventListener(
    "wheel",
    (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      if (wheelLocked) return;
      if (Math.abs(e.deltaX) < 15) return;
      wheelLocked = true;
      goTo(current + (e.deltaX > 0 ? 1 : -1));
      setTimeout(() => {
        wheelLocked = false;
      }, 500);
    },
    { passive: false },
  );

  goTo(0);
}

const articleGrid = document.getElementById("articleGrid");
const articlesBlock = document.getElementById("articlesBlock");
const officialSourcesBlock = document.getElementById("officialSourcesBlock");
const loadMoreWrap = document.getElementById("loadMoreWrap");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const ARTICLES_INITIAL_COUNT = 6;

// If the articles section stays hidden, the next visible block (Official
// Sources, which always shows) would otherwise still carry a
// divider/spacing meant to separate it from something above — strip that
// so the page still looks intentional either way.
const collapseArticlesGap = () => {
  if (!officialSourcesBlock) return;
  officialSourcesBlock.style.marginTop = "0";
  officialSourcesBlock.style.paddingTop = "0";
  officialSourcesBlock.style.borderTop = "none";
};

if (articleGrid && articlesBlock) {
  // Fails silently on purpose: a visitor should never see a broken-looking
  // "couldn't load" message (e.g. from an ad blocker interfering with the
  // fetch). If there's nothing to show, the whole section just stays
  // hidden. Errors are still logged to the console for debugging.
  fetch("/api/articles")
    .then((res) => res.json())
    .then((data) => {
      if (!data.articles || data.articles.length === 0) {
        if (data.errors && data.errors.length) {
          console.warn("Articles feed:", data.errors.join("; "));
        }
        collapseArticlesGap();
        return;
      }

      articleGrid.innerHTML = "";
      data.articles.forEach((article, index) => {
        const link = /^https?:\/\//i.test(article.link) ? article.link : "#";

        const card = document.createElement("div");
        card.className = "article-card";
        if (index >= ARTICLES_INITIAL_COUNT) {
          card.style.display = "none";
          card.dataset.moreArticle = "true";
        }

        const titleEl = document.createElement("h3");
        titleEl.className = "article-title";
        const titleLink = document.createElement("a");
        titleLink.href = link;
        titleLink.target = "_blank";
        titleLink.rel = "noopener";
        titleLink.textContent = article.title;
        titleEl.appendChild(titleLink);

        const summary = document.createElement("p");
        summary.className = "article-summary";
        summary.textContent = article.summary;

        const meta = document.createElement("div");
        meta.className = "article-meta";
        const metaLeft = document.createElement("span");
        const dateText = article.pubDate
          ? new Date(article.pubDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "";
        metaLeft.textContent = [article.source, dateText]
          .filter(Boolean)
          .join(" · ");
        const readMore = document.createElement("a");
        readMore.href = link;
        readMore.target = "_blank";
        readMore.rel = "noopener";
        readMore.textContent = "Read More →";
        meta.appendChild(metaLeft);
        meta.appendChild(readMore);

        card.appendChild(titleEl);
        card.appendChild(summary);
        card.appendChild(meta);
        articleGrid.appendChild(card);
      });

      if (data.articles.length > ARTICLES_INITIAL_COUNT && loadMoreWrap) {
        loadMoreWrap.style.display = "";
      }

      articlesBlock.style.display = "";
    })
    .catch((err) => {
      console.error("Articles fetch failed (feed source or an ad blocker may be interfering):", err);
      collapseArticlesGap();
    });
}

if (loadMoreBtn) {
  loadMoreBtn.addEventListener("click", () => {
    document
      .querySelectorAll('[data-more-article="true"]')
      .forEach((card) => {
        card.style.display = "";
      });
    loadMoreWrap.style.display = "none";
  });
}
