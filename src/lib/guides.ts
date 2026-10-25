export const depositParagraph = "Prices show GYD and a USD guide. A listing is not proof of title. Have an attorney search the registry before any deposit. A viewing from abroad is a request the agent confirms. This is not a valuation and not a promised return.";

export const guides = [
  {
    slug: "buying-from-abroad",
    href: "/guides/buying-from-abroad",
    title: "Buying from abroad",
    line: "Buying from overseas with confidence, from reading prices in GYD to working with an attorney in Guyana.",
    icon: "abroad",
  },
  {
    slug: "spotting-scams",
    href: "/guides/spotting-scams",
    title: "Spotting property scams",
    line: "The warning signs to know, and the papers to see before any money changes hands.",
    icon: "shield",
  },
  {
    slug: "renting",
    href: "/guides/renting",
    title: "Renting in Guyana",
    line: "Finding the right place to rent, what to ask before you sign, and how to read the price.",
    icon: "key",
  },
] as const;

export type GuideIconName = (typeof guides)[number]["icon"];
