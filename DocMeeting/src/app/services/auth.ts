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
  private creditsSubject = new BehaviorSubject<number>(0);
  credits$ = this.creditsSubject.asObservable();

  // Variável que o resto do app vai "assistir" para saber se tá logado
  user$ = this.userSubject.asObservable();

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
    );

    // Monitoramento unificado
    this.supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ?? null;
      console.log('Evento de Autenticação:', event); // Debug essencial

      this.userSubject.next(user);

      if (user) {
        // Carrega os créditos sem travar o processo de login
        this.getProfile();
      } else {
        this.creditsSubject.next(0);
      }
    });
  }

  // Login com Google
  async signInWithGoogle() {
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });
    if (error) {
      console.error('Erro ao iniciar login Google:', error.message);
    }
  }

  // Logout
  async signOut() {
    await this.supabase.auth.signOut();
  }

  async getProfile() {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await this.supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Erro ao buscar créditos no Supabase:', error);
      return null;
    }

    if (data) {
      this.creditsSubject.next(data.credits);
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

  async updateCredits(userId: string, newAmount: number) {
    const { error } = await this.supabase
      .from('profiles')
      .update({ credits: newAmount })
      .eq('id', userId);

    if (!error) {
      this.creditsSubject.next(newAmount); // Notifica todos os componentes
      return true;
    }
    return false;
  }
}
