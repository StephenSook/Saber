import { Suspense } from "react";

import StudentDashboard from "../../frontend/app/student/page";

export const dynamic = "force-dynamic";

export default function StudentPage(): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <StudentDashboard />
    </Suspense>
  );
}
