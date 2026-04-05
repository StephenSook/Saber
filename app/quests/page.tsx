import { Suspense } from "react";

import QuestView from "../../frontend/app/quests/page";

export const dynamic = "force-dynamic";

export default function QuestsPage(): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <QuestView />
    </Suspense>
  );
}
