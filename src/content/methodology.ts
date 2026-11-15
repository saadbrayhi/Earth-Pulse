import { project } from "@/data/project";
import { analysis, changeThresholdDb } from "@/data/study";

export const methodologySections = [
  { id: "mission", title: "Mission & case study" },
  { id: "observations", title: "Observations" },
  { id: "processing", title: "Processing" },
  { id: "water", title: "Water interpretation" },
  { id: "references", title: "Supplemental data" },
  { id: "sources", title: "Sources & credits" },
];

export const methodologyStories = [
  {
    id: "mission",
    eyebrow: "01 / PURPOSE",
    title: "Wetlands, seen through radar.",
    paragraphs: [
      `${project.name} is a ${project.event} project for “${project.challenge}”, on the ${project.track} track. It lets people inspect how the radar signal changes over ${analysis.location}, using an authentic observation pair supplied to the project.`,
      `NISAR is a joint NASA–ISRO synthetic aperture radar mission. Its active microwave measurements complement optical imagery by observing through clouds and without sunlight. ${analysis.location} is a Ramsar wetland whose seasonal mosaic of vegetation and water makes interpretation valuable — and challenging.`,
      "The supplied study boundary is a rectangle that includes the wetland and surrounding land. It is an analysis region, not an authoritative ecological or administrative boundary.",
    ],
  },
  {
    id: "water",
    eyebrow: "04 / INTERPRETATION",
    title: "Signal change is not a water classification.",
    paragraphs: [
      `Smooth open water can have low ${analysis.polarization} backscatter, but rough water, wet soil and vegetation complicate this relationship. Flooded vegetation may increase radar return. An absolute low-backscatter rule or a ±${changeThresholdDb} dB difference alone cannot reliably identify water across this landscape.`,
      "A defensible next step would use quality-masked, near-date reference classifications, assess spatial context and speckle, and evaluate a candidate classifier using held-out spatial samples. Reference products have their own errors and cannot substitute for local ground truth. No candidate-water layer is shown without that evaluation.",
      "No water-covered area, expansion, recession, percentage water change, flood extent or accuracy score is reported. The high valid-pixel fraction measures numeric coverage only; it is not classification confidence. Spatially correlated pixels are not independent validation samples.",
    ],
  },
];
