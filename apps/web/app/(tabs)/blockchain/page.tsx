import { Suspense } from "react";
import BlockchainView from "./BlockchainView";

export default function BlockchainPage() {
  return (
    <Suspense fallback={<div className="h-96" aria-busy="true" />}>
      <BlockchainView />
    </Suspense>
  );
}
