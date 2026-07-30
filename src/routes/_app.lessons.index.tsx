import { createFileRoute } from "@tanstack/react-router";
import { LessonPath } from "@/components/lessons/LessonPath";
import { useAppStore } from "@/store/useAppStore";

export const Route = createFileRoute("/_app/lessons/")({
  head: () => ({
    meta: [
      { title: "Lessons · iInvest" },
      {
        name: "description",
        content:
          "Bite-sized investing lessons. Complete them in order to earn XP and practice money.",
      },
      { property: "og:title", content: "Lessons · iInvest" },
      {
        property: "og:description",
        content:
          "Bite-sized investing lessons. Earn XP and practice money as you learn.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Lessons · iInvest" },
      {
        name: "twitter:description",
        content:
          "Bite-sized investing lessons. Earn XP and practice money as you learn.",
      },
    ],
  }),
  component: LessonsPage,
});

function LessonsPage() {
  const completed = useAppStore((s) => s.user.completedLessons);

  return (
    // `h-full`, not a viewport calc: the app renders inside `.phone-frame`,
    // which is a fixed 844px on anything wider than a phone. Sizing against
    // `100dvh` made this box taller than the frame on a desktop browser, so the
    // path overflowed and left dead space. `.phone-content` is a flex child
    // with a definite height, so 100% resolves against the real container.
    <main className="h-full">
      <h1 className="sr-only">Lessons</h1>
      <LessonPath completedLessons={completed} />
    </main>
  );
}
