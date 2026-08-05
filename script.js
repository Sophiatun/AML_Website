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
