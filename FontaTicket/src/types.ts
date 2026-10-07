export interface Product {
  id: string;
  reference: string | null;
  nombre: string | null;
  precio: number | null;
  foto: string | null;
  category?: string | null;
  supplier?: string | null;
  family?: string | null;
  type?: string | null;
  size?: string | null;
  connection?: string | null;
  variant?: string | null;
  length?: string | null;
  manufacturerReference?: string | null;
  sourceUrl?: string | null;
  photoSourceUrl?: string | null;
  priceDate?: string | null;
  priceSource?: string | null;
  sourcePrice?: number | null;
  priceUnit?: string | null;
  priceIncludesVat?: boolean | null;
  brand?: string | null;
  model?: string | null;
  supplierReference?: string | null;
  priceStatus?: string | null;
  priceMethod?: string | null;
  catalogFamilyOrder?: number | null;
  catalogProductOrder?: number | null;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id?: string;
  reference?: string | null;
  supplier?: string | null;
  supplierReference?: string | null;
  price: number;
  sourcePrice?: number | null;
  priceDate?: string | null;
  priceSource?: string | null;
  sourceUrl?: string | null;
  priceUnit?: string | null;
  priceIncludesVat?: boolean | null;
  priceMethod?: string | null;
  description?: string | null;
  photo?: string | null;
  attributes: Record<string, unknown>;
}

export interface TicketLine {
  id: string;
  description: string;
  reference?: string;
  unitPrice: number;
  quantity: number;
}

export interface Ticket {
  id: string;
  createdAt: string;
  customer?: string;
  lines: TicketLine[];
  total: number;
  pendingPayment?: boolean;
}

export interface AppointmentMaterial {
  id: string;
  name: string;
  acquired: boolean;
}

export interface Appointment {
  id: string;
  client: string;
  date: string;
  time: string;
  address: string;
  work: string;
  materials: AppointmentMaterial[];
}

export interface CartLine extends TicketLine {}
