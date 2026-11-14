export const methodologyStories = [
  {
    id: "mission",
    eyebrow: "01 / PURPOSE",
    title: "Wetlands, seen through radar.",
    paragraphs: [
      "EarthPulse is a NASA Space Apps 2026 project for “Dancing with the SARs”, on the Water & Wetlands Monitoring track. It lets people inspect how the radar signal changes over Tanguar Haor, Bangladesh, using an authentic observation pair supplied to the project.",
      "NISAR is a joint NASA–ISRO synthetic aperture radar mission. Its active microwave measurements complement optical imagery by observing through clouds and without sunlight. Tanguar Haor is a Ramsar wetland whose seasonal mosaic of vegetation and water makes interpretation valuable — and challenging.",
      "The supplied study boundary is a rectangle that includes the wetland and surrounding land. It is an analysis region, not an authoritative ecological or administrative boundary.",
    ],
  },
  {
    id: "water",
    eyebrow: "04 / INTERPRETATION",
    title: "Signal change is not a water classification.",
    paragraphs: [
      "Smooth open water can have low HH backscatter, but rough water, wet soil and vegetation complicate this relationship. Flooded vegetation may increase radar return. An absolute low-backscatter rule or a ±3 dB difference alone cannot reliably identify water across this landscape.",
      "A defensible next step would use quality-masked, near-date reference classifications, assess spatial context and speckle, and evaluate a candidate classifier using held-out spatial samples. Reference products have their own errors and cannot substitute for local ground truth. No candidate-water layer is shown without that evaluation.",
      "No water-covered area, expansion, recession, percentage water change, flood extent or accuracy score is reported. The high valid-pixel fraction measures numeric coverage only; it is not classification confidence. Spatially correlated pixels are not independent validation samples.",
    ],
  },
];

export const scientificSources = [
  {
    href: "https://nisar-docs.asf.alaska.edu/gcov/",
    label: "ASF NISAR GCOV data guide",
    description: "Product, covariance terms, radiometry and native grid documentation.",
  },
  {
    href: "https://nisar-docs.asf.alaska.edu/amplitude/",
    label: "ASF NISAR amplitude guide",
    description: "Backscatter interpretation and sources of variation.",
  },
  {
    href: "https://search.asf.alaska.edu/",
    label: "ASF data search",
    description:
      "Distribution and discovery of NISAR products. Local export parent IDs are unresolved.",
  },
  {
    href: "https://www.jpl.nasa.gov/go/opera/products/dswx-product-suite/",
    label: "NASA JPL OPERA DSWx suite",
    description:
      "Reference product maturity and sensor differences. Documentation consulted; no DSWx raster integrated.",
  },
  {
    href: "https://podaac.jpl.nasa.gov/dataset/OPERA_L3_DSWX-HLS_V1",
    label: "NASA PO.DAAC DSWx-HLS",
    description: "30 m optical water-classification product; candidate only.",
  },
  {
    href: "https://rsis.ramsar.org/RISapp/files/RISrep/BD1031RIS.pdf",
    label: "Ramsar Tanguar Haor information sheet",
    description: "Wetland context; not used as a current water mask.",
  },
];
