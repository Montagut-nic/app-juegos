import { Component, inject, signal } from '@angular/core';
import { Supabase } from '../../core/supabase';
type Juego = 'ahorcado' | 'mayor-menor' | 'trivia' | 'veintiuno';

interface ResultadoRow {
  user_id: string;
  racha: number | null;
  puntaje: number | null;
  created_at: string;
}

interface TopRow {
  pos: number;
  user_id: string;
  nombre: string;
  valor: number;   // racha o puntaje
  fecha: Date;
}


@Component({
  selector: 'app-ranking',
  imports: [],
  templateUrl: './ranking.html',
  styleUrl: './ranking.scss'
})
export class Ranking {

  private supa = inject(Supabase);

  loading = signal<boolean>(true);
  error = signal<string>('');

  // Tops
  ahorcadoRacha = signal<TopRow[]>([]);
  mayorRacha = signal<TopRow[]>([]);
  mayorPozo = signal<TopRow[]>([]);
  triviaRacha = signal<TopRow[]>([]);
  veintiunoRacha = signal<TopRow[]>([]);
  veintiunoPozo = signal<TopRow[]>([]);


  async ngOnInit() {
    await this.cargar();
  }

  async cargar() {
    this.loading.set(true);
    this.error.set('');
    try {
      const [ah, mr, mp, tr, vr, vp] = await Promise.all([
        this.fetchTopUnicos('ahorcado', 'racha', 10),
        this.fetchTopUnicos('mayor-menor', 'racha', 10),
        this.fetchTopUnicos('mayor-menor', 'puntaje', 10),
        this.fetchTopUnicos('trivia', 'racha', 10),
        this.fetchTopUnicos('veintiuno', 'racha', 10),
        this.fetchTopUnicos('veintiuno', 'puntaje', 10),
      ]);

      this.ahorcadoRacha.set(ah);
      this.mayorRacha.set(mr);
      this.mayorPozo.set(mp);
      this.triviaRacha.set(tr);
      this.veintiunoRacha.set(vr);
      this.veintiunoPozo.set(vp);
    } catch (e: any) {
      console.error(e);
      this.error.set(e?.message ?? 'No se pudo cargar el ranking.');
    } finally {
      this.loading.set(false);
    }
  }

  private async fetchTopUnicos(
    juego: Juego,
    campo: 'racha' | 'puntaje',
    limit: number
  ): Promise<TopRow[]> {

    // Traemos varias filas por si hay muchos duplicados; el cliente deduplica.
    const { data, error } = await this.supa.client
      .from('ranking')
      .select('user_id, racha, puntaje, created_at')
      .eq('juego', juego)
      .gt(campo, 0)                                 // > 0 (evita racha 0 o pozo 0)
      .order(campo, { ascending: false });
    if (error) throw error;

    const vistos = new Set<string>();
    const lista: TopRow[] = [];

    for (const row of (data as ResultadoRow[])) {
      const uid = row.user_id;
      if (vistos.has(uid)) continue;

      const valor = (campo === 'racha' ? row.racha : row.puntaje) ?? 0;
      if (valor <= 0) continue;

      vistos.add(uid);
      lista.push({
        pos: 0,                 // se setea después
        user_id: uid,
        nombre: '',             // se hidrata después
        valor,
        fecha: new Date(row.created_at)
      });

      if (lista.length >= limit) break;
    }

    // Hidratar nombres si tenés una tabla "profiles" (id, username/nombre)
    await this.hidratarNombres(lista);

    // Posición 1..N
    lista.forEach((r, i) => (r.pos = i + 1));
    return lista;
  }

  private async hidratarNombres(rows: TopRow[]) {
    const ids = rows.map(r => r.user_id);
    const short = (id: string) => id ? `${id.slice(0,6)}…${id.slice(-4)}` : 'N/D';

    try {
      if (!this.supa.client || ids.length === 0) {
        rows.forEach(r => r.nombre = short(r.user_id));
        return;
      }

      const { data, error } = await this.supa.client
        .from('registros_usuarios')
        .select('authId, name')
        .in('authId', ids);

      if (error || !data) {
        rows.forEach(r => r.nombre = short(r.user_id));
        return;
      }

      const map = new Map<string, string>();
      for (const p of data) {
        const label = p.name || short(p.authId);
        map.set(p.authId, label);
      }
      rows.forEach(r => r.nombre = map.get(r.user_id) ?? short(r.user_id));
    } catch {
      rows.forEach(r => r.nombre = short(r.user_id));
    }
  }

}
