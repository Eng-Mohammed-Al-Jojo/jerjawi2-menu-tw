import { createContext, useContext, useMemo, useState, useEffect } from "react";
import type { Item } from "../components/menu/Menu";
import type { PriceType } from "../utils/priceUtils";

/* ================= Types ================= */

export interface CartItem extends Item {
    qty: number;
    selectedPrice: number;
    selectedPriceType: PriceType;
    priceKey: string;
    optionLabel?: string;
}

export interface ActiveOrderState {
    items: CartItem[];
    totalItems: number;
    totalAmount: number;
    orderId: string | null;
    status?: "active" | "closed";
}

export interface OrderSession {
    orderId: string;
    displayId: string;
    customerName: string;
    status: "pending_payment" | "submitted" | "paid" | "delivered" | "cancelled";
    paymentMethod?: string | null;
    lastUpdated: number;
}

interface CartContextType {
    items: CartItem[];
    addItem: (item: Item, price: number, qty?: number, selectedPriceType?: PriceType) => void;
    increase: (priceKey: string) => void;
    decrease: (priceKey: string) => void;
    removeItem: (priceKey: string) => void;
    clearCart: () => void;
    totalItems: number;
    totalAmount: number;
    orderId: string | null;
    updateOrderId: (id: string | null) => void;
    isFullTrackingOpen: boolean;
    setIsFullTrackingOpen: (open: boolean) => void;
    orderSession: OrderSession | null;
    saveOrderSession: (session: OrderSession | null) => void;
}

/* ================= Context ================= */

const CartContext = createContext<CartContextType | null>(null);

/* ================= Provider ================= */

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [initialState] = useState<ActiveOrderState | null>(() => {
        try {
            const saved = localStorage.getItem("active_order");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && Array.isArray(parsed.items)) {
                    return parsed as ActiveOrderState;
                }
            }
        } catch (e) {
            console.error("Cart hydration failed:", e);
        }
        return null;
    });

    const [items, setItems] = useState<CartItem[]>(initialState?.items || []);
    const [orderId, setOrderId] = useState<string | null>(
        initialState?.orderId !== undefined ? initialState.orderId : () => localStorage.getItem("lastOrderId")
    );
    const [isFullTrackingOpen, setIsFullTrackingOpen] = useState(false);

    const [orderSession, setOrderSession] = useState<OrderSession | null>(() => {
        try {
            const saved = localStorage.getItem("active_order_session");
            if (saved) {
                const parsed = JSON.parse(saved);
                // Expire sessions older than 24h
                if (Date.now() - parsed.lastUpdated > 86400000) {
                    localStorage.removeItem("active_order_session");
                    return null;
                }
                return parsed;
            }
        } catch (e) {
            console.error("Session hydration failed:", e);
        }
        return null;
    });

    const saveOrderSession = (session: OrderSession | null) => {
        setOrderSession(session);
        if (session) {
            localStorage.setItem("active_order_session", JSON.stringify({
                ...session,
                lastUpdated: Date.now()
            }));
        } else {
            localStorage.removeItem("active_order_session");
        }
    };

    const updateOrderId = (id: string | null) => {
        setOrderId(id);
        if (id) {
            localStorage.setItem("lastOrderId", id);
        } else {
            localStorage.removeItem("lastOrderId");
            setIsFullTrackingOpen(false);
        }
    };

    /* إضافة صنف بسعر محدد بكمية محددة */
    const addItem = (item: Item, price: number, qty: number = 1, selectedPriceType: PriceType = "takeaway") => {
        const key = `${item.id}-${selectedPriceType}-${price}`;

        setItems(prev => {
            const found = prev.find(i => i.priceKey === key);

            if (found) {
                return prev.map(i =>
                    i.priceKey === key ? { ...i, qty: i.qty + qty } : i
                );
            }

            return [
                ...prev,
                {
                    ...item,
                    qty: qty,
                    selectedPrice: price,
                    selectedPriceType,
                    priceKey: key,
                    optionLabel: selectedPriceType,
                },
            ];
        });
    };

    /* زيادة */
    const increase = (priceKey: string) => {
        setItems(prev =>
            prev.map(i =>
                i.priceKey === priceKey ? { ...i, qty: i.qty + 1 } : i
            )
        );
    };

    /* نقصان */
    const decrease = (priceKey: string) => {
        setItems(prev =>
            prev
                .map(i =>
                    i.priceKey === priceKey ? { ...i, qty: i.qty - 1 } : i
                )
                .filter(i => i.qty > 0)
        );
    };

    /* حذف */
    const removeItem = (priceKey: string) => {
        setItems(prev => prev.filter(i => i.priceKey !== priceKey));
    };

    /* تفريغ */
    const clearCart = () => setItems([]);

    /* مجموع الكميات */
    const totalItems = useMemo(
        () => items.reduce((sum, i) => sum + i.qty, 0),
        [items]
    );

    /* مجموع السعر */
    const totalAmount = useMemo(
        () =>
            items.reduce(
                (sum, i) => sum + i.selectedPrice * i.qty,
                0
            ),
        [items]
    );

    /* Local Storage Persistence Effect */
    useEffect(() => {
        try {
            const stateToSave: ActiveOrderState = {
                items,
                totalItems,
                totalAmount,
                orderId,
                status: orderId || items.length > 0 ? "active" : "closed"
            };
            localStorage.setItem("active_order", JSON.stringify(stateToSave));
        } catch (e) {
            console.error("Error saving active_order to localStorage", e);
        }
    }, [items, totalItems, totalAmount, orderId]);

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                increase,
                decrease,
                removeItem,
                clearCart,
                totalItems,
                totalAmount,
                orderId,
                updateOrderId,
                isFullTrackingOpen,
                setIsFullTrackingOpen,
                orderSession,
                saveOrderSession,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

/* ================= Hook ================= */

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) {
        throw new Error("useCart must be used inside CartProvider");
    }
    return ctx;
}
