import TabBar from "@/components/TabBar";
import { DemoBanner } from "@/components/ui";

export default function TabsLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto min-h-dvh max-w-md pb-28">
      <DemoBanner />
      {children}
      <TabBar />
    </div>
  );
}
