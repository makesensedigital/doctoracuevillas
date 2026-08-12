// The business facts — Handbook §26.
//
// Declared ONCE, here. The markup, the structured data (JSON-LD) and the machine-readable summary
// (`llms.txt`) are all DERIVED from this object by `scripts/build-derived.mjs`, and
// `node scripts/build-derived.mjs --check` fails the gate when they have drifted.
//
// WHY THIS IS A RULE AND NOT A PREFERENCE
//
// Held in several places instead, a changed address or telephone number is several edits. By the
// third change one has been missed — and on this class of site that is not a stale comment, it is a
// PUBLISHED CONTRADICTION: the page says one thing, the structured data says another, and an
// assistant answering a question about the business confidently states whichever it read.
//
// That answer cannot be corrected afterwards, because nobody knows who received it.
//
// EVERY CLINICAL CLAIM BELOW COMES FROM THE PRACTICE'S OWN MATERIAL. Nothing here promises an
// outcome, which is both an advertising rule for medical practice in Argentina and the register the
// brief asks for: process and accompaniment, never a result.

(function (root) {
  const FACTS = {
    // -------------------------------------------------------------------- the practitioner
    name: "Dra. María Guadalupe Cuevillas",
    legalName: "María Guadalupe Cuevillas",
    tagline: "Salud hormonal femenina en todas las etapas de la vida.",
    description:
      "La Dra. María Guadalupe Cuevillas es médica endocrinóloga especializada en fertilidad y en " +
      "climaterio, y Medical Consultant en NaProTecnología formada en el Pope Paul VI Institute " +
      "(Omaha, Estados Unidos). Atiende fertilidad y salud del ciclo, climaterio y endocrinología " +
      "general, con un enfoque que estudia y corrige la causa hormonal y metabólica en lugar de " +
      "saltearla. Consulta por videollamada desde cualquier país, y en consultorio en el Hospital " +
      "Universitario Austral (Sede Escobar) y en Centro Médico Villanueva (Tigre).",
    // A practitioner has no founding date, and inventing one to fill a field is how a fact nobody
    // checked ends up in the structured data.
    foundingYear: null,

    // Obligatory on every page of a medical site in Argentina, so it is a fact here and a line in
    // the footer — an acceptance criterion, not a pre-launch review item.
    registration: {
      label: "M.N.",
      value: "149275",
      authority: "Ministerio de Salud de la Nación, Argentina",
    },

    // -------------------------------------------------------------------- reach
    // schema.org type. Pick the most specific one that is true.
    schemaType: "Physician",
    // schema.org's MedicalSpecialty enumeration, not free text — an invented value is silently
    // ignored by every consumer, which looks exactly like a value that worked.
    medicalSpecialty: ["Endocrine"],
    areaServed: { type: "Country", name: "Argentina" },
    // BCP 47. Drives <html lang>, og:locale and the copy language (§13).
    locale: "es-AR",

    // -------------------------------------------------------------------- locations
    // One entry per place. No telephone is declared on either: the practice publishes exactly one
    // number, it is a messaging line, and it lives in config.js like every other external
    // identifier. The structured data derives it from there.
    locations: [
      // PILAR IS NOT HERE ANY MORE, AND ITS ABSENCE IS THE FACT — removed 2026-08-12 and ANSWERED
      // THE SAME DAY: she is médica de staff of the Austral's Servicio de Endocrinología, and she
      // sees patients in person ONLY in that hospital's consultorios externos at the Sede Escobar.
      // Pilar was in the first build, taken from the brief, and was never separately checked; the
      // Escobar sede was added beside it on 2026-08-11 rather than in place of it, which is what
      // made both appear at once.
      // The distinction the site now draws, and the reason there is prose about it on /sobre-mi:
      // the affiliation is to a hospital whose campus is in Pilar; the CONSULTING ROOM is Escobar.
      // An address published here is an invitation to travel to it, which is why an affiliation
      // must not be listed as one.
      // THE STREET NUMBER IS 650, AND IT HAS MOVED ONCE ALREADY. The full sequence, because a fact
      // that changed twice in a day is one somebody will change a third time:
      //   642 shipped first — the standing instruction, then confirmed by Guadalupe on 2026-08-11.
      //   650 replaced it hours later, on Juan's instruction, same day.
      // 650 is also what the hospital's own page for this sede publishes
      // (hospitalaustral.edu.ar/pacientes/sedes/escobar/), so the file and the obvious source now
      // agree — which is the state that stops this from being re-litigated. 642 is what the
      // hospital's 2014 opening note and its Plan de Salud sucursal listing still carry, and what
      // the scraped directories repeat, so a source saying 642 is not new information.
      // BEFORE CHANGING IT AGAIN: get it from somebody who has been to the door recently, and say
      // in the commit who that was. A wrong number here sends a patient to the wrong address, and
      // nothing in this architecture can observe that happening.
      // The number lives only here — the footer, the structured data, llms.txt and the map link on
      // /contacto all derive from it — plus the same number as prose in that card.
      {
        label: "Hospital Universitario Austral (Sede Escobar)",
        street: "Juan P. Asborno 650",
        city: "Belén de Escobar",
        region: "Provincia de Buenos Aires",
        country: "AR",
        telephone: null,
        hours: "Jueves y viernes por la mañana; turnos por los canales del hospital",
      },
      // "Complejo Vila Terra" was all the brief gave, and a complex is not an address: it named the
      // place without saying where its door is. The street line comes from the centre's own site
      // (cmvillanueva.com.ar, 2026-08-12), which publishes "Boulevard de todos los Santos 100,
      // Complejo Comercial Vila Terra. Tigre, Provincia de Buenos Aires" in three places on one
      // page. The complex is inside the Villanueva private-neighbourhood development at Dique
      // Luján, so the name still earns its place — but as orientation in the card on /contacto,
      // not as the street line the map is built from. Nobody here has been to the door.
      {
        label: "Centro Médico Villanueva",
        street: "Boulevard de todos los Santos 100",
        city: "Tigre",
        region: "Provincia de Buenos Aires",
        country: "AR",
        telephone: null,
        hours: "Según agenda",
      },
    ],

    // -------------------------------------------------------------------- the three doors
    // Each entry becomes a card on the home page, an offer in the structured data, and a line in
    // llms.txt. Each also has its OWN URL, because each one has to be findable on its own terms —
    // an architecture decision taken with the hosting decision, because it implies redirects (§26).
    //
    // NAMED BY THE PATIENT'S NEED, NEVER BY THE METHOD. Nobody searches for a technique; they search
    // for the problem they have.
    offerings: [
      {
        id: "fertilidad",
        url: "/fertilidad/",
        navLabel: "Fertilidad",
        name: "Fertilidad y salud del ciclo",
        summary: "Buscás un embarazo y querés entender y tratar la causa.",
        detail:
          "SOP (SOMP) y resistencia a la insulina, sospecha de endometriosis, tiroides y prolactina, abortos recurrentes, factor masculino y salida de anticonceptivos.",
      },
      {
        id: "climaterio",
        url: "/climaterio/",
        navLabel: "Climaterio",
        name: "Climaterio",
        summary: "Síntomas, prevención y un plan a tu medida para esta etapa.",
        detail:
          "Sofocos y trastornos del sueño, salud ósea y cardiovascular, metabolismo, salud sexual, terapia hormonal o alternativas no hormonales.",
      },
      {
        id: "endocrinologia",
        url: "/endocrinologia/",
        navLabel: "Endocrinología",
        name: "Endocrinología general",
        summary: "Tiroides, peso, insulina, osteoporosis: tu salud hormonal integral.",
        detail:
          "Hipotiroidismo y Hashimoto, descenso de peso y resistencia a la insulina, osteoporosis y salud ósea, alteraciones del ciclo.",
      },
    ],

    // -------------------------------------------------------------------- presence
    // Used for `sameAs` in the structured data — the strongest signal tying this site to the
    // practitioner's other profiles. LinkedIn is deliberately absent: the profile is out of date, and
    // pointing search engines at a stale credential is worse than pointing them nowhere.
    profiles: [
      "https://www.instagram.com/dracuevillas/",
      "https://www.hospitalaustral.edu.ar/servicios-medicos/endocrinologia/",
    ],

    // -------------------------------------------------------------------- AI crawler policy
    // §26 requires the decision AND the reason beside it, because a policy file copied from
    // somewhere else is not a decision. `build-derived.mjs` writes both into robots.txt.
    aiCrawlers: {
      allow: true,
      reason:
        "Patients ask assistants about symptoms and specialists before they search. We would rather " +
        "those answers came from the practitioner's own published, accurate description than from a " +
        "directory listing nobody maintains.",
    },
  };

  root.SITE_FACTS = FACTS;
})(typeof globalThis !== "undefined" ? globalThis : this);
