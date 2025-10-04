import { Component, OnDestroy, ViewChild, ElementRef, inject, signal, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Supabase, ChatMessage } from '../../core/supabase';
import { toSignal } from '@angular/core/rxjs-interop';
import { Alert } from '../../core/alert';


@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './chat-widget.html',
  styleUrl: './chat-widget.scss'
})

export class ChatWidget implements OnDestroy {

  private alert = inject(Alert);
  private supabase = inject(Supabase);
  user = toSignal(this.supabase.user$, { initialValue: this.supabase.user });
  get isLoggedIn() { return !!this.user(); }

  open = signal(false);
  sending = signal(false);
  text = signal('');

  messages = signal<ChatMessage[]>([]);
  private unsub?: () => void;

  constructor() {
    // Siempre creamos el efecto para reaccionar a login/logout
    effect(() => {
      const u = this.user();
      if (u) this.initChat();     // me logueé → inicializo
      else this.teardownChat();   // me deslogueé → limpio
    });

    // Si ya estoy logueado, inicializo
    if (this.isLoggedIn) {
      this.initChat();
    }
  }



  @ViewChild('scrollBox') scrollBox!: ElementRef<HTMLDivElement>;

  teardownChat() {
    this.unsub?.();
    this.unsub = undefined;
    this.messages.set([]);
    this.open.set(false);
  }

  async initChat() {
    try {
      const data = await this.supabase.fetchChat();
      this.messages.set(data);
      setTimeout(() => this.scrollToBottom(), 0);

      this.unsub = this.supabase.subscribeChat((msg) => {
        this.messages.update(arr => [...arr, msg]);
        setTimeout(() => this.scrollToBottom(), 0);
      });
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  }

  ngOnDestroy() { this.unsub?.(); }

  toggle() { this.open.update(v => !v); setTimeout(() => this.scrollToBottom(), 50); }

  async send() {
    const value = this.text().trim();
    if (!value || this.sending()) return;
    if (value.length > 256) {
      this.alert.error('Superaste el limite de 256 caracteres por mensaje.');
      return;
    }
    try {
      this.sending.set(true);
      await this.supabase.sendChatMessage(value)
      this.text.set('');
    } catch (error) {
      this.alert.error('Error enviando el mensaje');
      console.error('Error mandando el mensaje:', error);
    } finally {
      this.sending.set(false);
      setTimeout(() => this.scrollToBottom(), 0);
    }
  }

  onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.send();
    }
  }

  private scrollTimeout?: any;

  private scrollToBottom() {
    if (!this.scrollBox || !this.scrollBox.nativeElement) return;
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => {
      const el = this.scrollBox.nativeElement;
      el.scrollTop = el.scrollHeight;
    }, 50); // Debounce by 50ms
  }

  esPropio(msg: ChatMessage): boolean {
    const u = this.user();
    if (!u) return false;
    return msg.user_id == u.id;
  }
}
