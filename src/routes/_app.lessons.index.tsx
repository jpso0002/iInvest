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
    // TopStatsBar (~73px) sits above us and the shared _app layout reserves
    // 96px (pb-24) below for the fixed TabBar — neither is a percentage
    // ancestor, so we size against the viewport directly to get a real,
    // bounded box for the internal scroll-snap container to scroll within.
    <main className="h-[calc(100dvh-73px-96px)]">
      <h1 className="sr-only">Lessons</h1>
      <LessonPath completedLessons={completed} />
    </main>
  );
}
