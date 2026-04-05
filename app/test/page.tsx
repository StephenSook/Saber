import { Suspense } from "react";

import DiagnosticTest from "../../frontend/app/test/page";

export const dynamic = "force-dynamic";

export default function TestPage(): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <DiagnosticTest />
    </Suspense>
  );
}
