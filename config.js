// The configuration module — Handbook §26.
//
// EVERY external identifier this site uses lives here and nowhere else: the messaging number, the
// canonical domain, container ids, form ids, scheduling URLs, the contact mailbox, the asset version.
// `scripts/check-config.mjs` fails the gate on a literal for any of them found anywhere else.
//
// The rule is not tidiness. An identifier repeated across a page is a search-and-replace waiting to
// go wrong, and the cost is paid in production: a wrong number on one of eleven buttons looks exactly
// like a right one.
//
// NOTHING HERE IS A SECRET. Everything in this file is delivered to the visitor's browser and is
// readable there. These are PUBLIC IDENTIFIERS, and they are protected at the provider — restricted
// by origin or domain in each provider's own console. An identifier that cannot be restricted that
// way does not belong in a static site at all (§26; §4 is sharpened here, not relaxed).
//
// Loaded before analytics.js, because the consent default has to execute before the tag container.

(function (root) {
  const CONFIG = {
    // -------------------------------------------------------------------- identity
    // The canonical origin, with protocol and no trailing slash. Absolute URLs in the head, the
    // sitemap and the structured data are all derived from this.
    canonicalOrigin: "https://example.com",

    // -------------------------------------------------------------------- contact
    // Messaging number in international format, digits only — no +, no spaces, no dashes.
    // A per-control message template lives in `messages` below, never inline in the markup.
    messagingNumber: "0000000000000",
    contactMailbox: "hello@example.com",

    // One template per conversion control. The key is the control's analytics label, so the visible
    // control, the event it emits and the text it composes cannot drift apart.
    // The composed text is the ENTIRE context the business receives (§26).
    messages: {
      hero_primary: "Hi — I found you through the site and I would like to know more.",
      pricing_enquiry: "Hi — I would like to ask about pricing.",
      footer_contact: "Hi — I would like to get in touch.",
    },

    // -------------------------------------------------------------------- measurement
    // Tag container id. Left as the placeholder below, the gate FAILS — it never degrades to a
    // console warning nobody reads (§26).
    tagContainerId: "GTM-XXXXXXX",

    // -------------------------------------------------------------------- consent
    // The recorded decision. §26 requires the jurisdiction, the owner, the date and — the
    // load-bearing half — THE CONDITION THAT WOULD CHANGE THE ANSWER, because whoever revisits
    // this will not have the context.
    //
    // `mode: "notice-only"` means: a privacy statement, no banner, measurement on by default.
    // `mode: "explicit"` means: default denied, banner, measurement only after a choice.
    //
    // NOTE THE LIMITATION, which is architectural and not a setting: a static site CANNOT produce
    // auditable PROOF of consent. The record lives in the visitor's browser — that is state, not
    // evidence. Where proof is required, an external receiver is needed (§26).
    consent: {
      mode: "notice-only",
      jurisdiction: "TBD — name the country or bloc whose law this answers",
      decidedBy: "TBD — a person, not a team",
      decidedOn: "TBD — YYYY-MM-DD",
      revisitWhen:
        "the client sells or advertises into a jurisdiction requiring prior consent, the site handles special-category data, or profiling for advertising is introduced",
      privacyUrl: "/privacy.html",
    },

    // -------------------------------------------------------------------- conversion receiver
    // Where a submitted form is PERSISTED. §26: every conversion path terminates in a system the
    // business controls, and the record is written BEFORE any handoff to an external channel.
    //
    // `endpoint: null` is a legitimate answer ONLY if the site presents no form. It does not mean
    // "hand off to messaging and hope" — a control with no receiver is not a form, and the copy
    // must not claim anything was sent.
    receiver: {
      endpoint: null, // e.g. "https://forms.example-provider.com/f/abc123"
      owner: "TBD — the person who answers a submission, by name",
      // Restricted at the provider to `canonicalOrigin`. Verified, not assumed.
      originRestricted: false,
    },

    // -------------------------------------------------------------------- third parties
    // Every origin this page is ALLOWED to contact on first render, before any interaction.
    // `scripts/check-third-parties.mjs` compares the markup against this list. Anything embedded
    // that is not here has to become a click-to-load placeholder (§26).
    allowedOriginsOnFirstRender: ["https://www.googletagmanager.com"],

    // -------------------------------------------------------------------- assets
    // No build means no content-addressed filenames, so cache invalidation is manual. Bump this on
    // any change to a style, script or image; `?v=` is appended from here and nowhere else.
    assetVersion: 1,
  };

  root.SITE_CONFIG = CONFIG;
})(typeof globalThis !== "undefined" ? globalThis : this);
