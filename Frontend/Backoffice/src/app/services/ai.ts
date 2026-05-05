import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AIService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8084/api/ai';

  generateDescription(name: string, location: string, capacity: number) {
    return this.http.post<any>(`${this.apiUrl}/generate-description`, { name, location, capacity });
  }

  analyzeFeedback(message: string) {
    return this.http.post<any>(`${this.apiUrl}/analyze-feedback`, { message });
  }
}