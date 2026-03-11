export type Role = 'Administrador' | 'Ventas' | 'Cobranza' | 'Producción';

export interface User {
  uid: string;
  email: string;
  name: string;
  role: Role;
}

export interface Client {
  id: string;
  folio: string;
  name: string;
  businessName: string;
  phone: string;
  email: string;
  rfc: string;
  address: string;
  taxRegime: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  folio: string;
  clientId: string;
  clientName: string;
  rfc: string;
  taxData: string;
  station: string;
  campaignType: string;
  startDate: string;
  endDate: string;
  monthlyAmount: number;
  seller: string;
  status: 'Activo' | 'Finalizado' | 'Cancelado';
  fileUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: string;
  folio: string;
  clientId: string;
  clientName: string;
  contractId: string;
  amount: number;
  date: string;
  seller: string;
  concept: string;
}

export interface Payment {
  id: string;
  folio: string;
  clientId: string;
  clientName: string;
  contractId: string;
  amount: number;
  date: string;
  method: string;
  reference: string;
  recordedBy: string;
  concept: string;
}

export interface SpotRequest {
  id: string;
  folio: string;
  clientId: string;
  clientName: string;
  contractId: string;
  spotName: string;
  scriptText: string;
  duration: string;
  requestDate: string;
  dueDate: string;
  status: 'solicitado' | 'en proceso' | 'pendiente de voz' | 'pendiente de autorización' | 'terminado' | 'enviado' | 'al aire';
  audioUrl?: string;
}

export interface Quote {
  id: string;
  folio: string;
  clientId: string;
  clientName: string;
  date: string;
  items: Array<{ concept: string; quantity: number; price: number; total: number }>;
  total: number;
  notes: string;
}

export interface TransmissionOrder {
  id: string;
  folio: string;
  clientId: string;
  clientName: string;
  spotId: string;
  station: string;
  transmissionDates: string;
  schedules: string;
  frequency: string;
  fileUrl?: string;
}

export interface ScheduleEntry {
  id: string;
  folio: string;
  clientId: string;
  station: string;
  program: string;
  day: string;
  time: string;
  duration: string;
  contractId: string;
}

export interface InternalInvoice {
  id: string;
  folio: string;
  clientId: string;
  contractId: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  fileUrl: string;
}

export interface AppComment {
  id: string;
  relatedId: string;
  userId: string;
  userName: string;
  text: string;
  date: string;
}