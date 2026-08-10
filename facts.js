// The business facts — Handbook §26.
//
// Declared ONCE, here. The markup, the structured data (JSON-LD) and the machine-readable summary
// (`llms.txt`) are all DERIVED from this object by `scripts/build-derived.mjs`, and
// `scripts/check-facts.mjs` fails the gate when they have drifted.
//
// WHY THIS IS A RULE AND NOT A PREFERENCE
//
// Held in several places instead, a changed address or telephone number is several edits. By the
// third change one has been missed — and on this class of site that is not a stale comment, it is a
// PUBLISHED CONTRADICTION: the page says one thing, the structured data says another, and an
// assistant answering a question about the business confidently states whichever it read.
//
// That answer cannot be corrected afterwards, because nobody knows who received it.

(function (root) {
  const FACTS = {
    // -------------------------------------------------------------------- the organization
    name: "Example Company",
    legalName: "Example Company S.A.",
    tagline: "One sentence a stranger understands, in the visitor's language.",
    description:
      "Two or three sentences. What the business does, for whom, and what makes it the right choice. This text is what a generative assistant is most likely to quote, so write it to be quoted.",
    foundingYear: "2020",

    // A registration, licence or professional number where the sector requires one to be visible.
    // Regulatory obligations of the sector are acceptance criteria, not a pre-launch review item.
    registration: null, // e.g. { label: "Licence no.", value: "1234", authority: "Regulator", url: "https://…" }

    // -------------------------------------------------------------------- reach
    // schema.org type. Pick the most specific one that is true.
    schemaType: "LocalBusiness",
    areaServed: { type: "Country", name: "Argentina" },
    // BCP 47. Drives <html lang>, og:locale and the copy language (§13).
    locale: "es-AR",

    // -------------------------------------------------------------------- locations
    // One entry per place. Empty is a valid answer for a business with no public address.
    locations: [
      {
        label: "Head office",
        street: "Example Street 123",
        city: "Buenos Aires",
        region: "CABA",
        country: "AR",
        telephone: "+540000000000",
        hours: "Mon to Fri, 9 to 18",
      },
    ],

    // -------------------------------------------------------------------- what is sold
    // Each entry becomes a section in the markup, an offer in the structured data, and a line in
    // llms.txt. If one of these has to be findable on its own terms it needs its OWN URL — that is
    // an architecture decision taken with the hosting decision, because it implies redirects (§26).
    offerings: [
      {
        id: "offering-one",
        name: "The first thing you sell",
        summary: "One sentence. What the buyer gets, not how it is built.",
        detail:
          "A paragraph a prospect can act on. Concrete, in the visitor's language, and free of internal vocabulary.",
      },
      {
        id: "offering-two",
        name: "The second thing you sell",
        summary: "One sentence.",
        detail: "A paragraph.",
      },
    ],

    // -------------------------------------------------------------------- presence
    // Used for `sameAs` in the structured data — the strongest signal tying this site to the
    // organization's other profiles.
    profiles: [],

    // -------------------------------------------------------------------- AI crawler policy
    // §26 requires the decision AND the reason beside it, because a policy file copied from
    // somewhere else is not a decision. `build-derived.mjs` writes both into robots.txt.
    aiCrawlers: {
      allow: true,
      reason:
        "We want assistants to be able to answer questions about this business accurately, from a source we control.",
    },
  };

  root.SITE_FACTS = FACTS;
})(typeof globalThis !== "undefined" ? globalThis : this);
