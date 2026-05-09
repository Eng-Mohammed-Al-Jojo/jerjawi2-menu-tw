import { db } from "../firebase";
import { ref, get, onValue, type Unsubscribe } from "firebase/database";
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Category, Subcategory, Item } from "../components/menu/Menu";

export interface MenuData {
  categories: Category[];
  subcategories: Subcategory[];
  items: Item[];
  orderSystem: boolean;
}

const CACHE_KEY = "menu_cache";

export const MenuService = {
  /**
   * Loads menu data from the Local JS Object via HTTP (JSON)
   */
  async getMenuFromLocalJson(): Promise<MenuData> {
    const res = await fetch("/menu.json");
    if (!res.ok) throw new Error("Failed to load local menu.json");
    const data = await res.json();
    
    const cats: Category[] = Object.entries(data.categories || {}).map(([id, v]: any) => ({
      id,
      ...v,
      available: v.available !== false,
    })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    
    const subs: Subcategory[] = Object.entries(data.subcategories || {}).map(([id, v]: any) => ({ 
      id, ...v 
    }));
    
    const its: Item[] = Object.entries(data.items || {}).map(([id, v]: any) => ({ 
      id, ...v, createdAt: v.createdAt || 0 
    })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    
    return {
      categories: cats,
      subcategories: subs,
      items: its,
      orderSystem: data.orderSystem ?? true,
    };
  },

  /**
   * Read recently saved menu data from localStorage
   */
  getMenuFromCache(): MenuData | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      return JSON.parse(cached) as MenuData;
    } catch {
      return null;
    }
  },

  /**
   * Save parsed menu data to localStorage
   */
  saveToCache(data: MenuData) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
    } catch (e) {
      console.error("Failed to save menu cache", e);
    }
  },

  /**
   * Attempts to fetch menu strictly online using get() with a timeout timeout
   * @param timeoutMs Timeout in milliseconds (default: 2000)
   */
  async fetchMenuOnline(timeoutMs: number = 2000): Promise<MenuData> {
    const fetchPromise = async () => {
      const [catsSnap, subsSnap, itemsSnap, osSnap] = await Promise.all([
        get(ref(db, "categories")),
        get(ref(db, "subcategories")),
        get(ref(db, "items")),
        get(ref(db, "settings/orderSystem"))
      ]);

      const catsData = catsSnap.val() || {};
      const subsData = subsSnap.val() || {};
      const itemsData = itemsSnap.val() || {};
      const osData = osSnap.val();

      const cats: Category[] = Object.entries(catsData).map(([id, v]: any) => ({
        id,
        ...v,
        available: v.available !== false,
      })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      const subs: Subcategory[] = Object.entries(subsData).map(([id, v]: any) => ({ id, ...v }));

      const its: Item[] = Object.entries(itemsData).map(([id, v]: any) => ({ 
        id, ...v, createdAt: v.createdAt || 0 
      })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      return {
        categories: cats,
        subcategories: subs,
        items: its,
        orderSystem: osData === true || osData === "true" || osData === 1
      };
    };

    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error("Firebase fetch timeout")), timeoutMs)
    );

    return Promise.race([fetchPromise(), timeoutPromise]);
  },

  /**
   * Orchestrates the fallback logic: 
   * 1. Try Firebase with quick 2s timeout
   * 2. If slow/fail, try Local Cache
   * 3. If no cache, try menu.json
   */
  async getMenuWithFallback(): Promise<{ data: MenuData, source: 'online' | 'cache' | 'json' }> {
    if (navigator.onLine) {
      try {
        const data = await this.fetchMenuOnline(2000); // Wait maximum 2 seconds
        this.saveToCache(data);
        return { data, source: 'online' };
      } catch (error) {
        console.warn("Online fetch slow or failed, falling back...", error);
        // Fall down to cache
      }
    }

    const cachedData = this.getMenuFromCache();
    if (cachedData) {
      return { data: cachedData, source: 'cache' };
    }

    try {
      const jsonData = await this.getMenuFromLocalJson();
      this.saveToCache(jsonData);
      return { data: jsonData, source: 'json' };
    } catch {
      // Ultimate failure, return empty arrays to prevent crash
      return { 
        data: { categories: [], subcategories: [], items: [], orderSystem: true }, 
        source: 'json' 
      };
    }
  },

  /**
   * Background subscription to keep the cache and UI updated
   * This is called AFTER the initial fast load completes.
   */
  subscribeToMenuUpdates(onUpdate: (data: MenuData) => void): Unsubscribe {
    let cats: Category[] = [];
    let subs: Subcategory[] = [];
    let its: Item[] = [];
    let os: boolean = true;
    
    let catsLoaded = false, subsLoaded = false, itLoaded = false, osLoaded = false;

    const checkAndNotify = () => {
      if (catsLoaded && subsLoaded && itLoaded && osLoaded) {
        const data = { categories: cats, subcategories: subs, items: its, orderSystem: os };
        this.saveToCache(data);
        onUpdate(data);
      }
    };

    const unsubCats = onValue(ref(db, "categories"), (snap) => {
      const val = snap.val();
      cats = val ? Object.entries(val).map(([id, v]: any) => ({
        id, ...v, available: v.available !== false,
      })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : [];
      catsLoaded = true;
      checkAndNotify();
    });

    const unsubSubs = onValue(ref(db, "subcategories"), (snap) => {
      const val = snap.val();
      subs = val ? Object.entries(val).map(([id, v]: any) => ({ id, ...v })) : [];
      subsLoaded = true;
      checkAndNotify();
    });

    const unsubItems = onValue(ref(db, "items"), (snap) => {
      const val = snap.val();
      its = val ? Object.entries(val).map(([id, v]: any) => ({ 
        id, ...v, createdAt: v.createdAt || 0 
      })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : [];
      itLoaded = true;
      checkAndNotify();
    });

    const unsubOs = onValue(ref(db, "settings/orderSystem"), (snap) => {
      const val = snap.val();
      os = val === true || val === "true" || val === 1;
      osLoaded = true;
      checkAndNotify();
    });

    return () => {
      unsubCats();
      unsubSubs();
      unsubItems();
      unsubOs();
    };
  }
};
