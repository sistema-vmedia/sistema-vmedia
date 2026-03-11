"use client"

import { useState } from "react"
import { Radio, Plus, Search, Eye, MessageSquare, Calendar as CalendarIcon, Download, Printer } from "lucide-react"
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
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { DocumentContainer } from "@/components/documents/document-container"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const STATIONS = [
  "XHJZ La Campera 92.9 FM",
  "XHJS Euforia 98.5 FM"
]

export default function TransmissionOrdersPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  
  const orders = [
    { id: "1", folio: "OT-9001", client: "Comercializadora JP", spot: "Promo Verano", station: STATIONS[0], dates: "01/05 al 31/05", frequency: "10 spots diarios", schedules: "7:00, 9:00, 11:00, 13:00, 15:00, 17:00, 19:00, 21:00" },
    { id: "2", folio: "OT-9002", client: "Abarrotes del Norte", spot: "Aniversario", station: STATIONS[1], dates: "15/05 al 20/05", frequency: "5 spots diarios", schedules: "8:00, 12:00, 16:00, 20:00" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 text-white">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Órdenes de Transmisión</h2>
          <p className="text-muted-foreground">Instrucciones de pauta para cabina y programación oficial</p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 font-bold w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Generar Orden
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-card text-white border-border">
            <DialogHeader>
              <DialogTitle>Nueva Orden de Transmisión</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Define la pauta para una estación específica.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="station-select" className="text-right">Estación</Label>
                <div className="col-span-3">
                  <Select>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Selecciona una estación" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATIONS.map((station) => (
                        <SelectItem key={station} value={station}>{station}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="spot-name" className="text-right">Spot</Label>
                <Input id="spot-name" placeholder="Nombre del spot" className="col-span-3 bg-background/50" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="period" className="text-right">Periodo</Label>
                <Input id="period" placeholder="Ej. 01/05 al 31/05" className="col-span-3 bg-background/50" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancelar</Button>
              <Button type="submit" className="font-bold">Generar Orden</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card p-4 rounded-lg border flex items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por orden, cliente o estación..." className="pl-9 bg-background/50" />
        </div>
      </div>

      <div className="border rounded-lg bg-card overflow-x-auto w-full">
        <Table className="min-w-[800px] md:min-w-full">
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">Folio OT</TableHead>
              <TableHead className="font-bold">Cliente / Spot</TableHead>
              <TableHead className="font-bold">Estación</TableHead>
              <TableHead className="font-bold">Periodo</TableHead>
              <TableHead className="text-right font-bold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-xs font-bold text-accent">{order.folio}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-white">{order.client}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">{order.spot}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{order.station}</TableCell>
                <TableCell className="text-xs">{order.dates}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" title="Ver Orden">
                        <Eye className="h-4 w-4 text-primary" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[90vw] md:max-w-[900px] p-0 border-none bg-transparent overflow-hidden">
                      <DialogHeader className="sr-only">
                        <DialogTitle>Orden de Transmisión: {order.folio}</DialogTitle>
                        <DialogDescription>Detalles de pauta para cabina de radio.</DialogDescription>
                      </DialogHeader>
                      <div className="max-h-[85vh] overflow-y-auto">
                        <DocumentContainer title="ORDEN DE TRANSMISIÓN" folio={order.folio} date="2024-05-01">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left mb-8 text-black">
                              <div>
                                  <p className="text-[10px] uppercase font-black text-gray-400 mb-1">CLIENTE</p>
                                  <p className="font-black text-xl uppercase leading-none mb-4">{order.client}</p>
                                  
                                  <p className="text-[10px] uppercase font-black text-gray-400 mb-1">ESTACIÓN</p>
                                  <p className="font-black text-lg text-primary">{order.station}</p>
                              </div>
                              <div className="text-left md:text-right md:border-l md:pl-8">
                                  <p className="text-[10px] uppercase font-black text-gray-400 mb-1 tracking-tighter">PERIODO DE TRANSMISIÓN</p>
                                  <p className="font-black text-lg uppercase mb-4">{order.dates}</p>
                                  
                                  <p className="text-[10px] uppercase font-black text-gray-400 mb-1 tracking-tighter">FRECUENCIA DIARIA</p>
                                  <p className="font-black text-lg text-primary">{order.frequency}</p>
                              </div>
                          </div>

                          <div className="bg-gray-900 text-white p-6 md:p-10 rounded-sm text-left relative overflow-hidden">
                               <div className="absolute right-[-20px] top-[-20px] opacity-10 rotate-12">
                                  <Radio className="h-40 w-40" />
                              </div>
                              <p className="text-[10px] uppercase font-black text-gray-400 mb-4 tracking-widest flex items-center gap-2">
                                  <CalendarIcon className="h-3 w-3" /> HORARIOS DE SALIDA PROGRAMADOS
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                  {order.schedules.split(',').map((time, idx) => (
                                      <div key={idx} className="bg-white/10 p-3 rounded text-center font-black text-lg md:text-xl border border-white/5">
                                          {time.trim()}
                                      </div>
                                  ))}
                              </div>
                          </div>

                          <div className="mt-8 md:mt-12 text-left p-4 md:p-6 border-2 border-red-50 py-6 md:py-10">
                              <p className="text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">NOTAS PARA PROGRAMACIÓN</p>
                              <p className="text-sm text-gray-600 font-bold italic leading-relaxed">
                                  "El spot debe rotar equitativamente en todos los horarios. Favor de confirmar recepción de audio MP3 vía correo electrónico."
                              </p>
                          </div>
                        </DocumentContainer>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
