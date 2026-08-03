// `/slice` — the guided product demonstration.
//
// Entirely separate from the production app: it does not touch `useAppStore`,
// does not persist, and shares nothing but the design tokens and a handful of
// presentational components. The real app at `/` is unaffected.

import { createFileRoute } from "@tanstack/react-router";
import { SliceShell } from "@/slice/SliceShell";

export const Route = createFileRoute("/slice")({
  head: () => ({
    meta: [
      { title: "iInvest — guided tour" },
      {
        name: "description",
        content:
          "An eight-minute guided walkthrough: learn to invest with practice money.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SlicePage,
});

function SlicePage() {
  return <SliceShell />;
}
