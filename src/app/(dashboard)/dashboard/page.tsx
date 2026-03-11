"use client"

import { useMemo } from "react"
import { StatsCard } from "@/components/dashboard/stats-card"
import { 
  Users, 
  FileCheck, 
  TrendingUp, 
  Wallet, 
  Clock, 
  Mic, 
  CheckCircle2,
  Calendar,
  ArrowRight
} from "lucide-react"
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit, where, Timestamp } from "firebase/firestore"
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const { firestore, user } = useFirebase()

  // Queries for real data - depend on user presence to ensure auth state is ready
  const clientsRef = useMemoFirebase(() => (firestore && user) ? collection(firestore, "clients") : null, [firestore, user])
  const contractsRef = useMemoFirebase(() => (firestore && user) ? collection(firestore, "contracts") : null, [firestore, user])
  const salesRef = useMemoFirebase(() => (firestore && user) ? collection(firestore, "sales") : null, [firestore, user])
  const paymentsRef = useMemoFirebase(() => (firestore && user) ? collection(firestore, "payments") : null, [firestore, user])

  const { data: clients } = useCollection(clientsRef)
  const { data: contracts } = useCollection(contractsRef)
  const { data: sales } = useCollection(salesRef)
  const { data: payments } = useCollection(paymentsRef)

  // Calculations for KPIs
  const metrics = useMemo(() => {
    if (!clients || !contracts || !sales || !payments) return null

    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()

    const monthlySales = sales.filter(s => {
      const d = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt)
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear
    })

    const monthlyIncome = payments.filter(p => {
      const d = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt)
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear
    })

    const totalSalesMonth = monthlySales.reduce((acc, s) => acc + (s.amount || 0), 0)
    const totalIncomeMonth = monthlyIncome.reduce((acc, p) => acc + (p.amountPaid || 0), 0)
    
    const activeClients = clients.filter(c => c.isActive).length
    const activeContracts = contracts.filter(c => c.status === 'Activo').length
    
    // Contracts expiring soon (next 30 days)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    const expiringSoon = contracts.filter(c => {
      const end = new Date(c.endDate)
      return end > now && end <= thirtyDaysFromNow && c.status === 'Activo'
    }).length

    const pendingPayments = sales.filter(s => s.paymentStatus === 'Pendiente').reduce((acc, s) => acc + (s.amount || 0), 0)

    return {
      totalSalesMonth,
      totalIncomeMonth,
      activeClients,
      activeContracts,
      expiringSoon,
      pendingPayments
    }
  }, [clients, contracts, sales, payments])

  // Chart Data
  const stationData = useMemo(() => {
    if (!sales) return []
    const xhjzTotal = sales.filter(s => s.station?.includes('XHJZ')).reduce((acc, s) => acc + (s.amount || 0), 0)
    const xhjsTotal = sales.filter(s => s.station?.includes('XHJS')).reduce((acc, s) => acc + (s.amount || 0), 0)
    return [
      { name: 'XHJZ 92.9 FM', total: xhjzTotal },
      { name: 'XHJS 98.5 FM', total: xhjsTotal }
    ]
  }, [sales])

  const recentSales = useMemo(() => sales?.slice(0, 5) || [], [sales])
  const upcomingContracts = useMemo(() => {
    return contracts?.filter(c => c.status === 'Activo').sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()).slice(0, 5) || []
  }, [contracts])

  if (!metrics) return <div className="p-8 text-center text-muted-foreground">Cargando métricas en tiempo real...</div>

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Panel de Control</h2>
        <p className="text-muted-foreground">Resumen financiero y operativo de SOMOS VMCR</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Ventas del Mes" 
          value={`$${metrics.totalSalesMonth.toLocaleString()}`} 
          icon={TrendingUp} 
          description="Total acumulado este mes" 
        />
        <StatsCard 
          title="Ingresos Reales" 
          value={`$${metrics.totalIncomeMonth.toLocaleString()}`} 
          icon={Wallet} 
          description="Pagos recibidos este mes" 
        />
        <StatsCard 
          title="Clientes Activos" 
          value={metrics.activeClients} 
          icon={Users} 
          description="Cartera actual vigente" 
        />
        <StatsCard 
          title="Contratos Activos" 
          value={metrics.activeContracts} 
          icon={FileCheck} 
          description={`${metrics.expiringSoon} por vencer pronto`} 
        />
        <StatsCard 
          title="Cuentas por Cobrar" 
          value={`$${metrics.pendingPayments.toLocaleString()}`} 
          icon={Clock} 
          description="Ventas con pago pendiente" 
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-card border rounded-lg p-6 flex flex-col">
          <h3 className="text-lg font-bold mb-6 text-primary uppercase tracking-tighter">Ingresos por Estación</h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stationData}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  itemStyle={{ color: '#E61717' }}
                  cursor={{ fill: 'rgba(230, 23, 23, 0.1)' }}
                />
                <Bar dataKey="total" fill="#E61717" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-primary uppercase tracking-tighter">Ventas Recientes</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sales">Ver todas <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="space-y-4">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-md border border-border/50">
                <div className="overflow-hidden">
                  <p className="font-bold text-white truncate">{sale.clientName}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{sale.station}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="font-black text-accent">${sale.amount?.toLocaleString()}</p>
                  <Badge variant="outline" className={`text-[9px] h-4 ${sale.paymentStatus === 'Pagado' ? 'text-green-500 border-green-500/30' : 'text-orange-500 border-orange-500/30'}`}>
                    {sale.paymentStatus}
                  </Badge>
                </div>
              </div>
            ))}
            {recentSales.length === 0 && <p className="text-center text-muted-foreground py-10 italic">Sin ventas registradas.</p>}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-card border rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-primary uppercase tracking-tighter">Contratos por Vencer</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/contracts">Gestionar <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="space-y-4">
            {upcomingContracts.map((contract) => (
              <div key={contract.id} className="flex items-center justify-between p-3 bg-muted/10 rounded-md border border-dashed">
                <div>
                  <p className="font-medium text-white">{contract.clientName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-3 w-3 text-accent" />
                    <p className="text-[10px] text-muted-foreground">Vence: {contract.endDate}</p>
                  </div>
                </div>
                <Badge className="bg-primary/10 text-primary border-none text-[10px]">Expira Pronto</Badge>
              </div>
            ))}
            {upcomingContracts.length === 0 && <p className="text-center text-muted-foreground py-10 italic">No hay contratos próximos a vencer.</p>}
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-lg font-bold text-primary uppercase tracking-tighter mb-6">Nuevos Clientes</h3>
          <div className="grid grid-cols-2 gap-4">
             {clients?.slice(0, 4).map(client => (
               <Link key={client.id} href={`/clients/${client.id}`} className="p-4 bg-muted/20 rounded-lg border hover:border-primary/50 transition-colors group">
                  <p className="font-bold text-white truncate group-hover:text-primary">{client.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{client.companyName}</p>
               </Link>
             ))}
             {clients?.length === 0 && <p className="col-span-2 text-center text-muted-foreground py-10 italic">Registra tu primer cliente.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}