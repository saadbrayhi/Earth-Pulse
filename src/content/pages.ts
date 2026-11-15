import { project, radarMission } from "@/data/project";
import { analysis, observationWindow } from "@/data/study";

export const siteMetadata = {
  title: `${project.name} | Wetlands in perspective`,
  description: `Explore real ${radarMission.displayName} radar observations of ${analysis.location}. Transparent analysis, visible change, honest uncertainty.`,
};

export const pages = {
  explore: {
    metadata: {
      title: `Radar Explorer | ${project.name}`,
      description: `Compare ${radarMission.displayName} ${analysis.polarization} radar backscatter observations over ${analysis.location}. Radar change is not validated flood extent.`,
    },
    header: {
      eyebrow: "OBSERVE. COMPARE. UNDERSTAND.",
      title: "A changing landscape.",
      description:
        "Inspect short-term radar changes, discover seasonal observations, and follow the evidence.",
    },
  },
  insights: {
    metadata: {
      title: `Insights | ${project.name}`,
      description: `Real full-resolution ${radarMission.name} backscatter statistics and transparent data-quality limits for ${analysis.location}.`,
    },
    header: {
      eyebrow: "EVIDENCE, WITH CONTEXT",
      title: "What the signal says.",
      description: `Full-resolution backscatter analysis · ${observationWindow}`,
    },
  },
  about: {
    metadata: {
      title: `Methodology & Sources | ${project.name}`,
      description: `Reproducible ${radarMission.name} processing, source provenance, supplemental data discovery and scientific limitations.`,
    },
    header: {
      eyebrow: "TRANSPARENCY IS PART OF THE PRODUCT",
      title: "Follow the evidence.",
      description: `The data, the decisions, and the limits behind ${project.name}.`,
    },
  },
} as const;
