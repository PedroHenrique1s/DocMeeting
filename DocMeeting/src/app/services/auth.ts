import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabase: SupabaseClient;
  private userSubject = new BehaviorSubject<User | null>(null);

  // Variável que o resto do app vai "assistir" para saber se tá logado
  user$ = this.userSubject.asObservable();

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );

    // 1. Tenta recuperar sessão salva (se der F5)
    this.supabase.auth.getUser().then(({ data }) => {
      this.userSubject.next(data.user);
    });

    // 2. Fica ouvindo: se logar ou deslogar, avisa todo mundo
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.userSubject.next(session?.user ?? null);
    });
  }

  // Login com Google
  async signInWithGoogle() {
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`, // Volta para localhost:4200
      },
    });
    if (error) console.error('Erro no login:', error);
  }

  // Logout
  async signOut() {
    await this.supabase.auth.signOut();
  }

  // Pega os créditos do banco
  async getProfile() {
    const user = this.userSubject.value;
    if (!user) return null;

    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }
    return data;
  }

  // Consome 1 crédito
  async consumeCredit() {
    const user = this.userSubject.value;
    if (!user) return;

    const profile = await this.getProfile();
    if (profile && profile.credits > 0) {
      await this.supabase
        .from('profiles')
        .update({ credits: profile.credits - 1 })
        .eq('id', user.id);
    }
  }

  async signInWithOtp(email: string) {
    return await this.supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin 
      }
    });
  }

  async signUp(email: string, pass: string) {
    return await this.supabase.auth.signUp({
      email: email,
      password: pass,
      options: {
        data: {
          full_name: email.split('@')[0], // Nome provisório baseado no e-mail
        },
        emailRedirectTo: window.location.origin
      }
    });
  }
}
