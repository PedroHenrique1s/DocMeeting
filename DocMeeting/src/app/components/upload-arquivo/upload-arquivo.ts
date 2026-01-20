import { Component, ViewChild, ElementRef, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; 
import { FormsModule } from '@angular/forms'; 
import { GeminiService } from '../../services/gemini';
import { AuthService } from '../../services/auth'; //
import { Subscription } from 'rxjs';
import { Notification } from '../../services/notification';

@Component({
  selector: 'app-upload-arquivo',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule], 
  templateUrl: './upload-arquivo.html',
  styleUrl: './upload-arquivo.scss',
})
export class UploadArquivo implements OnInit, OnDestroy {
  isLoading = false;
  isLoggedIn = false; // Controle de login
  meetings: any[] = [];
  selectedMeeting: any = null;
  
  isEditing = false;
  showHtmlCode = false;

  private _userSub!: Subscription;

  @ViewChild('visualEditor') visualEditor!: ElementRef;

  // Injeção via construtor conforme sua preferência
  constructor(
    private geminiService: GeminiService,
    private _authService: AuthService, //
    private _notify: Notification //
  ) {}

  ngOnInit() {
    // Monitora se o usuário está logado
    this._userSub = this._authService.user$.subscribe(user => {
      this.isLoggedIn = !!user; //
    });
  }

  ngOnDestroy() {
    if (this._userSub) this._userSub.unsubscribe();
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // 1. Validação de Login
    if (!this.isLoggedIn) {
      this._notify.show('Você precisa estar logado para processar arquivos.', 'error'); //
      event.target.value = '';
      return;
    }

    // 2. Validação de Extensão
    const allowedExtensions = ['mp3', 'mp4', 'txt'];
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension || !allowedExtensions.includes(extension)) {
      this._notify.show('Formato inválido! Use apenas MP3, MP4 ou TXT.', 'error'); //
      event.target.value = '';
      return;
    }

    this.isLoading = true;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await this.geminiService.analyzeMeeting(file, arrayBuffer);

      const newMeeting = {
        id: Date.now(),
        category: result.category,
        summary: result.quickSummary,
        fullContent: result.styledContent,
        date: new Date()
      };

      this.meetings.unshift(newMeeting);
      this._notify.show('Ata gerada com sucesso pela IA!', 'success'); //
    } catch (error) {
      this._notify.show('Erro ao processar arquivo com a IA Gemini.', 'error'); //
      console.error(error);
    } finally {
      this.isLoading = false;
      event.target.value = '';
    }
  }

  viewMeeting(meeting: any) {
    this.selectedMeeting = meeting;
    this.isEditing = false;
    this.showHtmlCode = false; 
  }

  deleteMeeting(id: number) {
    this.meetings = this.meetings.filter(m => m.id !== id);
    if (this.selectedMeeting && this.selectedMeeting.id === id) {
      this.closeModal();
    }
    this._notify.show('Reunião excluída.', 'info'); //
  }

  closeModal() {
    this.selectedMeeting = null;
    this.isEditing = false;
    this.showHtmlCode = false; 
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      setTimeout(() => {
        if (this.visualEditor) {
          this.visualEditor.nativeElement.innerHTML = this.selectedMeeting.fullContent;
        }
      }, 0);
    }
  }

  toggleSourceCode() {
    this.showHtmlCode = !this.showHtmlCode;
    if (!this.showHtmlCode && this.isEditing) {
      setTimeout(() => {
        if (this.visualEditor) {
          this.visualEditor.nativeElement.innerHTML = this.selectedMeeting.fullContent;
        }
      }, 0);
    }
  }

  onVisualContentChange(event: any) {
    this.selectedMeeting.fullContent = event.target.innerHTML;
  }

  saveEdit() {
    this._notify.show('Alterações salvas localmente.', 'success'); //
    this.isEditing = false;
    this.showHtmlCode = false;
  }

  copyContent() {
    const plainText = this.selectedMeeting.fullContent.replace(/<[^>]*>?/gm, ''); 
    navigator.clipboard.writeText(plainText).then(() => {
      this._notify.show('Texto copiado para a área de transferência!', 'info'); //
    });
  }

  sendEmail() {
    const subject = encodeURIComponent(`Ata: ${this.selectedMeeting.category}`);
    const body = encodeURIComponent(`Resumo: ${this.selectedMeeting.summary}\n\n(Ata completa disponível no sistema)`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }
}