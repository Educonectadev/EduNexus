import PanelLayout from "@/components/layout/panel-layout"

export default function DirectorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PanelLayout>{children}</PanelLayout>
}
