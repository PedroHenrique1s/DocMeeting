import { TestBed } from '@angular/core/testing';

import { Meetings } from './meetings';

describe('Meetings', () => {
  let service: Meetings;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Meetings);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
