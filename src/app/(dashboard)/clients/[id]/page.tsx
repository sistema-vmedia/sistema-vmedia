
"use client"

import { use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  FileText, 
  Plus,
  History as HistoryIcon,
  MessageSquare,
  BadgeDollarSign
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFirebase, useDoc, useCollection, useMemoFirebase } from "@/firebase"
import { doc, collection, query, where, deleteDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { EntityCollaboration } from "@/components/shared/entity-collaboration"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const router = useRouter()
  const { firestore } = useFirebase()

  const clientRef = useMemoFirebase(() => {
    if (!firestore || !id) return null
    return doc(firestore, "clients", id)
  }, [firestore, id])

  const { data: client, isLoading: loadingClient } = useDoc(clientRef)

  const contractsQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null
    return query(collection(firestore, "contracts"), where("clientId", "==", id))
  }, [firestore, id])

  const { data: contracts, isLoading: loadingContracts } = useCollection(contractsQuery)

  const handleDelete = async () => {
    if (!firestore || !id) return
    if (confirm("¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.")) {
      try {
        await deleteDoc(doc(firestore, "clients", id))
        toast({ title: "Cliente eliminado", description: "El cliente ha sido borrado correctamente." })
        router.push("/clients")
      } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message })
      }
    }
  }

  if (loadingClient) return <div className="p-8 text-center">Cargando detalles del cliente...</div>
  if (!client) return <div className="p-8 text-center text-red-500">Cliente no encontrado.</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/clients")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight text-white">{client.name}</h2>
          <p className="text-muted-foreground">{client.companyName}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/clients/edit/${id}`)}>
            <Edit className="mr-2 h-4 w-4" /> Editar
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl">Perfil del Cliente</CardTitle>
              <CardDescription>Datos generales y fiscales</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <BadgeDollarSign className="h-4 w-4 text-accent" />
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest">RFC</p>
                    <p className="text-white font-mono">{client.rfc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Phone className="h-4 w-4 text-accent" />
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest">Teléfono</p>
                    <p className="text-white">{client.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="h-4 w-4 text-accent" />
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest">Email</p>
                    <p className="text-white">{client.email}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Building2 className="h-4 w-4 text-accent" />
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest">Régimen Fiscal</p>
                    <p className="text-white">{client.fiscalRegime}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-accent mt-1" />
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest">Dirección Fiscal</p>
                    <p className="text-white text-sm leading-relaxed">{client.fiscalAddress}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="contracts" className="w-full">
            <TabsList className="bg-card border w-full justify-start rounded-b-none border-b-0">
              <TabsTrigger value="contracts" className="data-[state=active]:bg-background">
                <FileText className="mr-2 h-4 w-4" /> Contratos
              </TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-background">
                <HistoryIcon className="mr-2 h-4 w-4" /> Historial
              </TabsTrigger>
            </TabsList>
            <TabsContent value="contracts" className="mt-0 border rounded-b-lg bg-card overflow-hidden">
              <div className="p-4 flex justify-between items-center border-b">
                <h3 className="font-bold">Contratos del Cliente</h3>
                <Button size="sm" asChild>
                  <Link href={`/contracts/new?clientId=${id}`}>
                    <Plus className="h-4 w-4 mr-1" /> Nuevo Contrato
                  </Link>
                </Button>
              </div>
              <div className="overflow-x-auto w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Folio</TableHead>
                      <TableHead>Estación</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Estatus</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingContracts ? (
                      <TableRow><TableCell colSpan={5} className="text-center">Cargando contratos...</TableCell></TableRow>
                    ) : contracts?.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Sin contratos registrados.</TableCell></TableRow>
                    ) : (
                      contracts?.map(contract => (
                        <TableRow key={contract.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/contracts?folio=${contract.id}`)}>
                          <TableCell className="font-mono text-accent text-xs font-bold">{contract.id.substring(0, 8)}</TableCell>
                          <TableCell>{contract.station}</TableCell>
                          <TableCell className="text-xs">{contract.campaignType}</TableCell>
                          <TableCell className="font-bold">${contract.monthlyAmount?.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className="bg-green-500/10 text-green-500 border-none">{contract.status || "Activo"}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="activity" className="mt-0 border rounded-b-lg bg-card p-6">
               <EntityCollaboration entityPath={`clients/${id}`} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Observaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground italic leading-relaxed">
                {client.observations || "Sin observaciones adicionales."}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Colaboración</CardTitle>
              <CardDescription>Chat interno sobre este cliente</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
               <div className="h-[400px]">
                 <EntityCollaboration entityPath={`clients/${id}`} />
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
