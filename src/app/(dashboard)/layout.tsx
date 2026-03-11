import { SidebarNav } from "@/components/layout/sidebar-nav"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background relative overflow-x-hidden">
        <SidebarNav />
        <SidebarInset className="flex flex-col min-h-screen w-full overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 lg:hidden bg-card sticky top-0 z-30 w-full">
            <SidebarTrigger />
            <div className="flex flex-1 items-center gap-2">
              <h1 className="text-xl font-bold text-primary tracking-tighter">SOMOS VMCR</h1>
            </div>
          </header>
          <main className="flex-1 w-full overflow-y-auto">
            <div className="max-w-7xl mx-auto p-4 md:p-8">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
