'use client';

import { useState, useId, useEffect, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, StorageError } from 'firebase/storage';
import { useFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface FileUploaderProps {
  path: string;
  onUploadComplete: (url: string) => void;
  allowedTypes?: string[];
  label?: string;
}

/**
 * COMPONENTE DE SUBIDA GLOBAL
 * Diseñado para ser resiliente a re-renderizados y cambios de estado de Firestore.
 */
export function FileUploader({ path, onUploadComplete, allowedTypes = ['*/*'], label = "Subir archivo" }: FileUploaderProps) {
  const { storage, user, areServicesAvailable } = useFirebase();
  const [progress, setProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const uploaderId = useId();
  
  const lastUpdateRef = useRef<number>(Date.now());
  const uploadTaskRef = useRef<any>(null);

  // LOGS DE CICLO DE VIDA
  useEffect(() => {
    console.log(`[Uploader:${uploaderId}] Montado para ruta: ${path}`);
    return () => {
      if (uploadTaskRef.current && status === 'uploading') {
        console.warn(`[Uploader:${uploaderId}] Desmontado durante subida. La tarea de Firebase seguirá en segundo plano.`);
      }
    };
  }, [uploaderId, path, status]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    console.log(`[Uploader:${uploaderId}] Archivo seleccionado: ${file.name} (${file.type})`);

    if (!storage || !user) {
      const msg = "Servicios no disponibles o sesión no iniciada.";
      console.error(`[Uploader:${uploaderId}] Error: ${msg}`);
      setErrorMessage(msg);
      return;
    }

    // Validación de tipos
    const isAllowed = allowedTypes.some(type => {
      if (type === '*/*') return true;
      if (file.type && (type.endsWith('/*') ? file.type.startsWith(type.replace('/*', '')) : file.type === type)) return true;
      if (type.startsWith('.') && file.name.toLowerCase().endsWith(type.toLowerCase())) return true;
      return false;
    });

    if (!isAllowed) {
      console.warn(`[Uploader:${uploaderId}] Tipo no permitido: ${file.type}`);
      toast({ variant: "destructive", title: "Formato no válido", description: `El archivo ${file.name} no es un formato permitido.` });
      return;
    }

    setIsUploading(true);
    setStatus('uploading');
    setProgress(1);
    lastUpdateRef.current = Date.now();

    try {
      const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const storagePath = `${path}/${Date.now()}_${cleanName}`;
      const storageRef = ref(storage, storagePath);
      
      console.log(`[Uploader:${uploaderId}] Iniciando subida en: ${storagePath}`);
      console.log(`[Uploader:${uploaderId}] Bucket: ${storage.app.options.storageBucket}`);

      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type || 'application/octet-stream'
      });
      
      uploadTaskRef.current = uploadTask;

      uploadTask.on('state_changed',
        (snapshot) => {
          const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`[Uploader:${uploaderId}] Progreso: ${Math.round(p)}% (${snapshot.bytesTransferred}/${snapshot.totalBytes})`);
          setProgress(Math.max(p, 1));
          lastUpdateRef.current = Date.now();
        },
        (error: StorageError) => {
          console.error(`[Uploader:${uploaderId}] Error de Firebase:`, error.code, error.message);
          setStatus('error');
          setIsUploading(false);
          setErrorMessage(`${error.code}: ${error.message}`);
          
          if (error.code !== 'storage/canceled') {
            toast({ variant: "destructive", title: "Fallo de subida", description: error.message });
          }
        },
        async () => {
          console.log(`[Uploader:${uploaderId}] Subida finalizada con éxito.`);
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log(`[Uploader:${uploaderId}] URL generada: ${downloadURL.substring(0, 50)}...`);
            setStatus('success');
            setIsUploading(false);
            setProgress(100);
            onUploadComplete(downloadURL);
          } catch (urlErr: any) {
            console.error(`[Uploader:${uploaderId}] Error al obtener URL final:`, urlErr);
            setErrorMessage("Error al generar enlace del archivo.");
            setStatus('error');
            setIsUploading(false);
          }
        }
      );
    } catch (err: any) {
      console.error(`[Uploader:${uploaderId}] Fallo crítico al iniciar tarea:`, err);
      setErrorMessage(err.message);
      setStatus('error');
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3 w-full">
      <div className="relative">
        <input
          type="file"
          id={uploaderId}
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading || !areServicesAvailable}
          accept={allowedTypes.join(',')}
        />
        <label htmlFor={uploaderId}>
          <Button 
            asChild 
            variant={status === 'success' ? 'secondary' : status === 'error' ? 'destructive' : 'outline'} 
            className="w-full cursor-pointer font-bold border-dashed h-12"
            disabled={isUploading || !areServicesAvailable}
          >
            <div>
              {status === 'uploading' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo... {Math.round(progress)}%
                </>
              ) : status === 'success' ? (
                <><CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> ¡Archivo Cargado!</>
              ) : status === 'error' ? (
                <><AlertCircle className="mr-2 h-4 w-4" /> Reintentar Carga</>
              ) : (
                <><Upload className="mr-2 h-4 w-4" /> {label}</>
              )}
            </div>
          </Button>
        </label>
      </div>
      
      {isUploading && (
        <Progress value={progress} className="h-1.5 w-full bg-muted overflow-hidden" />
      )}

      {errorMessage && (
        <div className="flex items-start gap-2 p-3 rounded bg-destructive/10 border border-destructive/20 text-[11px] text-destructive font-bold leading-tight">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <div className="flex-1">
            <p className="uppercase tracking-tighter">Fallo en la comunicación:</p>
            <p className="font-mono mt-1 opacity-80">{errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
