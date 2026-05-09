import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import type { Order } from "../types/order";

/**
 * Excel Export Utility
 * Generates a professional .xlsx file from the orders dataset.
 */
export const exportOrdersToExcel = async (orders: Order[], title: string = "Orders_Report") => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Orders");

    // Define Columns
    worksheet.columns = [
        { header: "رقم الطلب (Internal ID)", key: "id", width: 15 },
        { header: "رقم الطلب (Display ID)", key: "orderId", width: 15 },
        { header: "اسم العميل", key: "customerName", width: 25 },
        { header: "رقم الجوال", key: "customerPhone", width: 15 },
        { header: "النوع", key: "orderType", width: 12 },
        { header: "الإجمالي", key: "totalAmount", width: 12 },
        { header: "حالة الطلب", key: "status", width: 15 },
        { header: "طريقة الدفع", key: "methodName", width: 15 },
        { header: "حالة الدفع", key: "paymentStatus", width: 15 },
        { header: "حساب المرسل", key: "senderAccountName", width: 20 },
        { header: "رقم المرسل", key: "senderAccountNumber", width: 20 },
        { header: "حساب المستقبل", key: "receiverAccountName", width: 20 },
        { header: "رقم المستقبل", key: "receiverAccountNumber", width: 20 },
        { header: "اسم البنك / المحفظة المرسل منها", key: "senderBankOrWallet", width: 25 },
        { header: "المصدر", key: "source", width: 15 },
        { header: "التاريخ", key: "createdAt", width: 20 },

    ];

    // Styling Header
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
    worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "B7303E" }
    };
    worksheet.getRow(1).alignment = { horizontal: "center" };

    // Add Data
    orders.forEach((order) => {
        worksheet.addRow({
            id: order.id,
            orderId: order.orderId,
            customerName: order.customer?.name || "—",
            customerPhone: order.customer?.phone || order.customer?.table || "—",
            orderType: order.orderType === "in" ? "محلي" : "توصيل",
            totalAmount: `${order.totalAmount}₪`,
            status: order.status,
            methodName: (order as any).methodName || "Cash / كاش",
            paymentStatus: order.paymentStatus === "paid" ? "مدفوع" : "غير مدفوع",
            senderAccountName: (order as any).senderAccountName || "—",
            senderAccountNumber: (order as any).senderAccountNumber || "—",
            receiverAccountName: (order as any).receiverAccountName || "—",
            receiverAccountNumber: (order as any).receiverAccountNumber || "—",
            senderBankOrWallet: (order as any).senderBankOrWallet || (order as any).transactionReference || "—",
            source: order.source || "dashboard",
            createdAt: new Date(order.createdAt).toLocaleString("ar-EG"),
        });
    });

    // Formatting
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
            row.alignment = { horizontal: "center" };
        }
    });

    // Generate Buffer and Save
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `${title}_${new Date().toISOString().split("T")[0]}.xlsx`);
};
