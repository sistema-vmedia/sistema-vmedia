"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Search, MoreHorizontal, Edit, FileText, History, MessageSquare, AlertTriangle, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, query, orderBy, addDoc } from "firebase/firestore"
import { logHistoryNonBlocking } from "@/firebase/non-blocking-updates"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  
  const { firestore, user, areServicesAvailable, initializationError } = useFirebase()

  const clientsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return collection(firestore, "clients")
  }, [firestore, user])

  const clientsQuery = useMemoFirebase(() => {
    if (!clientsRef) return null
    return query(clientsRef, orderBy("createdAt", "desc"))
  }, [clientsRef])

  const { data: clients, isLoading } = useCollection(clientsQuery)

  const handleCreateClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    
    if (!firestore || !user) {
      toast({
        variant: "destructive",
        title: "Error de conexión",
        description: "Firestore o el usuario no están disponibles."
      })
      setIsSaving(false)
      return
    }

    const formData = new FormData(e.currentTarget)
    const newClient = {
      name: formData.get("name")?.toString() || "",
      companyName: formData.get("companyName")?.toString() || "",
      phone: formData.get("phone")?.toString() || "",
      email: formData.get("email")?.toString() || "",
      rfc: formData.get("rfc")?.toString().toUpperCase() || "",
      fiscalAddress: formData.get("fiscalAddress")?.toString() || "",
      fiscalRegime: formData.get("fiscalRegime")?.toString() || "",
      observations: formData.get("observations")?.toString() || "",
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    try {
      const docRef = await addDoc(collection(firestore, "clients"), newClient)
      
      const historyCol = collection(firestore, `clients/${docRef.id}/history`)
      logHistoryNonBlocking(
        historyCol,
        user.uid,
        user.displayName || user.email || "Usuario",
        "creación",
        `Se registró el nuevo cliente: ${newClient.name}`
      )

      setIsCreateModalOpen(false)
      toast({
        title: "Cliente creado",
        description: "El nuevo cliente ha sido registrado correctamente."
      })
    } catch (error: any) {
      console.error("Error al crear cliente:", error)
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: error.message || "No se pudo guardar el cliente en Firestore."
      })
    } finally {
      setIsSaving(false)
    }
  }

  const filteredClients = clients?.filter(client => 
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.rfc?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!areServicesAvailable) {
    return (
      <div className="p-4 md:p-8 space-y-4">
        <Alert variant="destructive" className="bg-destructive/10 border-destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="font-bold">Error de Inicialización</AlertTitle>
          <AlertDescription className="mt-2 text-sm opacity-90">
            {initializationError || "No se pudo conectar con los servicios de Firebase."}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Clientes</h2>
          <p className="text-muted-foreground">Gestión y control de cartera de clientes</p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 font-bold w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-card text-white border-border overflow-y-auto max-h-[90vh]">
            <form onSubmit={handleCreateClient}>
              <DialogHeader>
                <DialogTitle>Nuevo Cliente</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Ingresa los datos fiscales y de contacto del nuevo cliente.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Nombre</Label>
                  <Input id="name" name="name" placeholder="Nombre completo" className="col-span-3 bg-background/50" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="companyName" className="text-right">Razón Social</Label>
                  <Input id="companyName" name="companyName" placeholder="Nombre de la empresa" className="col-span-3 bg-background/50" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="rfc" className="text-right">RFC</Label>
                  <Input id="rfc" name="rfc" placeholder="RFC" className="col-span-3 bg-background/50 font-mono uppercase" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="fiscalAddress" className="text-right text-xs">Domicilio Fiscal</Label>
                  <Input id="fiscalAddress" name="fiscalAddress" placeholder="Dirección completa" className="col-span-3 bg-background/50" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="fiscalRegime" className="text-right text-xs">Régimen Fiscal</Label>
                  <Input id="fiscalRegime" name="fiscalRegime" placeholder="Ej. 601" className="col-span-3 bg-background/50" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">Teléfono</Label>
                  <Input id="phone" name="phone" placeholder="10 dígitos" className="col-span-3 bg-background/50" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="correo@ejemplo.com" className="col-span-3 bg-background/50" required />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="observations" className="text-right pt-2">Notas</Label>
                  <Textarea id="observations" name="observations" placeholder="Observaciones adicionales..." className="col-span-3 bg-background/50 resize-none" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={isSaving}>Cancelar</Button>
                <Button type="submit" className="font-bold" disabled={isSaving}>
                  {isSaving ? "Guardando..." : "Guardar Cliente"}
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
            placeholder="Buscar por nombre, RFC..." 
            className="pl-9 bg-background/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table className="min-w-[800px] md:min-w-full">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[120px] font-bold">RFC</TableHead>
                <TableHead className="font-bold">Nombre / Razón Social</TableHead>
                <TableHead className="font-bold hidden sm:table-cell">Teléfono</TableHead>
                <TableHead className="font-bold">Estatus</TableHead>
                <TableHead className="text-right font-bold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">Cargando clientes...</TableCell>
                </TableRow>
              ) : filteredClients?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">No se encontraron clientes registrados.</TableCell>
                </TableRow>
              ) : (
                filteredClients?.map((client) => (
                  <TableRow key={client.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono text-xs font-bold text-accent">{client.rfc}</TableCell>
                    <TableCell>
                      <Link href={`/clients/${client.id}`} className="flex flex-col hover:underline">
                        <span className="font-medium text-white truncate max-w-[200px] md:max-w-none">{client.name}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[200px] md:max-w-none">{client.companyName}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{client.phone}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/10 border-none">
                        {client.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild title="Ver Detalle">
                          <Link href={`/clients/${client.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>

                        <Sheet>
                          <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" title="Colaboración">
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </SheetTrigger>
                          <SheetContent className="sm:max-w-[450px]">
                            <SheetHeader className="mb-6">
                              <SheetTitle>Colaboración: {client.name}</SheetTitle>
                              <SheetDescription>Historial y comentarios internos para este cliente.</SheetDescription>
                            </SheetHeader>
                            <EntityCollaboration entityPath={`clients/${client.id}`} />
                          </SheetContent>
                        </Sheet>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/clients/edit/${client.id}`)}>
                              <Edit className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/contracts?clientId=${client.id}`}>
                                <FileText className="mr-2 h-4 w-4" /> Ver Contratos
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                               <Link href={`/clients/${client.id}#history`}>
                                <History className="mr-2 h-4 w-4" /> Ver Historial
                               </Link>
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