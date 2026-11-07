import type { Metadata } from "next";
import Grow from "./Grow";

export const metadata: Metadata = { title: "Grow the app · OwnTheBlock" };

export default function GrowPage() {
  return <Grow />;
}
