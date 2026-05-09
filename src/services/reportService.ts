import { FirebaseService } from "./firebaseService";
import type { CompletedOrderReport } from "../types/report";
import type { Order } from "../types/order";
import type { PaymentRecord } from "../types/payment";

export const ReportService = {
    /**
     * Listen to reports stream
     */
    listenToReports(limit: number, callback: (reports: CompletedOrderReport[]) => void) {
        return FirebaseService.listenQuery("reports", limit, (data) => {
            const reportsArray = Object.entries(data || {}).map(([id, val]) => ({
                id,
                ...(val as any)
            })).sort((a, b) => b.verifiedAt - a.verifiedAt);
            callback(reportsArray);
        });
    },

    /**
     * Create a report from an electronic payment verification
     */
    async createReportFromPayment(order: Order, payment: PaymentRecord, verifiedBy?: string): Promise<string> {
        const id = `rpt_${Date.now()}`;
        const report: CompletedOrderReport = {
            id,
            orderId: order.orderId,
            orderDbId: order.id,
            customerName: order.customer.name,
            customerPhone: order.customer.phone,
            customerTable: order.customer.table,
            customerAddress: order.customer.address,
            orderType: order.orderType,
            orderItems: order.items,
            totalAmount: Number(order.totalAmount),
            paymentType: "electronic",
            methodName: payment.methodName,
            senderAccountName: payment.senderAccountName,
            senderAccountNumber: payment.senderAccountNumber,
            receiverAccountName: payment.receiverAccountName,
            receiverAccountNumber: payment.receiverAccountNumber,
            senderBankOrWallet: payment.senderBankOrWallet,
            paymentNotes: payment.notes,
            orderDate: order.createdAt,
            verifiedAt: Date.now(),
            verifiedBy,
            paymentRecordId: payment.id
        };

        await FirebaseService.update(`reports/${id}`, report);
        return id;
    },

    /**
     * Create a report from a cash payment verification
     */
    async createReportFromCash(order: Order, verifiedBy?: string): Promise<string> {
        const id = `rpt_${Date.now()}`;
        const report: CompletedOrderReport = {
            id,
            orderId: order.orderId,
            orderDbId: order.id,
            customerName: order.customer.name,
            customerPhone: order.customer.phone,
            customerTable: order.customer.table,
            customerAddress: order.customer.address,
            orderType: order.orderType,
            orderItems: order.items,
            totalAmount: Number(order.totalAmount),
            paymentType: "cash",
            methodName: "Cash / كاش",
            senderAccountName: null,
            senderAccountNumber: null,
            receiverAccountName: null,
            receiverAccountNumber: null,
            orderDate: order.createdAt,
            verifiedAt: Date.now(),
            verifiedBy,
        };

        await FirebaseService.update(`reports/${id}`, report);
        return id;
    },

    /**
     * Delete a report
     */
    async deleteReport(id: string) {
        return FirebaseService.remove(`reports/${id}`);
    }
};
