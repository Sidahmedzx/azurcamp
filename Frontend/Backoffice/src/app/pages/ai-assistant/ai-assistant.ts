import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AIService } from '../../services/ai';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="header-box animate-fade-in">
      <div>
        <h1 style="font-size: 2.25rem; color: white; margin-bottom: 0.5rem;">AI Assistant</h1>
        <p style="color: var(--text-muted);">Powered by Ollama via Spring AI.</p>
      </div>
    </div>

    <div class="card animate-slide-up" style="margin-bottom: 2rem;">
      <h2>Generate Campsite Description</h2>
      <p class="subtitle">Enter campsite details and let AI write a marketing description.</p>
      <div class="form-row">
        <div class="form-group">
          <label>Name</label>
          <input type="text" [(ngModel)]="descName" placeholder="e.g. Majestic Forest" />
        </div>
        <div class="form-group">
          <label>Location</label>
          <input type="text" [(ngModel)]="descLocation" placeholder="e.g. Ain Draham" />
        </div>
        <div class="form-group">
          <label>Capacity</label>
          <input type="number" [(ngModel)]="descCapacity" min="1" />
        </div>
        <button (click)="generateDescription()" [disabled]="descLoading()">
          <i class="fa-solid" [ngClass]="descLoading() ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'"></i>
          {{ descLoading() ? 'Generating...' : 'Generate' }}
        </button>
      </div>
      <div class="result-box" *ngIf="descResult()">
        <p>{{ descResult() }}</p>
      </div>
    </div>

    <div class="card animate-slide-up">
      <h2>Analyze Feedback Sentiment</h2>
      <p class="subtitle">Paste a visitor's feedback and AI will analyze its sentiment.</p>
      <div class="form-row" style="flex-direction: column; align-items: stretch;">
        <div class="form-group" style="width: 100%;">
          <label>Feedback Message</label>
          <textarea [(ngModel)]="feedbackMessage" rows="3" placeholder="e.g. The campsite was amazing, beautiful views..."></textarea>
        </div>
        <button (click)="analyzeFeedback()" [disabled]="feedbackLoading()" style="align-self: flex-start;">
          <i class="fa-solid" [ngClass]="feedbackLoading() ? 'fa-spinner fa-spin' : 'fa-brain'"></i>
          {{ feedbackLoading() ? 'Analyzing...' : 'Analyze' }}
        </button>
      </div>
      <div class="result-box" *ngIf="feedbackResult()">
        <p>{{ feedbackResult() }}</p>
      </div>
    </div>
  `,
  styles: [`
    .card { background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: var(--radius-lg); padding: 2rem; backdrop-filter: blur(12px); }
    h2 { color: white; font-size: 1.25rem; margin-bottom: 0.25rem; }
    .subtitle { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem; }
    .form-row { display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap; margin-bottom: 1.5rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
    .form-group label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .form-group input, .form-group textarea { background: rgba(30,41,59,0.6); border: 1px solid var(--glass-border); border-radius: 0.5rem; color: white; padding: 0.65rem 0.85rem; font-size: 0.9rem; }
    .form-group input:focus, .form-group textarea:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
    textarea { resize: vertical; min-height: 80px; }
    button { background: var(--primary); color: white; border: none; padding: 0.65rem 1.25rem; border-radius: 0.5rem; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; }
    button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(99,102,241,0.3); }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .result-box { background: rgba(99,102,241,0.05); border: 1px solid rgba(99,102,241,0.2); border-radius: 0.75rem; padding: 1.25rem; color: var(--text-main); line-height: 1.6; font-size: 0.95rem; }
  `]
})
export class AIAssistantComponent {
  private aiService = inject(AIService);

  descName = '';
  descLocation = '';
  descCapacity = 50;
  descResult = signal<string | null>(null);
  descLoading = signal(false);

  feedbackMessage = '';
  feedbackResult = signal<string | null>(null);
  feedbackLoading = signal(false);

  generateDescription() {
    this.descLoading.set(true);
    this.descResult.set(null);
    this.aiService.generateDescription(this.descName, this.descLocation, this.descCapacity)
      .subscribe({
        next: (res) => {
          this.descResult.set(res?.data || res);
          this.descLoading.set(false);
        },
        error: () => {
          this.descResult.set('Error: Could not generate description.');
          this.descLoading.set(false);
        }
      });
  }

  analyzeFeedback() {
    this.feedbackLoading.set(true);
    this.feedbackResult.set(null);
    this.aiService.analyzeFeedback(this.feedbackMessage)
      .subscribe({
        next: (res) => {
          this.feedbackResult.set(res?.data || res);
          this.feedbackLoading.set(false);
        },
        error: () => {
          this.feedbackResult.set('Error: Could not analyze feedback.');
          this.feedbackLoading.set(false);
        }
      });
  }
}