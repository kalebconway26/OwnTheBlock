import { Suspense } from "react";
import TraceView from "./TraceView";

export default function TracePage() {
  return (
    <Suspense fallback={<div className="h-96" aria-busy="true" />}>
      <TraceView />
    </Suspense>
  );
}
