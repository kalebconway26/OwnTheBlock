import type { Metadata } from "next";
import Simulator from "@/components/sim/Simulator";

export const metadata: Metadata = { title: "Block Simulator · OwnTheBlock" };

export default function SimulatePage() {
  return <Simulator />;
}
