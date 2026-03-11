"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Save, Loader2, FileText, Download, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, doc } from "firebase/firestore"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { toast } from "@/hooks/use-toast"
import { logHistoryNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { generateContractPDF } from "@/lib/pdf-generator"

const STATIONS = [
  "XHJZ La Campera 92.9 FM",
  "XHJS Euforia 98.5 FM"
]

function NewContractPage() {
  const router = useRouter()
  const searchParams = useSearchParams()


  // Pre-filled data from URL
  const preselectedClientId = searchParams.get("clientId")
  const preselectedStation = searchParams.get("station")
  const preselectedAmount = searchParams.get("amount")
  const preselectedStartDate = searchParams.get("startDate")
  const preselectedEndDate = searchParams.get("endDate")
  const preselectedPackage = searchParams.get("package")
  const linkedSaleId = searchParams.get("saleId")

  const { firestore, storage, user } = useFirebase()
  const [isSaving, setIsSaving] = useState(false)

  const clientsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return collection(firestore, "clients")
  }, [firestore])

  const { data: clients, isLoading: loadingClients } = useCollection(clientsQuery)

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!firestore || !user) {
      toast({
        variant: "destructive",
        title: "Sesión no disponible",
        description: "Debes estar autenticado para registrar contratos."
      })
      return
    }
    
    setIsSaving(true)

    try {
      const formData = new FormData(e.currentTarget)
      const clientId = formData.get("clientId")?.toString() || ""
      const selectedClient = clients?.find(c => c.id === clientId)

      if (!selectedClient) {
        throw new Error("Debes seleccionar un cliente válido de la lista.")
      }

      // 1. Preparar referencia y datos (Sin bloquear)
      const contractCol = collection(firestore, "contracts")
      const contractRef = doc(contractCol) // Generamos ID localmente
      const contractId = contractRef.id

      const newContract = {
        id: contractId,
        clientId: clientId,
        clientName: selectedClient.name || "Desconocido",
        station: formData.get("station")?.toString() || "",
        campaignType: formData.get("campaignType")?.toString() || "",
        startDate: formData.get("startDate")?.toString() || "",
        endDate: formData.get("endDate")?.toString() || "",
        monthlyAmount: Number(formData.get("monthlyAmount")),
        status: "Activo",
        salespersonId: user.uid,
        observations: formData.get("observations")?.toString() || "",
        isActive: true,
        linkedSaleId: linkedSaleId || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      // 2. Generar PDF (Operación local pesada pero necesaria antes de guardar)
      const pdfBlob = await generateContractPDF(
        { ...newContract, id: contractId },
        selectedClient,
        user.displayName || user.email || "Usuario del Sistema"
      )

      // 3. Guardar registro base en Firestore (No bloqueante)
      setDocumentNonBlocking(contractRef, newContract, { merge: true })

      // 4. Iniciar subida a Storage (En segundo plano con seguimiento)
      if (storage) {
        const storagePath = `contracts/${contractId}_${Date.now()}.pdf`
        const storageRef = ref(storage, storagePath)
        const uploadTask = uploadBytesResumable(storageRef, pdfBlob, {
          contentType: 'application/pdf',
          customMetadata: { contractId, clientId, generatedBy: user.uid }
        })

        uploadTask.on('state_changed', null, 
          (error) => {
            console.error("Fallo subida de PDF en background:", error)
            toast({ variant: "destructive", title: "Error de respaldo", description: "El contrato se guardó pero el PDF falló. Intenta regenerarlo desde el detalle." })
          }, 
          async () => {
            // Cuando termine la subida, actualizamos la URL en el doc
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref)
            updateDocumentNonBlocking(contractRef, { contractFileUrl: downloadUrl })
          }
        )
      }

      // 5. Registrar Historial
      const historyCol = collection(firestore, `contracts/${contractId}/history`)
      logHistoryNonBlocking(
        historyCol,
        user.uid,
        user.displayName || user.email || "Usuario",
        "creación",
        `Contrato ${contractId.substring(0,8)} formalizado exitosamente.`
      )

      toast({ title: "¡Contrato Creado!", description: "El acuerdo ha sido registrado. El PDF se está procesando en la nube." })
      
      // Redirección inmediata para mejorar percepción de velocidad
      router.push("/contracts")

    } catch (error: any) {
      console.error("Error en flujo de contrato:", error)
      toast({ 
        variant: "destructive", 
        title: "No se pudo crear el contrato", 
        description: error.message || "Ocurrió un error inesperado al procesar el documento." 
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-3xl font-bold tracking-tight text-white">Formalizar Contrato</h2>
      </div>

      {linkedSaleId && (
        <Alert className="bg-primary/5 border-primary/20 max-w-4xl mx-auto">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary font-bold">Venta Vinculada</AlertTitle>
          <AlertDescription>
            Este contrato se está generando a partir de la venta <strong>{linkedSaleId}</strong>. Los datos han sido precargados.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleCreate}>
        <Card className="bg-card border-border max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Detalles del Acuerdo Oficial</CardTitle>
            <CardDescription>Completa o verifica la información para el documento PDF oficial.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="clientId">Cliente</Label>
                <Select name="clientId" defaultValue={preselectedClientId || ""} required>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingClients ? <div className="p-2 text-center text-xs">Cargando...</div> : 
                      clients?.map(client => <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="station">Estación</Label>
                <Select name="station" defaultValue={preselectedStation || ""} required>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Selecciona estación" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATIONS.map(station => <SelectItem key={station} value={station}>{station}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="campaignType">Paquete / Tipo de Campaña</Label>
                <Input id="campaignType" name="campaignType" defaultValue={preselectedPackage || ""} placeholder="Ej. Paquete Full 30s" required className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyAmount">Monto Mensual (MXN)</Label>
                <Input id="monthlyAmount" name="monthlyAmount" type="number" step="0.01" defaultValue={preselectedAmount || ""} placeholder="0.00" required className="bg-background/50" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha de Inicio</Label>
                <Input id="startDate" name="startDate" type="date" defaultValue={preselectedStartDate || ""} required className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Fecha de Término</Label>
                <Input id="endDate" name="endDate" type="date" defaultValue={preselectedEndDate || ""} required className="bg-background/50" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observations">Observaciones Finales</Label>
              <Textarea id="observations" name="observations" placeholder="Condiciones finales para el PDF..." className="bg-background/50 min-h-[120px]" />
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
              <Button type="submit" disabled={isSaving || !user} className="font-bold min-w-[200px]">
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</> : <><FileText className="mr-2 h-4 w-4" /> Generar Contrato PDF</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
export default function PageWrapper() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <NewContractPage />
    </Suspense>
  )
}
