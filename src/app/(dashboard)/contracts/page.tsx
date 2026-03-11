"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FileText, Plus, Search, FileDown, Paperclip, MessageSquare, CalendarIcon, Eye, Download } from "lucide-react"
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
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"

export default function ContractsPage() {
  const router = useRouter()
  const { firestore } = useFirebase()
  const [searchTerm, setSearchTerm] = useState("")

  const contractsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, "contracts"), orderBy("createdAt", "desc"))
  }, [firestore])

  const { data: contracts, isLoading } = useCollection(contractsQuery)

  const filteredContracts = contracts?.filter(contract => 
    contract.station?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.campaignType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Contratos</h2>
          <p className="text-muted-foreground">Registro de acuerdos publicitarios con generación de PDF automático</p>
        </div>
        
        <Button className="bg-primary hover:bg-primary/90 font-bold w-full md:w-auto" asChild>
          <Link href="/contracts/new">
            <Plus className="mr-2 h-4 w-4" /> Registrar Contrato
          </Link>
        </Button>
      </div>

      <div className="bg-card p-4 rounded-lg border flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por cliente, estación o folio..." 
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
                <TableHead className="font-bold">Folio</TableHead>
                <TableHead className="font-bold">Cliente / Estación</TableHead>
                <TableHead className="font-bold">Campaña</TableHead>
                <TableHead className="font-bold">Periodo</TableHead>
                <TableHead className="font-bold">Monto Men.</TableHead>
                <TableHead className="font-bold">Estatus</TableHead>
                <TableHead className="text-right font-bold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10">Cargando contratos...</TableCell></TableRow>
              ) : filteredContracts?.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No hay contratos registrados.</TableCell></TableRow>
              ) : (
                filteredContracts?.map((contract) => (
                  <TableRow key={contract.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono text-xs font-bold text-accent">{contract.id.substring(0, 8).toUpperCase()}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <Link href={`/contracts/${contract.id}`} className="font-medium text-white hover:underline">
                          {contract.clientName || "Cliente Desconocido"}
                        </Link>
                        <span className="text-xs text-muted-foreground">{contract.station}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{contract.campaignType}</TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <div>{contract.startDate}</div>
                        <div className="text-muted-foreground">al {contract.endDate}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-primary">${contract.monthlyAmount?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-500/10 text-green-500 border-none">{contract.status || "Activo"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Ver Detalle / PDF" asChild>
                          <Link href={`/contracts/${contract.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>

                        {contract.contractFileUrl && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Descargar PDF" 
                            onClick={() => handleDownload(contract.contractFileUrl, `Contrato_${contract.id.substring(0, 8)}.pdf`)}
                          >
                            <Download className="h-4 w-4 text-primary" />
                          </Button>
                        )}

                        <Sheet>
                          <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" title="Comentarios y Auditoría">
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </SheetTrigger>
                          <SheetContent className="sm:max-w-[450px]">
                            <SheetHeader className="mb-6">
                              <SheetTitle>Colaboración: {contract.id.substring(0, 8)}</SheetTitle>
                              <SheetDescription>Historial de cambios y comentarios para este contrato.</SheetDescription>
                            </SheetHeader>
                            <EntityCollaboration entityPath={`contracts/${contract.id}`} />
                          </SheetContent>
                        </Sheet>
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
