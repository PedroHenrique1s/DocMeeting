import { TestBed } from '@angular/core/testing';

import { DynamicModal } from './dynamic-modal';

describe('DynamicModal', () => {
  let service: DynamicModal;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DynamicModal);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
