import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  createClient,
  SupabaseClient,
  Session,
  User,
} from '@supabase/supabase-js';
import { environment } from '../../environments/env';

export interface ChatMessage {
  id: number;
  user_id: string;
  contenido: string;
  usuario: string;
  created_at: string; // ISO
}

@Injectable({
  providedIn: 'root'
})
export class Supabase {
  private _client: SupabaseClient;
  private _session$ = new BehaviorSubject<Session | null>(null);
  private _user$ = new BehaviorSubject<User | null>(null);

  constructor(private _ngZone: NgZone) {
    this._client = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });

    this._client.auth.getSession().then(({ data }) => {
      this._session$.next(data.session ?? null);
      this._user$.next(data.session?.user ?? null);
    });

    this._client.auth.onAuthStateChange((event, session) => {
      this._ngZone.run(() => {
        this._session$.next(session ?? null);
        this._user$.next(session?.user ?? null);
      });
    });

  }

  get client(): SupabaseClient {
    return this._client;
  }

  get session$(): Observable<Session | null> {
    return this._session$.asObservable();
  }
  get user$(): Observable<User | null> {
    return this._user$.asObservable();
  }

  get session(): Session | null {
    return this._session$.value;
  }
  get user(): User | null {
    return this._user$.value;
  }

  async isLoggedIn(): Promise<boolean> {
    const session = await this.session;
    return !!session;
  }

  async logInWithPassword(email: string, password: string): Promise<User> {
    const { data, error } = await this._client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data.user;
  }

  async signUpWithPassword(
    email: string,
    password: string,
  ): Promise<User> {
    const { data, error } = await this._client.auth.signUp({
      email,
      password
    });
    if (error) throw error;
    return data.session!.user;
  }

  async saveUserData(authId: string,
    patch: { userEmail?: string | null; userName?: string | null; avatar_url?: string | null; userPoints?: number | null; userActive?: boolean | null }): Promise<any | void> {
    const payload: any = { authId };
    if (patch.userEmail !== undefined) {
      payload.email = patch.userEmail;
    }
    if (patch.userName !== undefined) {
      payload.name = patch.userName;
    }
    if (patch.avatar_url !== undefined) {
      payload.avatarUrl = patch.avatar_url;
    }
    if (patch.userPoints !== undefined) {
      payload.puntos = patch.userPoints;
    }
    if (patch.userActive !== undefined) {
      payload.active = patch.userActive;
    }

    // Ensure we don't send nulls for NOT NULL columns; rely on DB defaults where possible
    const { data, error } = await this._client
      .from('registros_usuarios')
      .upsert(payload, { onConflict: 'authId' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async setPuntos(authId: string, puntos: number) {
    const { data, error } = await this._client
      .from('registros_usuarios')
      .update({ puntos })
      .eq('authId', authId)
      .select('puntos')
      .single();
    if (error) throw error;
    return data.puntos as number;
  }

  async getPuntos(authId: string): Promise<number> {
    const data = await this.getUserData(authId);
    return data?.puntos || 0;
  }


  async getUserData(authId: string): Promise<any | null> {
    const { data, error } = await this._client.from('registros_usuarios').select('*').eq('authId', authId).single();
    if (error) throw error;
    return data;
  }

  async saveFile(avatarFile: File, authID: string) {
    let ext: string;
    switch (avatarFile.type.toLowerCase()) {
      case 'image/jpeg':
        ext = '.jpeg';
        break;
      case 'image/png':
        ext = '.png';
        break;
      case 'image/jpg':
        ext = '.jpg';
        break;
      default:
        throw new Error(`Tipo de archivo no soportado: ${avatarFile.type}`);
    }
    const { data, error } = await this._client.storage.from('images').upload(`users/${authID}${ext}`, avatarFile!, {
      cacheControl: '3600',
      upsert: true
    });
    if (error) throw error;

    const { error: updateError } = await this._client
      .from('registros_usuarios')
      .update({ avatarUrl: data.path })
      .eq('authId', authID);
    if (updateError) throw updateError;
  }

  async getAvatarUrl(avatar_url: string) {
    return this._client.storage.from('images').getPublicUrl(avatar_url).data.publicUrl;
  }

  private _chatChannel: ReturnType<typeof this._client.channel> | null = null;

  /** Trae las N últimas (orden ascendente para listas) */
  async fetchChat(): Promise<ChatMessage[]> {
    const { data, error } = await this._client
      .from('mensajes')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data as ChatMessage[];
  }

  async sendChatMessage(contenido: string): Promise<void> {
    if (contenido.trim().length === 0) {
      throw new Error('El mensaje está vacío');
    }
    const user = this._user$.value;
    if (!user) throw new Error('No autenticado');

    const name = await this.getUserData(user.id).then(data => data?.name || 'Desconocido').catch(() => 'Desconocido');

    const { error } = await this._client
      .from('mensajes')
      .insert({
        user_id: user.id,
        usuario: name,
        contenido: contenido.trim()
      });
    if (error) throw error;
  }

  subscribeChat(onInsert: (msg: ChatMessage) => void) {
    // Cerrar canal previo si hubiera
    this.unsubscribeChat();

    this._chatChannel = this._client
      .channel('realtime:mensajes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mensajes' },
        (payload) => {
          onInsert(payload.new as ChatMessage);
        }
      )
      .subscribe((status) => {
        // loggear status
        console.log('chat channel status', status);
      });

    return () => this.unsubscribeChat();
  }

  unsubscribeChat() {
    if (this._chatChannel) {
      this._client.removeChannel(this._chatChannel);
      this._chatChannel = null;
    }
  }

  async sendEncuesta(authID: string, nom: string, ape: string, edad: number, tel: string, rating: number, r_ahor: number, r_triv: number, r_mayMen: number, r_veinti: number, jNuevo: string, recom: boolean, coment: string): Promise<any | void> {
    const { data, error } = await this._client
      .from('encuesta')
      .insert({
        user_id: authID,
        nombre: nom,
        apellido: ape,
        edad,
        tel,
        puntaje_sitio: rating,
        clas_ahorcado: r_ahor,
        clas_maymen: r_mayMen,
        clas_trivia: r_triv,
        clas_veinti: r_veinti,
        juegoNuevo: jNuevo,
        recomienda: recom,
        comentarios: coment
      });
    if (error) throw error;
    return data;
  }

  async encuestaYaCompletada(userId: string): Promise<boolean> {
    const { count, error } = await this._client
      .from('encuesta')
      .select('user_id', { count: 'exact', head: true }) // head: true => no trae filas
      .eq('user_id', userId);

    if (error) throw error;
    return (count ?? 0) > 0;
  }

  async guardarResultado(juego: 'trivia'|'ahorcado'|'veintiuno'|'mayor-menor', user_id: string, puntos: number, racha: number): Promise<any | void> {
    const { data, error } = await this._client
      .from('ranking')
      .insert({
        juego,
        user_id,
        puntaje: puntos,
        racha
      });
    if (error) throw error;
    return data;
  }

}
