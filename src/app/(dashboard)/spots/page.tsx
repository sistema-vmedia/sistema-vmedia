"use client"

import { useState, useRef } from "react"
import { Mic, Plus, Play, Download, Wand2, FileAudio, Eye, MessageSquare, Pause, Loader2, Upload, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { generateSpotText } from "@/ai/flows/spot-text-generator"
import { DocumentContainer } from "@/components/documents/document-container"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet"
import { EntityCollaboration } from "@/components/shared/entity-collaboration"
import { Progress } from "@/components/ui/progress"
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc, updateDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { generateSpotPDF } from "@/lib/spot-pdf-generator"
import { logHistoryNonBlocking } from "@/firebase/non-blocking-updates"
import { FileUploader } from "@/components/shared/file-uploader"

const STATIONS = [
  "XHJZ La Campera 92.9 FM",
  "XHJS Euforia 98.5 FM"
]

export default function SpotsPage() {
  const { firestore, user } = useFirebase()
  const [isGeneratingIA, setIsGeneratingIA] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [scriptText, setScriptText] = useState("")
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const spotsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, "spot_requests"), orderBy("createdAt", "desc"))
  }, [firestore])

  const { data: spots, isLoading: loadingSpots } = useCollection(spotsQuery)

  const handleCreateSpot = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!firestore || !user) return
    setIsSaving(true)

    const formData = new FormData(e.currentTarget)
    const newSpotRequest = {
      clientName: formData.get("client")?.toString() || "",
      station: formData.get("station")?.toString() || "",
      spotName: formData.get("name")?.toString() || "",
      spotText: scriptText,
      duration: formData.get("duration")?.toString() || "30s",
      status: "solicitado",
      requestedByUserId: user.uid,
      requestedByName: user.displayName || user.email || "Usuario",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    try {
      const { addDoc } = await import('firebase/firestore')
      const docRef = await addDoc(collection(firestore, "spot_requests"), newSpotRequest)
      
      const historyCol = collection(firestore, `spot_requests/${docRef.id}/history`)
      logHistoryNonBlocking(historyCol, user.uid, newSpotRequest.requestedByName, "creación", `Solicitud: ${newSpotRequest.spotName}`)

      setIsCreateOpen(false)
      setScriptText("")
      toast({ title: "Solicitud enviada" })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUploadComplete = async (spotId: string, url: string) => {
    if (!firestore || !user) return
    
    console.log(`[SpotsPage] Actualizando registro: ${spotId}`);
    const spotRef = doc(firestore, "spot_requests", spotId);
    
    try {
      await updateDoc(spotRef, {
        audioFileUrl: url,
        status: 'terminado',
        updatedAt: serverTimestamp()
      });

      const historyCol = collection(firestore, `spot_requests/${spotId}/history`)
      logHistoryNonBlocking(historyCol, user.uid, user.displayName || user.email || "Usuario", "Audio cargado", "Se vinculó el archivo final.")
      
      toast({ title: "Spot finalizado", description: "El audio se guardó correctamente en el registro." })
    } catch (e: any) {
      console.error("[SpotsPage] Error al actualizar Firestore:", e);
      toast({ variant: "destructive", title: "Error al vincular URL", description: e.message });
    }
  }

  const handleGenerateScript = async () => {
    setIsGeneratingIA(true)
    try {
      const result = await generateSpotText({
        clientName: "Cliente",
        campaignObjective: "Promoción",
        productServiceDescription: "Servicio",
        targetAudience: "General",
        duration: "30 segundos",
        keyMessage: "Mensaje",
        callToAction: "Acción"
      })
      setScriptText(result.spotText)
    } catch (error) {
      toast({ variant: "destructive", title: "Error IA" })
    } finally {
      setIsGeneratingIA(false)
    }
  }

  const togglePlayback = (spotId: string, url: string) => {
    if (playingAudio === spotId) {
      audioRef.current?.pause()
      setPlayingAudio(null)
    } else {
      setPlayingAudio(spotId)
      if (audioRef.current) {
        audioRef.current.src = url
        audioRef.current.play()
      }
    }
  }

  const handleDownloadPDF = async (spot: any) => {
    setIsGeneratingPDF(true)
    try {
      const pdfBlob = await generateSpotPDF(spot, user?.displayName || "Usuario")
      const blobUrl = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `Ficha_Spot_${spot.id.substring(0,5)}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error PDF" })
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="hidden">
        <audio 
          ref={audioRef} 
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          onEnded={() => setPlayingAudio(null)}
        />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 text-white">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Producción de Spots</h2>
          <p className="text-muted-foreground">Gestión de guiones y carga de audios finales</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 font-bold w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Nueva Solicitud
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-card text-white border-border max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreateSpot}>
              <DialogHeader>
                <DialogTitle>Nueva Solicitud de Grabación</DialogTitle>
                <DialogDescription className="text-muted-foreground">Detalles técnicos para el equipo de producción.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Input name="client" placeholder="Nombre del cliente" className="bg-background/50" required />
                </div>
                <div className="space-y-2">
                  <Label>Estación Destino</Label>
                  <Select name="station" required>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Seleccionar estación" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nombre del Spot</Label>
                  <Input name="name" placeholder="Ej. Campaña Navideña 2024" className="bg-background/50" required />
                </div>
                <div className="space-y-2">
                  <Label>Duración (Segundos)</Label>
                  <Input name="duration" placeholder="30s" defaultValue="30s" className="bg-background/50" required />
                </div>
                <div className="space-y-2">
                  <Label>Texto del Guion</Label>
                  <Textarea value={scriptText} onChange={(e) => setScriptText(e.target.value)} placeholder="Escribe el contenido para grabar..." className="min-h-[120px] bg-background/50" required />
                  <Button type="button" variant="outline" size="sm" className="w-full text-accent border-accent hover:bg-accent/10" onClick={handleGenerateScript} disabled={isGeneratingIA}>
                    {isGeneratingIA ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    Sugerir Guion con IA
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSaving}>Registrar Solicitud</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {loadingSpots ? (
          <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Sincronizando con cabina de producción...</p>
          </div>
        ) : (
          spots?.map((spot) => (
            <Card key={spot.id} className="bg-card/50 border-border group hover:border-primary/50 transition-all flex flex-col h-full relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="font-mono text-[10px] mb-2">{spot.id.substring(0,8).toUpperCase()}</Badge>
                  <Badge variant="outline" className={spot.status === 'terminado' ? 'bg-green-500/10 text-green-500 border-none' : 'bg-blue-500/10 text-blue-500 border-none'}>
                    {spot.status?.toUpperCase()}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold text-white truncate">{spot.spotName}</CardTitle>
                <CardDescription className="text-accent truncate">{spot.clientName}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="text-xs text-muted-foreground mb-4 space-y-1">
                  <p className="font-bold text-white/80">{spot.station}</p>
                  <p>Duración: <span className="text-white font-mono">{spot.duration}</span></p>
                </div>
                
                <div className="mt-auto space-y-3">
                  {spot.audioFileUrl ? (
                    <div className="bg-background/30 p-3 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-3">
                        <Button variant="secondary" size="icon" className="h-10 w-10 shrink-0" onClick={() => togglePlayback(spot.id, spot.audioFileUrl)}>
                          {playingAudio === spot.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <div className="flex-1 space-y-1 overflow-hidden">
                          <Progress value={playingAudio === spot.id ? (currentTime / (duration || 1)) * 100 : 0} className="h-1" />
                          <div className="flex justify-between text-[10px] font-mono opacity-60">
                            <span>{playingAudio === spot.id ? Math.floor(currentTime) + 's' : "0:00"}</span>
                            <span>{spot.duration}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0" asChild>
                          <a href={spot.audioFileUrl} download={`Spot_${spot.spotName}.mp3`} target="_blank"><Download className="h-4 w-4" /></a>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2">
                      <FileUploader 
                        key={`uploader-${spot.id}`}
                        path="audios" 
                        allowedTypes={['audio/mpeg', 'audio/wav', '.mp3', '.wav']} 
                        label="Subir Audio Final"
                        onUploadComplete={(url) => handleUploadComplete(spot.id, url)}
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" className="flex-1 text-xs gap-2 border hover:bg-accent/10">
                          <Eye className="h-3 w-3" /> Ver Ficha
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[95vw] md:max-w-[900px] h-[90vh] p-0 border-none bg-transparent">
                        <DialogHeader className="sr-only"><DialogTitle>Ficha Técnica</DialogTitle></DialogHeader>
                        <DocumentContainer 
                          title="FICHA DE PRODUCCIÓN" 
                          folio={spot.id.substring(0,8).toUpperCase()} 
                          date={new Date(spot.createdAt?.toDate ? spot.createdAt.toDate() : spot.createdAt).toLocaleDateString()} 
                          onDownload={() => handleDownloadPDF(spot)} 
                          isGenerating={isGeneratingPDF}
                        >
                          <div className="text-left space-y-8">
                            <div className="grid grid-cols-2 gap-4">
                              <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Titular</p><p className="text-xl font-black text-black leading-none">{spot.clientName}</p></div>
                              <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estación</p><p className="text-xl font-black text-primary leading-none">{spot.station}</p></div>
                            </div>
                            <div className="bg-gray-50 p-8 border-2 border-dashed rounded-sm">
                              <p className="text-[10px] font-black text-gray-400 mb-4 uppercase tracking-widest text-center">GUION OFICIAL PARA GRABACIÓN</p>
                              <p className="text-xl text-gray-800 leading-relaxed italic font-serif text-center">"{spot.spotText}"</p>
                            </div>
                          </div>
                        </DocumentContainer>
                      </DialogContent>
                    </Dialog>

                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="border shrink-0 hover:bg-primary/10">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="sm:max-w-[450px]">
                        <SheetHeader className="mb-6"><SheetTitle>Producción: {spot.spotName}</SheetTitle></SheetHeader>
                        <EntityCollaboration entityPath={`spot_requests/${spot.id}`} />
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
