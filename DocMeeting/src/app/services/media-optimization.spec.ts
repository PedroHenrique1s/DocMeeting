import { TestBed } from '@angular/core/testing';

import { MediaOptimization } from './media-optimization';

describe('MediaOptimization', () => {
  let service: MediaOptimization;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MediaOptimization);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
