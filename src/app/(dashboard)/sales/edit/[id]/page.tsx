"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase"
import { doc, serverTimestamp, collection } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { updateDocumentNonBlocking, logHistoryNonBlocking } from "@/firebase/non-blocking-updates"

const STATIONS = [
  "XHJZ La Campera 92.9 FM",
  "XHJS Euforia 98.5 FM"
]

const PACKAGES = [
  "Básico",
  "Full",
  "Premium",
  "Individual",
  "Paquete Especial"
]

const PAYMENT_STATUS = [
  "Pendiente",
  "Parcial",
  "Pagado"
]

export default function EditSalePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const router = useRouter()
  const { firestore, user } = useFirebase()
  const [isSaving, setIsSaving] = useState(false)

  const saleRef = useMemoFirebase(() => {
    if (!firestore || !id) return null
    return doc(firestore, "sales", id)
  }, [firestore, id])

  const { data: sale, isLoading } = useDoc(saleRef)

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!firestore || !id || !sale || !user) return
    setIsSaving(true)

    const formData = new FormData(e.currentTarget)
    const updatedData = {
      station: formData.get("station")?.toString() || "",
      startDate: formData.get("startDate")?.toString() || "",
      endDate: formData.get("endDate")?.toString() || "",
      amount: Number(formData.get("amount")),
      package: formData.get("package")?.toString() || "",
      paymentStatus: formData.get("paymentStatus")?.toString() || "",
      observations: formData.get("observations")?.toString() || "",
      updatedAt: serverTimestamp(),
    }

    const docRef = doc(firestore, "sales", id)
    updateDocumentNonBlocking(docRef, updatedData)
      .then(() => {
        const historyCol = collection(firestore, `sales/${id}/history`)
        logHistoryNonBlocking(
          historyCol,
          user.uid,
          user.displayName || user.email || "Usuario",
          "edición de venta",
          `Se actualizaron los datos de la venta ${sale.id}`
        )
        toast({ title: "Cambios guardados", description: "La venta ha sido actualizada correctamente." })
        router.push(`/sales/${id}`)
      })
      .finally(() => {
        setIsSaving(false)
      })
  }

  if (isLoading) return <div className="p-10 text-center">Cargando venta...</div>
  if (!sale) return <div className="p-10 text-center text-red-500">Venta no encontrada.</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/sales/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-3xl font-bold tracking-tight text-white">Editar Venta: {sale.id}</h2>
      </div>

      <form onSubmit={handleUpdate}>
        <Card className="bg-card border-border max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Formulario de Edición</CardTitle>
            <CardDescription>Actualiza las condiciones comerciales acordadas con {sale.clientName}.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estación</Label>
                  <Select name="station" defaultValue={sale.station}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Paquete</Label>
                  <Select name="package" defaultValue={sale.package}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PACKAGES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Monto (MXN)</Label>
                  <Input id="amount" name="amount" type="number" step="0.01" defaultValue={sale.amount} required className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label>Estatus de Pago</Label>
                  <Select name="paymentStatus" defaultValue={sale.paymentStatus}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha Inicio</Label>
                  <Input id="startDate" name="startDate" type="date" defaultValue={sale.startDate} required className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Fecha Fin</Label>
                  <Input id="endDate" name="endDate" type="date" defaultValue={sale.endDate} required className="bg-background/50" />
                </div>
             </div>

             <div className="space-y-2">
               <Label htmlFor="observations">Observaciones</Label>
               <Textarea id="observations" name="observations" defaultValue={sale.observations} className="bg-background/50 min-h-[120px]" />
             </div>

             <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
               <Button type="button" variant="outline" onClick={() => router.push(`/sales/${id}`)}>Cancelar</Button>
               <Button type="submit" disabled={isSaving} className="font-bold min-w-[150px]">
                 {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : <><Save className="mr-2 h-4 w-4" /> Guardar Cambios</>}
               </Button>
             </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}