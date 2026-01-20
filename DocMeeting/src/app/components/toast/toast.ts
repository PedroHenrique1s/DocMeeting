import { Component } from '@angular/core';
import { Notification, ToastType } from '../../services/notification';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast',
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class Toast {
  message: string | null = null;
  type: ToastType = 'info';
  private _subscription: Subscription = new Subscription();

  constructor(private _notificationService: Notification) {}

  ngOnInit(): void {
    // Subscreve para ouvir as novas notificações que chegam do serviço
    this._subscription = this._notificationService.toast$.subscribe(toast => {
      if (toast) {
        this.message = toast.msg;
        this.type = toast.type;
      } else {
        this.message = null;
      }
    });
  }

  // Permite que o utilizador feche o toast ao clicar nele
  clear(): void {
    this._notificationService.clear();
  }

  ngOnDestroy(): void {
    // Limpa a subscrição para evitar fugas de memória (memory leaks)
    this._subscription.unsubscribe();
  }
}
