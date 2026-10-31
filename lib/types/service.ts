import { Bike } from "./bikes";
import { Client } from "./client";
import { Mechanic } from "./mechanic";
import { PaymentMethod, ServiceCategory } from "@/lib/enums";

export interface ServicePart {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  serviceId: number;
  /** Quién cargó el repuesto. Los de un mecánico se marcan para que el dueño revise el precio. */
  addedBy?: "OWNER" | "MECHANIC";
}

/** Edición hecha por un mecánico desde su enlace (valor anterior y nuevo, como texto). */
export interface ServiceActivity {
  id: number;
  action: "FIELD_CHANGED" | "PART_ADDED" | "PART_CHANGED" | "PART_REMOVED";
  field: string | null;
  before: string | null;
  after: string | null;
  actorName: string | null;
  createdAt: string;
}

export interface ServicePartInput {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Service {
  id: number;
  /** Folio correlativo del taller (#0123). */
  number: number;
  description: string;
  price: number;
  status: string;
  category: ServiceCategory;
  isReminderActive: boolean;
  isUrgent?: boolean;
  paidAt?: string | null;
  /** Cuándo el cliente retiró la bici; null/ausente = sigue en el taller. */
  pickedUpAt?: string | null;
  paidAmount?: number | null;
  paymentMethod?: PaymentMethod | null;
  scheduledReminderDate?: string | null;
  bicycle?: Bike | null;
  clientId: number;
  // Opcional: reparaciones no ligadas a una bici registrada no tienen bicycleId.
  bicycleId?: number | null;
  client?: Client;
  mechanic?: Mechanic;
  mechanicId: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  scheduledAt?: string | null;
  deliveryAt?: string | null;
  /** Nota interna del taller; nunca se muestra al cliente. */
  notes?: string | null;
  parts: ServicePart[];
  /** Solo viene en el detalle (`GET /services/:id`): las últimas ediciones del mecánico. */
  activity?: ServiceActivity[];
}

export interface ServiceQuery {
  data: Service[];
  limit: number;
  page: number;
  totalItems: number;
  totalPages: number;
}
