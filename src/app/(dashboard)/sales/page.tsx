"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  Plus, 
  Search, 
  Eye, 
  MoreHorizontal, 
  FileCheck, 
  Edit, 
  Trash2,
  AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, query, orderBy, doc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { setDocumentNonBlocking, deleteDocumentNonBlocking, logHistoryNonBlocking } from "@/firebase/non-blocking-updates"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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

export default function SalesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const { firestore, user, areServicesAvailable, initializationError } = useFirebase()

  const clientsRef = useMemoFirebase(() => firestore ? collection(firestore, "clients") : null, [firestore])
  const { data: clients, isLoading: loadingClients } = useCollection(clientsRef)

  const salesRef = useMemoFirebase(() => firestore ? collection(firestore, "sales") : null, [firestore])
  const salesQuery = useMemoFirebase(() => {
    if (!salesRef) return null
    return query(salesRef, orderBy("createdAt", "desc"))
  }, [salesRef])

  const { data: sales, isLoading: loadingSales } = useCollection(salesQuery)

  const handleRegisterSale = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!firestore || !user) return
    setIsSaving(true)

    const formData = new FormData(e.currentTarget)
    const clientId = formData.get("clientId")?.toString() || ""
    const selectedClient = clients?.find(c => c.id === clientId)

    if (!selectedClient) {
      toast({ variant: "destructive", title: "Error", description: "Selecciona un cliente válido." })
      setIsSaving(false)
      return
    }

    const timestamp = Date.now().toString().slice(-4)
    const folio = `VEN-${(sales?.length || 0) + 1}-${timestamp}`

    const newSale = {
      id: folio,
      clientId: clientId,
      clientName: selectedClient.name,
      station: formData.get("station")?.toString() || "",
      startDate: formData.get("startDate")?.toString() || "",
      endDate: formData.get("endDate")?.toString() || "",
      amount: Number(formData.get("amount")),
      package: formData.get("package")?.toString() || "",
      salespersonId: user.uid,
      salespersonName: user.displayName || user.email || "Usuario",
      paymentStatus: formData.get("paymentStatus")?.toString() || "Pendiente",
      observations: formData.get("observations")?.toString() || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const saleDocRef = doc(firestore, "sales", folio)
    
    setDocumentNonBlocking(saleDocRef, newSale, { merge: true })
      .then(() => {
        const historyCol = collection(firestore, `sales/${folio}/history`)
        logHistoryNonBlocking(
          historyCol,
          user.uid,
          newSale.salespersonName,
          "registro de venta",
          `Venta registrada con folio ${folio} para ${newSale.clientName}`
        )
        toast({ title: "Venta Registrada", description: `Folio ${folio} creado exitosamente.` })
        setIsRegisterModalOpen(false)
      })
      .catch(() => {
        // El error es manejado por el emisor global en setDocumentNonBlocking
      })
      .finally(() => {
        setIsSaving(false)
      })
  }

  const handleDeleteSale = (id: string) => {
    if (!firestore || !confirm("¿Eliminar esta venta?")) return
    
    const saleDocRef = doc(firestore, "sales", id)
    deleteDocumentNonBlocking(saleDocRef)
      .then(() => {
        toast({ title: "Venta eliminada" })
      })
  }

  const filteredSales = sales?.filter(s => 
    s.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!areServicesAvailable) {
    return (
      <div className="p-4 md:p-8 space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Error de Conexión</AlertTitle>
          <AlertDescription>
            {initializationError || "No se pudo conectar con Firestore."}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Ventas</h2>
          <p className="text-muted-foreground">Registro y control de cierres publicitarios</p>
        </div>
        
        <Dialog open={isRegisterModalOpen} onOpenChange={setIsRegisterModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 font-bold w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Registrar Venta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] bg-card text-white border-border overflow-y-auto max-h-[90vh]">
            <form onSubmit={handleRegisterSale}>
              <DialogHeader>
                <DialogTitle>Registrar Nueva Venta</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Ingresa los detalles del cierre comercial. El folio se generará automáticamente.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Cliente</Label>
                    <Select name="clientId" required>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Selecciona un cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingClients ? <SelectItem value="loading" disabled>Cargando...</SelectItem> : 
                          clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="station">Estación</Label>
                    <Select name="station" required>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Selecciona estación" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="package">Paquete Contratado</Label>
                    <Select name="package" required>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Selecciona paquete" />
                      </SelectTrigger>
                      <SelectContent>
                        {PACKAGES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Monto de la Venta (MXN)</Label>
                    <Input id="amount" name="amount" type="number" step="0.01" required className="bg-background/50" placeholder="0.00" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Fecha Inicio</Label>
                    <Input id="startDate" name="startDate" type="date" required className="bg-background/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Fecha Fin</Label>
                    <Input id="endDate" name="endDate" type="date" required className="bg-background/50" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentStatus">Estatus de Pago</Label>
                    <Select name="paymentStatus" defaultValue="Pendiente">
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Selecciona estatus" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observations">Observaciones</Label>
                  <Textarea id="observations" name="observations" className="bg-background/50 min-h-[100px]" placeholder="Detalles del cierre o condiciones..." />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsRegisterModalOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSaving} className="font-bold">
                  {isSaving ? "Registrando..." : "Confirmar Venta"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-lg border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por cliente o folio..." 
            className="pl-9 bg-background/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table className="min-w-[1000px] md:min-w-full">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold">Folio</TableHead>
                <TableHead className="font-bold">Cliente / Estación</TableHead>
                <TableHead className="font-bold">Paquete</TableHead>
                <TableHead className="font-bold">Periodo</TableHead>
                <TableHead className="font-bold">Monto</TableHead>
                <TableHead className="font-bold">Pago</TableHead>
                <TableHead className="text-right font-bold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingSales ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10">Cargando ventas...</TableCell></TableRow>
              ) : filteredSales?.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No hay ventas registradas.</TableCell></TableRow>
              ) : (
                filteredSales?.map((sale) => (
                  <TableRow key={sale.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono text-xs font-bold text-accent">{sale.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <Link href={`/sales/${sale.id}`} className="font-medium text-white hover:underline">
                          {sale.clientName}
                        </Link>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{sale.station}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs uppercase font-medium">{sale.package}</TableCell>
                    <TableCell>
                      <div className="text-[10px]">
                        <div>{sale.startDate}</div>
                        <div className="text-muted-foreground">al {sale.endDate}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-black text-white">${sale.amount?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] border-none ${
                        sale.paymentStatus === 'Pagado' ? 'bg-green-500/10 text-green-500' : 
                        sale.paymentStatus === 'Parcial' ? 'bg-orange-500/10 text-orange-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {sale.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild title="Ver Detalle">
                          <Link href={`/sales/${sale.id}`}><Eye className="h-4 w-4" /></Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/sales/edit/${sale.id}`)}>
                              <Edit className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/contracts/new?clientId=${sale.clientId}&station=${encodeURIComponent(sale.station)}&amount=${sale.amount}&startDate=${sale.startDate}&endDate=${sale.endDate}&package=${encodeURIComponent(sale.package)}&saleId=${sale.id}`}>
                                <FileCheck className="mr-2 h-4 w-4 text-green-500" /> Generar Contrato
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteSale(sale.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}