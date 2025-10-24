import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Supabase } from '../../core/supabase';

type Encuesta = {
  created_at: string;
  user_id: string;
  nombre: string;
  apellido: string;
  edad: number;
  tel: string;
  puntaje_sitio: number;      // 1..5
  clas_ahorcado: number;      // 1..4
  clas_maymen: number;        // 1..4
  clas_veinti: number;        // 1..4
  clas_trivia: number;        // 1..4
  recomienda: boolean;
  comentarios: string;
  juegoNuevo: string | null;
};

@Component({
  selector: 'app-resultados-encuestas',
  imports: [CommonModule, DatePipe],
  templateUrl: './resultados-encuestas.html',
  styleUrl: './resultados-encuestas.scss',
})
export class ResultadosEncuestas implements OnInit {
  private supa = inject(Supabase);

  loading = signal<boolean>(true);
  error = signal<string>('');

  filas = signal<Encuesta[]>([]);
  total = signal<number>(0);


  // Promedio estrellas
  promedio = computed(() => {
    const arr = this.filas();
    if (!arr.length) return 0;
    const sum = arr.reduce((a, r) => a + (Number(r.puntaje_sitio) || 0), 0);
    return +(sum / arr.length).toFixed(2);
  });

  recomiendaPct = computed(() => {
    const arr = this.filas();
    if (!arr.length) return 0;
    const si = arr.filter(r => !!r.recomienda).length;
    return Math.round((si * 100) / arr.length);
  });

  favoritoCounts = computed(() => {
    const acc = { ahorcado: 0, maymen: 0, veinti: 0, trivia: 0 };
    for (const r of this.filas()) {
      if (r.clas_ahorcado === 1) acc.ahorcado++;
      if (r.clas_maymen === 1) acc.maymen++;
      if (r.clas_veinti === 1) acc.veinti++;
      if (r.clas_trivia === 1) acc.trivia++;
    }
    return acc;
  });

  ngOnInit() { this.cargar(); }

  async cargar() {
    this.loading.set(true);
    this.error.set('');
    try {
      let q = this.supa.client
        .from('encuesta')
        .select('created_at,user_id,nombre,apellido,edad,tel,puntaje_sitio,clas_ahorcado,clas_maymen,clas_veinti,clas_trivia,recomienda,comentarios,juegoNuevo', { count: 'exact' })
        .order('created_at', { ascending: false });
      const { data, count, error } = await q;
      if (error) throw error;

      this.filas.set((data || []) as Encuesta[]);
      this.total.set(count ?? (data?.length || 0));
    } catch (e: any) {
      console.error(e);
      this.error.set(e?.message ?? 'No se pudieron cargar los resultados.');
    } finally {
      this.loading.set(false);
    }
  }

  capitalizarPalabras(texto: string): string {
    const rx = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g;
    return texto.replace(rx, (palabra) =>
      palabra.charAt(0).toLocaleUpperCase('es') +
      palabra.slice(1).toLocaleLowerCase('es')
    );
  }

}