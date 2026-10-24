import { SAMPLE_LABEL } from "./sample-label";

export type SamplePartner = {
  id: string;
  name: string;
  category: string;
  area: string;
  note: string;
};

/** Preview only. These are not firms, and the public partners page must not import this file. */
export const partnerSample: SamplePartner[] = [
  { id: "sample-bank", name: "Sample Bank", category: "Banks", area: "Georgetown", note: SAMPLE_LABEL },
  { id: "sample-insurer", name: "Sample Insurance Broker", category: "Insurance brokers", area: "Georgetown", note: SAMPLE_LABEL },
  { id: "sample-lawyer", name: "Sample Lawyer", category: "Lawyers", area: "Georgetown", note: SAMPLE_LABEL },
  { id: "sample-surveyor", name: "Sample Surveyor", category: "Surveyors", area: "East Bank", note: SAMPLE_LABEL },
  { id: "sample-valuer", name: "Sample Valuer", category: "Valuers", area: "East Coast", note: SAMPLE_LABEL },
];
