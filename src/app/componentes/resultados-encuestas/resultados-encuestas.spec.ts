import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultadosEncuestas } from './resultados-encuestas';

describe('ResultadosEncuestas', () => {
  let component: ResultadosEncuestas;
  let fixture: ComponentFixture<ResultadosEncuestas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultadosEncuestas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultadosEncuestas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
