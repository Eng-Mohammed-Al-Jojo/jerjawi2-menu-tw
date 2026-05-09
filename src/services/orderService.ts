import { FirebaseService } from "./firebaseService";
import type { Order, OrderStatus, PaymentStatus } from "../types/order";
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Order Service
 * Handles business logic for orders and status lifecycle
 */
export const OrderService = {
    /**
     * Generate a sequential human-readable order number
     * Resets to 1001 daily
     */
    getNextOrderNumber: async (): Promise<string> => {
        const today = new Date().toISOString().split('T')[0];
        try {
            const result = await FirebaseService.transaction("counters/orderNumber", (current) => {
                if (!current || current.lastResetDate !== today) {
                    return { value: 1001, lastResetDate: today };
                }
                return { ...current, value: (current.value || 1000) + 1 };
            });

            const num = result.snapshot.val().value;
            return `#${num}`;
        } catch (error) {
            console.error("Counter failed:", error);
            return `#${Math.floor(1000 + Math.random() * 9000)}`;
        }
    },

    /**
     * Create a new order
     */
    createOrder: async (orderData: Partial<Order>, customId?: string): Promise<string> => {
        try {
            const now = Date.now();

            let displayId = orderData.orderId;
            if (!displayId) {
                displayId = await OrderService.getNextOrderNumber();
            }

            const data = {
                ...orderData,
                orderId: displayId,
                createdAt: now,
                updatedAt: now,
                status: (orderData.status || "pending") as OrderStatus,
                archived: orderData.archived || false
            };

            const toDbKey = (id: string) => id.replace(/#/g, '');
            const targetId = toDbKey(customId || displayId);
            await FirebaseService.update(`orders/${targetId}`, data);
            return targetId;
        } catch (error) {
            console.error("Order creation failed:", error);
            throw error;
        }
    },

    /**
     * Update order status with lifecycle logic
     */
    updateStatus: async (id: string, status: OrderStatus, extraUpdates: any = {}): Promise<boolean> => {
        try {
            const now = Date.now();
            const updates: any = {
                status,
                updatedAt: now,
                ...extraUpdates
            };

            // Auto-archive logic: Terminal states are archived
            if (status === "delivered" || status === "cancelled" || status === "archived") {
                updates.archived = true;
            } else {
                updates.archived = false;
            }

            await FirebaseService.update(`orders/${id}`, updates);
            return true;
        } catch (error) {
            console.error("Status update failed:", error);
            throw error;
        }
    },

    /**
     * Specialized completion logic
     */
    completeOrder: async (id: string): Promise<boolean> => {
        return OrderService.updateStatus(id, "delivered");
    },

    /**
     * Update payment status
     */
    updatePaymentStatus: async (id: string, paymentStatus: PaymentStatus): Promise<boolean> => {
        try {
            await FirebaseService.update(`orders/${id}`, { paymentStatus });
            return true;
        } catch (error) {
            console.error("Payment status update failed:", error);
            throw error;
        }
    },

    /**
     * Toggle order archiving (manual soft delete)
     */
    toggleArchive: async (id: string, archived: boolean): Promise<boolean> => {
        try {
            await FirebaseService.update(`orders/${id}`, { archived });
            return true;
        } catch (error) {
            console.error("Archiving failed:", error);
            throw error;
        }
    },

    /**
     * Permanently delete an order (Hard Delete)
     */
    deleteOrder: async (id: string): Promise<boolean> => {
        try {
            await FirebaseService.remove(`orders/${id}`);
            return true;
        } catch (error) {
            console.error("Deletion failed:", error);
            throw error;
        }
    },

    /**
     * Get all orders with a limit
     */
    listenToOrders: (limit: number, callback: (orders: Order[]) => void): (() => void) => {
        return FirebaseService.listenQuery("orders", limit, (data) => {
            const ordersArray = Object.entries(data || {}).map(([id, val]) => ({
                id,
                ...(val as any)
            })).sort((a: Order, b: Order) => (b.createdAt || 0) - (a.createdAt || 0));
            callback(ordersArray);
        });
    },

    /**
     * Centralized WhatsApp Notification Helper
     */
    notifyCustomer: (order: Order, type: 'confirm' | 'ready' | 'cancel') => {
        if (!order.customer.phone) return;

        let message = "";
        const orderId = order.orderId;

        switch (type) {
            case 'confirm':
                message = `✅ تم تأكيد طلبك رقم (${orderId}).\nنحن الآن بصدد تحضيره لك بكل حب. ❤️`;
                break;
            case 'ready':
                message = `🔔 طلبك رقم (${orderId}) جاهز الآن!\nنحن بانتظارك أو سيصلك قريباً. ✨`;
                break;
            case 'cancel':
                message = `❌ نعتذر منك، تم إلغاء الطلب رقم (${orderId}).\nللمزيد من الاستفسار يرجى التواصل معنا.`;
                break;
        }

        const cleanPhone = order.customer.phone.replace(/[\s+]/g, '');
        const encoded = encodeURIComponent(message);
        const waUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;
        window.open(waUrl, "_blank");
    },

    /**
     * Delete All Orders (Daily Closing)
     */
    deleteAllOrders: async (): Promise<void> => {
        try {
            await FirebaseService.remove("orders");
        } catch (error) {
            console.error("Error deleting all orders:", error);
            throw error;
        }
    }
};
