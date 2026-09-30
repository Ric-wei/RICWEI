/* =========================================================================
   RICWEI — site interactivity (vanilla JS, no dependencies)
   ========================================================================= */
document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Welcome intro overlay -------------------------------------- */
  var welcomeOverlay = document.getElementById('welcomeOverlay');
  if (welcomeOverlay) {
    var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var alreadyWelcomed = false;
    try { alreadyWelcomed = sessionStorage.getItem('ricweiWelcomed') === '1'; } catch (e) { /* storage unavailable, ignore */ }

    var dismissTimer;

    function closeWelcome (immediate) {
      clearTimeout(dismissTimer);
      document.body.classList.remove('welcome-active');
      try { sessionStorage.setItem('ricweiWelcomed', '1'); } catch (e) { /* ignore */ }
      if (immediate) {
        welcomeOverlay.remove();
        return;
      }
      welcomeOverlay.classList.add('leaving');
      welcomeOverlay.addEventListener('animationend', function () {
        if (welcomeOverlay.parentNode) welcomeOverlay.remove();
      }, { once: true });
    }

    if (prefersReducedMotion || alreadyWelcomed) {
      // Skip the intro instantly — respects reduced-motion preference and
      // avoids replaying on every page within the same browsing session.
      closeWelcome(true);
    } else {
      welcomeOverlay.classList.add('auto-leaving');
      dismissTimer = setTimeout(function () { closeWelcome(false); }, 4100);
      welcomeOverlay.addEventListener('animationend', function (e) {
        if (e.target === welcomeOverlay) closeWelcome(true);
      });

      var skipBtn = document.getElementById('welcomeSkip');
      if (skipBtn) skipBtn.addEventListener('click', function () { closeWelcome(false); });
      welcomeOverlay.addEventListener('click', function (e) {
        if (e.target === welcomeOverlay || e.target.classList.contains('welcome-overlay-bg')) closeWelcome(false);
      });
      document.addEventListener('keydown', function onKey (e) {
        if (e.key === 'Escape') { closeWelcome(false); document.removeEventListener('keydown', onKey); }
      });
    }
  }

  /* ---------- Hero Ken Burns slideshow ------------------------------------ */
  document.querySelectorAll('.kenburns-frame').forEach(function (kbFrame, frameIdx) {
  var kbSlides = kbFrame.querySelectorAll('.kb-slide');
  var kbIndex = 0;
  if (kbSlides.length > 1) {
    setInterval(function () {
      kbSlides[kbIndex].classList.remove('active');
      kbIndex = (kbIndex + 1) % kbSlides.length;
      kbSlides[kbIndex].classList.add('active');
    }, 5000 + frameIdx * 400);
  }
});

  /* ---------- Mobile drawer menu ---------------------------------------- */
  var menuBtn = document.querySelector('.mobile-menu-btn');
  var drawer = document.querySelector('.mobile-drawer');
  var backdrop = document.querySelector('.mobile-drawer-backdrop');
  var closeDrawerBtn = document.querySelector('.close-drawer');

  function openDrawer () {
    if (!drawer) return;
    drawer.classList.add('open');
    backdrop.classList.add('show');
    menuBtn.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer () {
    if (!drawer) return;
    drawer.classList.remove('open');
    backdrop.classList.remove('show');
    menuBtn.classList.remove('open');
    document.body.style.overflow = '';
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      drawer.classList.contains('open') ? closeDrawer() : openDrawer();
    });
  }
  if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);

  /* ---------- Sticky nav shadow on scroll -------------------------------- */
  var navbar = document.querySelector('.navbar');
  function onScrollNav () {
    if (!navbar) return;
    if (window.scrollY > 12) navbar.style.boxShadow = '0 10px 30px -18px rgba(18,24,43,0.35)';
    else navbar.style.boxShadow = 'none';
  }
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  /* ---------- Back to top -------------------------------------------------- */
  var backToTop = document.querySelector('.back-to-top');
  function onScrollTop () {
    if (!backToTop) return;
    backToTop.classList.toggle('show', window.scrollY > 500);
  }
  window.addEventListener('scroll', onScrollTop, { passive: true });
  onScrollTop();

  /* ---------- Scroll reveal ------------------------------------------------ */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Stat counters ------------------------------------------------- */
  var counters = document.querySelectorAll('.counter');
  function animateCounter (el) {
    var target = parseInt(el.getAttribute('data-target'), 10) || 0;
    var duration = 1600;
    var start = null;
    function step (ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString() + (el.getAttribute('data-suffix') || '');
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window && counters.length) {
    var cIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          cIo.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cIo.observe(el); });
  }

  /* ---------- Testimonial slider -------------------------------------------- */
  var slider = document.querySelector('.testimonial-slider');
  if (slider) {
    var track = slider.querySelector('.testimonial-slides');
    var slides = slider.querySelectorAll('.t-slide');
    var dotsWrap = slider.querySelector('.t-nav');
    var prevBtn = slider.querySelector('.t-arrow.prev');
    var nextBtn = slider.querySelector('.t-arrow.next');
    var idx = 0;
    var timer;

    slides.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.className = 't-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Show testimonial ' + (i + 1));
      dot.addEventListener('click', function () { goTo(i); resetTimer(); });
      dotsWrap.appendChild(dot);
    });
    var dots = dotsWrap.querySelectorAll('.t-dot');

    function goTo (i) {
      idx = (i + slides.length) % slides.length;
      track.style.transform = 'translateX(-' + (idx * 100) + '%)';
      dots.forEach(function (d, di) { d.classList.toggle('active', di === idx); });
    }
    function resetTimer () {
      clearInterval(timer);
      timer = setInterval(function () { goTo(idx + 1); }, 6500);
    }
    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(idx - 1); resetTimer(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(idx + 1); resetTimer(); });
    resetTimer();
  }

  /* ---------- FAQ accordion --------------------------------------------------- */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var q = item.querySelector('.faq-q');
    var a = item.querySelector('.faq-a');
    q.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      item.closest('.faq-list').querySelectorAll('.faq-item').forEach(function (other) {
        other.classList.remove('open');
        other.querySelector('.faq-a').style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });

  /* ---------- Program / gallery filter tabs ------------------------------------ */
  document.querySelectorAll('[data-filter-group]').forEach(function (group) {
    var tabs = group.querySelectorAll('.filter-tab');
    var targetSelector = group.getAttribute('data-filter-group');
    var items = document.querySelectorAll(targetSelector);
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        var cat = tab.getAttribute('data-cat');
        items.forEach(function (item) {
          var match = cat === 'all' || item.getAttribute('data-cat') === cat;
          item.style.display = match ? '' : 'none';
        });
      });
    });
  });

  /* ---------- Donate: frequency toggle + amount + dynamic impact --------------- */
  var donateForm = document.querySelector('.donate-form');
  if (donateForm) {
    var freqBtns = donateForm.querySelectorAll('.freq-toggle button');
    var amountInputs = donateForm.querySelectorAll('.amount-options input');
    var customAmount = donateForm.querySelector('.custom-amount');
    var impactPreview = donateForm.querySelector('.impact-preview span');
    var frequency = 'once';

    freqBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        freqBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        frequency = btn.getAttribute('data-freq');
        updateImpact();
      });
    });

    function currentAmount () {
      var checked = donateForm.querySelector('.amount-options input:checked');
      if (checked && checked.value !== 'custom') return parseInt(checked.value, 10);
      if (customAmount && customAmount.value) return parseInt(customAmount.value, 10) || 0;
      return 0;
    }

    function updateImpact () {
      if (!impactPreview) return;
      var amt = currentAmount();
      var freqLabel = frequency === 'monthly' ? 'every month' : frequency === 'yearly' ? 'every year' : 'as a one-time gift';
      if (!amt) {
        impactPreview.innerHTML = 'Choose an amount to see your impact.';
        return;
      }
      var msg;
      if (amt >= 100000) msg = 'covers a full year\u2019s scholarship for one indigent pupil';
      else if (amt >= 50000) msg = 'supports a community maternal health outreach';
      else if (amt >= 25000) msg = 'funds learning materials for 5 pupils for a school term';
      else if (amt >= 10000) msg = 'sponsors vocational training supplies for 3 women';
      else msg = 'helps provide learning materials for a pupil in need';
      impactPreview.innerHTML = '<strong>\u20a6' + amt.toLocaleString() + '</strong> given ' + freqLabel + ' ' + msg + '.';
    }
    amountInputs.forEach(function (input) { input.addEventListener('change', updateImpact); });
    if (customAmount) customAmount.addEventListener('input', function () {
      amountInputs.forEach(function (i) { if (i.value === 'custom') i.checked = true; });
      updateImpact();
    });
    updateImpact();
  }

  /* ---------- Generic form validation ------------------------------------------- */
  document.querySelectorAll('form[data-validate]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;
      form.querySelectorAll('[required]').forEach(function (field) {
        var errorEl = field.parentElement.querySelector('.field-error');
        var fieldValid = true;
        if (field.type === 'email') {
          fieldValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim());
        } else if (field.type === 'checkbox') {
          fieldValid = field.checked;
        } else {
          fieldValid = field.value.trim().length > 0;
        }
        field.classList.toggle('field-invalid', !fieldValid);
        if (!fieldValid) valid = false;
      });
      var successEl = form.querySelector('.form-success');
      if (valid) {
        if (successEl) successEl.style.display = 'block';
        form.reset();
        form.querySelectorAll('.field-invalid').forEach(function (f) { f.classList.remove('field-invalid'); });
        if (successEl) successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        var firstInvalid = form.querySelector('.field-invalid');
        if (firstInvalid) firstInvalid.focus();
      }
    });
  });

});
