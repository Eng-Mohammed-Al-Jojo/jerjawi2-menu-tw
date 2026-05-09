import type { OrderItem, OrderType } from "./order";

/**
 * CompletedOrderReport
 * جدول reports/ في Firebase — يحتوي على بيانات الطلب + الدفع بعد التشييك النهائي
 */
export interface CompletedOrderReport {
    id: string;                    // rpt_timestamp
    orderId: string;               // #1001 — رقم الطلب المعروض
    orderDbId: string;             // المفتاح الداخلي في Firebase
    customerName: string;
    customerPhone?: string;
    customerTable?: string;
    customerAddress?: string;
    orderType: OrderType;          // "in" | "out"
    orderItems: OrderItem[];
    totalAmount: number;
    /**
     * نوع الدفع:
     * - "cash"      → دفع نقدي مباشر (تشييك من لوحة الطلبات)
     * - "electronic"→ دفع إلكتروني تم التشييك عليه في PaymentApprovals
     */
    paymentType: "cash" | "electronic";
    methodName: string;            // "كاش" | اسم طريقة الدفع الإلكتروني
    senderAccountName?: string | null;
    senderAccountNumber?: string | null;
    receiverAccountName?: string | null;
    receiverAccountNumber?: string | null;
    senderBankOrWallet?: string | null;
    paymentNotes?: string;
    orderDate: number;             // createdAt الطلب الأصلي
    verifiedAt: number;            // وقت التشييك
    verifiedBy?: string;           // اسم/UID المشرف
    paymentRecordId?: string;      // مرجع سجل الدفع الإلكتروني
}
