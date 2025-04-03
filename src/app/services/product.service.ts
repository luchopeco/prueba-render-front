import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'https://price-list-zbua.onrender.com/api/PriceList';  // Cambiar por la URL real de la API

  async getProducts() {
    const response = await fetch(this.apiUrl);
    const data = await response.json();
    return data;
  }
}
