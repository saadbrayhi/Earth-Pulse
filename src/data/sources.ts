export const sources = {
  gcov: {
    href: "https://nisar-docs.asf.alaska.edu/gcov/",
    label: "ASF NISAR GCOV data guide",
    description: "Product, covariance terms, radiometry and native grid documentation.",
  },
  amplitude: {
    href: "https://nisar-docs.asf.alaska.edu/amplitude/",
    label: "ASF NISAR amplitude guide",
    description: "Backscatter interpretation and sources of variation.",
  },
  asf: {
    href: "https://search.asf.alaska.edu/",
    label: "ASF data search",
    description:
      "Distribution and discovery of NISAR products. Local export parent IDs are unresolved.",
  },
  dswx: {
    href: "https://www.jpl.nasa.gov/go/opera/products/dswx-product-suite/",
    label: "NASA JPL OPERA DSWx suite",
    description:
      "Reference product maturity and sensor differences. Documentation consulted; no DSWx raster integrated.",
  },
  dswxHls: {
    href: "https://podaac.jpl.nasa.gov/dataset/OPERA_L3_DSWX-HLS_V1",
    label: "NASA PO.DAAC DSWx-HLS",
    description: "30 m optical water-classification product; candidate only.",
  },
  ramsar: {
    href: "https://rsis.ramsar.org/RISapp/files/RISrep/BD1031RIS.pdf",
    label: "Ramsar Tanguar Haor information sheet",
    description: "Wetland context; not used as a current water mask.",
  },
} as const;

export const scientificSources = Object.values(sources);
