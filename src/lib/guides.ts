export const depositParagraph = "Prices show GYD and a USD guide. A listing is not proof of title. Have an attorney search the registry before any deposit. A viewing from abroad is a request the agent confirms. This is not a valuation and not a promised return.";

export const guides = [
  {
    slug: "buying-from-abroad",
    href: "/guides/buying-from-abroad",
    title: "Buying from abroad",
    line: "GYD and a USD guide, and how to instruct an attorney from overseas.",
    icon: "abroad",
  },
  {
    slug: "spotting-scams",
    href: "/guides/spotting-scams",
    title: "Spotting property scams",
    line: "Red flags, deposits, and what to ask for before you pay.",
    icon: "shield",
  },
  {
    slug: "renting",
    href: "/guides/renting",
    title: "Renting in Guyana",
    line: "The same search as a sale, and what the price figures mean.",
    icon: "key",
  },
] as const;

export type GuideIconName = (typeof guides)[number]["icon"];
