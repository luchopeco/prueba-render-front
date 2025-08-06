import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  aroma: string;
  brand: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private items: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  private isCartOpenSubject = new BehaviorSubject<boolean>(false);

  cart$ = this.cartSubject.asObservable();
  isCartOpen$ = this.isCartOpenSubject.asObservable();

  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    if (this.isBrowser) {
      // Recuperar items del sessionStorage solo en el navegador
      const savedCart = sessionStorage.getItem('cart');
      if (savedCart) {
        this.items = JSON.parse(savedCart);
        this.cartSubject.next(this.items);
      }
    }
  }

  addItem(item: CartItem) {
    const existingItem = this.items.find(i => i.id === item.id && i.aroma === item.aroma);
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      this.items.push(item);
    }
    this.cartSubject.next([...this.items]);
    // Guardar en sessionStorage solo en el navegador
    if (this.isBrowser) {
      sessionStorage.setItem('cart', JSON.stringify(this.items));
    }
  }

  removeItem(itemId: string, aroma: string) {
    this.items = this.items.filter(item => !(item.id === itemId && item.aroma === aroma));
    this.cartSubject.next([...this.items]);
    // Actualizar sessionStorage solo en el navegador
    if (this.isBrowser) {
      sessionStorage.setItem('cart', JSON.stringify(this.items));
    }
  }

  getTotal(): number {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getItems(): CartItem[] {
    return [...this.items];
  }

  clearCart() {
    this.items = [];
    this.cartSubject.next([]);
  }

  toggleCart() {
    this.isCartOpenSubject.next(!this.isCartOpenSubject.value);
  }

  closeCart() {
    this.isCartOpenSubject.next(false);
  }

  generateWhatsAppMessage(): string {
    const items = this.items.map(item => 
      `• ${item.name} (${item.brand})\n  Aroma: ${item.aroma}\n  Cantidad: ${item.quantity} x $${item.price} = $${item.quantity * item.price}`
    ).join('\n\n');
    
    return encodeURIComponent(
      `*Nuevo Pedido*\n\n${items}\n\n*Total: $${this.getTotal()}*`
    );
  }
}
