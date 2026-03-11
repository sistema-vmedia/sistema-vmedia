"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  FileDown, 
  Printer, 
  MessageSquare, 
  History as HistoryIcon, 
  BadgeDollarSign, 
  Calendar, 
  Radio,
  FileText,
  Loader2,
  QrCode,
  AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase"
import { doc, updateDoc, collection, getDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { EntityCollaboration } from "@/components/shared/entity-collaboration"
import { generateContractPDF } from "@/lib/pdf-generator"
import { toast } from "@/hooks/use-toast"
import { logHistoryNonBlocking } from "@/firebase/non-blocking-updates"

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const router = useRouter()
  const { firestore, storage, user, areServicesAvailable } = useFirebase()
  const [isGenerating, setIsGenerating] = useState(false)
  const [localPdfUrl, setLocalPdfUrl] = useState<string | null>(null)
  const [storageError, setStorageError] = useState<string | null>(null)

  const contractRef = useMemoFirebase(() => {
    if (!firestore || !id) return null
    return doc(firestore, "contracts", id)
  }, [firestore, id])

  const { data: contract, isLoading } = useDoc(contractRef)

  // Cleanup local URL on unmount
  useEffect(() => {
    return () => {
      if (localPdfUrl) URL.revokeObjectURL(localPdfUrl)
    }
  }, [localPdfUrl])

  const handleGeneratePDF = async () => {
    if (!firestore || !user || !contract) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se puede generar el PDF sin conexión a la base de datos."
      })
      return
    }
    
    setIsGenerating(true)
    setStorageError(null)

    try {
      // Fetch full client data for PDF
      const clientDoc = await getDoc(doc(firestore, "clients", contract.clientId))
      if (!clientDoc.exists()) throw new Error("El cliente asociado a este contrato ya no existe.")
      const clientData = clientDoc.data()

      // Generate PDF Blob
      const pdfBlob = await generateContractPDF(
        { ...contract, id },
        clientData,
        user.displayName || user.email || "Usuario del Sistema"
      )

      // Create a local URL for immediate preview/fallback
      const blobUrl = URL.createObjectURL(pdfBlob)
      setLocalPdfUrl(blobUrl)

      // Try to upload to Storage if available
      if (storage) {
        try {
          const storagePath = `contracts/${id}_${Date.now()}.pdf`
          const storageRef = ref(storage, storagePath)
          
          const uploadResult = await uploadBytes(storageRef, pdfBlob, {
            contentType: 'application/pdf',
            customMetadata: { contractId: id, clientId: contract.clientId, generatedBy: user.uid }
          })
          
          const downloadUrl = await getDownloadURL(uploadResult.ref)

          // Update Firestore with the cloud URL
          await updateDoc(doc(firestore, "contracts", id), {
            contractFileUrl: downloadUrl,
            updatedAt: new Date().toISOString()
          })

          toast({ title: "PDF Guardado en la Nube", description: "El documento oficial ha sido actualizado y guardado." })
        } catch (uploadErr: any) {
          console.error("Storage upload failed:", uploadErr)
          const isBucketError = uploadErr.message?.includes('no-default-bucket') || uploadErr.code === 'storage/no-default-bucket'
          
          if (isBucketError) {
            setStorageError("Firebase Storage no está configurado (falta bucket). El PDF solo estará disponible localmente en esta sesión.")
          } else {
            setStorageError("Error al subir a la nube. El PDF se generó localmente.")
          }
          
          toast({ 
            variant: "destructive", 
            title: "Aviso: Solo Guardado Local", 
            description: "El PDF se generó pero no pudo guardarse en la nube. Puedes descargarlo ahora." 
          })
        }
      } else {
        setStorageError("Servicio de Storage no disponible. PDF generado localmente.")
      }

      // History
      const historyCol = collection(firestore, `contracts/${id}/history`)
      logHistoryNonBlocking(
        historyCol,
        user.uid,
        user.displayName || user.email || "Usuario",
        "Generación de PDF",
        storage ? "Se intentó generar y subir el PDF oficial." : "Se generó PDF para vista previa local."
      )

    } catch (error: any) {
      console.error("Error generating PDF:", error)
      toast({ 
        variant: "destructive", 
        title: "Error de Generación", 
        description: error.message || "No se pudo crear el archivo PDF." 
      })
    } finally {
      setIsGenerating(false)
    }
  }

  if (isLoading) return <div className="p-8 text-center">Cargando detalles del contrato...</div>
  if (!contract) return <div className="p-8 text-center text-red-500">Contrato no encontrado.</div>

  const activePdfUrl = localPdfUrl || contract.contractFileUrl

  const handlePrint = () => {
    if (activePdfUrl) {
      window.open(activePdfUrl, '_blank')
    }
  }

  const handleDownload = () => {
    if (activePdfUrl) {
      const link = document.createElement('a');
      link.href = activePdfUrl;
      link.download = `Contrato_SomosVMCR_${id.substring(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/contracts")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight text-white">Contrato: {id.substring(0, 8).toUpperCase()}</h2>
            <Badge className="bg-primary/20 text-primary border-primary/30 uppercase font-black text-[10px] tracking-widest">Oficial</Badge>
          </div>
          <p className="text-muted-foreground">{contract.clientName}</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {!activePdfUrl ? (
            <Button onClick={handleGeneratePDF} disabled={isGenerating} className="bg-accent hover:bg-accent/90 text-black font-bold">
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
              Generar PDF Oficial
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Ver / Imprimir
              </Button>
              <Button onClick={handleDownload} className="bg-primary hover:bg-primary/90 font-bold">
                <FileDown className="mr-2 h-4 w-4" /> Descargar PDF
              </Button>
              <Button variant="secondary" onClick={handleGeneratePDF} disabled={isGenerating} title="Regenerar PDF">
                 {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
              </Button>
            </>
          )}
        </div>
      </div>

      {storageError && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error de Almacenamiento</AlertTitle>
          <AlertDescription>{storageError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-border overflow-hidden">
            <CardHeader className="bg-muted/30 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">Vista Previa del Documento</CardTitle>
                  <CardDescription>
                    {localPdfUrl ? "Vista previa local generada." : "Archivo PDF con validez oficial de Somos VMCR."}
                  </CardDescription>
                </div>
                {contract.contractFileUrl && (
                  <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/5">
                    URL en Nube Activa
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {activePdfUrl ? (
                <iframe 
                  src={activePdfUrl} 
                  className="w-full h-[600px] md:h-[800px]"
                  title="Vista previa contrato"
                />
              ) : (
                <div className="p-20 text-center space-y-4">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto opacity-20" />
                  <p className="text-muted-foreground italic">
                    El archivo PDF oficial aún no ha sido generado para este contrato.
                  </p>
                  <Button variant="outline" onClick={handleGeneratePDF} disabled={isGenerating}>
                    {isGenerating ? "Generando..." : "Generar Documento Ahora"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-border border-l-4 border-l-primary shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Resumen de Campaña
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg border">
                <Radio className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Estación Emisora</p>
                  <p className="text-white text-sm font-bold">{contract.station}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg border">
                <Calendar className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Vigencia del Acuerdo</p>
                  <p className="text-white text-sm font-medium">{contract.startDate} al {contract.endDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-primary/10 p-3 rounded-lg border border-primary/20">
                <BadgeDollarSign className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Inversión Mensual</p>
                  <p className="text-2xl font-black text-white">${contract.monthlyAmount?.toLocaleString()} <span className="text-xs font-normal opacity-50">MXN</span></p>
                </div>
              </div>
              <div className="pt-4 border-t border-border/50">
                 <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Notas Especiales</p>
                 <p className="text-xs text-muted-foreground italic leading-relaxed bg-muted/20 p-3 rounded border border-dashed">
                   {contract.observations || "Sin notas adicionales para programación."}
                 </p>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="comments" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="comments" className="flex gap-2">
                <MessageSquare className="h-4 w-4" /> Comentarios
              </TabsTrigger>
              <TabsTrigger value="history" className="flex gap-2">
                <HistoryIcon className="h-4 w-4" /> Auditoría
              </TabsTrigger>
            </TabsList>
            <TabsContent value="comments" className="mt-0 pt-4">
               <EntityCollaboration entityPath={`contracts/${id}`} />
            </TabsContent>
            <TabsContent value="history" className="mt-0 pt-4">
               <EntityCollaboration entityPath={`contracts/${id}`} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
