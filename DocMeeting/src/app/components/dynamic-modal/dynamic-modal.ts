import { Component, inject } from '@angular/core';
import { DynamicModalService } from '../../services/dynamic-modal';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-dynamic-modal',
  imports: [AsyncPipe],
  templateUrl: './dynamic-modal.html',
  styleUrl: './dynamic-modal.scss',
})
export class DynamicModal {
  public modalService = inject(DynamicModalService);

  modalState$ = this.modalService.modalState$;

  onButtonClick(action: () => void) {
    action(); 
    this.modalService.close(); 
  }
}
