import { Suspense } from "react";

import TeacherDashboard from "../../frontend/app/teacher/page";

export const dynamic = "force-dynamic";

export default function TeacherPage(): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <TeacherDashboard />
    </Suspense>
  );
}
