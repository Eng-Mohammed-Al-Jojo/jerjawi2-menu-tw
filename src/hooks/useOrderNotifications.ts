import { useState, useEffect, useRef, useCallback } from "react";
import type { Order } from "../types/order";
import { OrderService } from "../services/orderService";
import { playNewOrderSound, unlockAudio } from "../utils/audioUtils";

/**
 * useOrderNotifications
 * Senior-level hook for real-time order detection and notification queuing.
 * Handles isFirstLoad logic, sound debouncing, and dual-mode notifications (Toast/System).
 */
export const useOrderNotifications = (limit: number = 20) => {
    const [notifications, setNotifications] = useState<Order[]>([]);
    const [settings, setSettings] = useState({
        sound: localStorage.getItem('order_notify_sound') !== 'false',
        system: localStorage.getItem('order_notify_system') !== 'false'
    });

    const knownOrderIds = useRef<Set<string>>(new Set());
    const isFirstLoad = useRef(true);
    const audioEnabled = useRef(false);
    const soundDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    /**
     * Update settings and persist to localStorage
     */
    const updateSettings = useCallback((key: 'sound' | 'system', value: boolean) => {
        setSettings(prev => {
            const next = { ...prev, [key]: value };
            localStorage.setItem(`order_notify_${key}`, String(value));
            return next;
        });
    }, []);

    /**
     * Activates audio engine on first user interaction.
     */
    const enableAudio = useCallback(() => {
        if (audioEnabled.current) return;
        
        // Unlock audio context by playing a muted sound (satisfies browser policy)
        unlockAudio();
        
        audioEnabled.current = true;
        console.log("Order Notification System: Audio Ready 🔊");
        window.removeEventListener('click', enableAudio);
        window.removeEventListener('touchstart', enableAudio);
    }, []);

    useEffect(() => {
        window.addEventListener('click', enableAudio);
        window.addEventListener('touchstart', enableAudio);
        return () => {
            window.removeEventListener('click', enableAudio);
            window.removeEventListener('touchstart', enableAudio);
        };
    }, [enableAudio]);

    /**
     * Plays the notification sound with a slight debounce
     */
    const triggerSound = useCallback(() => {
        if (!audioEnabled.current || !settings.sound) return;
        
        if (soundDebounceTimer.current) clearTimeout(soundDebounceTimer.current);
        
        soundDebounceTimer.current = setTimeout(() => {
            playNewOrderSound();
            soundDebounceTimer.current = null;
        }, 150);
    }, [settings.sound]);

    /**
     * Shows a browser system notification (for background/minimized state)
     */
    const showSystemNotification = useCallback((order: Order) => {
        if (!settings.system || !("Notification" in window) || Notification.permission !== "granted") return;

        const title = `طلب جديد 🛎️`;
        const options = {
            body: `طلب رقم ${order.orderId}\nالعميل: ${order.customer?.name}\nالإجمالي: ${order.totalAmount}₪`,
            icon: "/logo.png",
            tag: order.id,
            silent: true
        };

        const notification = new Notification(title, options);
        notification.onclick = (e) => {
            e.preventDefault();
            window.focus();
            notification.close();
        };
    }, [settings.system]);

    useEffect(() => {
        const unsubscribe = OrderService.listenToOrders(limit, (orders) => {
            if (isFirstLoad.current) {
                orders.forEach(o => knownOrderIds.current.add(o.id));
                isFirstLoad.current = false;
                return;
            }

            const incomingNewOrders: Order[] = [];
            orders.forEach(order => {
                if (!knownOrderIds.current.has(order.id)) {
                    knownOrderIds.current.add(order.id);
                    incomingNewOrders.push(order);
                }
            });

            if (incomingNewOrders.length > 0) {
                if (document.hidden) {
                    incomingNewOrders.forEach(order => showSystemNotification(order));
                } else {
                    setNotifications(prev => [...prev, ...incomingNewOrders]);
                }
                triggerSound();
            }
        });

        return () => unsubscribe();
    }, [limit, triggerSound, showSystemNotification]);

    /**
     * Remove a notification from the UI stack
     */
    const dismissNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(o => o.id !== id));
    }, []);

    /**
     * Auto-dismissal logic for toasts: disappear after 10 seconds
     */
    useEffect(() => {
        if (notifications.length > 0) {
            const timer = setTimeout(() => {
                dismissNotification(notifications[0].id);
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [notifications, dismissNotification]);

    return {
        notifications,
        dismissNotification,
        settings,
        updateSettings
    };
};
