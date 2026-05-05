import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PredictionInput {
  price: number;
  location: string;
  month: string;
}

export interface PredictionResult {
  popularity_score: number;
  temperature: number;
  month: string;
  input: {
    price: number;
    location: string;
  };
}

@Injectable({ providedIn: 'root' })
export class PredictionService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000';

  predict(input: PredictionInput): Observable<PredictionResult> {
    return this.http.post<PredictionResult>(`${this.apiUrl}/predict`, input);
  }
}