import { useEffect, useMemo, useState } from "react";
import { PaymentService } from "../services/paymentService";
import type { PaymentMethod } from "../types/payment";

interface UsePaymentMethodsResult {
    methods: PaymentMethod[];
    enabled: boolean;
    loading: boolean;
}

export function usePaymentMethods(): UsePaymentMethodsResult {
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [enabled, setEnabled] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = PaymentService.listenToPaymentMethodsSettings((settings) => {
            setMethods(settings.methods);
            setEnabled(settings.enabled);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return useMemo(() => ({ methods, enabled, loading }), [methods, enabled, loading]);
}
