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
     4. Interactive console (delight layer)
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
      "  ls              list sections",
      "  open <section>  jump to a section (projects, skills, contact…)",
      "  skills          print skills.json",
      "  resume          open résumé (PDF)",
      "  email           email Jerome (opens Gmail)",
      "  linkedin        open LinkedIn profile",
      "  github          open GitHub profile",
      "  theme           toggle green / amber",
      "  clear           clear this console"
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

        case "ls":
        case "dir":
          out("experience/   projects/   skills.json   education/   certs/   writing.md   contact.json");
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
      }
    });

    // Clicking anywhere in the console focuses the input (terminal feel)
    var box = document.getElementById("console-box");
    if (box) box.addEventListener("click", function (e) {
      if (e.target.tagName !== "A") input.focus();
    });
  })();

})();
