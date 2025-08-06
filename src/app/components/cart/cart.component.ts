import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService, CartItem } from '../../services/cart.service';
import { PricePipe } from '../../pipes/price.pipe';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, PricePipe],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent {
  constructor(public cartService: CartService) {}

  sendWhatsAppOrder() {
    const message = this.cartService.generateWhatsAppMessage();
    window.open(`https://api.whatsapp.com/send?phone=543416860769&text=${message}`, '_blank');
  }
}
