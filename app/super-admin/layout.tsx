import PanelLayout from "@/components/layout/panel-layout"

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PanelLayout>{children}</PanelLayout>
}
