"use client"

import { useState } from "react"
import { FileText, Plus, Search, Eye, Download, MessageSquare, Loader2, Calendar, AlertTriangle } from "lucide-react"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, addDoc, serverTimestamp, where } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { logHistoryNonBlocking } from "@/firebase/non-blocking-updates"
import { FileUploader } from "@/components/shared/file-uploader"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet"
import { EntityCollaboration } from "@/components/shared/entity-collaboration"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function InvoicesPage() {
  const { firestore, user, areServicesAvailable, initializationError } = useFirebase()
  const [searchTerm, setSearchTerm] = useState("")
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

  // Data fetching
  const invoicesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return query(collection(firestore, "internal_invoices"), orderBy("createdAt", "desc"))
  }, [firestore, user])

  const { data: invoices, isLoading: loadingInvoices } = useCollection(invoicesQuery)

  const clientsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return collection(firestore, "clients")
  }, [firestore, user])
  const { data: clients } = useCollection(clientsQuery)

  const contractsQuery = useMemoFirebase(() => {
    if (!firestore || !selectedClientId) return null
    return query(collection(firestore, "contracts"), where("clientId", "==", selectedClientId))
  }, [firestore, selectedClientId])
  const { data: contracts } = useCollection(contractsQuery)

  const handleRegisterInvoice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!firestore || !user || !uploadedUrl) {
      if (!uploadedUrl) toast({ variant: "destructive", title: "Archivo faltante", description: "Debes cargar el comprobante PDF de la factura." })
      return
    }
    
    setIsSaving(true)
    const formData = new FormData(e.currentTarget)
    const clientId = formData.get("clientId")?.toString() || ""
    const contractId = formData.get("contractId")?.toString() || ""
    const invoiceNumber = formData.get("invoiceNumber")?.toString() || ""
    
    const clientName = clients?.find(c => c.id === clientId)?.name || "Desconocido"

    const newInvoice = {
      clientId,
      clientName,
      contractId,
      invoiceNumber,
      date: formData.get("date")?.toString() || new Date().toISOString().split('T')[0],
      amount: Number(formData.get("amount")),
      invoiceFileUrl: uploadedUrl,
      registeredByUserId: user.uid,
      registeredByName: user.displayName || user.email || "Usuario",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    try {
      const docRef = await addDoc(collection(firestore, "internal_invoices"), newInvoice)
      
      const historyCol = collection(firestore, `internal_invoices/${docRef.id}/history`)
      logHistoryNonBlocking(
        historyCol,
        user.uid,
        newInvoice.registeredByName,
        "registro de factura",
        `Factura oficial ${invoiceNumber} registrada para ${clientName}`
      )

      toast({ title: "Factura registrada", description: "El documento ha sido vinculado correctamente." })
      setIsUploadOpen(false)
      setUploadedUrl(null)
      setSelectedClientId(null)
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error al registrar", description: error.message })
    } finally {
      setIsSaving(false)
    }
  }

  const filteredInvoices = invoices?.filter(inv => 
    inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!areServicesAvailable) {
    return (
      <div className="p-8">
        <Alert variant="destructive" className="bg-destructive/10 border-destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="font-bold">Error de Conexión</AlertTitle>
          <AlertDescription>
            {initializationError || "No se pudo establecer conexión con Firebase Storage/Firestore."}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Facturación Interna</h2>
          <p className="text-muted-foreground">Control y respaldo de comprobantes fiscales oficiales</p>
        </div>

        <Dialog open={isUploadOpen} onOpenChange={(open) => {
          setIsUploadOpen(open)
          if (!open) {
            setUploadedUrl(null)
            setSelectedClientId(null)
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 font-bold w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Registrar Comprobante
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-card text-white border-border overflow-y-auto max-h-[90vh]">
            <form onSubmit={handleRegisterInvoice}>
              <DialogHeader>
                <DialogTitle>Vincular Factura Externa</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Registra los datos de tu sistema de facturación y sube el PDF oficial.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Seleccionar Cliente</Label>
                    <Select name="clientId" onValueChange={setSelectedClientId} required>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Contrato Relacionado</Label>
                    <Select name="contractId" disabled={!selectedClientId} required>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder={selectedClientId ? "Contrato" : "Primero elige cliente"} />
                      </SelectTrigger>
                      <SelectContent>
                        {contracts?.map(con => (
                          <SelectItem key={con.id} value={con.id}>
                            {con.id.substring(0,8).toUpperCase()} - {con.station}
                          </SelectItem>
                        ))}
                        {contracts?.length === 0 && <SelectItem value="none" disabled>Sin contratos vigentes</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Folio de Factura</Label>
                    <Input name="invoiceNumber" placeholder="Ej. F-9920" required className="bg-background/50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de Emisión</Label>
                    <Input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} required className="bg-background/50" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Importe Total (MXN)</Label>
                  <Input type="number" step="0.01" name="amount" placeholder="0.00" required className="bg-background/50" />
                </div>

                <div className="space-y-2 pt-4">
                  <Label className="text-primary font-black uppercase text-[10px] tracking-widest">Archivo PDF del Comprobante</Label>
                  <FileUploader 
                    key="invoice-uploader"
                    path="invoices" 
                    allowedTypes={['application/pdf', '.pdf']} 
                    label="Hacer clic para cargar PDF"
                    onUploadComplete={(url) => setUploadedUrl(url)}
                  />
                  {uploadedUrl && (
                    <div className="flex items-center gap-2 text-green-500 font-bold text-[10px] animate-pulse p-2 bg-green-500/5 rounded">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>ARCHIVO LISTO PARA VINCULACIÓN</span>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSaving || !uploadedUrl} className="font-bold min-w-[150px]">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Vincular Factura"}
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
            placeholder="Buscar por factura o cliente..." 
            className="pl-9 bg-background/50" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table className="min-w-[900px] md:min-w-full">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold">Factura</TableHead>
                <TableHead className="font-bold">Cliente</TableHead>
                <TableHead className="font-bold">Fecha</TableHead>
                <TableHead className="font-bold">Monto</TableHead>
                <TableHead className="font-bold text-center">Contrato</TableHead>
                <TableHead className="text-right font-bold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingInvoices ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10">Consultando registros...</TableCell></TableRow>
              ) : filteredInvoices?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No hay facturas vinculadas aún.</TableCell></TableRow>
              ) : (
                filteredInvoices?.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono text-xs font-bold text-accent">{inv.invoiceNumber}</TableCell>
                    <TableCell className="font-medium text-white">{inv.clientName}</TableCell>
                    <TableCell className="text-xs">{inv.date}</TableCell>
                    <TableCell className="font-bold text-primary">${Number(inv.amount).toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-mono text-[10px] bg-muted/50">
                        {inv.contractId?.substring(0,8).toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" asChild title="Ver Comprobante">
                        <a href={inv.invoiceFileUrl} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4 text-primary" />
                        </a>
                      </Button>
                      
                      <Button variant="ghost" size="icon" asChild title="Descargar">
                        <a href={inv.invoiceFileUrl} download={`Factura_${inv.invoiceNumber}.pdf`}>
                          <Download className="h-4 w-4 text-muted-foreground" />
                        </a>
                      </Button>

                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="ghost" size="icon" title="Colaboración">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="sm:max-w-[450px]">
                          <SheetHeader className="mb-6">
                            <SheetTitle>Auditoría de Factura: {inv.invoiceNumber}</SheetTitle>
                            <SheetDescription>Comentarios internos y trazabilidad.</SheetDescription>
                          </SheetHeader>
                          <EntityCollaboration entityPath={`internal_invoices/${inv.id}`} />
                        </SheetContent>
                      </Sheet>
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
