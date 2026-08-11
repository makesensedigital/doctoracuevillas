// Behaviour — Handbook §26.
//
// Every external destination is BUILT HERE from config.js (and, for the practitioner's own profiles,
// from facts.js). The markup carries a key, never a URL: `data-messaging="fertilidad"` rather than a
// messaging link with the number in it. That is what makes "one configuration module holds every
// external identifier" true rather than aspirational, and `scripts/check-config.mjs` enforces it.
//
// THIS SITE HAS NO FORM, and this file has no form handling. Its three conversion paths — the
// scheduler, the messaging inbox and the mailing platform — each terminate in a system the practice
// already controls and which writes the record itself. Every one of them is a DEPARTURE, so every
// one is marked as an intent below and none of them is ever recorded as an outcome (§26).

(function () {
  const config = window.SITE_CONFIG;
  if (!config) return;

  const external = function (el, href) {
    el.setAttribute("href", href);
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener noreferrer");
    // The visitor left towards something this site cannot see. The markup declares it here because
    // this is where the destination is decided.
    el.setAttribute("data-analytics-intent", "");
  };

  // ---------------------------------------------------------------- messaging destinations
  // The composed text is the ENTIRE context the business receives, so it comes from the template
  // registered against this control's key — never from the markup, where it would drift away from
  // what the button says.
  document.querySelectorAll("[data-messaging]").forEach(function (el) {
    const key = el.getAttribute("data-messaging");
    const text = (config.messages && config.messages[key]) || "";
    external(el, "https://wa.me/" + config.messagingNumber + "?text=" + encodeURIComponent(text));
  });

  // ---------------------------------------------------------------- scheduling destinations
  //
  // A key with no URL behind it is HIDDEN rather than left in place. A scheduling button that goes
  // nowhere is not a smaller failure than a missing button — it is a larger one, because the visitor
  // spends their intent on it and the practice never learns they tried.
  document.querySelectorAll("[data-agenda]").forEach(function (el) {
    const key = el.getAttribute("data-agenda");
    const url = config.agendas && config.agendas[key];
    if (!url) {
      el.hidden = true;
      console.error(
        "site: config.agendas." + key + " has no URL, so its control was hidden. Give it a URL and " +
          "restore the control together with a label that says where it goes (Handbook §26).",
      );
      return;
    }
    external(el, url);
  });

  // ---------------------------------------------------------------- mailing list destinations
  document.querySelectorAll("[data-newsletter]").forEach(function (el) {
    const key = el.getAttribute("data-newsletter");
    const url = config.newsletter && config.newsletter[key];
    if (!url) {
      el.hidden = true;
      console.error("site: config.newsletter." + key + " has no URL, so its control was hidden.");
      return;
    }
    external(el, url);
  });

  // ---------------------------------------------------------------- the subscription form
  //
  // The mailing form is a third party's page. Loading it with the rest of the page would contact
  // that provider before the visitor has chosen anything, which is precisely what the consent
  // decision exists to prevent — so NOTHING is requested until she asks for it by clicking. That is
  // the remedy §26 names for an embed, and it is why the provider's own widget script is not used
  // here at all: it is unversioned, has no integrity attribute, and writes into the document.
  //
  // It stays an INTENT. The submission happens inside a cross-origin frame, so this site can watch
  // her ask for the form and can never watch her finish it.
  document.querySelectorAll("[data-newsletter][data-newsletter-embed]").forEach(function (el) {
    const slot = document.getElementById(el.getAttribute("aria-controls"));
    if (!slot) return;
    el.setAttribute("aria-expanded", "false");

    el.addEventListener("click", function (event) {
      const url = el.getAttribute("href");
      if (!url || slot.dataset.loaded) return;
      // Only now does anything leave the page, and it leaves for the provider, not for a new tab.
      event.preventDefault();
      slot.dataset.loaded = "1";

      const frame = document.createElement("iframe");
      frame.src = url;
      // A frame with no title is an unlabelled landmark for anyone using a screen reader.
      frame.title = "Formulario de suscripción";
      slot.insertBefore(frame, slot.firstChild);
      slot.hidden = false;
      el.setAttribute("aria-expanded", "true");
      el.hidden = true;
      slot.setAttribute("tabindex", "-1");
      slot.focus();
    });
  });

  document.querySelectorAll("[data-mailbox]").forEach(function (el) {
    el.setAttribute("href", "mailto:" + config.contactMailbox);
    if (!el.textContent.trim()) el.textContent = config.contactMailbox;
    // Handing the visitor to a mail client is a departure like any other.
    el.setAttribute("data-analytics-intent", "");
  });

  // ---------------------------------------------------------------- profiles
  // The profile URLs are business facts (they are the structured data's `sameAs`), so they are read
  // from there and matched by host fragment. Writing one into the markup as well is how the footer
  // and the structured data end up pointing at different accounts.
  const facts = window.SITE_FACTS;
  document.querySelectorAll("[data-profile]").forEach(function (el) {
    const needle = el.getAttribute("data-profile");
    const url = ((facts && facts.profiles) || []).find(function (p) {
      return p.indexOf(needle) !== -1;
    });
    if (!url) {
      el.hidden = true;
      console.error("site: no profile in facts.js matches “" + needle + "”, so its link was hidden.");
      return;
    }
    el.setAttribute("href", url);
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener noreferrer");
  });

  // ---------------------------------------------------------------- directions
  //
  // Built from the address in facts.js rather than from a stored map URL, so there is no second copy
  // of an address to fall out of step. The map opens on a click the visitor chose to make; an
  // embedded one would contact the provider with her address on first render, before any consent
  // choice, and a static site has nowhere to proxy that (§26).
  document.querySelectorAll("[data-map]").forEach(function (el) {
    const label = el.getAttribute("data-map");
    const place = ((facts && facts.locations) || []).find(function (l) {
      return l.label === label;
    });
    if (!place) {
      el.hidden = true;
      console.error("site: no location in facts.js is labelled “" + label + "”.");
      return;
    }
    const query = [place.street, place.city, place.region, "Argentina"].filter(Boolean).join(", ");
    external(el, "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(query));
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
