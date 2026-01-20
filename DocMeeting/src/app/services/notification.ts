import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info';

@Injectable({
  providedIn: 'root',
})
export class Notification {
  private _toast = new BehaviorSubject<{msg: string, type: ToastType} | null>(null);
  toast$ = this._toast.asObservable();

  show(msg: string, type: ToastType = 'info') {
    this._toast.next({ msg, type });
    setTimeout(() => this.clear(), 4000);
  }

  clear() {
    this._toast.next(null);
  }
}
