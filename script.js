(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // sounds.js is optional: without it the page is simply silent.
  function sound(name) {
    if (window.arcSound) window.arcSound.play(name);
  }

  // Hover sounds are for a mouse pointer only; a finger has no hover.
  function addSounds(selector, hoverName, selectName) {
    Array.prototype.forEach.call(document.querySelectorAll(selector), function (el) {
      el.addEventListener("pointerenter", function (event) {
        if (event.pointerType === "mouse") sound(hoverName);
      });
      el.addEventListener("click", function () {
        sound(selectName);
      });
    });
  }

  // Highlighter strokes swipe in the first time each one scrolls into view.
  var markers = Array.prototype.slice.call(document.querySelectorAll(".marker"));
  if ("IntersectionObserver" in window) {
    var markerObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          markerObserver.unobserve(entry.target);
        });
      },
      { threshold: 1 }
    );
    markers.forEach(function (marker) {
      markerObserver.observe(marker);
    });
  } else {
    markers.forEach(function (marker) {
      marker.classList.add("is-in");
    });
  }

  addSounds(".sidebar__link", "nav-hover", "nav-select");
  addSounds(".button, .text-link", "cta-hover", "cta-select");

  /* ---------- Works strip ---------- */

  var strip = document.querySelector(".strip");
  var track = document.querySelector(".track");
  var slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  var outline = document.querySelector(".frame__outline");
  var label = document.querySelector(".frame__label");
  var sizeBadge = document.querySelector(".frame__size");

  var step = 0; // distance between two slide centres
  var active = -1;
  var isScrolling = false;
  var settleTimer = null;

  function clampIndex(i) {
    return Math.max(0, Math.min(slides.length - 1, i));
  }

  function measure() {
    if (slides.length < 2) return;
    step = slides[1].offsetLeft - slides[0].offsetLeft;
  }

  function restart(el, className) {
    el.classList.remove(className);
    void el.offsetWidth; // restart the CSS animation
    el.classList.add(className);
  }

  // The badge under the frame reports the frame's real size.
  function updateSizeBadge() {
    if (!outline || !sizeBadge) return;
    var rect = outline.getBoundingClientRect();
    sizeBadge.textContent = Math.round(rect.width) + " × " + Math.round(rect.height);
  }

  // Each slide gets its distance from the frame, in slides: 0 when centred, capped at 1.
  function updateSlides() {
    if (!track || !step) return;
    var position = track.scrollLeft / step;
    slides.forEach(function (slide, i) {
      var offset = i - position;
      slide.style.setProperty("--d", Math.min(Math.abs(offset), 1).toFixed(4));
      slide.classList.toggle("is-before", offset < 0);
    });

    var nearest = clampIndex(Math.round(position));
    slides.forEach(function (slide, i) {
      slide.classList.toggle("is-current", i === nearest);
    });
    if (nearest !== active) {
      var first = active === -1;
      active = nearest;
      label.textContent = slides[active].getAttribute("data-name");
      if (!first) sound("work-change");
      if (!first && !reduceMotion) restart(label, "is-swapping");
    }
  }

  function scrollToIndex(index, instant) {
    track.scrollTo({ left: clampIndex(index) * step, behavior: instant || reduceMotion ? "auto" : "smooth" });
  }

  function settle() {
    clearTimeout(settleTimer);
    if (!isScrolling || drag.active) return;
    isScrolling = false;
    track.classList.remove("is-dragging");
    strip.classList.remove("is-scrolling");
    if (!reduceMotion) restart(strip, "is-locked");
  }

  function onTrackScroll() {
    updateSlides();
    if (!isScrolling) {
      isScrolling = true;
      strip.classList.remove("is-locked");
      strip.classList.add("is-scrolling");
    }
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, 140);
  }

  // Mouse drag. Touch and trackpads already scroll the row natively.
  var drag = { down: false, active: false, moved: false, startX: 0, startLeft: 0, lastX: 0, lastT: 0, velocity: 0 };

  function onPointerDown(event) {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    drag.down = true;
    drag.active = false;
    drag.moved = false;
    drag.startX = drag.lastX = event.clientX;
    drag.startLeft = track.scrollLeft;
    drag.lastT = event.timeStamp;
    drag.velocity = 0;
  }

  function onPointerMove(event) {
    if (!drag.down) return;
    var dx = event.clientX - drag.startX;
    if (!drag.active) {
      if (Math.abs(dx) < 4) return;
      drag.active = true;
      drag.moved = true;
      track.classList.add("is-dragging");
      try {
        track.setPointerCapture(event.pointerId);
      } catch (error) {
        // Capture is a nicety (keeps the drag alive outside the row); dragging works without it.
      }
    }
    var dt = event.timeStamp - drag.lastT;
    if (dt > 0) {
      // Smoothed pointer speed in px/ms, used to carry the row on to the next cover on release.
      drag.velocity = 0.7 * ((event.clientX - drag.lastX) / dt) + 0.3 * drag.velocity;
    }
    drag.lastX = event.clientX;
    drag.lastT = event.timeStamp;
    track.scrollLeft = drag.startLeft - dx;
  }

  function onPointerUp(event) {
    if (!drag.down) return;
    drag.down = false;
    if (!drag.active) return;
    drag.active = false;
    if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
    var projected = track.scrollLeft - drag.velocity * 220;
    var target = clampIndex(Math.round(projected / step));
    if (Math.abs(target * step - track.scrollLeft) < 1) {
      settle();
    } else {
      scrollToIndex(target);
    }
  }

  function onTrackClick(event) {
    if (drag.moved) {
      drag.moved = false;
      return;
    }
    var slide = event.target.closest(".slide");
    if (!slide) return;
    var index = slides.indexOf(slide);
    if (index !== active) {
      scrollToIndex(index);
    } else {
      // Anywhere inside the selection frame counts, not only the cover itself.
      openWork(slide);
    }
  }

  // The cover in the frame leads to its project page: work.html?work=<name as a slug>.
  function openWork(slide) {
    var slug = slide
      .getAttribute("data-name")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    var from = /yc\.html$/.test(window.location.pathname) ? "&from=yc" : "";
    window.location.href = "work.html?work=" + slug + from;
  }

  function onTrackKeydown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      openWork(slides[active]);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollToIndex(active + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollToIndex(active - 1);
    }
  }

  function initStrip() {
    if (!strip || !track || !slides.length) return;
    measure();
    var start = slides.findIndex(function (slide) {
      return slide.hasAttribute("data-start");
    });
    track.scrollLeft = Math.max(start, 0) * step;
    updateSlides();
    updateSizeBadge();

    track.addEventListener("scroll", onTrackScroll, { passive: true });
    track.addEventListener("scrollend", settle);
    track.addEventListener("pointerdown", onPointerDown);
    track.addEventListener("pointermove", onPointerMove);
    track.addEventListener("pointerup", onPointerUp);
    track.addEventListener("pointercancel", onPointerUp);
    track.addEventListener("click", onTrackClick);
    track.addEventListener("keydown", onTrackKeydown);
    strip.addEventListener("animationend", function (event) {
      if (event.animationName === "frame-lock") strip.classList.remove("is-locked");
    });
  }

  /* ---------- Sidebar ---------- */

  var sidebar = document.querySelector(".sidebar");
  var spyLinks = Array.prototype.slice.call(document.querySelectorAll("[data-spy]"));
  var sections = spyLinks
    .map(function (link) {
      return document.getElementById(link.getAttribute("data-spy"));
    })
    .filter(Boolean);

  // Highlight the section whose top has most recently passed the upper third of the window.
  function updateActiveLink() {
    var line = window.innerHeight / 3;
    var current = sections[0];
    sections.forEach(function (section) {
      if (section.getBoundingClientRect().top <= line) current = section;
    });
    var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (atBottom) current = sections[sections.length - 1];
    spyLinks.forEach(function (link) {
      link.classList.toggle("is-active", current && link.getAttribute("data-spy") === current.id);
    });
  }

  // The works strip is full-bleed, so its covers pass under the fixed sidebar. Fade the sidebar out while they do.
  function updateSidebarVisibility() {
    if (!sidebar || !track) return;
    var side = sidebar.getBoundingClientRect();
    // Measured against the row of covers itself, not the empty padding above it.
    var band = track.getBoundingClientRect();
    var overlaps = band.top < side.bottom + 24 && band.bottom > side.top - 24;
    sidebar.classList.toggle("is-hidden", overlaps);
  }

  // Both checks are a handful of rect reads, so they run straight from the scroll event.
  function onScroll() {
    updateActiveLink();
    updateSidebarVisibility();
  }

  function onResize() {
    if (track && step) {
      // Keep the same cover in the frame when the slide width changes.
      var keep = active;
      measure();
      track.scrollLeft = keep * step;
      updateSlides();
    }
    updateSizeBadge();
    onScroll();
  }

  initStrip();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  onScroll();
})();
