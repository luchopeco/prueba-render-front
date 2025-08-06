import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'price',
  standalone: true
})
export class PricePipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    // Si el valor es null o undefined, retornar 0
    if (value === null || value === undefined) {
      return '0';
    }
    // Formatear el número con separadores de miles
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
}
