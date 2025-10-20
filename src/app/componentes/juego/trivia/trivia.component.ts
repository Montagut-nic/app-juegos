import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Supabase } from '../../../core/supabase';
import { Alert } from '../../../core/alert';

type PokemonBasic = { id: number; name: string; image: string };

@Component({
  selector: 'app-trivia',
  standalone: false,
  templateUrl: './trivia.component.html',
  styleUrl: './trivia.component.scss'
})
export class TriviaComponent implements OnInit {

  private http = inject(HttpClient);
  private supa = inject(Supabase);
  private alert = inject(Alert);

  // Estado de usuario (puntos)
  authId: string | null = null;
  puntos = 0;

  // Estado de ronda
  loading = true;
  revealed = false;
  selected: string | null = null;

  pokemon: PokemonBasic | null = null;   // el correcto
  options: string[] = [];                // 1 correcta + 3 distractores

  async ngOnInit(): Promise<void> {
    // guard ya protege /juegos/...
    const u = this.supa.user;
    if (u) {
      this.authId = u.id;
      await this.supa.getPuntos(u.id)
        .then((p) => {
          this.puntos = p;
          this.nextRound();
        });
    } else {
      // fallback (no debería ocurrir si tenés guard)
      this.nextRound();
    }
  }

  // ===== Lógica de juego =====
  async nextRound() {
    try {
      this.loading = true;
      this.revealed = false;
      this.selected = null;

      // 1) Pokémon correcto
      const correctId = this.randId();
      const correct = await this.fetchPokemon(correctId);

      // 2) 3 distractores
      const names = new Set<string>([correct.name]);
      const distractors: string[] = [];
      while (distractors.length < 3) {
        const id = this.randId();
        if (id === correct.id) continue;
        const p = await this.fetchPokemon(id);
        if (!names.has(p.name)) {
          names.add(p.name);
          distractors.push(p.name);
        }
      }

      // 3) Mezclar opciones
      const all = [correct.name, ...distractors];
      this.shuffle(all);

      // 4) Set estado
      this.pokemon = correct;
      this.options = all;
    } catch (e) {
      console.error(e);
      this.alert.error('No se pudo cargar el Pokémon. Probá de nuevo.', { verticalPosition: 'top' });
    } finally {
      this.loading = false;
    }
  }

  async selectOption(name: string) {
    if (this.revealed) return;
    this.selected = name;
    const correct = name === (this.pokemon?.name ?? '');
    this.revealed = true;
    if (correct) {
      try {
        await this.supa.setPuntos(this.authId!, this.puntos + 1);
        this.alert.success('¡Correcto! +1 punto', { verticalPosition: 'top' });
      } catch (e) {
        this.alert.error('Adivinaste, pero ocurrió un error al cargar los puntos.', { verticalPosition: 'top' });
      }
    } else {
      this.alert.error('¡Incorrecto! La respuesta correcta era ' + this.pokemon!.name, { verticalPosition: 'top' });
    }
  }

  // ===== Helpers =====
  private randId(): number {
    // 1..1025 inclusive
    return Math.floor(Math.random() * 1025) + 1;
  }

  private async fetchPokemon(id: number): Promise<PokemonBasic> {
    try {
      const data: any = await firstValueFrom(this.http.get(`https://pokeapi.co/api/v2/pokemon/${id}`));
      const image = data?.sprites?.other?.['official-artwork']?.front_default
        ?? data?.sprites?.front_default
        ?? '';
      return {
        id,
        name: this.capitalizarPalabras(data?.name),
        image
      };
    } catch (e) {
      console.error('No se pudo cargar el Pokémon. ' + e);
      throw e;
    }

  }

  private capitalizarPalabras(texto: string): string {
    return texto.replace(/\b\w+\b/g, (match) => match.charAt(0).toUpperCase() + match.slice(1).toLowerCase());
  }

  private shuffle<T>(arr: T[]) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

}
