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
    //
    // The apex is canonical; `www` redirects to it in `_redirects`. Extensionless paths are the
    // canonical form because the host resolves `/fertilidad` to `fertilidad.html` and redirects the
    // `.html` form away — see brief.md, the hosting decision.
    canonicalOrigin: "https://doctoracuevillas.com",

    // -------------------------------------------------------------------- contact
    // Messaging number in international format, digits only — no +, no spaces, no dashes.
    // A per-control message template lives in `messages` below, never inline in the markup.
    messagingNumber: "5491159612588",
    contactMailbox: "guada@doctoracuevillas.com",

    // One template per DOOR, keyed by the door's own name — the same value the page declares as
    // `data-puerta` and the same value every event carries. A door is the unit because the only
    // thing the prepared text has to establish is which conversation this is; a per-button template
    // would multiply the copy without adding a distinction anybody reads.
    //
    // The composed text is the ENTIRE context the business receives (§26), and it deliberately asks
    // for nothing: a prepared question about symptoms, dates or medication would be data collection
    // in a messaging channel, which carries the same disclosure obligation as a form.
    messages: {
      home: "Hola, quiero consultar por un turno.",
      fertilidad: "Hola, quiero consultar por un turno de fertilidad.",
      climaterio: "Hola, quiero consultar por un turno de climaterio.",
      endocrinologia: "Hola, quiero consultar por un turno de endocrinología.",
      "sobre-mi": "Hola, quiero consultar por un turno.",
      "como-es-la-consulta": "Hola, tengo una duda sobre cómo es la consulta.",
      contacto: "Hola, quiero hacerte una consulta.",
    },

    // -------------------------------------------------------------------- scheduling
    // The booking platform stays external in v1 (no scheduling system is built here), so these are
    // provider URLs and belong in this module like any other external identifier. The markup carries
    // the key; site.js builds the destination and marks the click as an INTENT, because a visitor who
    // leaves for the scheduler can be observed departing and never arriving.
    //
    // `climaterio: null` is the pending slot from brief.md item 2. Until it holds a URL, the
    // /climaterio page converts through messaging instead, and its button says so in the served
    // markup. When the URL arrives, change the control AND its visible label together — a button
    // labelled "por WhatsApp" that opens a scheduler is a lie the gate cannot catch.
    agendas: {
      fertilidad_primera: "https://primerconsultanapro.youcanbook.me",
      fertilidad_seguimiento: "https://seguimientonapro.youcanbook.me",
      endocrinologia: "https://endodracuevillas.youcanbook.me",
      climaterio: null,
    },

    // -------------------------------------------------------------------- mailing list
    // The provider's own hosted form pages, one per audience. They are LINKED, never embedded: the
    // provider's widget is an unversioned script with no subresource integrity that writes into the
    // document, which §26 prohibits outright, and embedding it would also contact a third party on
    // first render before any consent choice. Linking keeps both rules intact and keeps the double
    // opt-in, the captcha and the consent record inside the platform that owns the list.
    newsletter: {
      fertilidad:
        "https://v3.envialosimple.com/form/renderwidget/format/html/AdministratorID/203816/FormID/1/Lang/es",
      climaterio:
        "https://v3.envialosimple.com/form/renderwidget/format/html/AdministratorID/203816/FormID/2/Lang/es",
      endocrinologia:
        "https://v3.envialosimple.com/form/renderwidget/format/html/AdministratorID/203816/FormID/3/Lang/es",
      profesionales:
        "https://v3.envialosimple.com/form/renderwidget/format/html/AdministratorID/203816/FormID/4/Lang/es",
    },

    // -------------------------------------------------------------------- measurement
    // Tag container id. Left as the placeholder below, the gate FAILS — it never degrades to a
    // console warning nobody reads (§26).
    tagContainerId: "GTM-TCHKKB37",

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
      mode: "explicit",
      jurisdiction: "Argentina — Ley 25.326 de Protección de los Datos Personales",
      decidedBy: "María Guadalupe Cuevillas",
      decidedOn: "2026-08-09",
      revisitWhen:
        "the practice advertises into the EU or the UK, a visitor's health information is collected " +
        "on the site itself rather than in a messaging channel, or remarketing tags are added to the " +
        "container. Argentine law does not require prior consent for analytics cookies; this site " +
        "asks anyway because its audience is patients and the subject matter is health, and the " +
        "decision was taken to hold the stricter line rather than the sufficient one",
      privacyUrl: "/privacidad",
    },

    // -------------------------------------------------------------------- conversion receiver
    // Where a submitted form is PERSISTED. §26: every conversion path terminates in a system the
    // business controls, and the record is written BEFORE any handoff to an external channel.
    //
    // `endpoint: null` is a legitimate answer ONLY if the site presents no form. It does not mean
    // "hand off to messaging and hope" — a control with no receiver is not a form, and the copy
    // must not claim anything was sent.
    //
    // THIS SITE PRESENTS NO FORM, deliberately. Its three conversion paths each terminate in a
    // system the practice already controls and which writes the record itself: the scheduler, the
    // messaging inbox, and the mailing platform. Nothing on this site claims to have sent anything.
    receiver: {
      endpoint: null,
      owner: "María Guadalupe Cuevillas",
      // Restricted at the provider to `canonicalOrigin`. Verified, not assumed. Nothing to restrict
      // while there is no endpoint.
      originRestricted: false,
    },

    // -------------------------------------------------------------------- third parties
    // Every origin this page is ALLOWED to contact on first render, before any interaction.
    // `scripts/check-assets.mjs` compares the markup against this list. Anything embedded
    // that is not here has to become a click-to-load placeholder (§26).
    //
    // One entry, and it only fires after the visitor accepts: the container is injected by
    // analytics.js, never by a tag in the markup.
    allowedOriginsOnFirstRender: ["https://www.googletagmanager.com"],

    // -------------------------------------------------------------------- assets
    // No build means no content-addressed filenames, so cache invalidation is manual. Bump this on
    // any change to a style, script or image; `?v=` is appended from here and nowhere else.
    assetVersion: 1,
  };

  root.SITE_CONFIG = CONFIG;
})(typeof globalThis !== "undefined" ? globalThis : this);
