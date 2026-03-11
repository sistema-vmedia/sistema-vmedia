
"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase"
import { doc, updateDoc, serverTimestamp, collection } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { logHistoryNonBlocking } from "@/firebase/non-blocking-updates"

export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const router = useRouter()
  const { firestore, user } = useFirebase()
  const [isSaving, setIsSaving] = useState(false)

  const clientRef = useMemoFirebase(() => {
    if (!firestore || !id) return null
    return doc(firestore, "clients", id)
  }, [firestore, id])

  const { data: client, isLoading } = useDoc(clientRef)

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!firestore || !id || !client) return
    setIsSaving(true)

    const formData = new FormData(e.currentTarget)
    const updatedData = {
      name: formData.get("name")?.toString() || "",
      companyName: formData.get("companyName")?.toString() || "",
      phone: formData.get("phone")?.toString() || "",
      email: formData.get("email")?.toString() || "",
      rfc: formData.get("rfc")?.toString().toUpperCase() || "",
      fiscalAddress: formData.get("fiscalAddress")?.toString() || "",
      fiscalRegime: formData.get("fiscalRegime")?.toString() || "",
      observations: formData.get("observations")?.toString() || "",
      updatedAt: serverTimestamp(),
    }

    try {
      await updateDoc(clientRef, updatedData)
      
      if (user) {
        const historyCol = collection(firestore, `clients/${id}/history`)
        logHistoryNonBlocking(
          historyCol,
          user.uid,
          user.displayName || user.email || "Usuario",
          "actualización",
          `Se actualizaron los datos del cliente: ${updatedData.name}`
        )
      }

      toast({ title: "Cambios guardados", description: "El cliente ha sido actualizado correctamente." })
      router.push(`/clients/${id}`)
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <div className="p-8 text-center">Cargando cliente...</div>
  if (!client) return <div className="p-8 text-center text-red-500">Cliente no encontrado.</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/clients/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-3xl font-bold tracking-tight text-white">Editar Cliente</h2>
      </div>

      <form onSubmit={handleUpdate}>
        <Card className="bg-card border-border max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Formulario de Edición</CardTitle>
            <CardDescription>Actualiza los datos fiscales y de contacto.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Comercial / Contacto</Label>
                <Input id="name" name="name" defaultValue={client.name} required className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Razón Social</Label>
                <Input id="companyName" name="companyName" defaultValue={client.companyName} required className="bg-background/50" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rfc">RFC</Label>
                <Input id="rfc" name="rfc" defaultValue={client.rfc} required className="bg-background/50 font-mono uppercase" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fiscalRegime">Régimen Fiscal</Label>
                <Input id="fiscalRegime" name="fiscalRegime" defaultValue={client.fiscalRegime} required className="bg-background/50" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" name="phone" defaultValue={client.phone} required className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={client.email} required className="bg-background/50" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fiscalAddress">Domicilio Fiscal</Label>
              <Input id="fiscalAddress" name="fiscalAddress" defaultValue={client.fiscalAddress} required className="bg-background/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="observations">Observaciones</Label>
              <Textarea id="observations" name="observations" defaultValue={client.observations} className="bg-background/50 min-h-[100px]" />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.push(`/clients/${id}`)}>Cancelar</Button>
              <Button type="submit" disabled={isSaving} className="font-bold">
                <Save className="mr-2 h-4 w-4" /> {isSaving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
