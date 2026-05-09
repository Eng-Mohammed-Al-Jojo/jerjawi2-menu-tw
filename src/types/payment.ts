export interface PaymentMethod {
    id: string;
    name: string;
    imageUrl?: string;
    fields?: { label: string; value: string }[];
    showPaymentDetails: boolean;
    isEnabled: boolean;
    type: "bank" | "wallet" | "cash";
    order?: number;
    createdAt?: number;
    
    // Deprecated fields kept for compatibility during migration if needed
    label?: string;
    details?: string;
    isActive?: boolean;
}

export interface PaymentMethodsSettings {
    enabled: boolean;
    methods?: Record<string, Omit<PaymentMethod, "id">>;
}

export type PaymentStatus = "pending" | "approved" | "rejected";

export interface PaymentRecord {
    id: string;
    orderId: string;
    methodId: string;
    methodName: string;
    customerName: string;
    senderAccountName?: string | null;
    senderAccountNumber?: string | null;
    receiverAccountName?: string | null;
    receiverAccountNumber?: string | null;
    senderBankOrWallet?: string | null;
    notes?: string;
    amount: number;
    status: PaymentStatus;
    createdAt: number;
    updatedAt: number;
    receiptUrl?: string;
    
    /** Approval */
    approvedAt?: number;
}
