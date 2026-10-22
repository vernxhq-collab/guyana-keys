"use client";

import { useState } from "react";

export function SampleIntro() {
  const [note, setNote] = useState("");
  return (
    <>
      <button className="btn" type="button" onClick={() => setNote("Sample preview. This does not send a lead.")}>Request intro</button>
      {note ? <p>{note}</p> : null}
    </>
  );
}
