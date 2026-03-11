"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  BadgeDollarSign, 
  Calendar, 
  Radio, 
  Package, 
  User, 
  FileCheck,
  MessageSquare,
  History as HistoryIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { toast } from "@/hooks/use-toast"
import { EntityCollaboration } from "@/components/shared/entity-collaboration"
import Link from "next/link"

export default function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const router = useRouter()
  const { firestore } = useFirebase()

  const saleRef = useMemoFirebase(() => {
    if (!firestore || !id) return null
    return doc(firestore, "sales", id)
  }, [firestore, id])

  const { data: sale, isLoading } = useDoc(saleRef)

  const handleDelete = () => {
    if (!firestore || !id || !confirm("¿Seguro que deseas eliminar esta venta?")) return
    
    const docRef = doc(firestore, "sales", id)
    deleteDocumentNonBlocking(docRef)
      .then(() => {
        toast({ title: "Venta eliminada correctamente" })
        router.push("/sales")
      })
  }

  if (isLoading) return <div className="p-10 text-center">Cargando detalle de venta...</div>
  if (!sale) return <div className="p-10 text-center text-red-500">Venta no encontrada.</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/sales")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight text-white">{sale.id}</h2>
            <Badge className={
              sale.paymentStatus === 'Pagado' ? 'bg-green-500/10 text-green-500 border-none' : 
              sale.paymentStatus === 'Parcial' ? 'bg-orange-500/10 text-orange-500 border-none' : 'bg-red-500/10 text-red-500 border-none'
            }>{sale.paymentStatus.toUpperCase()}</Badge>
          </div>
          <p className="text-muted-foreground">{sale.clientName}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/sales/edit/${id}`}><Edit className="mr-2 h-4 w-4" /> Editar</Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete}><Trash2 className="mr-2 h-4 w-4" /> Eliminar</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Resumen Comercial</CardTitle>
              <CardDescription>Detalles técnicos de la pauta cerrada</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Radio className="h-5 w-5 text-accent" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Estación</p>
                      <p className="text-white font-bold">{sale.station}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-accent" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Paquete</p>
                      <p className="text-white font-bold">{sale.package}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <BadgeDollarSign className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Monto Total</p>
                      <p className="text-2xl font-black text-white">${sale.amount?.toLocaleString()} <span className="text-xs font-normal opacity-50">MXN</span></p>
                    </div>
                  </div>
               </div>
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-accent" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Vigencia</p>
                      <p className="text-white font-medium">{sale.startDate} al {sale.endDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-accent" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Vendedor</p>
                      <p className="text-white font-medium">{sale.salespersonName}</p>
                    </div>
                  </div>
               </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Acción Recomendada</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-4 items-center justify-between bg-primary/5 p-6 rounded-lg border border-dashed border-primary/20">
              <div className="text-center md:text-left">
                <p className="font-bold text-white">¿Listo para formalizar?</p>
                <p className="text-xs text-muted-foreground">Genera el contrato PDF oficial precargando los datos de esta venta.</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90 font-bold" asChild>
                <Link href={`/contracts/new?clientId=${sale.clientId}&station=${encodeURIComponent(sale.station)}&amount=${sale.amount}&startDate=${sale.startDate}&endDate=${sale.endDate}&package=${encodeURIComponent(sale.package)}&saleId=${sale.id}`}>
                  <FileCheck className="mr-2 h-4 w-4" /> Generar Contrato
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Tabs defaultValue="comments">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="comments" className="flex gap-2">
                <MessageSquare className="h-4 w-4" /> Colaboración
              </TabsTrigger>
              <TabsTrigger value="history" className="flex gap-2">
                <HistoryIcon className="h-4 w-4" /> Historial
              </TabsTrigger>
            </TabsList>
            <TabsContent value="comments" className="pt-4">
              <EntityCollaboration entityPath={`sales/${id}`} />
            </TabsContent>
            <TabsContent value="history" className="pt-4">
              <EntityCollaboration entityPath={`sales/${id}`} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Observaciones del Cierre</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground italic leading-relaxed whitespace-pre-wrap">
                {sale.observations || "Sin observaciones adicionales registradas."}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Datos del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex flex-col">
                 <span className="text-[10px] uppercase font-bold text-muted-foreground">Razón Social</span>
                 <span className="text-sm font-bold">{sale.clientName}</span>
               </div>
               <Button variant="outline" className="w-full text-xs" asChild>
                 <Link href={`/clients/${sale.clientId}`}>Ver Ficha de Cliente</Link>
               </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}