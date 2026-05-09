import { db, auth } from "../firebase";
import { 
    ref, 
    onValue, 
    update, 
    remove, 
    push, 
    set, 
    query, 
    limitToLast,
    runTransaction,
    DataSnapshot
} from "firebase/database";

/**
 * Firebase Service
 * Provides low-level database utilities and wrappers
 */
export const FirebaseService = {
    /**
     * Listen to a path in the database
     */
    listen: (path: string, callback: (data: any) => void) => {
        const dbRef = ref(db, path);
        return onValue(dbRef, (snapshot: DataSnapshot) => {
            callback(snapshot.val());
        });
    },

    /**
     * Listen to a query (e.g. with limit)
     */
    listenQuery: (path: string, limit: number, callback: (data: any) => void) => {
        const dbRef = query(ref(db, path), limitToLast(limit));
        return onValue(dbRef, (snapshot: DataSnapshot) => {
            callback(snapshot.val());
        });
    },

    /**
     * Update data at a specific path
     */
    update: async (path: string, data: object) => {
        return update(ref(db, path), data);
    },

    /**
     * Remove data at a specific path
     */
    remove: async (path: string) => {
        return remove(ref(db, path));
    },

    /**
     * Push new data to a list and return the ID
     */
    push: async (path: string, data: any) => {
        const newRef = push(ref(db, path));
        await set(newRef, data);
        return newRef.key;
    },

    /**
     * Run a transaction on a path
     */
    transaction: async (path: string, updateFn: (current: any) => any) => {
        return runTransaction(ref(db, path), updateFn);
    },

    /**
     * Get a reference to auth
     */
    auth: () => auth
};
