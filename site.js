// Behaviour — Handbook §26.
//
// Every external destination is BUILT HERE from config.js. The markup carries a key, never a URL:
// `data-messaging="hero_primary"` rather than a messaging link with the number in it. That is what
// makes "one configuration module holds every external identifier" true rather than aspirational,
// and `scripts/check-config.mjs` enforces it.

(function () {
  const config = window.SITE_CONFIG;
  if (!config) return;

  // ---------------------------------------------------------------- messaging destinations
  // The composed text is the ENTIRE context the business receives, so it comes from the template
  // registered against this control's key — never from the markup, where it would drift away from
  // what the button says.
  document.querySelectorAll("[data-messaging]").forEach(function (el) {
    const key = el.getAttribute("data-messaging");
    const text = (config.messages && config.messages[key]) || "";
    el.setAttribute(
      "href",
      "https://wa.me/" + config.messagingNumber + "?text=" + encodeURIComponent(text),
    );
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener noreferrer");
    // A messaging handoff is a departure this site cannot observe, so it is an intent (§26).
    el.setAttribute("data-analytics-intent", "");
  });

  document.querySelectorAll("[data-mailbox]").forEach(function (el) {
    el.setAttribute("href", "mailto:" + config.contactMailbox);
    if (!el.textContent.trim()) el.textContent = config.contactMailbox;
  });

  // ---------------------------------------------------------------- navigation
  const toggle = document.getElementById("nav-toggle");
  const menu = document.getElementById("nav-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      const open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // ---------------------------------------------------------------- the form
  //
  // §26: the record is written to a system the business controls BEFORE any handoff, and a success
  // state appears only for something that was actually submitted.
  //
  // With no receiver configured there is deliberately no fallback that opens a messaging app and
  // claims success. That is the failure the rule exists to prevent: the visitor is told they are
  // done and the business is told nothing.
  const form = document.getElementById("contact-form");
  if (form) {
    const status = document.getElementById("form-status");
    const submit = form.querySelector('button[type="submit"]');

    const say = function (message, kind) {
      if (!status) return;
      status.textContent = message;
      status.dataset.kind = kind;
    };

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const endpoint = config.receiver && config.receiver.endpoint;
      if (!endpoint) {
        // Never a silent no-op and never a false success.
        say(
          "This form is not connected yet. Please use the contact details below — we do not want to lose your message.",
          "error",
        );
        console.error(
          "site: no receiver.endpoint configured. A control that persists nothing must not be " +
            "presented as a form (Handbook §26).",
        );
        return;
      }

      if (submit) submit.disabled = true;
      say("Sending…", "pending");

      fetch(endpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      })
        .then(function (response) {
          if (!response.ok) throw new Error("receiver responded " + response.status);
          // Only now is anything true.
          form.reset();
          say("Thanks — we have your message and will reply shortly.", "success");
          window.trackEvent("contact_form_submitted", {
            event_category: "conversion",
            event_label: "contact_form",
          });
        })
        .catch(function (error) {
          // The submission failed, so the visitor is told it failed and given another route. The
          // typed text stays in the fields; clearing it would destroy the only copy.
          say(
            "We could not send that. Please try again, or reach us with the contact details below.",
            "error",
          );
          console.error("site: submission failed —", error);
          window.trackEvent("contact_form_failed", {
            event_category: "conversion",
            event_label: "contact_form",
          });
        })
        .finally(function () {
          if (submit) submit.disabled = false;
        });
    });
  }

  // ---------------------------------------------------------------- consent banner
  // Rendered only under `explicit`. Refusing costs exactly what accepting costs, nothing is
  // pre-selected, and the site works with everything denied (§26).
  const banner = document.getElementById("consent-banner");
  if (banner && config.consent && config.consent.mode === "explicit") {
    let choice = null;
    try {
      choice = localStorage.getItem("consent-choice");
    } catch (e) {
      /* private mode — the banner simply shows again */
    }
    if (!choice) {
      banner.hidden = false;
      banner.querySelector("[data-consent-accept]").addEventListener("click", function () {
        window.grantConsent();
        banner.hidden = true;
      });
      banner.querySelector("[data-consent-decline]").addEventListener("click", function () {
        window.denyConsent();
        banner.hidden = true;
      });
    }
  }
})();
