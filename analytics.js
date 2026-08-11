// Measurement — Handbook §26.
//
// Loaded AFTER config.js and before anything else, because the consent default has to execute
// before the tag container. Reversed, a banner is decoration: the tags have already fired.
//
// TWO RULES THIS FILE ENFORCES RATHER THAN DOCUMENTS
//
// 1. An event is named for the moment it can be VERIFIED. Where completion happens outside the
//    site — a messaging app, a scheduler, a payment page — this site observes the departure and
//    nothing after it. `trackIntent()` exists so that is impossible to record as an outcome, and
//    it stamps `outcome_confirmed: false` on every such event so the reporting cannot lose it.
//
// 2. Measurement is DECLARED IN THE MARKUP. An element states what it emits with
//    `data-analytics-event` and `data-analytics-label`; one delegated listener collects them.
//    No per-control function, no `onclick`, no second file to remember to edit. It survives
//    copy-paste, and an agent editing the markup does not have to also edit a script.

(function () {
  const config = window.SITE_CONFIG;
  const AGENDA_ORIGIN_KEY = "agenda-origin";
  const AGENDA_ORIGIN_MAX_AGE_MS = 30 * 60 * 1000;
  // The sentinel the guard below compares against, not a configured value. Naming it is the only
  // way to detect an unconfigured container, and the scan cannot tell a sentinel from the thing it
  // detects without being told — which is what the marker is for.
  const PLACEHOLDER = "GTM-XXXXXXX"; // check-config: allow — sentinel, not a value

  // Always define the API, even when measurement is not configured, so a caller never has to
  // guard. What must NOT happen is silent success — see the gate note below.
  window.trackEvent = window.trackEvent || function () {};
  window.trackIntent = window.trackIntent || function () {};

  if (!config) {
    console.error("analytics: config.js must load before analytics.js.");
    return;
  }

  window.dataLayer = window.dataLayer || [];
  const gtag = function () {
    window.dataLayer.push(arguments);
  };

  // Third-party runtimes do not participate in first paint. Calls made before they arrive remain
  // in dataLayer (or Clarity's queue) and are consumed in order once the runtime loads.
  const afterLoadAndIdle = function (callback) {
    const whenIdle = function () {
      if ("requestIdleCallback" in window) window.requestIdleCallback(callback, { timeout: 2000 });
      else window.setTimeout(callback, 0);
    };

    if (document.readyState === "complete") whenIdle();
    else window.addEventListener("load", whenIdle, { once: true });
  };

  // ---------------------------------------------------------------- session recording
  //
  // Loaded ONLY after an affirmative choice, and never on page load. This is deliberately stricter
  // than the tag container beside it: that one loads with everything denied and respects consent
  // mode, which is defensible for counting. Recording a visit is not counting, and the safe default
  // for it is not to arrive at all.
  //
  // Idempotent, because `grantConsent` also runs on a later visit from the stored choice.
  const loadSessionRecording = function () {
    const project = String(config.clarityProjectId || "").trim();
    if (!project || window.__recordingLoaded) return;
    window.__recordingLoaded = true;

    window.clarity =
      window.clarity ||
      function () {
        (window.clarity.q = window.clarity.q || []).push(arguments);
      };

    afterLoadAndIdle(function () {
      const s = document.createElement("script");
      s.async = true;
      s.src = "https://www.clarity.ms/tag/" + encodeURIComponent(project);
      document.head.appendChild(s);
    });
  };

  // ---------------------------------------------------------------- consent, before anything
  // Under `explicit`, everything starts DENIED and only an affirmative choice updates it. Under
  // `notice-only` the decision recorded in config.js is that prior consent is not required in the
  // stated jurisdiction — which is a decision with an owner and a date, not an omission.
  if (config.consent && config.consent.mode === "explicit") {
    gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
      functionality_storage: "denied",
      personalization_storage: "denied",
      security_storage: "granted",
      wait_for_update: 500,
    });

    // The visitor's choice. This is STATE, not evidence: a static site cannot produce auditable
    // proof of consent, because there is no server to hold the record (§26).
    window.grantConsent = function grantConsent() {
      gtag("consent", "update", {
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
        analytics_storage: "granted",
        functionality_storage: "granted",
        personalization_storage: "granted",
      });
      loadSessionRecording();
      try {
        localStorage.setItem("consent-choice", "granted");
      } catch (e) {
        /* private mode — the choice simply does not persist */
      }
    };
    window.denyConsent = function denyConsent() {
      try {
        localStorage.setItem("consent-choice", "denied");
      } catch (e) {
        /* as above */
      }
    };
    try {
      if (localStorage.getItem("consent-choice") === "granted") window.grantConsent();
    } catch (e) {
      /* as above */
    }
  }

  // Under `notice-only` the recorded decision is that prior consent is not required, so the same
  // rule applies to recording as to counting. This site is `explicit`, so this branch does nothing
  // here — it exists so that changing the mode changes both together rather than only one.
  if (!config.consent || config.consent.mode !== "explicit") loadSessionRecording();

  // ---------------------------------------------------------------- the container
  const containerId = String(config.tagContainerId || "").trim();

  // A placeholder here is a FAILURE, not a warning. `scripts/check-placeholders.mjs` fails the
  // gate on it, which is the point: a console warning is read by nobody, and a site that ships
  // without measurement cannot recover the history it did not record (§26).
  if (!containerId || containerId === PLACEHOLDER) {
    console.error(
      "analytics: tagContainerId is unset or still the placeholder. The site is publishing " +
        "without measurement, and that history cannot be reconstructed backwards (Handbook §26).",
    );
    return;
  }

  afterLoadAndIdle(function () {
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });

    if (!document.querySelector('script[data-tag-container="' + containerId + '"]')) {
      const s = document.createElement("script");
      s.async = true;
      s.dataset.tagContainer = containerId;
      s.src = "https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(containerId);
      document.head.appendChild(s);
    }
  });

  // ---------------------------------------------------------------- the API
  // `puerta` — which of the site's doors the visitor was standing in when the event fired. It is on
  // EVERY event rather than on the ones that seemed to need it, because the question the measurement
  // exists to answer is "which door converts", and an event that arrives without it cannot be
  // assigned to one afterwards. The page declares it once on <body>; no control repeats it.
  const base = function () {
    return {
      page_location: window.location.href,
      page_title: document.title,
      puerta: (document.body && document.body.dataset.puerta) || "",
    };
  };

  // An OUTCOME the site actually observed.
  window.trackEvent = function trackEvent(name, params) {
    if (!name) return;
    window.dataLayer.push(
      Object.assign({ event: name, outcome_confirmed: true }, base(), params || {}),
    );
  };

  // A DEPARTURE. The visitor left towards something this site cannot see, so the name says so and
  // `outcome_confirmed` stays false. Never designate one of these the primary conversion (§26).
  window.trackIntent = function trackIntent(name, params) {
    if (!name) return;
    const safe = /_intent$|^.*_open$/.test(name) ? name : name + "_intent";
    window.dataLayer.push(
      Object.assign({ event: safe, outcome_confirmed: false }, base(), params || {}),
    );
  };

  // ---------------------------------------------------------------- declarative collection
  const clean = function (v) {
    return String(v || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80);
  };

  const pointsToTurno = function (el) {
    const href = el.getAttribute("href");
    if (!href) return false;
    try {
      const destination = new URL(href, window.location.href);
      return (
        destination.origin === window.location.origin &&
        destination.pathname === "/como-es-la-consulta/" &&
        destination.hash === "#turno"
      );
    } catch (e) {
      return false;
    }
  };

  const rememberAgendaOrigin = function (eventLabel) {
    try {
      sessionStorage.setItem(
        AGENDA_ORIGIN_KEY,
        JSON.stringify({
          puerta: base().puerta,
          label: clean(eventLabel),
          ts: Date.now(),
        }),
      );
    } catch (e) {
      /* storage can be unavailable; attribution then stays explicitly empty */
    }
  };

  const consumeAgendaOrigin = function () {
    const empty = { origen_puerta: "", origen_control: "" };
    if (window.location.pathname !== "/como-es-la-consulta/") return empty;

    try {
      const raw = sessionStorage.getItem(AGENDA_ORIGIN_KEY);
      if (!raw) return empty;

      const stored = JSON.parse(raw);
      const age = Date.now() - Number(stored.ts);
      sessionStorage.removeItem(AGENDA_ORIGIN_KEY);
      if (!Number.isFinite(age) || age < 0 || age >= AGENDA_ORIGIN_MAX_AGE_MS) return empty;

      return {
        origen_puerta: clean(stored.puerta),
        origen_control: clean(stored.label),
      };
    } catch (e) {
      try {
        sessionStorage.removeItem(AGENDA_ORIGIN_KEY);
      } catch (storageError) {
        /* storage remains unavailable */
      }
      return empty;
    }
  };

  document.addEventListener("click", function (event) {
    const el = event.target.closest("[data-analytics-event]");
    if (!el) return;

    const name = el.dataset.analyticsEvent;
    const params = {
      event_category: el.dataset.analyticsCategory || "engagement",
      event_label: el.dataset.analyticsLabel || el.id || "",
      link_text: clean(el.textContent),
    };
    const href = el.getAttribute("href");
    if (href) params.link_url = href;

    // Two dimensions that cannot be inferred from the control or the page, and that a stated
    // question depends on: WHICH scheduler was opened, and WHICH audience subscribed. Nothing else
    // is instrumented — a property with no question behind it is noise that survives forever.
    if (el.dataset.analyticsAgenda) params.agenda = el.dataset.analyticsAgenda;
    if (el.dataset.analyticsAudiencia) params.audiencia = el.dataset.analyticsAudiencia;

    if (pointsToTurno(el)) rememberAgendaOrigin(params.event_label);
    if (name === "agenda") Object.assign(params, consumeAgendaOrigin());

    // `data-analytics-intent` marks a control that hands the visitor somewhere this site cannot
    // observe. The markup declares it because the markup is where the destination is.
    if (el.hasAttribute("data-analytics-intent")) window.trackIntent(name, params);
    else window.trackEvent(name, params);
  });
})();
