import { Component, EventEmitter, Output } from '@angular/core';
import { AuthService } from '../../services/auth';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Notification } from '../../services/notification';

@Component({
  selector: 'app-auth-modal',
  standalone: true, 
  imports: [FormsModule, CommonModule],
  templateUrl: './auth-modal.html',
  styleUrl: './auth-modal.scss',
})
export class AuthModal {
  email: string = '';
  password: string = ''; 
  isSignUp: boolean = false; 
  loading: boolean = false;
  sent: boolean = false;

  @Output() close = new EventEmitter<void>();

  constructor(
    private _authService: AuthService, 
    private _notify: Notification
  ) {}

  async handleAuth(event: Event) {
    event.preventDefault();
    if (!this.email) return;

    this.loading = true;

    try {
      if (this.isSignUp) {
        // Fluxo de Cadastro (E-mail + Senha)
        const { error } = await this._authService.signUp(this.email, this.password);
        if (error) throw error;
        
        this._notify.show('Conta criada! Verifique seu e-mail.', 'success');
        this.close.emit(); // Cadastro fecha direto pois exige validação externa
      } else {
        // Fluxo de Magic Link
        const { error } = await this._authService.signInWithOtp(this.email);
        if (error) throw error;
        
        this._notify.show('Link mágico enviado com sucesso!', 'success');
        this.sent = true;

        // Aguarda 2 segundos para o usuário ver a mensagem de sucesso e fecha automaticamente
        setTimeout(() => {
          this.close.emit();
        }, 2000);
      }
    } catch (error: any) {
      this._notify.show(error.message || 'Ocorreu um erro na autenticação', 'error');
    } finally {
      this.loading = false;
    }
  }

  toggleMode() {
    this.isSignUp = !this.isSignUp;
    this.sent = false;
  }

  onClose() {
    this.close.emit();
  }
}