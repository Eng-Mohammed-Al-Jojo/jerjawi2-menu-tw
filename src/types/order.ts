import type { PriceType } from "../utils/priceUtils";

export type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled" | "archived";
export type PaymentStatus = "paid" | "unpaid";
export type OrderType = "in" | "out";

export interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
    selectedPriceType?: PriceType;
}

export interface CustomerData {
    name: string;
    phone?: string;
    table?: string;
    address?: string;
    notes?: string;
}

export interface PreparationTime {
    startedAt: number | null;
    completedAt: number | null;
    durationMinutes: number | null;
}

export interface Order {
    id: string;
    orderId: string;
    customer: CustomerData;
    items: OrderItem[];
    totalAmount: number;
    status: OrderStatus;
    paymentStatus?: PaymentStatus;
    orderType: OrderType;
    createdAt: number;
    updatedAt: number;
    preparationTime?: PreparationTime;
    archived?: boolean;
    source?: "dashboard" | "whatsapp";
    tracked?: boolean;
    excludedFromReports?: boolean;
}
