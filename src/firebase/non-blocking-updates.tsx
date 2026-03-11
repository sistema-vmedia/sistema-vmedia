'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
  serverTimestamp,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Registra una acción en el historial de una entidad.
 */
export function logHistoryNonBlocking(
  historyCol: CollectionReference,
  userId: string,
  userName: string,
  action: string,
  details: string = ""
) {
  const data = {
    userId,
    userName,
    action,
    details,
    timestamp: serverTimestamp(),
  };

  addDoc(historyCol, data).catch((error) => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: historyCol.path,
        operation: 'create',
        requestResourceData: data,
      })
    );
  });
}

/**
 * Initiates a setDoc operation for a document reference.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options: SetOptions) {
  return setDoc(docRef, data, options).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'write',
        requestResourceData: data,
      })
    );
    throw error;
  });
}

/**
 * Initiates an addDoc operation for a collection reference.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  return addDoc(colRef, data).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: colRef.path,
        operation: 'create',
        requestResourceData: data,
      })
    );
    throw error;
  });
}

/**
 * Initiates an updateDoc operation for a document reference.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  return updateDoc(docRef, data).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'update',
        requestResourceData: data,
      })
    );
    throw error;
  });
}

/**
 * Initiates a deleteDoc operation for a document reference.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  return deleteDoc(docRef).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete',
      })
    );
    throw error;
  });
}