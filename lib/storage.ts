import { Product, Ingredient, AddOn, Menu, Location, Order } from "@/types";

const STORAGE_KEYS = {
  PRODUCTS: "denis_kebap_products",
  INGREDIENTS: "denis_kebap_ingredients",
  ADDONS: "denis_kebap_addons",
  MENUS: "denis_kebap_menus",
  LOCATIONS: "denis_kebap_locations",
  CUSTOMERS: "denis_kebap_customers",
  EMPLOYEES: "denis_kebap_employees",
  ORDERS: "denis_kebap_orders",
  USERS: "denis_kebap_users",
};

// Products
export const getProducts = (): Product[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
  if (stored) {
    try {
      const products = JSON.parse(stored);
      // Prüfe ob leeres Array
      if (Array.isArray(products) && products.length === 0) {
        console.log("Keine Produkte gefunden, erstelle initiale Produkte...");
        localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
      } else if (Array.isArray(products) && products.length > 0) {
        // Migration: Korrigiere alte categoryId "kebap" zu "menu-1" und setze status auf true wenn undefined/false
        let needsUpdate = false;
        const migratedProducts = products.map((product: Product) => {
          const updates: Partial<Product> = {};
          if (product.categoryId === "kebap") {
            updates.categoryId = "menu-1";
            needsUpdate = true;
          }
          // Stelle sicher, dass status true ist für Standard-Produkte
          if (product.id === "kebap-1" && product.status === false) {
            updates.status = true;
            needsUpdate = true;
          }
          if (Object.keys(updates).length > 0) {
            return { ...product, ...updates };
          }
          return product;
        });
        if (needsUpdate) {
          saveProducts(migratedProducts);
        }
        return migratedProducts;
      }
    } catch (e) {
      // Bei Parsing-Fehler: Lösche ungültige Daten und erstelle initiale Produkte
      console.error("Fehler beim Parsen der Produkte:", e);
      localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    }
  }
  // Initial data (falls nicht vorhanden oder leer)
  const initial: Product[] = [
    {
      id: "kebap-1",
      name: "KEBAP",
      description: "Hühnerfleisch, Zwiebel, Salat, Soße, Tomate",
      price: 6.6,
      categoryId: "menu-1", // DENIS KEBAP
      status: true,
      tax: 10,
      applicablePreparationTime: true,
      showInApp: true,
      ingredients: [], // Standard-Ingredients (wird im Admin gesetzt)
      addOns: [], // Verfügbare Add-Ons (wird im Admin gesetzt)
    },
    {
      id: "kebap-2",
      name: "VEGGIE",
      description: "Zwiebel, Salat, Soße, Tomate, Käse",
      price: 6.6,
      categoryId: "menu-1", // DENIS KEBAP
      status: true,
      tax: 10,
      applicablePreparationTime: true,
      showInApp: true,
      ingredients: [],
      addOns: [],
    },
  ];
  saveProducts(initial);
  return initial;
};

export const saveProducts = (products: Product[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
};

export const addProduct = (product: Product) => {
  const products = getProducts();
  products.push(product);
  saveProducts(products);
};

export const updateProduct = (id: string, product: Partial<Product>) => {
  const products = getProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index !== -1) {
    products[index] = { ...products[index], ...product };
    saveProducts(products);
  }
};

export const deleteProduct = (id: string) => {
  const products = getProducts();
  const filtered = products.filter((p) => p.id !== id);
  saveProducts(filtered);
};

export const reorderProducts = (newOrder: string[]) => {
  const products = getProducts();
  const ordered = newOrder.map(id => products.find(p => p.id === id)).filter(Boolean) as Product[];
  const remaining = products.filter(p => !newOrder.includes(p.id));
  saveProducts([...ordered, ...remaining]);
};

// Ingredients
export const getIngredients = (): Ingredient[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEYS.INGREDIENTS);
  
  const initial: Ingredient[] = [
    { id: "ing-1", name: "Brot", price: 0, createdOn: "18-12-2025", status: true },
    { id: "ing-2", name: "Hühnerfleisch", price: 0, createdOn: "18-12-2025", status: true },
    { id: "ing-3", name: "Reis", price: 0, createdOn: "18-12-2025", status: true },
    { id: "ing-4", name: "Zwiebel", price: 0, createdOn: "18-12-2025", status: true },
    { id: "ing-5", name: "Salat", price: 0, createdOn: "18-12-2025", status: true },
    { id: "ing-6", name: "Soße", price: 0, createdOn: "18-12-2025", status: true },
    { id: "ing-7", name: "Tomate", price: 0, createdOn: "18-12-2025", status: true },
    { id: "ing-8", name: "Käse", price: 0, createdOn: "18-12-2025", status: true },
    { id: "ing-9", name: "Käse", price: 0.6, createdOn: "18-12-2025", status: true },
    { id: "ing-10", name: "Käse", price: 1.2, createdOn: "18-12-2025", status: true },
    { id: "ing-11", name: "Käse", price: 1.8, createdOn: "18-12-2025", status: true },
    { id: "ing-12", name: "Käse", price: 2.4, createdOn: "18-12-2025", status: true },
    { id: "ing-13", name: "Käse", price: 3.0, createdOn: "18-12-2025", status: true },
    { id: "ing-14", name: "Käse", price: 3.6, createdOn: "18-12-2025", status: true },
  ];
  if (stored) {
    // Wenn Daten bereits gespeichert sind, verwende diese direkt
    // (Änderungen sollten nicht überschrieben werden)
    return JSON.parse(stored);
  }
  
  // Initial data nur beim ersten Mal
  saveIngredients(initial);
  return initial;
};

export const saveIngredients = (ingredients: Ingredient[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(ingredients));
};

export const getIngredientById = (id: string): Ingredient | undefined => {
  const ingredients = getIngredients();
  return ingredients.find((i) => i.id === id);
};

export const addIngredient = (ingredient: Ingredient) => {
  const ingredients = getIngredients();
  ingredients.push(ingredient);
  saveIngredients(ingredients);
};

export const updateIngredient = (id: string, ingredient: Partial<Ingredient>) => {
  const ingredients = getIngredients();
  const index = ingredients.findIndex((i) => i.id === id);
  if (index !== -1) {
    ingredients[index] = { ...ingredients[index], ...ingredient };
    saveIngredients(ingredients);
  }
};

export const deleteIngredient = (id: string) => {
  const ingredients = getIngredients();
  const filtered = ingredients.filter((i) => i.id !== id);
  saveIngredients(filtered);
};

export const reorderIngredients = (newOrder: string[]) => {
  const ingredients = getIngredients();
  const ordered = newOrder.map(id => ingredients.find(i => i.id === id)).filter(Boolean) as Ingredient[];
  const remaining = ingredients.filter(i => !newOrder.includes(i.id));
  saveIngredients([...ordered, ...remaining]);
};

// AddOns
export const getAddOns = (): AddOn[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEYS.ADDONS);
  
  const initial: AddOn[] = [
    { id: "addon-1", name: "Brot", price: 1.8, createdOn: "18-12-2025", status: true },
    { id: "addon-2", name: "Ext.Fleisch", price: 3.3, createdOn: "18-12-2025", status: true },
    { id: "addon-3", name: "Käse", price: 1.2, createdOn: "18-12-2025", status: true },
    { id: "addon-4", name: "Reis", price: 2.4, createdOn: "18-12-2025", status: true },
    { id: "addon-5", name: "Scharf", price: 0, createdOn: "18-12-2025", status: true },
    { id: "addon-6", name: "Zwiebel", price: 0.1, createdOn: "18-12-2025", status: true },
    { id: "addon-7", name: "Salat", price: 0.2, createdOn: "18-12-2025", status: true },
    { id: "addon-8", name: "Soße", price: 0.3, createdOn: "18-12-2025", status: true },
    { id: "addon-9", name: "Tomate", price: 0.2, createdOn: "18-12-2025", status: true },
    { id: "addon-10", name: "Ketchup", price: 0.3, createdOn: "18-12-2025", status: true },
    { id: "addon-11", name: "Gabel", price: 0, createdOn: "18-12-2025", status: true },
    { id: "addon-12", name: "Ketchup", price: 0.5, createdOn: "18-12-2025", status: true },
    { id: "addon-13", name: "Zwiebel", price: 0.2, createdOn: "18-12-2025", status: true },
    { id: "addon-14", name: "Salat", price: 0.3, createdOn: "18-12-2025", status: true },
    { id: "addon-15", name: "Soße", price: 0.5, createdOn: "18-12-2025", status: true },
    { id: "addon-16", name: "Tomate", price: 0.3, createdOn: "18-12-2025", status: true },
    { id: "addon-17", name: "Käse", price: 0.6, createdOn: "18-12-2025", status: true },
    { id: "addon-18", name: "Käse", price: 1.8, createdOn: "18-12-2025", status: true },
  ];
  if (stored) {
    // Wenn Daten bereits gespeichert sind, verwende diese direkt
    // (Änderungen sollten nicht überschrieben werden)
    return JSON.parse(stored);
  }
  
  // Initial data nur beim ersten Mal
  saveAddOns(initial);
  return initial;
};

export const saveAddOns = (addOns: AddOn[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.ADDONS, JSON.stringify(addOns));
};

export const getAddOnById = (id: string): AddOn | undefined => {
  const addOns = getAddOns();
  return addOns.find((addOn) => addOn.id === id);
};

export const addAddOn = (addOn: AddOn) => {
  const addOns = getAddOns();
  addOns.push(addOn);
  saveAddOns(addOns);
};

export const updateAddOn = (id: string, addOn: Partial<AddOn>) => {
  const addOns = getAddOns();
  const index = addOns.findIndex((a) => a.id === id);
  if (index !== -1) {
    addOns[index] = { ...addOns[index], ...addOn };
    saveAddOns(addOns);
  }
};

export const deleteAddOn = (id: string) => {
  const addOns = getAddOns();
  const filtered = addOns.filter((a) => a.id !== id);
  saveAddOns(filtered);
};

export const reorderAddOns = (newOrder: string[]) => {
  const addOns = getAddOns();
  const ordered = newOrder.map(id => addOns.find(a => a.id === id)).filter(Boolean) as AddOn[];
  const remaining = addOns.filter(a => !newOrder.includes(a.id));
  saveAddOns([...ordered, ...remaining]);
};

// Menus
export const getMenus = (): Menu[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEYS.MENUS);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Stelle sicher, dass mindestens ein Menü existiert
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      // Falls leeres Array: erstelle initiale Menüs
      if (Array.isArray(parsed) && parsed.length === 0) {
        console.log("Keine Menüs gefunden, erstelle initiale Menüs...");
        localStorage.removeItem(STORAGE_KEYS.MENUS);
      }
    } catch (e) {
      // Bei Parsing-Fehler: Lösche ungültige Daten und erstelle initiale Menüs
      console.error("Fehler beim Parsen der Menüs:", e);
      localStorage.removeItem(STORAGE_KEYS.MENUS);
    }
  }
  // Erstelle initiale Menüs (falls nicht vorhanden oder leer)
  const initial: Menu[] = [
    { id: "menu-1", name: "DENIS KEBAP", color: "#FF6B35", applicablePreparationTime: true, status: true },
    { id: "menu-2", name: "DENIS BOX", color: "#4ECDC4", applicablePreparationTime: true, status: true },
    { id: "menu-3", name: "DENIS TELLER", color: "#45B7D1", applicablePreparationTime: true, status: true },
    { id: "menu-4", name: "GETRÄNKE", color: "#96CEB4", applicablePreparationTime: false, status: true },
    { id: "menu-5", name: "INTERN", color: "#FFEAA7", applicablePreparationTime: false, status: true },
  ];
  saveMenus(initial);
  return initial;
};

export const saveMenus = (menus: Menu[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(menus));
};

export const addMenu = (menu: Menu) => {
  const menus = getMenus();
  menus.push(menu);
  saveMenus(menus);
};

export const updateMenu = (id: string, menu: Partial<Menu>) => {
  const menus = getMenus();
  const index = menus.findIndex((m) => m.id === id);
  if (index !== -1) {
    menus[index] = { ...menus[index], ...menu };
    saveMenus(menus);
  }
};

export const deleteMenu = (id: string) => {
  const menus = getMenus();
  const filtered = menus.filter((m) => m.id !== id);
  saveMenus(filtered);
};

export const reorderMenus = (newOrder: string[]) => {
  const menus = getMenus();
  const ordered = newOrder.map(id => menus.find(m => m.id === id)).filter(Boolean) as Menu[];
  const remaining = menus.filter(m => !newOrder.includes(m.id));
  saveMenus([...ordered, ...remaining]);
};

// Locations
// Default Öffnungszeiten für Migration
const DEFAULT_OPEN_DAYS = [
  { day: "Monday", isOpen: true, openTime: "11:00", closeTime: "19:00", rushStart: "12:00", rushEnd: "13:00" },
  { day: "Tuesday", isOpen: true, openTime: "11:00", closeTime: "19:00", rushStart: "12:00", rushEnd: "13:00" },
  { day: "Wednesday", isOpen: true, openTime: "11:00", closeTime: "19:00", rushStart: "12:00", rushEnd: "13:00" },
  { day: "Thursday", isOpen: true, openTime: "11:00", closeTime: "19:00", rushStart: "12:00", rushEnd: "13:00" },
  { day: "Friday", isOpen: true, openTime: "11:00", closeTime: "19:00", rushStart: "12:00", rushEnd: "13:00" },
  { day: "Saturday", isOpen: true, openTime: "11:00", closeTime: "15:00", rushStart: "12:00", rushEnd: "13:00" },
  { day: "Sunday", isOpen: false, openTime: "11:00", closeTime: "15:00", rushStart: "12:00", rushEnd: "13:00" },
];

export const getLocations = (): Location[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEYS.LOCATIONS);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Stelle sicher, dass mindestens eine Location existiert
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Migration: Füge openDays hinzu, wenn sie fehlen
        let needsSave = false;
        const migrated = parsed.map((loc: Location) => {
          if (!loc.openDays || loc.openDays.length === 0) {
            needsSave = true;
            return {
              ...loc,
              openDays: DEFAULT_OPEN_DAYS,
              regularDisplaySeconds: loc.regularDisplaySeconds ?? 60,
              rushHourDisplaySeconds: loc.rushHourDisplaySeconds ?? 90,
            };
          }
          return loc;
        });
        if (needsSave) {
          console.log("Migration: openDays zu bestehenden Locations hinzugefügt");
          saveLocations(migrated);
        }
        return migrated;
      }
      // Falls leeres Array: erstelle initiale Location
      if (Array.isArray(parsed) && parsed.length === 0) {
        console.log("Keine Locations gefunden, erstelle initiale Location...");
        localStorage.removeItem(STORAGE_KEYS.LOCATIONS);
      }
    } catch (e) {
      // Bei Parsing-Fehler: Lösche ungültige Daten und erstelle initiale Location
      console.error("Fehler beim Parsen der Locations:", e);
      localStorage.removeItem(STORAGE_KEYS.LOCATIONS);
    }
  }
  // Erstelle initiale Location (falls nicht vorhanden oder leer)
  const initial: Location[] = [
    {
      id: "loc-1",
      name: "Neusiedl am See",
      address: "Mo-Fr: 11-19 | Sa: 11-15 Uhr.",
      tagLine: "Herzlich Willkommen! 👋",
      orderReadyIn: 7,
      orderCancelBefore: 8,
      bufferTime: 8,
      status: true,
      regularDisplaySeconds: 60,
      rushHourDisplaySeconds: 90,
      openDays: DEFAULT_OPEN_DAYS,
    },
  ];
  saveLocations(initial);
  return initial;
};

export const saveLocations = (locations: Location[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(locations));
};

export const getLocationById = (id: string): Location | undefined => {
  const locations = getLocations();
  return locations.find((location) => location.id === id);
};

export const addLocation = (location: Location) => {
  const locations = getLocations();
  locations.push(location);
  saveLocations(locations);
};

export const updateLocation = (id: string, location: Partial<Location>) => {
  const locations = getLocations();
  const index = locations.findIndex((l) => l.id === id);
  if (index !== -1) {
    locations[index] = { ...locations[index], ...location };
    saveLocations(locations);
  }
};

export const deleteLocation = (id: string) => {
  const locations = getLocations();
  const filtered = locations.filter((l) => l.id !== id);
  saveLocations(filtered);
};

// Customers
export type Customer = {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  createdOn: string;
  status: boolean;
};

export const getCustomers = (): Customer[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
  if (stored) {
    return JSON.parse(stored);
  }
  const initial: Customer[] = [
    { id: "cust-1", name: "Geri", email: "geri@gnipi.com", createdOn: "18-12-2025", status: true },
    { id: "cust-2", name: "Mirella", email: "mirella.ullrich@gmx.at", createdOn: "18-12-2025", status: true },
  ];
  saveCustomers(initial);
  return initial;
};

export const saveCustomers = (customers: Customer[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
};

export const addCustomer = (customer: Customer) => {
  const customers = getCustomers();
  customers.push(customer);
  saveCustomers(customers);
};

export const updateCustomer = (id: string, customer: Partial<Customer>) => {
  const customers = getCustomers();
  const index = customers.findIndex((c) => c.id === id);
  if (index !== -1) {
    customers[index] = { ...customers[index], ...customer };
    saveCustomers(customers);
  }
};

export const deleteCustomer = (id: string) => {
  const customers = getCustomers();
  const filtered = customers.filter((c) => c.id !== id);
  saveCustomers(filtered);
};

// Employees
export type Employee = {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  role: "ADMIN" | "MANAGER";
  createdOn: string;
  status: boolean;
};

export const getEmployees = (): Employee[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
  if (stored) {
    return JSON.parse(stored);
  }
  const initial: Employee[] = [
    { id: "emp-1", name: "Manveer", email: "manveer.singh@appdeft.biz", mobile: "9872103747", role: "ADMIN", createdOn: "22-10-2024", status: true },
    { id: "emp-2", name: "Denis", email: "denis@yopmail.com", mobile: "9872103747", role: "ADMIN", createdOn: "16-10-2024", status: true },
    { id: "emp-3", name: "Sibel", email: "sibeldeari@gmail.com", role: "ADMIN", createdOn: "26-03-2024", status: true },
  ];
  saveEmployees(initial);
  return initial;
};

export const saveEmployees = (employees: Employee[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
};

export const addEmployee = (employee: Employee) => {
  const employees = getEmployees();
  employees.push(employee);
  saveEmployees(employees);
};

export const updateEmployee = (id: string, employee: Partial<Employee>) => {
  const employees = getEmployees();
  const index = employees.findIndex((e) => e.id === id);
  if (index !== -1) {
    employees[index] = { ...employees[index], ...employee };
    saveEmployees(employees);
  }
};

export const deleteEmployee = (id: string) => {
  const employees = getEmployees();
  const filtered = employees.filter((e) => e.id !== id);
  saveEmployees(filtered);
};

// Orders - Server DB Implementation

// Legacy sync function - deprecated but kept for type safety
export const getOrders = (): Order[] => {
  console.warn("getOrders() (sync) called. This returns empty array now. Use getOrdersAsync() instead.");
  return [];
};

// Async Wrapper - Now calls API
export const getOrdersAsync = async (): Promise<Order[]> => {
  if (typeof window === "undefined") return []; // SSR check
  try {
    const res = await fetch('/api/orders', { cache: 'no-store' });
    if (!res.ok) throw new Error("Failed to fetch orders");
    return await res.json();
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
};

export const saveOrders = (orders: Order[]) => {
  // saveOrders is now no-op for external callers as we use API directly
  console.warn("saveOrders() called. In DB mode this does nothing. Use addOrder/updateOrder.");
};

export const addOrder = async (order: Order): Promise<void> => {
  try {
    console.log('[Client] Sending order to API:', order);
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (!res.ok) {
      console.error('[Client] API rejected order:', await res.text());
      return;
    }
    // Dispatch event for live updates across tabs/components
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage")); // Trigger re-fetch mechanisms
    }
    console.log('[Client] Order successfully added');
  } catch (error) {
    console.error("Failed to add order", error);
  }
};

export const updateOrder = async (id: string, updates: Partial<Order>): Promise<void> => {
  try {
    await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }
  } catch (error) {
    console.error("Failed to update order", error);
  }
};

export const clearAllOrders = async (): Promise<void> => {
  try {
    const res = await fetch('/api/orders', { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to clear orders');
    console.log('[Client] All orders cleared');
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }
  } catch (error) {
    console.error('Failed to clear all orders', error);
  }
};

// Helper functions
export const getProductById = (id: string): Product | undefined => {
  const products = getProducts();
  return products.find((p) => p.id === id);
};

export const getMenuById = (id: string): Menu | undefined => {
  const menus = getMenus();
  return menus.find((m) => m.id === id);
};

export const getEmployeeById = (id: string): Employee | undefined => {
  const employees = getEmployees();
  return employees.find((e) => e.id === id);
};

export const getCustomerById = (id: string): Customer | undefined => {
  const customers = getCustomers();
  return customers.find((c) => c.id === id);
};

// Users (für Authentifizierung)
export type User = {
  id: string;
  email: string;
  role: "ADMIN" | "CUSTOMER";
  otp?: string;
  otpExpiry?: string; // ISO string
  sessionToken?: string;
  sessionExpiry?: string; // ISO string
  createdAt: string;
};

export const getUsers = (): User[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEYS.USERS);
  if (stored) {
    return JSON.parse(stored);
  }
  return [];
};

export const saveUsers = (users: User[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const addUser = (user: User) => {
  const users = getUsers();
  users.push(user);
  saveUsers(users);
};

export const updateUser = (id: string, user: Partial<User>) => {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index !== -1) {
    users[index] = { ...users[index], ...user };
    saveUsers(users);
  }
};

export const getUserByEmail = (email: string): User | undefined => {
  const users = getUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
};

export const getUserBySessionToken = (token: string): User | undefined => {
  const users = getUsers();
  const user = users.find((u) => u.sessionToken === token);
  if (!user || !user.sessionExpiry) return undefined;
  
  // Prüfe ob Session abgelaufen ist
  if (new Date(user.sessionExpiry) < new Date()) {
    return undefined;
  }
  
  return user;
};

export const getUserById = (id: string): User | undefined => {
  const users = getUsers();
  return users.find((u) => u.id === id);
};

export const deleteUser = (id: string) => {
  const users = getUsers();
  const filtered = users.filter((u) => u.id !== id);
  saveUsers(filtered);
};

