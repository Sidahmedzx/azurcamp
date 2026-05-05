import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PredictionService, PredictionResult } from '../../services/prediction';

@Component({
  selector: 'app-price-predictor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="header-box animate-fade-in">
      <div>
        <h1 style="font-size: 2.25rem; color: white; margin-bottom: 0.5rem;">Popularity Predictor</h1>
        <p style="color: var(--text-muted);">ML-powered campsite popularity score based on price, location and season.</p>
      </div>
    </div>

    <div class="predictor-card animate-slide-up">
      <div class="form-row">
        <div class="form-group">
          <label>Price per Night (TND)</label>
          <input type="number" [(ngModel)]="price" min="1" placeholder="e.g. 45" />
        </div>
        <div class="form-group">
          <label>Location</label>
          <select [(ngModel)]="location">
            <option value="Ain Draham">Ain Draham</option>
            <option value="Kelibia">Kelibia</option>
            <option value="Tunis">Tunis</option>
            <option value="Hammamet">Hammamet</option>
            <option value="Sousse">Sousse</option>
            <option value="Djerba">Djerba</option>
            <option value="Bizerte">Bizerte</option>
            <option value="Tabarka">Tabarka</option>
            <option value="Tozeur">Tozeur</option>
            <option value="Douz">Douz</option>
          </select>
        </div>
        <div class="form-group">
          <label>Month</label>
          <select [(ngModel)]="month">
            <option *ngFor="let m of months" [value]="m">{{ m }}</option>
          </select>
        </div>
        <button (click)="predict()" [disabled]="loading()">
          <i class="fa-solid" [ngClass]="loading() ? 'fa-spinner fa-spin' : 'fa-chart-line'"></i>
          {{ loading() ? 'Analyzing...' : 'Predict Popularity' }}
        </button>
      </div>

      <div class="result-box" *ngIf="result()">
        <div class="score-circle" [style.borderColor]="getScoreColor(result()!.popularity_score)">
          <span class="score-value" [style.color]="getScoreColor(result()!.popularity_score)">{{ result()!.popularity_score }}</span>
          <span class="score-label">/100</span>
        </div>
        <div class="result-details">
          <div class="detail-item">
            <i class="fa-solid fa-location-dot"></i>
            {{ result()!.input.location }}
          </div>
          <div class="detail-item">
            <i class="fa-solid fa-temperature-half"></i>
            {{ result()!.temperature }}°C avg in {{ result()!.month }}
          </div>
          <div class="detail-item">
            <i class="fa-solid fa-tag"></i>
            {{ result()!.input.price }} TND/night
          </div>
        </div>
        <div class="verdict" [style.color]="getScoreColor(result()!.popularity_score)">
          {{ getVerdict(result()!.popularity_score) }}
        </div>
      </div>

      <div class="error-box" *ngIf="error()">
        <i class="fa-solid fa-triangle-exclamation"></i> {{ error() }}
      </div>
    </div>
  `,
  styles: [`
    .predictor-card { background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: var(--radius-lg); padding: 2.5rem; backdrop-filter: blur(12px); }
    .form-row { display: flex; gap: 1.5rem; align-items: flex-end; margin-bottom: 2rem; flex-wrap: wrap; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-group label { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .form-group input, .form-group select { background: rgba(30,41,59,0.6); border: 1px solid var(--glass-border); border-radius: 0.5rem; color: white; padding: 0.75rem 1rem; font-size: 1rem; min-width: 160px; }
    .form-group input:focus, .form-group select:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
    .form-group select option { background: #1e293b; color: white; }
    button { background: var(--primary); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 700; font-size: 0.95rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; }
    button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(99,102,241,0.3); }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .result-box { background: rgba(99,102,241,0.03); border: 1px solid rgba(99,102,241,0.15); border-radius: 1rem; padding: 2rem; display: flex; flex-direction: column; align-items: center; gap: 1.5rem; }
    .score-circle { width: 120px; height: 120px; border-radius: 50%; border: 4px solid; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .score-value { font-size: 2.5rem; font-weight: 800; }
    .score-label { font-size: 0.85rem; color: var(--text-muted); }
    .result-details { display: flex; gap: 2rem; flex-wrap: wrap; justify-content: center; }
    .detail-item { color: var(--text-muted); font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem; }
    .verdict { font-size: 1.1rem; font-weight: 700; text-align: center; }
    .error-box { background: rgba(244,63,94,0.05); border: 1px solid rgba(244,63,94,0.2); border-radius: 0.75rem; padding: 1rem 1.5rem; color: var(--danger); font-weight: 600; display: flex; align-items: center; gap: 0.5rem; margin-top: 1.5rem; }
  `]
})
export class PricePredictorComponent {
  private predictionService = inject(PredictionService);

  price = 45;
  location = 'Ain Draham';
  month = 'July';
  months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];

  result = signal<PredictionResult | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  predict() {
    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);

    this.predictionService.predict({
      price: this.price,
      location: this.location,
      month: this.month
    }).subscribe({
      next: (res) => {
        this.result.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Prediction failed. Is the ML API running on port 8000?');
        this.loading.set(false);
      }
    });
  }

  getScoreColor(score: number): string {
    if (score >= 70) return '#4ade80';
    if (score >= 40) return '#fbbf24';
    return '#f87171';
  }

  getVerdict(score: number): string {
    if (score >= 80) return 'Highly Popular — This campsite will thrive!';
    if (score >= 60) return 'Popular — Good potential, consider promotions.';
    if (score >= 40) return 'Average — Needs more events or price adjustment.';
    if (score >= 20) return 'Low Popularity — Action required: events, renovation, or price drop.';
    return 'Critical — Immediate intervention needed.';
  }
}