import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private searchTerms = new BehaviorSubject<string>('');
  searchTerms$ = this.searchTerms.asObservable();

  updateSearchTerm(term: string) {
    console.log('SearchService updating term:', term); // Para debug
    this.searchTerms.next(term);
  }
}
