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

// Edit testimonial content here — names and text only. Layout, sliding,
// autoplay, and accessibility behavior all live in the carousel logic
// below and don't need to change when this list changes.
const TESTIMONIALS = [
  {
    initials: "SK",
    name: "Susan K.",
    text: "A long-time client of Anne Liang CPA, I can confidently say she delivers exceptional service for complex tax situations common in high-tech and consulting fields.\n\nAnne expertly manages everything from standard tax filing to intricate planning, especially maximizing savings on work-related equity. Her proactive approach ensures accuracy without requiring constant oversight.\n\nShe also introduced me to sophisticated retirement strategies like Roth IRA conversions that effectively reduce my overall tax liability.\n\nHighly recommended for professionals seeking knowledgeable, reliable, and results-driven accounting support.",
  },
  {
    initials: "NJ",
    name: "Nila J.",
    text: "This is my third year working with Mrs. Anne Liang, and I couldn't be happier. She handled my taxes timely and without any hassle.\n\nShe is truly reliable and responsible, and also very pleasant to work with. I really appreciate her efforts and I'm completely satisfied with the result. I will definitely continue working with her in the coming years.",
  },
  {
    initials: "AL",
    name: "Amy L.",
    text: "It was when we started working with Anne for tax planning that we realized how much we were missing before. She's very knowledgeable, proactive, and easy to work with.\n\nShe helped us save more in taxes than we expected and gave us a lot more confidence about our financial future. We really appreciate that she looks at the bigger picture instead of just filing taxes once a year. We highly recommend her if you want someone who truly cares and knows what she's doing.",
  },
  {
    initials: "CY",
    name: "Cindy Y.",
    text: "We have been going to Anne Liang CPA service since 2000 and appreciated her dedicated service every tax season. They provide worksheets that have previous year's information to make tax preparation a little bit more manageable.\n\n What I appreciate most about her service is that she has good grasp of small businesses and can give me practical advice that we can use. Anne also gives excellent referrals when consulting service by experts become necessary. In that way, she is our go to person for problem solving.\n\n DIY does not save money any more than paying someone who has prepared hundreds of tax returns to save you on tax planning. I highly recommend Anne Liang if you are a business owner.",
  },
  {
    initials: "SS",
    name: "Shabbir S.",
    text: "I've been using Anne's team for nearly a decade now. My taxes aren't super easy, as I have always owned an LLC for my work as well as had a home office and at times rental income, but they aren't also super complex with income from multiple corporate entities either. I love that she talks about our tax strategy and about erring on the side of safety from a compliance point of view.\n\nThe second is that she's always keeping an eye on the changing regulatory environment. When a piece of legislation recently passed that would allow me to legally reduce my tax burden she and her team had spreadsheets to walk me through everything I needed to know to understand what these new rules meant for my family's taxes.\n\nAfter about ten years, I would whole heartedly recommend her. And mad props to her teammate Janelle. She's reliable, cheerful, and incredibly knowledgeable.",
  },
  {
    initials: "FS",
    name: "Farin S.",
    text: "I am very happy with Anne Liang and her team, who have been handling my tax returns.\n\nWhat I appreciate most is that she doesn't just prepare taxes, she genuinely cares about her clients and every dollar they earn. While you may be focused on the present, she provides thoughtful advice to help you save money and build a more secure future for retirement.\n\nThere were many small details that I overlooked while preparing my documents, but thanks to her keen eye for detail, she identified and addressed them. She is highly knowledgeable, thorough, and always up to date on current tax laws and regulations.\n\nI highly recommend Anne Liang and her team to anyone looking for a trustworthy, professional, and proactive tax advisor.",
  },
];

const testimonialCarousel = document.querySelector(".testimonial-carousel");
const testimonialTrack = document.getElementById("testimonialTrack");
const testimonialDotsWrap = document.getElementById("testimonialDots");
const testimonialPrevBtn = document.getElementById("testimonialPrev");
const testimonialNextBtn = document.getElementById("testimonialNext");

if (
  testimonialCarousel &&
  testimonialTrack &&
  testimonialDotsWrap &&
  TESTIMONIALS.length
) {
  const n = TESTIMONIALS.length;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const buildCard = (t, isClone) => {
    const card = document.createElement("div");
    card.className = "testimonial-card";
    card.setAttribute("role", "group");
    card.setAttribute("aria-roledescription", "slide");
    if (isClone) card.setAttribute("aria-hidden", "true");

    const text = document.createElement("div");
    text.className = "testimonial-text";
    t.text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .forEach((paragraph) => {
        const p = document.createElement("p");
        p.textContent = paragraph;
        text.appendChild(p);
      });

    const divider = document.createElement("div");
    divider.className = "testimonial-divider";

    const author = document.createElement("div");
    author.className = "testimonial-author";
    const avatar = document.createElement("div");
    avatar.className = "testimonial-avatar";
    avatar.textContent = t.initials;
    const nameWrap = document.createElement("div");
    const name = document.createElement("div");
    name.className = "testimonial-name";
    name.textContent = t.name;
    nameWrap.appendChild(name);
    author.appendChild(avatar);
    author.appendChild(nameWrap);

    card.appendChild(text);
    card.appendChild(divider);
    card.appendChild(author);
    return card;
  };

  // Infinite-loop illusion: a clone of the last card sits before the real
  // cards and a clone of the first sits after. Sliding onto a clone jumps
  // (with transitions off, invisibly) back to the matching real card.
  testimonialTrack.appendChild(buildCard(TESTIMONIALS[n - 1], true));
  TESTIMONIALS.forEach((t) =>
    testimonialTrack.appendChild(buildCard(t, false)),
  );
  testimonialTrack.appendChild(buildCard(TESTIMONIALS[0], true));

  const allCards = Array.from(testimonialTrack.children);
  let current = 1; // index into allCards — starts on the first real card

  TESTIMONIALS.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "dot" + (i === 0 ? " active" : "");
    dot.setAttribute("aria-label", `Go to testimonial ${i + 1}`);
    dot.addEventListener("click", () => {
      stopAutoplay();
      current = i + 1;
      update(true);
      startAutoplay();
    });
    testimonialDotsWrap.appendChild(dot);
  });
  const dotEls = testimonialDotsWrap.querySelectorAll(".dot");

  const getViewportWidth = () => {
    const style = getComputedStyle(testimonialCarousel);
    const padL = parseFloat(style.paddingLeft) || 0;
    const padR = parseFloat(style.paddingRight) || 0;
    return testimonialCarousel.clientWidth - padL - padR;
  };
  const getCardWidthRatio = (vw) => {
    if (vw <= 560) return 0.92;
    if (vw <= 900) return 0.7;
    return 0.42;
  };
  const getGap = (vw) => {
    if (vw <= 560) return 16;
    if (vw <= 900) return 24;
    return 28;
  };

  const update = (animate) => {
    const activeEl = allCards[current];
    const viewportWidth = getViewportWidth();
    const cardWidth = activeEl.getBoundingClientRect().width;
    const translateX = -(activeEl.offsetLeft - (viewportWidth - cardWidth) / 2);
    testimonialTrack.style.transition = animate ? "" : "none";
    testimonialTrack.style.transform = `translateX(${translateX}px)`;
    allCards.forEach((el, i) =>
      el.classList.toggle("is-active", i === current),
    );
    const realIndex = ((current - 1) % n + n) % n;
    dotEls.forEach((dot, i) => dot.classList.toggle("active", i === realIndex));
  };

  const layout = () => {
    const viewportWidth = getViewportWidth();
    const ratio = getCardWidthRatio(viewportWidth);
    const cardWidth = Math.round(viewportWidth * ratio);
    testimonialTrack.style.gap = getGap(viewportWidth) + "px";
    allCards.forEach((el) => {
      el.style.width = cardWidth + "px";
    });
    update(false);
  };

  const goNext = () => {
    current += 1;
    update(true);
  };
  const goPrev = () => {
    current -= 1;
    update(true);
  };

  // Wrap seamlessly once a transition onto a clone finishes.
  testimonialTrack.addEventListener("transitionend", (e) => {
    if (e.propertyName !== "transform") return;
    if (current === allCards.length - 1) {
      current = 1;
      update(false);
    } else if (current === 0) {
      current = n;
      update(false);
    }
  });

  const AUTOPLAY_MS = 6000;
  let autoplayId = null;
  const startAutoplay = () => {
    if (prefersReducedMotion) return;
    stopAutoplay();
    autoplayId = setInterval(goNext, AUTOPLAY_MS);
  };
  function stopAutoplay() {
    if (autoplayId) {
      clearInterval(autoplayId);
      autoplayId = null;
    }
  }
  testimonialCarousel.addEventListener("mouseenter", stopAutoplay);
  testimonialCarousel.addEventListener("mouseleave", startAutoplay);
  testimonialCarousel.addEventListener("focusin", stopAutoplay);
  testimonialCarousel.addEventListener("focusout", startAutoplay);

  if (testimonialPrevBtn) {
    testimonialPrevBtn.addEventListener("click", () => {
      stopAutoplay();
      goPrev();
      startAutoplay();
    });
  }
  if (testimonialNextBtn) {
    testimonialNextBtn.addEventListener("click", () => {
      stopAutoplay();
      goNext();
      startAutoplay();
    });
  }
  testimonialTrack.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      stopAutoplay();
      goNext();
      startAutoplay();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      stopAutoplay();
      goPrev();
      startAutoplay();
    }
  });

  window.addEventListener("resize", layout);

  // Click-and-drag (mouse) or touch drag — follows the pointer live.
  let dragStartX = 0;
  let dragStartTranslate = 0;
  let isDragging = false;
  const currentTranslateX = () => {
    const matrix = new DOMMatrixReadOnly(
      getComputedStyle(testimonialTrack).transform,
    );
    return matrix.m41;
  };
  testimonialTrack.addEventListener("pointerdown", (e) => {
    isDragging = true;
    stopAutoplay();
    dragStartX = e.clientX;
    dragStartTranslate = currentTranslateX();
    testimonialTrack.style.transition = "none";
    testimonialTrack.setPointerCapture(e.pointerId);
  });
  testimonialTrack.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    testimonialTrack.style.transform = `translateX(${dragStartTranslate + dx}px)`;
  });
  const endDrag = (e) => {
    if (!isDragging) return;
    isDragging = false;
    testimonialTrack.style.transition = "";
    const dx = e.clientX - dragStartX;
    if (dx < -60) goNext();
    else if (dx > 60) goPrev();
    else update(true);
    startAutoplay();
  };
  testimonialTrack.addEventListener("pointerup", endDrag);
  testimonialTrack.addEventListener("pointercancel", endDrag);

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
      stopAutoplay();
      if (e.deltaX > 0) goNext();
      else goPrev();
      startAutoplay();
      setTimeout(() => {
        wheelLocked = false;
      }, 500);
    },
    { passive: false },
  );

  layout();
  startAutoplay();
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
