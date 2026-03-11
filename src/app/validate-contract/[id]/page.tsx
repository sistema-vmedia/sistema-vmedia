"use client"

import { use } from "react"
import { ShieldCheck, ShieldAlert, FileText, CheckCircle2, Building2, Calendar, Radio, BadgeDollarSign } from "lucide-react"
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function ValidateContractPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const { firestore } = useFirebase()

  const contractRef = useMemoFirebase(() => {
    if (!firestore || !id) return null
    return doc(firestore, "contracts", id)
  }, [firestore, id])

  const { data: contract, isLoading } = useDoc(contractRef)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground font-medium">Validando autenticidad del contrato...</p>
        </div>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-destructive/50 bg-destructive/5">
          <CardContent className="pt-10 text-center space-y-6">
            <ShieldAlert className="h-16 w-16 text-destructive mx-auto" />
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Error de Validación</h2>
              <p className="text-muted-foreground">El contrato con folio <span className="text-destructive font-mono">{id.substring(0, 8)}</span> no existe en nuestros registros oficiales.</p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => window.location.href = "/"}>
              Regresar al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8">
      <Card className="max-w-2xl w-full border-primary/20 bg-card/50 backdrop-blur-sm shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <ShieldCheck className="h-48 w-48 text-primary" />
        </div>
        
        <CardHeader className="text-center border-b bg-primary/5 pb-10">
          <div className="bg-primary text-white p-3 rounded-full w-fit mx-auto mb-6 shadow-lg shadow-primary/20">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <CardTitle className="text-3xl font-black text-white uppercase tracking-tighter">CONTRATO VALIDADO</CardTitle>
          <CardDescription className="text-primary font-bold tracking-widest uppercase text-xs">Documento Oficial Auténtico</CardDescription>
          <Badge className="mt-4 bg-green-500/10 text-green-500 border-green-500/30 font-mono tracking-widest px-4 py-1">
            FOLIO: {id.substring(0, 10).toUpperCase()}
          </Badge>
        </CardHeader>
        
        <CardContent className="pt-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Building2 className="h-5 w-5 text-accent mt-1" />
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Titular / Cliente</p>
                  <p className="text-white font-bold text-lg leading-none mt-1">{contract.clientName}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Radio className="h-5 w-5 text-accent mt-1" />
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Estación Emisora</p>
                  <p className="text-white font-medium leading-none mt-1">{contract.station}</p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Calendar className="h-5 w-5 text-accent mt-1" />
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Vigencia</p>
                  <p className="text-white font-medium leading-none mt-1">{contract.startDate} al {contract.endDate}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <BadgeDollarSign className="h-5 w-5 text-accent mt-1" />
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Monto del Acuerdo</p>
                  <p className="text-xl font-black text-white leading-none mt-1">${contract.monthlyAmount?.toLocaleString()} <span className="text-[10px] font-normal opacity-50">MXN</span></p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 p-6 rounded-lg border border-border/50 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-green-500">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-black uppercase text-xs tracking-widest">Estado: Vigente</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed italic">
              "Este documento certifica que existe un acuerdo publicitario legalmente registrado en el sistema SOMOS VMCR de VMedia Comunicaciones para las fechas indicadas."
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {contract.contractFileUrl && (
              <Button className="w-full bg-primary hover:bg-primary/90 font-black h-12 uppercase tracking-tighter" asChild>
                <a href={contract.contractFileUrl} target="_blank">Ver Documento Digital</a>
              </Button>
            )}
            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest opacity-50">
              Verificado el {new Date().toLocaleDateString('es-MX', { dateStyle: 'long' })}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
