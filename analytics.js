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

  window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });

  if (!document.querySelector('script[data-tag-container="' + containerId + '"]')) {
    const s = document.createElement("script");
    s.async = true;
    s.dataset.tagContainer = containerId;
    s.src = "https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(containerId);
    document.head.appendChild(s);
  }

  // ---------------------------------------------------------------- the API
  const base = function () {
    return {
      page_location: window.location.href,
      page_title: document.title,
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

    // `data-analytics-intent` marks a control that hands the visitor somewhere this site cannot
    // observe. The markup declares it because the markup is where the destination is.
    if (el.hasAttribute("data-analytics-intent")) window.trackIntent(name, params);
    else window.trackEvent(name, params);
  });
})();
