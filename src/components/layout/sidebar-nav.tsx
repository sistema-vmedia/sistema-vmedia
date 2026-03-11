
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BadgeDollarSign, 
  CreditCard, 
  Mic2, 
  Radio, 
  Clock, 
  FileCheck, 
  Quote,
  LogOut
} from "lucide-react"
import { Role } from "@/lib/types"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar"

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['Administrador', 'Ventas', 'Cobranza', 'Producción'] },
  { name: 'Clientes', href: '/clients', icon: Users, roles: ['Administrador', 'Ventas'] },
  { name: 'Contratos', href: '/contracts', icon: FileCheck, roles: ['Administrador', 'Ventas'] },
  { name: 'Ventas', href: '/sales', icon: BadgeDollarSign, roles: ['Administrador', 'Ventas'] },
  { name: 'Cobranza', href: '/billing', icon: CreditCard, roles: ['Administrador', 'Cobranza'] },
  { name: 'Cotizaciones', href: '/quotes', icon: Quote, roles: ['Administrador', 'Ventas'] },
  { name: 'Spots', href: '/spots', icon: Mic2, roles: ['Administrador', 'Ventas', 'Producción'] },
  { name: 'Órdenes', href: '/transmission-orders', icon: Radio, roles: ['Administrador', 'Ventas'] },
  { name: 'Horarios', href: '/schedules', icon: Clock, roles: ['Administrador', 'Ventas'] },
  { name: 'Facturas Int.', href: '/invoices', icon: FileText, roles: ['Administrador', 'Ventas', 'Cobranza'] },
]

export function SidebarNav({ userRole = 'Administrador' }: { userRole?: Role }) {
  const pathname = usePathname()
  const { setOpenMobile, isMobile } = useSidebar()

  const filteredNavigation = navigation.filter(item => item.roles.includes(userRole))

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar collapsible="icon" className="border-r bg-card">
      <SidebarHeader className="p-6">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-primary tracking-tighter">SOMOS VMCR</h1>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">VMedia Comunicaciones</p>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        <SidebarMenu>
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.name}
                  className={cn(
                    "transition-colors",
                    isActive 
                      ? "bg-primary text-white hover:bg-primary/90" 
                      : "text-muted-foreground hover:bg-secondary hover:text-white"
                  )}
                >
                  <Link href={item.href} onClick={handleLinkClick}>
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border mt-auto">
        <div className="flex items-center gap-3 px-3 py-2 mb-4 overflow-hidden">
          <div className="h-8 w-8 shrink-0 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white">
            {userRole[0]}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">Usuario Demo</span>
            <span className="text-[10px] text-muted-foreground uppercase">{userRole}</span>
          </div>
        </div>
        <button className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors">
          <LogOut className="h-5 w-5" />
          <span>Cerrar Sesión</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  )
}
