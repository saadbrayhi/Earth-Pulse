import { project, radarMission, routes } from "@/data/project";
import { analysis } from "@/data/study";
import { sources } from "@/data/sources";

export const homeHero = {
  description: `See a changing landscape through radar. ${project.name} brings ${radarMission.displayName} observations of ${analysis.location} into focus, with real data and room for uncertainty.`,
};

export const projectStories = [
  {
    icon: "Waves",
    eyebrow: "01 / THE PLACE",
    title: "A seasonal wetland mosaic",
    description: `${analysis.location} is a Ramsar-listed wetland. Its mix of water, vegetation and surrounding land makes it a useful case study for interpreting a complex radar signal.`,
    href: sources.ramsar.href,
    action: "Ramsar site information",
  },
  {
    icon: "Satellite",
    eyebrow: "02 / THE SENSOR",
    title: "Observe beyond the clouds",
    description:
      "NISAR is the NASA–ISRO Synthetic Aperture Radar mission. Radar uses its own signal to observe surfaces day or night, without needing clear optical skies.",
    href: sources.amplitude.href,
    action: "Read the NISAR guide",
  },
  {
    icon: "Layers3",
    eyebrow: "03 / THE EVIDENCE",
    title: "Compare, then question",
    description: `Swipe between two ${analysis.polarization} observations, inspect backscatter differences in decibels, and see exactly which pixels contribute to the summary. A changing signal is the starting point for investigation.`,
    href: routes.insights.href,
    action: "Inspect the measured changes",
  },
];
