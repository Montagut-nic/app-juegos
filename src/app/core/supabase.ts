import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  createClient,
  SupabaseClient,
  Session,
  User,
} from '@supabase/supabase-js';
import { environment } from '../../environments/env';

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
  patch: { userEmail?: string | null; userName?: string | null; avatar_url?: string | null; userPoints?: number | null; userActive?: boolean | null}): Promise<any | void> {
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

  async getUserData(authId: string): Promise<any | null> {
    const { data, error } = await this._client.from('registros_usuarios').select('*').eq('authId', authId).single();
    if (error) throw error;
    return data;
  }

  async saveFile(avatarFile: File, authID: string){
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
    return  this._client.storage.from('images').getPublicUrl(avatar_url).data.publicUrl;
  }
}
