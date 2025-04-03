import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-list',
  imports: [CommonModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent implements OnInit {
  isLoading = false;
  products: any[] = [];

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.productService.getProducts().then(data => {
      this.products = data.productList;
      this.isLoading = false;
    });
  }
}
