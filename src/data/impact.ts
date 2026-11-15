export type EvidenceType =
  "External historical research" | "Reported historical estimate" | "General environmental context";
export interface ImpactEvidence {
  id: string;
  eventYear: number;
  period: string;
  title: string;
  scope: string;
  description: string;
  evidenceType: EvidenceType;
  sourceOrganization: string;
  sourceUrl: string;
  publicationDate: string;
  method: string;
  metrics: { label: string; value: number; unit: string }[];
}
export const impactEvidence: ImpactEvidence[] = [
  {
    id: "sunamganj-2017",
    eventYear: 2017,
    period: "Early flash flood, 2017",
    title: "When water arrives before harvest",
    scope: "Haor areas of Sunamganj district; not the EarthPulse image rectangle",
    description:
      "A published assessment documents losses to Boro cultivation and fisheries. The reported people and production losses describe the wider district, not locations inferred from our radar pixels.",
    evidenceType: "External historical research",
    sourceOrganization:
      "Mondal, Akter, Hiya & Farukh / Journal of Environmental Science and Natural Resources",
    sourceUrl: "https://www.banglajol.info/index.php/JESNR/article/view/52007/36873",
    publicationDate: "2021 (online); journal volume dated 2019",
    method:
      "Published district assessment of 2017 rice and fish losses; DOI 10.3329/jesnr.v12i1-2.52007. Figures are the paper's reported estimates.",
    metrics: [
      { label: "Affected Boro cultivation", value: 149224, unit: "ha" },
      { label: "Damaged rice", value: 393855, unit: "metric tonnes" },
      { label: "Affected farmers", value: 315084, unit: "people" },
      { label: "Affected fishermen", value: 44445, unit: "people" },
    ],
  },
  {
    id: "haor-2026",
    eventYear: 2026,
    period: "26 April–4 May 2026",
    title: "A narrow harvest window, major consequences",
    scope: "Seven haor districts of Bangladesh; not Tanguar Haor alone",
    description:
      "The Daily Star reported agriculture-ministry estimates during the disaster response. These are dated historical estimates, not a final loss inventory or measurements from the October radar pair.",
    evidenceType: "Reported historical estimate",
    sourceOrganization: "Bangladesh agriculture ministry, as reported by The Daily Star",
    sourceUrl:
      "https://www.thedailystar.net/business/news/haor-floods-wipe-out-tk-1047-crore-crops-agri-ministry-4170151",
    publicationDate: "2026-05-07",
    method:
      "Contemporaneous ministry/DAE assessment reported in news; article does not publish a complete estimation protocol. Later estimates differ.",
    metrics: [
      { label: "Reported damaged cropland", value: 49073, unit: "ha" },
      { label: "Reported Boro rice loss", value: 213000, unit: "metric tonnes" },
      { label: "Approximately affected farmers", value: 236000, unit: "people" },
    ],
  },
];
export const impactSources = {
  biodiversity: {
    url: "https://www.ramsar.org/fr/news/bangladesh-designates-its-2nd-ramsar-site",
    label: "Ramsar designation announcement, 6 September 2000",
    scope: "Designated Tanguar Haor Ramsar site",
    areaHa: 9500,
    fishSpecies: 135,
    birdSpecies: 208,
  },
  sar: {
    url: "https://www.mdpi.com/2072-4292/11/13/1581",
    label: "Uddin, Matin & Meyer (2019)",
    accuracy: 96.44,
  },
  alternative2026: {
    url: "https://cpd.org.bd/resources/2026/06/CPD_IRBD_3rd-Reading-FY26_Presentation.pdf",
    label: "CPD, June 2026 assessment, slide 68",
    riceLossTonnes: 339449,
    description:
      "CPD's revised central estimate uses harvest-completion, capacity and differentiated loss assumptions. It differs from the May ministry estimate; the figures must not be combined.",
  },
} as const;
