
"use client"

import { Plus, Search, Eye, MessageSquare, MoreHorizontal } from "lucide-react"
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
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
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

export default function QuotesPage() {
  const quotes = [
    { 
      id: "1", 
      folio: "COT-501", 
      client: "Cliente Nuevo S.A.", 
      date: "2024-05-10", 
      total: 45000, 
      items: [
        { concept: "30 Spots Radio 30s", price: 1000, qty: 30, total: 30000 },
        { concept: "Producción de Spot", price: 5000, qty: 1, total: 5000 },
        { concept: "Patrocinio Menciones", price: 2000, qty: 5, total: 10000 },
      ]
    },
    { 
      id: "2", 
      folio: "COT-502", 
      client: "Tienda Local", 
      date: "2024-05-12", 
      total: 8500, 
      items: [
        { concept: "10 Spots Radio 20s", price: 850, qty: 10, total: 8500 },
      ]
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end text-white">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cotizaciones</h2>
          <p className="text-muted-foreground">Generación de propuestas comerciales</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 font-bold">
          <Plus className="mr-2 h-4 w-4" /> Nueva Cotización
        </Button>
      </div>

      <div className="bg-card p-4 rounded-lg border flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por cotización o cliente..." className="pl-9 bg-background/50" />
        </div>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">Folio</TableHead>
              <TableHead className="font-bold">Cliente</TableHead>
              <TableHead className="font-bold">Fecha</TableHead>
              <TableHead className="font-bold text-right">Total</TableHead>
              <TableHead className="text-right font-bold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.map((quote) => (
              <TableRow key={quote.id}>
                <TableCell className="font-mono text-xs font-bold text-accent">{quote.folio}</TableCell>
                <TableCell className="font-medium text-white">{quote.client}</TableCell>
                <TableCell>{quote.date}</TableCell>
                <TableCell className="font-bold text-right">${quote.total.toLocaleString()}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" title="Comentarios">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-[450px]">
                      <SheetHeader className="mb-6">
                        <SheetTitle>Historial: {quote.folio}</SheetTitle>
                        <SheetDescription>Trazabilidad y comunicación interna sobre esta cotización.</SheetDescription>
                      </SheetHeader>
                      <EntityCollaboration entityPath={`quotations/${quote.id}`} />
                    </SheetContent>
                  </Sheet>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" title="Ver Propuesta">
                        <Eye className="h-4 w-4 text-primary" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[900px] p-0 border-none bg-transparent overflow-hidden">
                      <DialogHeader className="sr-only">
                        <DialogTitle>Propuesta Comercial: {quote.folio}</DialogTitle>
                        <DialogDescription>Documento de cotización detallada.</DialogDescription>
                      </DialogHeader>
                      <DocumentContainer 
                        title="COTIZACIÓN PUBLICITARIA" 
                        folio={quote.folio} 
                        date={quote.date}
                      >
                        <div className="text-left mb-8 text-black">
                          <p className="text-[10px] uppercase font-black text-gray-400 mb-1">DIRIGIDO A:</p>
                          <p className="font-black text-2xl uppercase leading-none">{quote.client}</p>
                        </div>

                        <div className="border border-gray-100 rounded-sm overflow-hidden text-black">
                          <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b">
                              <tr>
                                <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400">Concepto</th>
                                <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400 text-center">Cant.</th>
                                <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400 text-right">Unitario</th>
                                <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400 text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {quote.items.map((item, idx) => (
                                <tr key={idx} className="border-b last:border-b-0">
                                  <td className="px-4 py-4 text-sm font-bold">{item.concept}</td>
                                  <td className="px-4 py-4 text-sm text-center">{item.qty}</td>
                                  <td className="px-4 py-4 text-sm text-right">${item.price.toLocaleString()}</td>
                                  <td className="px-4 py-4 text-sm text-right font-bold text-primary">${item.total.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex justify-between items-start mt-12 pt-8 border-t-2 text-black">
                          <div className="text-left max-w-[400px]">
                            <p className="text-[10px] font-black text-gray-400 mb-2 uppercase">Observaciones</p>
                            <p className="text-xs text-gray-600 italic">Vigencia de cotización: 15 días naturales. Precios sujetos a cambios sin previo aviso. Incluye pauta en horarios rotativos.</p>
                          </div>
                          <div className="text-right">
                            <div className="flex gap-8 mb-2">
                              <span className="text-gray-400 font-bold uppercase text-xs">Subtotal</span>
                              <span className="font-bold text-sm text-black">${(quote.total / 1.16).toLocaleString()}</span>
                            </div>
                            <div className="flex gap-8 mb-4">
                              <span className="text-gray-400 font-bold uppercase text-xs">I.V.A (16%)</span>
                              <span className="font-bold text-sm text-black">${(quote.total - (quote.total / 1.16)).toLocaleString()}</span>
                            </div>
                            <div className="bg-black text-white p-4 inline-block min-w-[200px]">
                              <span className="block text-[10px] font-black uppercase opacity-60 mb-1">Total de Propuesta</span>
                              <span className="text-2xl font-black">${quote.total.toLocaleString()}.00</span>
                            </div>
                          </div>
                        </div>
                      </DocumentContainer>
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
