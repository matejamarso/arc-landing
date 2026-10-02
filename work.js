/*
  Fills work.html for one project, chosen by the address: work.html?work=axiom

  To finish a project page, edit its entry below:
    tagline  one line under the name (or null)
    intro    the paragraph about what Arc did (null shows a dashed placeholder)
    live     { label, url } for the live site (null hides the line)
    shots    picture addresses, top to bottom (null entries show dashed placeholders)
*/
(function () {
  var WONDER = "https://cdn.wonder.so/images/01a05f47-f2b0-7104-840f-65ccccea2167/";

  var WORKS = {
    axiom: {
      name: "Axiom",
      tagline: "The Only Trading Platform You’ll Ever Need",
      intro: null,
      live: { label: "axiom.trade", url: "https://axiom.trade" },
      shots: [WONDER + "f6e70d672ca55e69bbfa693ab3a7f59bd3841e532ecb34a6ce925dee677c265a.webp", null, null, null],
    },
    automattic: {
      name: "Automattic",
      tagline: "Spacefast, the Publishing Layer for Your Agents",
      intro: null,
      live: null, // TODO: add the Spacefast address
      shots: [WONDER + "c3382a9e4dd8a11d31f4927322e2a4c858462ee6e50191b1d6a6fcdc006d57b3.webp", null, null, null],
    },
    agentmail: {
      name: "AgentMail",
      tagline: "Email for AI Agents",
      intro: null,
      live: { label: "agentmail.to", url: "https://agentmail.to" },
      shots: ["https://494510hkri.ufs.sh/f/3d9AyaVNUM8w5LTQDLt1oRY7wDTKfMrq8Sn2isyOdjuzhmc3", null, null, null],
    },
    orchid: {
      name: "Orchid",
      tagline: "AI Personal Assistant",
      intro: null,
      live: null, // TODO: add the live address
      shots: [WONDER + "71f6ad0675a9d27f158d7ec3888b542490838407da6e29821284a0503636b088.webp", null, null, null],
    },
    // Nothing is known about these yet beyond the name.
    anything: { name: "Anything", tagline: null, intro: null, live: null, shots: [null, null, null, null] },
    conviction: { name: "Conviction", tagline: null, intro: null, live: null, shots: [null, null, null, null] },
    sim: { name: "Sim", tagline: null, intro: null, live: null, shots: [null, null, null, null] },
    agentphone: { name: "AgentPhone", tagline: null, intro: null, live: null, shots: [null, null, null, null] },
    bloom: { name: "Bloom", tagline: null, intro: null, live: null, shots: [null, null, null, null] },
    starsling: { name: "Starsling", tagline: null, intro: null, live: null, shots: [null, null, null, null] },
    "the-hog": { name: "The Hog", tagline: null, intro: null, live: null, shots: [null, null, null, null] },
    chonkie: { name: "Chonkie", tagline: null, intro: null, live: null, shots: [null, null, null, null] },
  };

  var params = new URLSearchParams(window.location.search);
  var work = WORKS[params.get("work")];

  var nameEl = document.getElementById("work-name");
  var taglineEl = document.getElementById("work-tagline");
  var introEl = document.getElementById("work-intro");
  var shotsEl = document.getElementById("work-shots");
  var liveEl = document.getElementById("work-live");
  var liveLink = document.getElementById("work-live-link");
  var backLink = document.getElementById("work-back");

  // Go back to the page the visitor came from.
  if (params.get("from") === "yc") {
    backLink.href = "yc.html";
    backLink.textContent = "← For YC founders";
  }

  if (!work) {
    document.title = "Work not found · Arc Studio";
    nameEl.textContent = "Work not found";
    taglineEl.textContent = "There is no page for this project.";
    introEl.hidden = true;
    shotsEl.hidden = true;
    return;
  }

  document.title = work.name + " · Arc Studio";
  nameEl.textContent = work.name;

  if (work.tagline) {
    taglineEl.textContent = work.tagline;
  } else {
    taglineEl.hidden = true;
  }

  if (work.intro) {
    introEl.textContent = work.intro;
  } else {
    introEl.className = "placeholder";
    introEl.textContent = "Intro goes here: what we did for " + work.name;
  }

  work.shots.forEach(function (src, i) {
    var shot;
    if (src) {
      shot = document.createElement("img");
      shot.className = "shot";
      shot.src = src;
      shot.alt = work.name + ", picture " + (i + 1);
      shot.loading = i === 0 ? "eager" : "lazy";
    } else {
      shot = document.createElement("div");
      shot.className = "shot shot--placeholder";
      shot.textContent = "Picture " + (i + 1);
      var hint = document.createElement("span");
      hint.className = "slide__placeholder-hint";
      hint.textContent = "To be added";
      shot.appendChild(hint);
    }
    shotsEl.appendChild(shot);
  });

  if (work.live) {
    liveLink.href = work.live.url;
    liveLink.textContent = work.live.label;
    liveEl.hidden = false;
  }
})();
