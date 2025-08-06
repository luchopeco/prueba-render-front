import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { SearchService } from '../../services/search.service';
import { CartService } from '../../services/cart.service';
import { Subscription } from 'rxjs';
import { AddToCartModalComponent } from '../add-to-cart-modal/add-to-cart-modal.component';
import { PricePipe } from '../../pipes/price.pipe';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, AddToCartModalComponent, PricePipe],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent implements OnInit, OnDestroy {
  isLoading = false;
  isGeneratingPDF = false;
  products: any[] = [];
  hasImageError: { [key: string]: boolean } = {};
  selectedProduct: any = null;
  modalVisible = false;
  private allProducts: any[] = [];
  private searchSubscription: Subscription | null = null;

  constructor(
    private productService: ProductService,
    private searchService: SearchService,
    private cartService: CartService
  ) {}

  handleImageError(event: Event, productId: any): void {
    console.log('Image error for product:', productId);
    console.log('Current hasImageError state:', this.hasImageError);
    this.hasImageError[productId] = true;
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.productService.getProducts().then(data => {
      console.log('Products loaded:', data.productList);
      this.allProducts = data.productList.map((product: any, index: number) => ({
        ...product,
        id: product._id || `product-${index}`
      }));
      this.products = [...this.allProducts];
      this.isLoading = false;

      this.searchSubscription = this.searchService.searchTerms$.subscribe(term => {
        this.filterProducts(term);
      });
    });
  }

  ngOnDestroy() {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  private filterProducts(searchTerm: string) {
    if (!searchTerm) {
      this.products = [...this.allProducts];
      return;
    }

    searchTerm = searchTerm.toLowerCase().trim();
    this.products = this.allProducts.filter(product => {
      const name = product.name?.toLowerCase() || '';
      const brand = product.brand?.toLowerCase() || '';
      const description = product.description?.toLowerCase() || '';
      const price = product.price?.toString() || '';

      return name.includes(searchTerm) ||
             brand.includes(searchTerm) ||
             description.includes(searchTerm) ||
             price.includes(searchTerm);
    });
  }

  openAddToCart(product: any) {
    this.selectedProduct = product;
    this.modalVisible = true;
  }

  closeAddToCart() {
    this.selectedProduct = null;
    this.modalVisible = false;
  }

  async downloadPDF() {
    this.isGeneratingPDF = true;
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      let y = 0;

      // Función para crear el encabezado moderno
      const createHeader = () => {
        // Barra superior moderna
        doc.setFillColor(41, 128, 185);
        doc.rect(0, 0, pageWidth, 25, 'F');

        // Título con estilo moderno
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('CATÁLOGO DE PRODUCTOS', 15, 17);

        // Fecha en la barra superior
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(new Date().toLocaleDateString(), pageWidth - 15, 17, { align: 'right' });

        return 35; // Altura más compacta del header
      };

      y = createHeader();

      // Grid moderno de 3 columnas
      const itemsPerRow = 3;
      const itemPadding = 8;
      const itemWidth = (pageWidth - (margin * 2) - (itemPadding * (itemsPerRow - 1))) / itemsPerRow;
      const imageSize = 50; // Imágenes más pequeñas
      let currentX = margin;

      for (let i = 0; i < this.products.length; i++) {
        const product = this.products[i];

        // Calcular posición X
        currentX = margin + (i % itemsPerRow) * (itemWidth + margin);

        // Pre-calcular texto y limitar contenido
        doc.setFontSize(12);
        const nombreOriginal = product.name;
        const nombre = nombreOriginal.length > 40 ? nombreOriginal.substring(0, 37) + '...' : nombreOriginal;

        // Descripción más completa
        let descripcion = product.description;
        if (descripcion.length > 120) {
          descripcion = descripcion.substring(0, 117) + '...';
        }
        const descripcionLines = doc.splitTextToSize(descripcion, itemWidth - 8);
        const maxLines = 3;
        const descripcionFinal = descripcionLines.slice(0, maxLines);

        const contentHeight = 110; // Altura ajustada

        // Nueva página si es necesario
        if (y + contentHeight > pageHeight - margin) {
          doc.addPage();
          y = createHeader();
        }

        // Contenedor del producto
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.5);
        doc.roundedRect(currentX, y, itemWidth, contentHeight, 2, 2, 'FD');

        // Imagen del producto
        if (product.urlImage) {
          try {
            const img = await this.getImageFromUrl(product.urlImage);
            const imgX = currentX + (itemWidth - imageSize)/2;
            doc.addImage(img, 'JPEG', imgX, y + 12, imageSize, imageSize);
          } catch (e) {
            // Si la imagen falla, dejamos el espacio vacío
          }
        }

        let textY = y + imageSize + 18;

        // Nombre del producto
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(44, 62, 80);
        doc.text(nombre, currentX + 5, textY);

        // Marca
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(128, 128, 128);
        doc.text(product.brand, currentX + 5, textY + 7);

        // Descripción más completa
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(88, 88, 88);
        doc.text(descripcionFinal, currentX + 5, textY + 15);

        // Precio moderno al final
        doc.setTextColor(39, 174, 96);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        const precio = `$ ${product.price}`;
        doc.text(precio, currentX + itemWidth - 5, y + contentHeight - 8, { align: 'right' });

        // Actualizar posición para el siguiente producto
        if ((i + 1) % itemsPerRow === 0) {
          y += contentHeight + itemPadding;
          currentX = margin;
        } else {
          currentX += itemWidth + itemPadding;
        }
    }
    doc.save('productos.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      this.isGeneratingPDF = false;
    }
  }

  getImageFromUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg'));
        } else {
          reject();
        }
      };
      img.onerror = reject;
      img.src = url;
    });
  }
}
