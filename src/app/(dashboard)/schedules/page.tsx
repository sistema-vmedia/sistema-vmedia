"use client"

import { useState } from "react"
import { Clock, Plus, Search, Calendar as CalendarIcon, Radio, Filter, MoreHorizontal, Trash2, Loader2 } from "lucide-react"
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
import { collection, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
const STATIONS = ["XHJZ La Campera 92.9 FM", "XHJS Euforia 98.5 FM"]

export default function SchedulesPage() {
  const { firestore, user } = useFirebase()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStation, setSelectedStation] = useState<string>("all")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Data fetching
  const slotsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, "schedule_slots"), orderBy("time", "asc"))
  }, [firestore])

  const { data: slots, isLoading: loadingSlots } = useCollection(slotsQuery)

  const clientsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return collection(firestore, "clients")
  }, [firestore])
  const { data: clients } = useCollection(clientsQuery)

  const contractsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return collection(firestore, "contracts")
  }, [firestore])
  const { data: contracts } = useCollection(contractsQuery)

  const handleAddSlot = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!firestore || !user) return
    setIsSaving(true)

    const formData = new FormData(e.currentTarget)
    const clientId = formData.get("clientId")?.toString() || ""
    const contractId = formData.get("contractId")?.toString() || ""
    const clientName = clients?.find(c => c.id === clientId)?.name || "Desconocido"

    const newSlot = {
      program: formData.get("program")?.toString() || "",
      station: formData.get("station")?.toString() || "",
      dayOfWeek: formData.get("dayOfWeek")?.toString() || "",
      time: formData.get("time")?.toString() || "",
      duration: Number(formData.get("duration")),
      clientId,
      clientName,
      contractId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    try {
      await addDoc(collection(firestore, "schedule_slots"), newSlot)
      toast({ title: "Horario asignado", description: "El espacio ha sido reservado en la rejilla de programación." })
      setIsAddOpen(false)
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteSlot = async (id: string) => {
    if (!firestore || !confirm("¿Eliminar este espacio de la programación?")) return
    try {
      await deleteDoc(doc(firestore, "schedule_slots", id))
      toast({ title: "Espacio liberado" })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message })
    }
  }

  const filteredSlots = slots?.filter(slot => {
    const matchesSearch = slot.program?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         slot.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStation = selectedStation === "all" || slot.station === selectedStation
    return matchesSearch && matchesStation
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Horarios</h2>
          <p className="text-muted-foreground">Control de bloques y programas en la rejilla radial</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 font-bold w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Asignar Espacio
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-card text-white border-border">
            <form onSubmit={handleAddSlot}>
              <DialogHeader>
                <DialogTitle>Nueva Asignación de Horario</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Reserva un bloque de tiempo para un programa o patrocinio específico.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Programa / Concepto</Label>
                    <Input name="program" placeholder="Ej. Noticiero Matutino" required className="bg-background/50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Estación</Label>
                    <Select name="station" required>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Día de la Semana</Label>
                    <Select name="dayOfWeek" required>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Hora de Inicio</Label>
                    <Input type="time" name="time" required className="bg-background/50" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Duración (minutos)</Label>
                    <Input type="number" name="duration" placeholder="Ej. 60" required className="bg-background/50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Select name="clientId" required>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Vincular cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Contrato Relacionado (Opcional)</Label>
                  <Select name="contractId">
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Seleccionar contrato" />
                    </SelectTrigger>
                    <SelectContent>
                      {contracts?.map(con => (
                        <SelectItem key={con.id} value={con.id}>
                          Folio: {con.id.substring(0,8).toUpperCase()} - {con.station}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSaving} className="font-bold">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar en Rejilla"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 bg-card p-4 rounded-lg border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por programa o cliente..." 
            className="pl-9 bg-background/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Tabs value={selectedStation} onValueChange={setSelectedStation} className="w-full md:w-auto">
          <TabsList className="bg-background/50">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value={STATIONS[0]}>92.9 FM</TabsTrigger>
            <TabsTrigger value={STATIONS[1]}>98.5 FM</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table className="min-w-[900px] md:min-w-full">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold">Hora</TableHead>
                <TableHead className="font-bold">Día</TableHead>
                <TableHead className="font-bold">Programa / Concepto</TableHead>
                <TableHead className="font-bold">Cliente</TableHead>
                <TableHead className="font-bold">Duración</TableHead>
                <TableHead className="font-bold">Estación</TableHead>
                <TableHead className="text-right font-bold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingSlots ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10">Cargando rejilla...</TableCell></TableRow>
              ) : filteredSlots?.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No hay horarios asignados que coincidan.</TableCell></TableRow>
              ) : (
                filteredSlots?.map((slot) => (
                  <TableRow key={slot.id} className="hover:bg-muted/20">
                    <TableCell className="font-bold text-accent">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {slot.time}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-muted/50 border-none font-medium">
                        {slot.dayOfWeek}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-white uppercase text-xs tracking-wider">
                      {slot.program}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {slot.clientName}
                    </TableCell>
                    <TableCell className="text-xs">
                      {slot.duration} min
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] text-muted-foreground uppercase">{slot.station?.split(' ')[0]}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteSlot(slot.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
