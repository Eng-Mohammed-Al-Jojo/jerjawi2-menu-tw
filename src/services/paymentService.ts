import { FirebaseService } from "./firebaseService";
import type { PaymentMethod, PaymentMethodsSettings, PaymentRecord, PaymentStatus } from "../types/payment";
import { OrderService } from "./orderService";
import type { Order } from "../types/order";

const PAYMENT_SETTINGS_PATH = "settings/paymentMethods";

interface NormalizedPaymentSettings {
    enabled: boolean;
    methods: PaymentMethod[];
}

const normalizeMethod = (id: string, value: unknown): PaymentMethod => {
    const data = (value || {}) as any;

    return {
        id,
        name: data.name || data.label || "",
        imageUrl: data.imageUrl || "",
        fields: data.fields || [],
        showPaymentDetails: data.showPaymentDetails !== undefined ? !!data.showPaymentDetails : true,
        isEnabled: data.isEnabled !== undefined ? !!data.isEnabled : (data.isActive !== undefined ? !!data.isActive : true),
        type: data.type === "wallet" || data.type === "cash" || data.type === "bank" ? data.type : "bank",
        order: data.order,
        createdAt: data.createdAt,
        
        // Backward compatibility
        label: data.name || data.label || "",
        details: data.details || data.instructions || data.fields?.map((f: any) => f.value).filter(Boolean).join("\n") || "",
        isActive: data.isEnabled !== undefined ? !!data.isEnabled : (data.isActive !== undefined ? !!data.isActive : true),
    };
};

const normalizeSettings = (data: unknown): NormalizedPaymentSettings => {
    const settings = (data || {}) as PaymentMethodsSettings;
    const rawMethods = settings.methods || {};

    const methods = Object.entries(rawMethods)
        .map(([id, value]) => normalizeMethod(id, value))
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    return {
        enabled: settings.enabled !== undefined ? !!settings.enabled : true,
        methods
    };
};

/**
 * Payment Service
 * Manages payment methods and payment verification lifecycle
 */
export const PaymentService = {
    /**
     * Payment Methods Management
     */
    async getPaymentMethods(): Promise<PaymentMethod[]> {
        return new Promise((resolve) => {
            FirebaseService.listen(PAYMENT_SETTINGS_PATH, (data) => {
                resolve(normalizeSettings(data).methods);
            });
        });
    },

    listenToPaymentMethods(callback: (methods: PaymentMethod[]) => void) {
        return FirebaseService.listen(PAYMENT_SETTINGS_PATH, (data) => {
            callback(normalizeSettings(data).methods);
        });
    },

    listenToPaymentMethodsSettings(callback: (settings: NormalizedPaymentSettings) => void) {
        return FirebaseService.listen(PAYMENT_SETTINGS_PATH, (data) => {
            callback(normalizeSettings(data));
        });
    },

    async savePaymentMethod(method: Partial<PaymentMethod>) {
        const id = method.id || `pm_${Date.now()}`;
        const data = {
            ...method,
            id,
            name: method.name || method.label || "",
            type: method.type || "bank",
            createdAt: method.createdAt || Date.now(),
            isEnabled: method.isEnabled !== undefined ? method.isEnabled : (method.isActive !== undefined ? method.isActive : true),
            showPaymentDetails: method.showPaymentDetails !== undefined ? method.showPaymentDetails : true,
            order: method.order || 0
        };
        // Ensure we don't save undefined fields
        Object.keys(data).forEach(key => (data as any)[key] === undefined && delete (data as any)[key]);
        
        return FirebaseService.update(`${PAYMENT_SETTINGS_PATH}/methods/${id}`, data);
    },

    async updatePaymentMethodField(id: string, field: string, value: any) {
        return FirebaseService.update(`${PAYMENT_SETTINGS_PATH}/methods/${id}`, { [field]: value });
    },

    async setPaymentScreenEnabled(enabled: boolean) {
        return FirebaseService.update(PAYMENT_SETTINGS_PATH, { enabled });
    },

    async deletePaymentMethod(id: string) {
        return FirebaseService.remove(`${PAYMENT_SETTINGS_PATH}/methods/${id}`);
    },

    /**
     * Payments Management
     */
    async submitPayment(payment: Omit<PaymentRecord, "id" | "status" | "createdAt" | "updatedAt">): Promise<PaymentRecord> {
        const id = `pay_${Date.now()}`;
        const data: PaymentRecord = {
            ...payment,
            id,
            status: "pending",
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        await FirebaseService.update(`payments/${id}`, data);
        return data;
    },

    listenToPayments(limit: number, callback: (payments: PaymentRecord[]) => void) {
        return FirebaseService.listenQuery("payments", limit, (data) => {
            const paymentsArray = Object.entries(data || {}).map(([id, val]) => ({
                id,
                ...(val as any)
            })).sort((a, b) => b.createdAt - a.createdAt);
            callback(paymentsArray);
        });
    },

    async updatePaymentStatus(paymentId: string, orderId: string, status: PaymentStatus) {
        const now = Date.now();
        await FirebaseService.update(`payments/${paymentId}`, {
            status,
            updatedAt: now
        });

        // If approved, mark the linked order as paid
        if (status === "approved") {
            await OrderService.updatePaymentStatus(orderId, "paid");
        }

        return true;
    },

    /**
     * Confirm an electronic payment (Initial Check):
     * - Marks the payment as approved and confirmed
     * - Marks the order as paid
     * - Sets matchStatus to pending_match
     * - DOES NOT move to reports or delete the order yet
     */
    async confirmPayment(payment: PaymentRecord, order: Order, _confirmedBy?: string) {
        const now = Date.now();

        // 1. Update Payment Record
        await FirebaseService.update(`payments/${payment.id}`, {
            status: "approved",
            isPaymentConfirmed: true,
            confirmedAt: now,
            matchStatus: "pending_match",
            updatedAt: now
        });

        // 2. Mark the order as paid
        await OrderService.updatePaymentStatus(order.id, "paid");

        return true;
    },

    /**
     * Delete All Payments (Daily Closing)
     */
    async deleteAllPayments() {
        try {
            await FirebaseService.remove("payments");
        } catch (error) {
            console.error("Error deleting payments:", error);
            throw error;
        }
    }
};
