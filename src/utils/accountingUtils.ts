import { 
    startOfDay, endOfDay, isWithinInterval, subDays, 
    startOfWeek, endOfWeek, startOfMonth, endOfMonth, 
    format, getHours 
} from "date-fns";
import type { Order } from "../types/order";

export const calculateStats = (orders: Order[]) => {
    const now = new Date();
    const today = { start: startOfDay(now), end: endOfDay(now) };
    const yesterday = { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)) };
    const thisWeek = { start: startOfWeek(now), end: endOfWeek(now) };
    const thisMonth = { start: startOfMonth(now), end: endOfMonth(now) };

    const getPrice = (amount: number | string): number => {
        if (typeof amount === "number") return amount;
        const price = parseFloat(amount.replace(/[^\d.]/g, ""));
        return isNaN(price) ? 0 : price;
    };

    const getRevenue = (filtered: Order[]) => 
        filtered
            .filter(o => o.status !== "cancelled" && !o.excludedFromReports)
            .reduce((acc, o) => acc + getPrice(o.totalAmount), 0);

    const filterByInterval = (interval: { start: Date; end: Date }) => 
        orders.filter(o => {
            const date = new Date(o.createdAt);
            return isWithinInterval(date, interval);
        });

    const activeOrders = orders.filter(o => !["delivered", "cancelled"].includes(o.status) && !o.excludedFromReports);
    const paidOrders = orders.filter(o => (o.paymentStatus === "paid" || o.status === "delivered") && !o.excludedFromReports);
    const unpaidOrders = orders.filter(o => o.paymentStatus !== "paid" && o.status !== "delivered" && o.status !== "cancelled" && !o.excludedFromReports);

    return {
        overall: {
            totalRevenue: getRevenue(orders),
            totalOrders: orders.filter(o => !o.excludedFromReports).length,
            paidCount: paidOrders.length,
            unpaidCount: unpaidOrders.length,
            pendingRevenue: getRevenue(unpaidOrders),
        },
        today: {
            revenue: getRevenue(filterByInterval(today)),
            orders: filterByInterval(today).filter(o => !o.excludedFromReports).length,
            paid: filterByInterval(today).filter(o => (o.paymentStatus === "paid" || o.status === "delivered") && !o.excludedFromReports).length,
            unpaid: filterByInterval(today).filter(o => o.paymentStatus !== "paid" && o.status !== "delivered" && o.status !== "cancelled" && !o.excludedFromReports).length,
            cancelled: filterByInterval(today).filter(o => o.status === "cancelled" && !o.excludedFromReports).length,
        },
        yesterday: {
            revenue: getRevenue(filterByInterval(yesterday)),
        },
        thisWeek: {
            revenue: getRevenue(filterByInterval(thisWeek)),
        },
        thisMonth: {
            revenue: getRevenue(filterByInterval(thisMonth)),
        },
        types: {
            dineIn: orders.filter(o => o.orderType === "in" && !o.excludedFromReports).length,
            takeaway: orders.filter(o => o.orderType === "out" && !o.excludedFromReports).length,
            dineInRevenue: getRevenue(orders.filter(o => o.orderType === "in")),
            takeawayRevenue: getRevenue(orders.filter(o => o.orderType === "out")),
        },
        activeCount: activeOrders.length
    };
};

export const getChartData = (orders: Order[]) => {
    const getPrice = (amount: number | string): number => {
        if (typeof amount === "number") return amount;
        const price = parseFloat(amount.replace(/[^\d.]/g, ""));
        return isNaN(price) ? 0 : price;
    };

    // 1. Hourly Breakdown (Last 24 hours of today)
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, sales: 0 }));
    const todayOrders = orders.filter(o => isWithinInterval(new Date(o.createdAt), { start: startOfDay(new Date()), end: endOfDay(new Date()) }));
    
    todayOrders
        .filter(o => o.status !== "cancelled" && !o.excludedFromReports)
        .forEach(o => {
            const hour = getHours(new Date(o.createdAt));
            hours[hour].sales += getPrice(o.totalAmount);
        });

    // 2. Sales Trend (Last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(new Date(), 6 - i);
        return {
            date: format(d, "MM/dd"),
            revenue: 0,
            fullDate: startOfDay(d)
        };
    });

    last7Days.forEach(day => {
        const dayOrders = orders.filter(o => isWithinInterval(new Date(o.createdAt), { 
            start: startOfDay(day.fullDate), 
            end: endOfDay(day.fullDate) 
        }));
        day.revenue = dayOrders
            .filter(o => o.status !== "cancelled" && !o.excludedFromReports)
            .reduce((acc, o) => acc + getPrice(o.totalAmount), 0);
    });

    return {
        hourly: hours.map(h => ({ name: `${h.hour}:00`, value: h.sales })),
        dailyTrend: last7Days,
        distribution: [
            { name: "داخل المطعم (سابقاً)", value: orders.filter(o => o.orderType === "in" && !o.excludedFromReports).length },
            { name: "سفري / خارجي", value: orders.filter(o => o.orderType === "out" && !o.excludedFromReports).length },
        ]
    };
};
