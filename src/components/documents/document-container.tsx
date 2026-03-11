"use client"

import React from "react"
import { Printer, Download, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DocumentHeader } from "./document-header"

interface DocumentContainerProps {
  title: string
  folio: string
  date: string
  children: React.ReactNode
  onClose?: () => void
  onDownload?: () => void
  onPrint?: () => void
  isGenerating?: boolean
}

export function DocumentContainer({ title, folio, date, children, onClose, onDownload, onPrint, isGenerating }: DocumentContainerProps) {
  const handlePrint = () => {
    if (onPrint) {
      onPrint()
    } else {
      window.print()
    }
  }

  return (
    <div className="bg-gray-100 p-0 md:p-8 h-full relative overflow-y-auto w-full">
      <div className="max-w-[850px] mx-auto space-y-4 pb-20">
        <div className="flex justify-end gap-2 no-print p-4 md:p-0 sticky top-0 z-10 bg-gray-100/80 backdrop-blur-sm">
          <Button variant="outline" onClick={handlePrint} disabled={isGenerating}>
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
            Imprimir / PDF
          </Button>
          {onDownload && (
            <Button onClick={onDownload} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Descargar
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="document-preview bg-white shadow-2xl overflow-hidden">
          <DocumentHeader />
          
          <div className="flex justify-between items-center mb-8 bg-gray-50 p-6 border-l-4 border-primary">
            <div>
              <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">{title}</p>
              <p className="text-3xl font-black text-primary">{folio}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">FECHA DE EMISIÓN</p>
              <p className="font-bold text-lg">{date}</p>
            </div>
          </div>

          <div className="space-y-8">
            {children}
          </div>

          <div className="mt-20 pt-12 border-t border-dashed text-center">
            <div className="inline-block border-t border-black px-16 pt-3">
              <p className="text-sm font-bold uppercase tracking-widest">Firma Autorizada</p>
              <p className="text-xs text-gray-400 mt-1">VMEDIA COMUNICACIONES S.A. DE C.V.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
