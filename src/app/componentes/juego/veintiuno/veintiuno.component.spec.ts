import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VeintiunoComponent } from './veintiuno.component';

describe('VeintiunoComponent', () => {
  let component: VeintiunoComponent;
  let fixture: ComponentFixture<VeintiunoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VeintiunoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VeintiunoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
