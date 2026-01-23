import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ModalConfig } from '../interfaces/dynamic-modal';

@Injectable({
  providedIn: 'root',
})
export class DynamicModalService {
  private modalState = new BehaviorSubject<{ isOpen: boolean; config?: ModalConfig }>({ isOpen: false });
  modalState$ = this.modalState.asObservable();

  open(config: ModalConfig){
    this.modalState.next({isOpen: true, config})
  }

  close(result?: any) {
    this.modalState.next({ isOpen: false });
    if (result) console.log('Modal fechado com retorno:', result);
  }
}
