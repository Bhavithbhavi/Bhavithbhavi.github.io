(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  // ---------- Theme toggle ----------
  var themeBtn = document.getElementById('theme-toggle');
  var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function currentTheme() {
    return root.dataset.theme || (darkQuery.matches ? 'dark' : 'light');
  }
  function syncThemeLabel() {
    themeBtn.setAttribute('aria-label', currentTheme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
  themeBtn.addEventListener('click', function () {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    syncThemeLabel();
  });
  if (darkQuery.addEventListener) darkQuery.addEventListener('change', syncThemeLabel);
  syncThemeLabel();

  // ---------- Header: scroll border + mobile menu ----------
  var header = document.getElementById('site-header');
  var menuBtn = document.getElementById('menu-toggle');

  function setMenu(open) {
    header.classList.toggle('nav-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  menuBtn.addEventListener('click', function () {
    setMenu(!header.classList.contains('nav-open'));
  });

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  navLinks.forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });

  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Highlight the nav link for the section in the middle of the screen
  if (hasIO) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (a) {
      var section = document.querySelector(a.getAttribute('href'));
      if (section) navIO.observe(section);
    });
  }

  // ---------- Reveal on scroll ----------
  var revealEls = document.querySelectorAll('.reveal');
  if (!hasIO || reduceMotion) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  } else {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealIO.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { revealIO.observe(el); });
  }

  // ---------- Project filters ----------
  var chips = document.querySelectorAll('.chip');
  var cards = document.querySelectorAll('#project-grid .project');
  var emptyNote = document.getElementById('empty-note');

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var filter = chip.dataset.filter;
      var shown = 0;
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
      cards.forEach(function (card) {
        var match = filter === 'all' || card.dataset.tags.split(' ').indexOf(filter) !== -1;
        card.hidden = !match;
        if (match) {
          shown++;
          card.classList.add('in');
        }
      });
      emptyNote.hidden = shown > 0;
    });
  });

  // ---------- Footer year ----------
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // ---------- Hero agent graph ----------
  var svg = document.getElementById('agent-graph');
  if (svg) initGraph(svg);

  function initGraph(svg) {
    var NS = 'http://www.w3.org/2000/svg';
    var NODE_W = 104, NODE_H = 34;
    var SPEED = 0.14; // px per ms

    var nodes = {
      pdf:    { x: 65,  y: 40,  label: 'textbook.pdf', kind: 'io' },
      ocr:    { x: 200, y: 40,  label: 'Mistral OCR' },
      struct: { x: 335, y: 40,  label: 'Structure' },
      vision: { x: 200, y: 140, label: 'Vision pass', kind: 'alt' },
      blue:   { x: 335, y: 140, label: 'Blueprint' },
      rag:    { x: 65,  y: 240, label: 'Qdrant RAG', kind: 'store' },
      gap:    { x: 200, y: 240, label: 'Gap filler' },
      judge:  { x: 335, y: 240, label: 'Judge' },
      slides: { x: 65,  y: 340, label: 'Slides agent' },
      hitl:   { x: 200, y: 340, label: 'Human review', kind: 'human' },
      valid:  { x: 335, y: 340, label: 'Validator' }
    };

    // Paths run centre to centre; nodes are drawn on top so the ends stay hidden.
    var edges = {
      'pdf>ocr':       { d: 'M65 40 H200' },
      'ocr>struct':    { d: 'M200 40 H335' },
      'ocr>vision':    { d: 'M200 40 V140', alt: true },
      'vision>struct': { d: 'M200 140 H268 V40 H335', alt: true },
      'struct>blue':   { d: 'M335 40 V140' },
      'blue>judge':    { d: 'M335 140 V240' },
      'judge>blue':    { d: 'M387 240 C 414 234 414 146 387 140', alt: true },
      'rag>gap':       { d: 'M65 240 H200' },
      'judge>gap':     { d: 'M335 240 H200' },
      'gap>valid':     { d: 'M200 240 V290 H335 V340' },
      'valid>hitl':    { d: 'M335 340 H200' },
      'hitl>slides':   { d: 'M200 340 H65' }
    };

    function el(name, attrs, parent) {
      var node = document.createElementNS(NS, name);
      Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
      if (parent) parent.appendChild(node);
      return node;
    }

    var edgeLayer = el('g', {}, svg);
    var packetLayer = el('g', {}, svg);
    var nodeLayer = el('g', {}, svg);

    Object.keys(edges).forEach(function (key) {
      var e = edges[key];
      e.el = el('path', { d: e.d, class: 'edge' + (e.alt ? ' alt' : '') }, edgeLayer);
    });

    Object.keys(nodes).forEach(function (id) {
      var n = nodes[id];
      n.el = el('g', { class: 'node' + (n.kind ? ' ' + n.kind : '') }, nodeLayer);
      el('rect', { x: n.x - NODE_W / 2, y: n.y - NODE_H / 2, width: NODE_W, height: NODE_H, rx: 8 }, n.el);
      el('text', { x: n.x, y: n.y }, n.el).textContent = n.label;
    });

    // Legend in the empty cell
    var legend = el('g', { class: 'legend', transform: 'translate(18 128)' }, nodeLayer);
    el('path', { d: 'M0 0 H22', class: 'edge' }, legend);
    el('text', { x: 30, y: 0 }, legend).textContent = 'flow';
    el('path', { d: 'M0 20 H22', class: 'edge alt' }, legend);
    el('text', { x: 30, y: 20 }, legend).textContent = 'retry/fallback';

    var statusEl = document.getElementById('graph-step');
    function setStatus(text) { if (statusEl) statusEl.textContent = text; }

    if (reduceMotion) {
      setStatus('static view');
      return;
    }

    // Pause while off screen or in a background tab
    var paused = false, onScreen = true;
    function updatePaused() { paused = !onScreen || document.hidden; }
    document.addEventListener('visibilitychange', updatePaused);
    if (hasIO) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        updatePaused();
      }).observe(svg);
    }

    // Calls onFrame(progressMs) every frame until it returns true; time stops while paused.
    function ticker(onFrame) {
      return new Promise(function (resolve) {
        var elapsed = 0, last = null;
        function frame(t) {
          var dt = last === null ? 0 : Math.min(t - last, 50);
          last = t;
          if (!paused) elapsed += dt;
          if (onFrame(elapsed)) resolve();
          else requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      });
    }

    function wait(ms) {
      return ticker(function (elapsed) { return elapsed >= ms; });
    }

    function travel(key, cls) {
      var path = edges[key].el;
      var len = path.getTotalLength();
      var duration = len / SPEED;
      var dot = el('circle', { r: 4, class: 'packet' + (cls ? ' ' + cls : '') }, packetLayer);
      path.classList.add('hot');
      return ticker(function (elapsed) {
        var p = Math.min(elapsed / duration, 1);
        var eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        var pt = path.getPointAtLength(eased * len);
        dot.setAttribute('cx', pt.x);
        dot.setAttribute('cy', pt.y);
        if (p < 1) return false;
        dot.remove();
        path.classList.remove('hot');
        return true;
      });
    }

    function setActive(ids) {
      Object.keys(nodes).forEach(function (id) {
        nodes[id].el.classList.toggle('active', ids.indexOf(id) !== -1);
      });
    }

    function go(from, to, opts) {
      opts = opts || {};
      if (!opts.quiet) setStatus('running · ' + nodes[to].label);
      return travel(from + '>' + to, opts.cls).then(function () { setActive([to]); });
    }

    async function runOnce() {
      setActive(['pdf']);
      setStatus('reading textbook.pdf');
      await wait(700);
      await go('pdf', 'ocr');
      if (Math.random() < 0.4) {
        setStatus('blurry page · vision fallback');
        await go('ocr', 'vision', { quiet: true });
        await go('vision', 'struct');
      } else {
        await go('ocr', 'struct');
      }
      await go('struct', 'blue');
      await go('blue', 'judge');
      if (Math.random() < 0.5) {
        setStatus('judge rejected blueprint · retry');
        await go('judge', 'blue', { quiet: true });
        await go('blue', 'judge');
      }
      setStatus('pulling context from Qdrant');
      await Promise.all([
        go('judge', 'gap', { quiet: true }),
        go('rag', 'gap', { quiet: true, cls: 'teal' })
      ]);
      await go('gap', 'valid');
      await go('valid', 'hitl');
      setStatus('waiting for human approval');
      await wait(1300);
      await go('hitl', 'slides');
      setStatus('slides updated');
      await wait(1600);
      setActive([]);
      await wait(400);
    }

    (async function loop() {
      for (;;) await runOnce();
    })();
  }
})();
