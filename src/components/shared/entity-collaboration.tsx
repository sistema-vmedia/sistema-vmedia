"use client"

import { useState } from "react"
import { MessageSquare, History as HistoryIcon, Send, User, Clock } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, query, orderBy } from "firebase/firestore"
import { addDocumentNonBlocking, logHistoryNonBlocking } from "@/firebase/non-blocking-updates"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface EntityCollaborationProps {
  entityPath: string; // e.g., "clients/cl-001" or "contracts/con-1024"
}

export function EntityCollaboration({ entityPath }: EntityCollaborationProps) {
  const [commentText, setCommentText] = useState("")
  const { firestore } = useFirestore()
  const { user } = useUser()

  // Comments collection and query
  const commentsCol = useMemoFirebase(() => {
    if (!firestore || !entityPath) return null
    return collection(firestore, entityPath, "comments")
  }, [firestore, entityPath])

  const commentsQuery = useMemoFirebase(() => {
    if (!commentsCol) return null
    return query(commentsCol, orderBy("createdAt", "desc"))
  }, [commentsCol])

  const { data: comments, isLoading: loadingComments } = useCollection(commentsQuery)

  // History collection and query
  const historyCol = useMemoFirebase(() => {
    if (!firestore || !entityPath) return null
    return collection(firestore, entityPath, "history")
  }, [firestore, entityPath])

  const historyQuery = useMemoFirebase(() => {
    if (!historyCol) return null
    return query(historyCol, orderBy("timestamp", "desc"))
  }, [historyCol])

  const { data: history, isLoading: loadingHistory } = useCollection(historyQuery)

  const handleSendComment = () => {
    if (!commentText.trim() || !commentsCol || !user) return

    const userName = user.displayName || user.email || "Usuario"

    const newComment = {
      commentText: commentText.trim(),
      userId: user.uid,
      userName: userName,
      createdAt: serverTimestamp(),
      entityPath: entityPath
    }

    addDocumentNonBlocking(commentsCol, newComment)
    
    // Log history of the comment
    if (historyCol) {
      logHistoryNonBlocking(
        historyCol,
        user.uid,
        userName,
        "Comentario agregado",
        commentText.trim().substring(0, 50) + (commentText.length > 50 ? "..." : "")
      )
    }

    setCommentText("")
  }

  const formatTimestamp = (ts: any) => {
    if (!ts) return ""
    const date = ts.toDate ? ts.toDate() : new Date(ts)
    return format(date, "d MMM, HH:mm", { locale: es })
  }

  return (
    <Tabs defaultValue="comments" className="w-full border rounded-lg bg-card">
      <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
        <TabsTrigger value="comments" className="flex gap-2">
          <MessageSquare className="h-4 w-4" /> Comentarios
        </TabsTrigger>
        <TabsTrigger value="history" className="flex gap-2">
          <HistoryIcon className="h-4 w-4" /> Historial
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="comments" className="p-4 space-y-4">
        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-4">
            {loadingComments ? (
              <div className="text-center text-xs text-muted-foreground py-4">Cargando comentarios...</div>
            ) : comments?.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-8">No hay comentarios internos aún.</div>
            ) : (
              comments?.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {(c.userName || "U")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-muted/50 p-3 rounded-lg text-sm border border-border/50">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-xs text-white">{c.userName || "Usuario"}</span>
                      <span className="text-[10px] text-muted-foreground">{formatTimestamp(c.createdAt)}</span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{c.commentText}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        <div className="flex gap-2 pt-2">
          <Textarea 
            placeholder="Escribir comentario interno..." 
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="min-h-[80px] resize-none bg-background/50"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendComment()
              }
            }}
          />
          <Button 
            size="icon" 
            className="h-auto px-4" 
            disabled={!commentText.trim() || loadingComments}
            onClick={handleSendComment}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="history" className="p-4">
        <ScrollArea className="h-[440px] pr-4">
          <div className="space-y-6">
            {loadingHistory ? (
              <div className="text-center text-xs text-muted-foreground py-4">Cargando historial...</div>
            ) : history?.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-8">Sin registros de actividad.</div>
            ) : (
              history?.map((h) => (
                <div key={h.id} className="relative pl-6 border-l-2 border-primary/20 pb-6 last:pb-0">
                  <div className="absolute left-[-6px] top-0 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                  <div className="flex flex-col">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-sm text-white">{h.action}</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {formatTimestamp(h.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Por: <span className="text-primary font-medium">{h.userName || "Sistema"}</span></p>
                    {h.details && (
                      <p className="text-[11px] bg-muted/30 p-2 rounded italic text-muted-foreground border border-border/30">
                        {h.details}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  )
}
