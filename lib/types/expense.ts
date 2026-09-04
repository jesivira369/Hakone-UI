import { ExpenseCategory } from "@/lib/enums";

export interface Expense {
  id: number;
  category: ExpenseCategory;
  description: string;
  amount: number;
  provider?: string | null;
  employeeName?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
  paidAt: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
}

export interface ExpenseQuery {
  data: Expense[];
  limit: number;
  page: number;
  totalItems: number;
  totalPages: number;
}
