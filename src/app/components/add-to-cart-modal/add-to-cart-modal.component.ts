import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { PricePipe } from '../../pipes/price.pipe';

@Component({
  selector: 'app-add-to-cart-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, PricePipe],
  templateUrl: './add-to-cart-modal.component.html',
  styleUrls: ['./add-to-cart-modal.component.scss']
})
export class AddToCartModalComponent {
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  quantity: number = 1;
  aroma: string = '';
  suggestedAromas: string[] = [];
  filteredAromas: string[] = [];
  showSuggestions: boolean = false;

  constructor(private cartService: CartService) {}

  private extractAromas(description: string): string[] {
    if (!description) return [];
    
    // Convertir a minúsculas y dividir en palabras
    const words = description.toLowerCase().split(/[\s,\.]+/);
    
    // Palabras que definitivamente NO son aromas (artículos, preposiciones, etc)
    const excludeWords = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'o', 
                                'de', 'del', 'al', 'con', 'por', 'para', 'en', 'su', 'sus', 'este',
                                'esta', 'estos', 'estas', 'que', 'más', 'mas', 'muy', 'es', 'son',
                                'tiene', 'tienen', 'para']);
    
    // Palabras que podrían ser aromas o descriptores de aroma
    const commonAromas = new Set([
      // Aromas florales
      'lavanda', 'jazmin', 'rosa', 'flores', 'floral', 'flores', 'gardenia', 'violeta',
      // Aromas frutales
      'vainilla', 'limón', 'limon', 'coco', 'manzana', 'frutal', 'naranja', 'citrico',
      'citrus', 'frutilla', 'durazno', 'tropical', 'frutos', 'fruta', 'frutas', 'berry',
      // Aromas especiados
      'canela', 'especias', 'cardamomo', 'clavo', 'jengibre',
      // Aromas frescos
      'fresco', 'marino', 'oceano', 'brisa', 'menta', 'eucalipto', 'pino',
      // Aromas dulces
      'dulce', 'caramelo', 'chocolate', 'miel',
      // Aromas naturales
      'natural', 'hierba', 'hierbas', 'madera', 'bosque', 'campo',
      // Otros descriptores
      'suave', 'intenso', 'aromático', 'fresco', 'silvestre'
    ]);

    // Obtener todas las palabras que:
    // 1. No están en la lista de exclusión
    // 2. Tienen al menos 3 caracteres
    // 3. O están en la lista de aromas comunes o aparecen en la descripción
    const potentialAromas = words.filter(word => 
      word.length >= 3 && 
      !excludeWords.has(word) &&
      (commonAromas.has(word) || description.toLowerCase().includes(word))
    );

    // Eliminar duplicados y capitalizar primera letra
    return [...new Set(potentialAromas)].map(
      aroma => aroma.charAt(0).toUpperCase() + aroma.slice(1)
    );
  }

  @Input() set product(value: any) {
    if (value) {
      this._product = value;
      const extractedAromas = this.extractAromas(value.description || '');
      this.suggestedAromas = extractedAromas.length > 0 ? extractedAromas : ['Lavanda', 'Vainilla', 'Limón'];
      this.filteredAromas = [...this.suggestedAromas];
    }
  }
  get product() {
    return this._product;
  }
  private _product: any = null;

  close() {
    this.visible = false;
    this.visibleChange.emit(false);
    this.resetForm();
  }

  isAromaValid(): boolean {
    return Boolean(this.aroma?.trim());
  }

  addToCart() {
    if (!this.isAromaValid() || !this.product) return;

    this.cartService.addItem({
      id: this.product.id,
      name: this.product.name,
      brand: this.product.brand,
      price: this.product.price,
      quantity: this.quantity,
      aroma: this.aroma
    });

    this.close();
  }

  private resetForm() {
    this.quantity = 1;
    this.aroma = '';
    this.showSuggestions = false;
  }

  onAromaInput(event: Event) {
    const value = (event.target as HTMLInputElement).value.toLowerCase();
    this.showSuggestions = true;
    this.filteredAromas = this.suggestedAromas.filter(aroma => 
      aroma.toLowerCase().includes(value)
    );
  }

  selectAroma(aroma: string) {
    this.aroma = aroma;
    this.showSuggestions = false;
  }
}
