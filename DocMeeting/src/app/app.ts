import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth';
import { UploadArquivo } from './components/upload-arquivo/upload-arquivo';
import { AuthModal } from './components/auth-modal/auth-modal';
import { Toast } from './components/toast/toast';

@Component({
  selector: 'app-root',
  imports: [UploadArquivo, CommonModule, AuthModal, Toast],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  currentUser$;
  credits = 0;
  showAuthModal = false;

  constructor(private authService: AuthService) {
    // 2. Atribua o valor AQUI dentro. Agora o authService já existe.
    this.currentUser$ = this.authService.user$;

    // Monitora o usuário
    this.authService.user$.subscribe(async (user) => {
      if (user) {
        const profile = await this.authService.getProfile();
        this.credits = profile?.credits ?? 0;
      } else {
        this.credits = 0;
      }
    });
  }

  loginGoogle() {
    this.authService.signInWithGoogle();
  }

  loginEmail() {
    this.showAuthModal = true;
  }

  logout() {
    this.authService.signOut();
  }
}
