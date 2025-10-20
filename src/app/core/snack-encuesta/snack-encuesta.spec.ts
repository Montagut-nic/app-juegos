import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SnackEncuesta } from './snack-encuesta';

describe('SnackEncuesta', () => {
  let component: SnackEncuesta;
  let fixture: ComponentFixture<SnackEncuesta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnackEncuesta]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SnackEncuesta);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
