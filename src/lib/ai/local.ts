export type DraftHome = {
  title: string;
  area: string;
  purpose: "Sale" | "Rent";
  beds: number;
  priceGyd: number;
  notes?: string;
};

export type DraftLead = { name: string; home: string; area: string; note: string; abroad: boolean; viewingAt?: string | null };

function gyd(value: number) {
  return "GY$" + value.toLocaleString("en-GY");
}

export function draftDescription(home: DraftHome) {
  const beds = home.beds > 0 ? `${home.beds}-bedroom ` : "";
  const deal = home.purpose === "Rent" ? "to rent" : "for sale";
  const price = home.priceGyd > 0 ? ` The asking figure is ${gyd(home.priceGyd)}.` : "";
  const notes = home.notes?.trim() ? ` ${home.notes.trim()}` : "";
  const description = `${home.title} is a ${beds}${home.purpose === "Rent" ? "rental" : "home"} ${deal} in ${home.area}.${price}${notes} A listing is not proof of title. Ask for the transport or certificate of title before any deposit.`;
  return { title: home.title, description, priceIsSuggestion: false, provider: "local" as const };
}

export function draftReply(lead: DraftLead) {
  const name = lead.name || "there";
  const when = lead.viewingAt ? ` The viewing is set. Reply if that time does not work.` : lead.note ? " Thursday afternoon can work. Tell me if you need another time." : " Tell me a day that suits you.";
  const abroad = lead.abroad ? " I can do this by WhatsApp if you are not in Guyana." : "";
  const message = `Hello ${name}, thank you for asking about ${lead.home} in ${lead.area}.${when}${abroad} A listing is not proof of title.`;
  return { message, provider: "local" as const };
}
