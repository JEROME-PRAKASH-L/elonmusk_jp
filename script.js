/* =========================================================================
   Jerome Prakash L — Terminal OS Portfolio
   Progressive enhancement only. The site is fully navigable without JS:
   nav links are real anchors, smooth-scroll is CSS, all content is in the DOM.
   ========================================================================= */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- footer year ---------- */
  try {
    var y = document.getElementById("year");
    if (y) y.textContent = String(new Date().getFullYear());
  } catch (e) { /* noop */ }

  /* =======================================================================
     1. Theme toggle (green <-> amber), persisted
     ======================================================================= */
  (function theme() {
    var root = document.documentElement;
    var btn = document.getElementById("theme-toggle");
    var label = btn ? btn.querySelector(".theme-name") : null;
    var KEY = "jp-theme";

    function apply(name) {
      root.setAttribute("data-theme", name);
      if (label) label.textContent = name;
    }
    try {
      var saved = localStorage.getItem(KEY);
      if (saved === "amber" || saved === "green") apply(saved);
    } catch (e) { /* storage blocked — ignore */ }

    if (btn) {
      btn.addEventListener("click", function () {
        var next = root.getAttribute("data-theme") === "amber" ? "green" : "amber";
        apply(next);
        try { localStorage.setItem(KEY, next); } catch (e) {}
      });
    }
  })();

  /* =======================================================================
     2. Active-section highlight in the sidebar
     ======================================================================= */
  (function activeNav() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".nav-link"));
    if (!links.length || !("IntersectionObserver" in window)) return;

    var byId = {};
    links.forEach(function (l) {
      var id = (l.getAttribute("href") || "").replace("#", "");
      if (id) byId[id] = l;
    });

    var sections = links
      .map(function (l) { return document.getElementById((l.getAttribute("href") || "").replace("#", "")); })
      .filter(Boolean);

    var current = null;
    function setActive(id) {
      if (id === current || !byId[id]) return;
      current = id;
      links.forEach(function (l) { l.classList.remove("is-active"); });
      var active = byId[id];
      active.classList.add("is-active");
      // On the collapsed mobile top-bar, scroll the *nav strip itself* (never the page)
      // so the active chip stays visible for later sections.
      var nav = active.parentElement;
      if (nav && nav.scrollWidth > nav.clientWidth + 4) {
        var navRect = nav.getBoundingClientRect();
        var linkRect = active.getBoundingClientRect();
        var target = nav.scrollLeft + (linkRect.left - navRect.left) - (navRect.width - linkRect.width) / 2;
        nav.scrollTo({ left: Math.max(0, target), behavior: prefersReduced ? "auto" : "smooth" });
      }
    }

    var io = new IntersectionObserver(function (entries) {
      // pick the entry nearest the top that is intersecting
      var visible = entries.filter(function (e) { return e.isIntersecting; });
      if (!visible.length) return;
      visible.sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
      setActive(visible[0].target.id);
    }, { rootMargin: "-20% 0px -65% 0px", threshold: 0 });

    sections.forEach(function (s) { io.observe(s); });

    // Fallback: at the very bottom of the page #contact can sit above the detection band
    // (because #console + footer occupy space below it), so pin it active at the end of scroll.
    window.addEventListener("scroll", function () {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        setActive("contact");
      }
    }, { passive: true });

    // Clicking a nav link gives immediate feedback (don't wait for scroll)
    links.forEach(function (l) {
      l.addEventListener("click", function () {
        var id = (l.getAttribute("href") || "").replace("#", "");
        if (id) setActive(id);
      });
    });
  })();

  /* =======================================================================
     3. Typed name effect on whoami (skipped under reduced-motion)
     ======================================================================= */
  (function typeName() {
    var el = document.getElementById("typed-name");
    if (!el) return;
    var cursor = el.querySelector(".cursor");
    var full = "Jerome Prakash L";

    if (prefersReduced) return; // CSS already shows the final name + steady cursor

    // Build: empty text node we grow, with the cursor kept at the end
    var textNode = document.createTextNode("");
    el.insertBefore(textNode, cursor);
    // Remove the static name text node(s) so we can type it out fresh
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3 && n !== textNode) el.removeChild(n);
    });

    var i = 0;
    function step() {
      if (i <= full.length) {
        textNode.textContent = full.slice(0, i);
        i++;
        setTimeout(step, 70);
      }
    }
    setTimeout(step, 350);
  })();

  /* =======================================================================
     4. Live GitHub repos (progressive enhancement)
     The #repos section ships with a static fallback link; cards are added
     only if the API call succeeds. Fetch is lazy (when the section nears
     the viewport) and cached in sessionStorage to respect the anonymous
     rate limit.
     ======================================================================= */
  (function reposApp() {
    var section = document.getElementById("repos");
    var grid = document.getElementById("repo-grid");
    if (!section || !grid || !window.fetch) return;

    var USER = "jerome-prakash-l";
    var API = "https://api.github.com/users/" + USER + "/repos?sort=pushed&per_page=12";
    var CACHE_KEY = "jp-repos-v1";
    var CACHE_TTL = 60 * 60 * 1000; // 1 hour
    var MAX_CARDS = 6;
    var started = false;

    var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    function monthYear(iso) {
      var d = new Date(iso);
      return isNaN(d.getTime()) ? "" : MONTHS[d.getMonth()] + " " + d.getFullYear();
    }

    // External data (repo names/descriptions) goes through textContent only.
    function el(tag, cls, text) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text) n.textContent = text;
      return n;
    }

    function render(repos) {
      var shown = repos.filter(function (r) { return r && !r.fork; }).slice(0, MAX_CARDS);
      if (!shown.length) return;
      shown.forEach(function (r) {
        var card = el("article", "project repo");
        var head = el("header", "project__head");
        var title = el("h3", "project__title");
        var link = el("a", "repo__link", r.name);
        link.href = r.html_url;
        link.target = "_blank";
        link.rel = "noopener";
        title.appendChild(link);
        head.appendChild(title);
        if (r.stargazers_count > 0) head.appendChild(el("span", "project__type", "★ " + r.stargazers_count));
        card.appendChild(head);
        if (r.description) card.appendChild(el("p", "project__desc", r.description));
        var meta = el("div", "repo__meta");
        if (r.language) {
          var lang = el("span", "repo__lang", r.language);
          lang.insertBefore(el("i", "repo__dot"), lang.firstChild);
          meta.appendChild(lang);
        }
        if (r.pushed_at) meta.appendChild(el("span", "", "updated " + monthYear(r.pushed_at)));
        card.appendChild(meta);
        grid.appendChild(card);
      });
    }

    function load() {
      if (started) return;
      started = true;

      try {
        var cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
        if (cached && cached.t && Date.now() - cached.t < CACHE_TTL && cached.repos) {
          render(cached.repos);
          return;
        }
      } catch (e) { /* bad cache — fall through to a fresh fetch */ }

      var loading = el("p", "repo__loading", "fetching repositories…");
      grid.appendChild(loading);

      fetch(API)
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json();
        })
        .then(function (repos) {
          if (!Array.isArray(repos)) throw new Error("unexpected payload");
          try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), repos: repos })); } catch (e) {}
          grid.removeChild(loading);
          render(repos);
        })
        .catch(function () {
          if (loading.parentNode) grid.removeChild(loading);
          // fallback note below the grid stays — nothing else to do
        });
    }

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        var near = entries.some(function (e) { return e.isIntersecting; });
        if (near) { io.disconnect(); load(); }
      }, { rootMargin: "400px 0px" });
      io.observe(section);
    } else {
      load();
    }
  })();

  /* =======================================================================
     5. Project demos — simulated replays of OpenClaw & the inbox recap.
     All demo text is our own static strings; the login preview is cloned
     from a <template> in index.html. A run token cancels stale playback.
     ======================================================================= */
  (function demosApp() {
    var toggles = Array.prototype.slice.call(document.querySelectorAll(".demo-toggle"));
    if (!toggles.length) return;

    var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var runToken = 0;
    var openId = null;

    function el(tag, cls, text) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text) n.textContent = text;
      return n;
    }

    var SCRIPTS = {
      openclaw: [
        { kind: "user",   text: "Build a login page using HTML/CSS/JS", delay: 500 },
        { kind: "agent",  text: "on it — creating files in ~/MyApp …", delay: 650 },
        { kind: "log",    text: "[gateway] agent connected · model ready", delay: 320 },
        { kind: "log",    text: "[hooks] loaded 4 internal hook handlers", delay: 320 },
        { kind: "log",    text: "~/MyApp $ write index.html ✓", delay: 380 },
        { kind: "log",    text: "~/MyApp $ write style.css ✓", delay: 380 },
        { kind: "log",    text: "~/MyApp $ write script.js ✓", delay: 420 },
        { kind: "agent",  text: "done — 3 files created. live preview:", delay: 620 },
        { kind: "insert", what: "login", delay: 250 }
      ],
      recap: [
        { kind: "log",    text: "05:00 cron: daily-inbox-recap started", delay: 480 },
        { kind: "log",    text: "connecting to Gmail… ✓", delay: 420 },
        { kind: "log",    text: "scanning last 24 h… 47 emails", delay: 480 },
        { kind: "log",    text: "calendar context… 3 events today", delay: 420 },
        { kind: "log",    text: "extracting action items… 3 found", delay: 480 },
        { kind: "log",    text: "composing summary… ✓ sending", delay: 560 },
        { kind: "insert", what: "mail", delay: 250 }
      ]
    };

    function insertLogin(box) {
      var tpl = document.getElementById("demo-login-template");
      if (!tpl || !("content" in tpl)) return;
      box.appendChild(tpl.content.cloneNode(true));
      var btn = box.querySelector(".demo-login__btn");
      if (btn) btn.addEventListener("click", function () {
        btn.textContent = "signed in ✓";
        btn.classList.add("is-done");
      });
    }

    function insertMail(box) {
      var d = new Date();
      var mail = el("div", "demo-mail");
      mail.appendChild(el("div", "demo-mail__subject",
        "Daily Incoming Mail Recap — " + MONTHS[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear()));
      mail.appendChild(el("div", "demo-mail__meta", "to: prakashjerome152@gmail.com · sent 05:00 AM"));
      mail.appendChild(el("p", "demo-mail__lead", "Top items worth checking:"));
      var ul = el("ul", "demo-mail__list");
      [
        "Internship application — recruiter replied, needs a response today",
        "GitHub: 2 pull-request reviews requested",
        "College: project submission deadline moved to Friday"
      ].forEach(function (t) { ul.appendChild(el("li", "", t)); });
      mail.appendChild(ul);
      mail.appendChild(el("p", "demo-mail__foot", "Today: 3 calendar events · no urgent flags — have a great morning ☀"));
      box.appendChild(mail);
    }

    function play(id) {
      var panel = document.getElementById("demo-" + id);
      var box = panel ? panel.querySelector(".demo__stage") : null;
      if (!box) return;
      runToken++;
      var token = runToken;
      var steps = SCRIPTS[id] || [];
      box.textContent = "";

      function schedule(i, delay) {
        if (prefersReduced) { doStep(i); }
        else { setTimeout(function () { doStep(i); }, delay || 400); }
      }

      function doStep(i) {
        if (token !== runToken || i >= steps.length) return;
        var s = steps[i];

        if (s.kind === "user" && !prefersReduced) {
          // typewriter for the "typed on Telegram" bubble
          var bubble = el("div", "demo__msg demo__msg--user", "");
          box.appendChild(bubble);
          var c = 0;
          (function typeChar() {
            if (token !== runToken) return;
            if (c <= s.text.length) {
              bubble.textContent = s.text.slice(0, c);
              c++;
              setTimeout(typeChar, 36);
            } else {
              schedule(i + 1, s.delay);
            }
          })();
          return;
        }

        if (s.kind === "insert") {
          if (s.what === "login") insertLogin(box);
          else insertMail(box);
        } else if (s.kind === "log") {
          box.appendChild(el("div", "demo__logline", s.text));
        } else {
          box.appendChild(el("div", "demo__msg demo__msg--" + s.kind, s.text));
        }
        schedule(i + 1, s.delay);
      }

      doStep(0);
    }

    function closeAll() {
      runToken++;
      Array.prototype.slice.call(document.querySelectorAll(".demo")).forEach(function (p) { p.hidden = true; });
      openId = null;
    }

    function open(id) {
      var panel = document.getElementById("demo-" + id);
      if (!panel) return;
      closeAll();
      panel.hidden = false;
      openId = id;
      play(id);
      panel.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "nearest" });
    }

    toggles.forEach(function (t) {
      t.addEventListener("click", function () {
        var id = t.getAttribute("data-demo");
        if (openId === id) closeAll();
        else open(id);
      });
    });
    Array.prototype.slice.call(document.querySelectorAll(".demo-close")).forEach(function (b) {
      b.addEventListener("click", closeAll);
    });
    Array.prototype.slice.call(document.querySelectorAll(".demo-replay")).forEach(function (b) {
      b.addEventListener("click", function () { play(b.getAttribute("data-demo")); });
    });
  })();

  /* =======================================================================
     6. Interactive console (delight layer)
     ======================================================================= */
  (function consoleApp() {
    var input = document.getElementById("console-input");
    var log = document.getElementById("console-log");
    if (!input || !log) return;

    var LINKEDIN = "https://www.linkedin.com/in/jerome-prakash-975a15326";
    var GITHUB = "https://github.com/jerome-prakash-l";
    var GMAIL_COMPOSE = "https://mail.google.com/mail/?view=cm&fs=1&to=prakashjerome152@gmail.com&su=Hi%20Jerome%2C%20saw%20your%20portfolio";
    var history = [];
    var histIndex = -1;

    var SECTIONS = {
      whoami: "whoami", about: "whoami",
      experience: "experience", exp: "experience",
      projects: "projects", project: "projects",
      repos: "repos", repo: "repos",
      skills: "skills",
      education: "education", edu: "education",
      certs: "certs", certifications: "certs",
      writing: "writing", blog: "writing",
      contact: "contact"
    };

    function makeLine(cls) {
      var d = document.createElement("div");
      d.className = cls;
      return d;
    }
    function echoCommand(raw) {
      var line = makeLine("line-cmd");
      line.innerHTML = '<span class="p">jerome@portfolio:~$</span>';
      line.appendChild(document.createTextNode(" " + raw)); // raw is a text node — never parsed as HTML
      log.appendChild(line);
    }
    // Safe plain-text output (newlines preserved via CSS white-space: pre-wrap)
    function out(text, cls) {
      var d = makeLine(cls || "line-out");
      d.textContent = text;
      log.appendChild(d);
    }
    // Trusted-HTML output — ONLY for link strings we construct ourselves below
    function outHTML(html, cls) {
      var d = makeLine(cls || "line-out");
      d.innerHTML = html;
      log.appendChild(d);
    }
    function scrollLog() { log.scrollTop = log.scrollHeight; }

    function go(id) {
      var target = document.getElementById(id);
      if (target) target.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
    }

    var HELP = [
      "available commands:",
      "  help            show this list",
      "  whoami          who is Jerome",
      "  neofetch        profile card, terminal-style",
      "  ls              list sections",
      "  open <section>  jump to a section (projects, skills, contact…)",
      "  demo <name>     play a project demo (openclaw · recap)",
      "  repos           live GitHub repositories",
      "  skills          print skills.json",
      "  resume          open résumé (PDF)",
      "  email           email Jerome (opens Gmail)",
      "  linkedin        open LinkedIn profile",
      "  github          open GitHub profile",
      "  theme           toggle green / amber",
      "  history         commands you've typed here",
      "  clear           clear this console",
      "",
      "tip: Tab autocompletes, ↑/↓ browse history"
    ].join("\n");

    // every command name run() understands — used by Tab completion
    var COMMANDS = [
      "help", "whoami", "neofetch", "ls", "open", "cd", "goto", "cat",
      "demo", "repos", "skills", "resume", "email", "linkedin", "github",
      "contact", "theme", "history", "clear", "date", "echo", "exit"
    ];

    var NEOFETCH = [
      " ╭───────────────╮   jerome@portfolio",
      " │  >_           │   ─────────────────",
      " │               │   OS:        JeromeOS 2026.1 · terminal edition",
      " │   jerome-os   │   Host:      Chennai, Tamil Nadu, India",
      " ╰───────────────╯   Kernel:    B.E. CSE · DMI College of Engineering",
      "                     Shell:     Python · JavaScript",
      "                     Packages:  7 (certs) · 2 (projects)",
      "                     Focus:     AI Agents · Automation · Computer Vision",
      "                     Writing:   1,000+ LinkedIn followers",
      "                     Contact:   prakashjerome152@gmail.com"
    ].join("\n");

    var SKILLS = [
      "{",
      '  "languages":       ["Python", "JavaScript", "HTML", "CSS"],',
      '  "ai_automation":   ["AI Agents", "Prompt Engineering", "Workflow Automation", "RAG"],',
      '  "tools":           ["Git", "GitHub", "WSL2 / Linux", "REST APIs", "Telegram Bots"],',
      '  "computer_vision": ["Hand & Gesture Detection", "Real-time HCI"],',
      '  "communication":   ["Technical Writing", "Documentation", "Content Strategy"]',
      "}"
    ].join("\n");

    function run(raw) {
      var cmd = raw.trim();
      if (!cmd) return;
      echoCommand(cmd);

      var parts = cmd.split(/\s+/);
      var name = parts[0].toLowerCase();
      var arg = (parts[1] || "").toLowerCase();

      switch (name) {
        case "help":
        case "?":
          out(HELP); break;

        case "whoami":
          out("Jerome Prakash L — CSE student building AI agents, automations & computer-vision tools.");
          go("whoami"); break;

        case "neofetch":
          out(NEOFETCH); break;

        case "history":
          out(history.length
            ? history.map(function (h, i) { return ("   " + (i + 1)).slice(-4) + "  " + h; }).join("\n")
            : "history: empty — you're looking at the first command.");
          break;

        case "ls":
        case "dir":
          out("experience/   projects/   repos/   skills.json   education/   certs/   writing.md   contact.json");
          break;

        case "open":
        case "cd":
        case "goto":
          if (SECTIONS[arg]) { out("→ " + SECTIONS[arg]); go(SECTIONS[arg]); }
          else out("open: no such section: " + (arg || "(empty)") + " — try 'ls'", "line-err");
          break;

        case "skills":
        case "cat":
          if (name === "cat" && arg && arg.indexOf("skill") === -1) {
            // normalize a leading "./" and a single trailing ".ext" (so `cat ./contact.json` works)
            var fileKey = arg.replace(/^\.\//, "").replace(/\.[^.]*$/, "");
            if (SECTIONS[fileKey]) { go(SECTIONS[fileKey]); out("→ " + arg); }
            else out("cat: " + arg + ": no such file", "line-err");
          } else {
            out(SKILLS); go("skills");
          }
          break;

        case "resume":
        case "cv":
          outHTML('opening résumé… <a href="Jerome_Prakash_L_Resume.pdf" target="_blank" rel="noopener">Jerome_Prakash_L_Resume.pdf</a>');
          window.open("Jerome_Prakash_L_Resume.pdf", "_blank", "noopener");
          break;

        case "email":
        case "mail":
          outHTML('opening Gmail compose… <a href="' + GMAIL_COMPOSE + '" target="_blank" rel="noopener">prakashjerome152@gmail.com</a>');
          window.open(GMAIL_COMPOSE, "_blank", "noopener");
          break;

        case "linkedin":
        case "in":
          outHTML('opening LinkedIn… <a href="' + LINKEDIN + '" target="_blank" rel="noopener">' + LINKEDIN + '</a>');
          window.open(LINKEDIN, "_blank", "noopener");
          break;

        case "demo":
          var target = (arg === "inbox" || arg === "recap") ? "recap"
            : (arg === "openclaw" || arg === "claw") ? "openclaw" : "";
          if (target) {
            var panel = document.getElementById("demo-" + target);
            var replayBtn = document.querySelector('.demo-replay[data-demo="' + target + '"]');
            var toggleBtn = document.querySelector('.demo-toggle[data-demo="' + target + '"]');
            if (panel && !panel.hidden && replayBtn) { replayBtn.click(); out("⟲ replaying " + target + " demo"); }
            else if (toggleBtn) { toggleBtn.click(); out("▶ playing " + target + " demo"); }
            else out("demo: not available", "line-err");
          } else {
            out("demos: openclaw · recap — try 'demo openclaw'");
          }
          break;

        case "github":
        case "gh":
          outHTML('opening GitHub… <a href="' + GITHUB + '" target="_blank" rel="noopener">' + GITHUB + '</a>');
          window.open(GITHUB, "_blank", "noopener");
          break;

        case "contact":
          go("contact"); out("→ contact"); break;

        case "theme":
          var btn = document.getElementById("theme-toggle");
          if (btn) btn.click();
          out("theme → " + document.documentElement.getAttribute("data-theme"));
          break;

        case "clear":
        case "cls":
          log.innerHTML = ""; return;

        case "sudo":
          out("nice try 😄 — permission denied.", "line-err"); break;

        case "date":
          out(new Date().toString()); break;

        case "echo":
          out(cmd.slice(4).trim()); break;

        case "exit":
          out("there is no exit from a good portfolio. type 'help'."); break;

        default:
          if (SECTIONS[name]) { go(SECTIONS[name]); out("→ " + SECTIONS[name]); }
          else out("command not found: " + name + " — type 'help'", "line-err");
      }
      scrollLog();
    }

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        var v = input.value;
        if (v.trim()) { history.push(v); histIndex = history.length; }
        run(v);
        input.value = "";
      } else if (e.key === "ArrowUp") {
        if (history.length && histIndex > 0) { histIndex--; input.value = history[histIndex]; e.preventDefault(); }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (histIndex < history.length - 1) { histIndex++; input.value = history[histIndex]; }
        else { histIndex = history.length; input.value = ""; }
      } else if (e.key === "Tab") {
        e.preventDefault();
        // complete the command word, or a section name after "open"/"cd"/"goto"/"cat"
        var val = input.value;
        var space = val.indexOf(" ");
        var prefix = space === -1 ? "" : val.slice(0, space + 1);
        var stem = (space === -1 ? val : val.slice(space + 1)).toLowerCase();
        if (!stem) return;
        var pool = space === -1 ? COMMANDS : Object.keys(SECTIONS);
        var hits = pool.filter(function (c) { return c.indexOf(stem) === 0; });
        if (hits.length === 1) {
          input.value = prefix + hits[0];
        } else if (hits.length > 1) {
          out(hits.join("   "));
          scrollLog();
        }
      }
    });

    // Clicking anywhere in the console focuses the input (terminal feel)
    var box = document.getElementById("console-box");
    if (box) box.addEventListener("click", function (e) {
      if (e.target.tagName !== "A") input.focus();
    });
  })();

})();
