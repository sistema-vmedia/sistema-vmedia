"use client"

import { useState } from "react"
import { CreditCard, Search, Eye, MessageSquare, Plus, Loader2, Download } from "lucide-react"
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
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
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
import { DocumentContainer } from "@/components/documents/document-container"
import { EntityCollaboration } from "@/components/shared/entity-collaboration"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet"
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, addDoc, serverTimestamp, getDoc, doc, updateDoc } from "firebase/firestore"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { toast } from "@/hooks/use-toast"
import { logHistoryNonBlocking } from "@/firebase/non-blocking-updates"
import { generatePaymentPDF } from "@/lib/payment-pdf-generator"

const PAYMENT_METHODS = ["Transferencia", "Efectivo", "Tarjeta", "Cheque"]

export default function BillingPage() {
  const { firestore, storage, user } = useFirebase()
  const [searchTerm, setSearchTerm] = useState("")
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const paymentsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, "payments"), orderBy("createdAt", "desc"))
  }, [firestore])

  const { data: payments, isLoading: loadingPayments } = useCollection(paymentsQuery)

  const clientsRef = useMemoFirebase(() => firestore ? collection(firestore, "clients") : null, [firestore])
  const { data: clients } = useCollection(clientsRef)

  const handleRegisterPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!firestore || !user) return
    setIsSaving(true)

    const formData = new FormData(e.currentTarget)
    const clientId = formData.get("clientId")?.toString() || ""
    const selectedClient = clients?.find(c => c.id === clientId)

    const folio = `REC-${Date.now().toString().slice(-4)}`

    const newPayment = {
      folio,
      clientId,
      clientName: selectedClient?.name || "Desconocido",
      amount: Number(formData.get("amount")),
      date: formData.get("date")?.toString() || new Date().toISOString().split('T')[0],
      paymentMethod: formData.get("paymentMethod")?.toString() || "Transferencia",
      reference: formData.get("reference")?.toString() || "",
      concept: formData.get("concept")?.toString() || "Pago de servicios publicitarios.",
      registeredByUserId: user.uid,
      registeredByName: user.displayName || user.email || "Usuario",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    try {
      const docRef = await addDoc(collection(firestore, "payments"), newPayment)
      
      const historyCol = collection(firestore, `payments/${docRef.id}/history`)
      logHistoryNonBlocking(
        historyCol,
        user.uid,
        newPayment.registeredByName,
        "registro de pago",
        `Pago registrado por $${newPayment.amount} para ${newPayment.clientName}`
      )

      toast({ title: "Pago registrado", description: `Folio ${folio} creado exitosamente.` })
      setIsRegisterOpen(false)
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error al registrar", description: error.message })
    } finally {
      setIsSaving(false)
    }
  }

  const generateBlob = async (payment: any) => {
    if (!firestore || !user) throw new Error("No hay conexión con la base de datos.")
    
    let clientData = null
    try {
      const clientDoc = await getDoc(doc(firestore, "clients", payment.clientId))
      clientData = clientDoc.exists() ? clientDoc.data() : null
    } catch (e) {
      console.warn("Could not fetch client data for PDF", e)
    }

    return await generatePaymentPDF(
      payment,
      clientData,
      payment.registeredByName || user.displayName || user.email || "Usuario del Sistema"
    )
  }

  const handleDownloadPDF = async (payment: any) => {
    setIsGenerating(true)
    try {
      const pdfBlob = await generateBlob(payment)
      const blobUrl = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `Recibo_${payment.folio || payment.id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Cleanup local blob
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100)

      // Intento de guardado en la nube (background) usando uploadBytesResumable como se solicitó
      if (storage && firestore) {
        try {
          const storagePath = `payments/${payment.id}_${Date.now()}.pdf`
          const storageRef = ref(storage, storagePath)
          const uploadTask = uploadBytesResumable(storageRef, pdfBlob, { contentType: 'application/pdf' })
          
          uploadTask.on('state_changed', null, 
            (error) => console.warn("Fallo subida silenciosa a Storage:", error), 
            async () => {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref)
              await updateDoc(doc(firestore, "payments", payment.id), { receiptFileUrl: downloadUrl })
            }
          )
        } catch (e) {
          console.warn("No se pudo iniciar subida silenciosa", e)
        }
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error al generar PDF", description: error.message })
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePrintPDF = async (payment: any) => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write('<p style="font-family:sans-serif; text-align:center; margin-top: 50px;">Generando recibo oficial para impresión...</p>')
    }

    setIsGenerating(true)
    try {
      const pdfBlob = await generateBlob(payment)
      const blobUrl = URL.createObjectURL(pdfBlob)
      if (printWindow) {
        printWindow.location.href = blobUrl
      }
    } catch (error: any) {
      if (printWindow) printWindow.close()
      toast({ variant: "destructive", title: "Error al preparar impresión", description: error.message })
    } finally {
      setIsGenerating(false)
    }
  }

  const filteredPayments = payments?.filter(p => 
    p.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.folio?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Cobranza</h2>
          <p className="text-muted-foreground">Registro de pagos y emisión de recibos oficiales</p>
        </div>

        <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 font-bold w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Registrar Pago
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-card text-white border-border">
            <form onSubmit={handleRegisterPayment}>
              <DialogHeader>
                <DialogTitle>Registrar Pago Recibido</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Ingresa los detalles del pago para generar el recibo oficial.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Select name="clientId" required>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Seleccionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de Pago</Label>
                    <Input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} required className="bg-background/50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Monto (MXN)</Label>
                    <Input type="number" step="0.01" name="amount" placeholder="0.00" required className="bg-background/50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Método de Pago</Label>
                    <Select name="paymentMethod" defaultValue="Transferencia">
                      <SelectTrigger className="bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Referencia / Transacción</Label>
                  <Input name="reference" placeholder="Folio de transferencia o cheque" className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label>Concepto</Label>
                  <Textarea name="concept" placeholder="Ej. Pago parcial campaña Mayo..." className="bg-background/50 min-h-[80px]" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsRegisterOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSaving} className="font-bold">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar y Generar Folio"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-lg border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por recibo o cliente..." 
            className="pl-9 bg-background/50 border-border" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-lg bg-card overflow-x-auto w-full">
        <Table className="min-w-[800px] md:min-w-full">
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">Recibo</TableHead>
              <TableHead className="font-bold">Cliente</TableHead>
              <TableHead className="font-bold">Fecha</TableHead>
              <TableHead className="font-bold">Monto</TableHead>
              <TableHead className="font-bold">Método</TableHead>
              <TableHead className="text-right font-bold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingPayments ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10">Cargando pagos...</TableCell></TableRow>
            ) : filteredPayments?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No hay pagos registrados.</TableCell></TableRow>
            ) : (
              filteredPayments?.map((payment) => (
                <TableRow key={payment.id} className="hover:bg-muted/20">
                  <TableCell className="font-mono text-xs font-bold text-accent">{payment.folio}</TableCell>
                  <TableCell className="font-medium text-white">{payment.clientName}</TableCell>
                  <TableCell>{payment.date}</TableCell>
                  <TableCell className="font-bold text-primary">${Number(payment.amount).toLocaleString()}</TableCell>
                  <TableCell>{payment.paymentMethod}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" title="Comentarios">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="sm:max-w-[450px]">
                        <SheetHeader className="mb-6">
                          <SheetTitle>Colaboración: {payment.folio}</SheetTitle>
                          <SheetDescription>Comentarios e historial de este pago.</SheetDescription>
                        </SheetHeader>
                        <EntityCollaboration entityPath={`payments/${payment.id}`} />
                      </SheetContent>
                    </Sheet>

                    <Button 
                      variant="ghost" 
                      size="icon" 
                      title="Descargar PDF" 
                      onClick={() => handleDownloadPDF(payment)}
                      disabled={isGenerating}
                    >
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 text-primary" />}
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" title="Vista Previa PDF">
                          <Eye className="h-4 w-4 text-primary" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[95vw] md:max-w-[1000px] h-[95vh] p-0 border-none bg-transparent overflow-hidden">
                        <DialogHeader className="sr-only">
                          <DialogTitle>Vista Previa de Recibo: {payment.folio}</DialogTitle>
                        </DialogHeader>
                        <DocumentContainer 
                          title="RECIBO DE PAGO" 
                          folio={payment.folio} 
                          date={payment.date}
                          onDownload={() => handleDownloadPDF(payment)}
                          onPrint={() => handlePrintPDF(payment)}
                          isGenerating={isGenerating}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                            <div className="text-left">
                              <p className="text-[10px] uppercase font-black text-gray-400 mb-1 tracking-tighter">PAGADO POR</p>
                              <p className="font-black text-xl md:text-2xl uppercase leading-none text-black">{payment.clientName}</p>
                              <p className="text-[10px] text-gray-500 mt-2 font-mono tracking-widest uppercase font-bold">Ref: {payment.reference || 'SIN REFERENCIA'}</p>
                            </div>
                            <div className="text-left md:text-right flex flex-col md:items-end">
                              <p className="text-[10px] uppercase font-black text-gray-400 mb-1 tracking-tighter">MÉTODO DE PAGO</p>
                              <p className="font-black text-lg md:text-xl leading-none uppercase text-black">{payment.paymentMethod}</p>
                              <p className="text-[10px] text-primary mt-2 font-black uppercase tracking-widest">Estatus: Liquidado</p>
                            </div>
                          </div>

                          <div className="border-y-2 border-gray-100 py-8 md:py-12 my-6 md:my-10 text-left">
                            <p className="text-[10px] uppercase font-black text-gray-300 mb-4 tracking-widest">CONCEPTO DETALLADO</p>
                            <p className="text-xl md:text-2xl text-gray-800 font-medium leading-relaxed italic">
                              "{payment.concept || "Pago por servicios publicitarios correspondientes a la campaña vigente."}"
                            </p>
                          </div>

                          <div className="flex justify-end">
                            <div className="bg-black text-white p-8 md:p-10 rounded-sm text-right min-w-full md:min-w-[320px] shadow-xl border-r-8 border-primary">
                              <p className="text-xs uppercase font-black opacity-60 mb-2 tracking-widest">MONTO TOTAL RECIBIDO</p>
                              <p className="text-4xl md:text-6xl font-black">${Number(payment.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                              <p className="text-[10px] mt-3 font-bold uppercase tracking-widest opacity-40">Moneda Nacional MXN</p>
                            </div>
                          </div>
                        </DocumentContainer>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
