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
if (articleGrid) {
  const showStatus = (message) => {
    articleGrid.innerHTML = "";
    const status = document.createElement("p");
    status.className = "articles-status";
    status.textContent = message;
    articleGrid.appendChild(status);
  };

  fetch("/api/articles")
    .then((res) => res.json())
    .then((data) => {
      if (!data.articles || data.articles.length === 0) {
        showStatus(
          (data.errors && data.errors[0]) ||
            "No articles available right now — check back soon.",
        );
        return;
      }

      articleGrid.innerHTML = "";
      data.articles.forEach((article) => {
        const link = /^https?:\/\//i.test(article.link) ? article.link : "#";

        const card = document.createElement("div");
        card.className = "article-card";

        const source = document.createElement("div");
        source.className = "article-source";
        source.textContent = article.source;

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
        const dateSpan = document.createElement("span");
        dateSpan.textContent = article.pubDate
          ? new Date(article.pubDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "";
        const readMore = document.createElement("a");
        readMore.href = link;
        readMore.target = "_blank";
        readMore.rel = "noopener";
        readMore.textContent = "Read More →";
        meta.appendChild(dateSpan);
        meta.appendChild(readMore);

        card.appendChild(source);
        card.appendChild(titleEl);
        card.appendChild(summary);
        card.appendChild(meta);
        articleGrid.appendChild(card);
      });
    })
    .catch((err) => {
      console.error("Articles fetch failed:", err);
      showStatus("Couldn't load articles right now — please try again later.");
    });
}
