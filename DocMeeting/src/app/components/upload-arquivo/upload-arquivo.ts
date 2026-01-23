import { Component, ViewChild, ElementRef, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; 
import { FormsModule } from '@angular/forms'; 
import { GeminiService } from '../../services/gemini';
import { AuthService } from '../../services/auth'; //
import { Subscription } from 'rxjs';
import { Notification } from '../../services/notification';
import { Meetings } from '../../services/meetings';
import { DynamicModalService } from '../../services/dynamic-modal';

@Component({
  selector: 'app-upload-arquivo',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule], 
  templateUrl: './upload-arquivo.html',
  styleUrl: './upload-arquivo.scss',
})
export class UploadArquivo implements OnInit, OnDestroy {
  protected meetings:        any[] = [];
  protected selectedMeeting: any   = null;
  
  protected isLoading    = false;
  protected isLoggedIn   = false; 
  protected isEditing    = false;
  protected showHtmlCode = false;
  protected credits      = 0;

  private _userSub!: Subscription;
  private _userId: string | null = null;

  @ViewChild('visualEditor') protected visualEditor!: ElementRef;

  constructor(
    private geminiService: GeminiService,
    private _authService: AuthService, //
    private _notify: Notification, //
    private _meeting: Meetings,
    private _modalService: DynamicModalService
  ) {}

  ngOnInit() {
    this._userSub = this._authService.user$.subscribe((user) => {
      this.isLoggedIn = !!user;
      this._userId = user?.id || null;

      if (this.isLoggedIn && this._userId) {
        this.loadMeetings();
      } else {
        this.meetings = [];
      }
    });

    // 2. ADICIONE ISTO: Sincroniza os créditos do componente com o serviço
    this._authService.credits$.subscribe((valorReal) => {
      this.credits = valorReal;
      console.log('Saldo sincronizado para o upload:', this.credits);
    });
  }

  ngOnDestroy() {
    if (this._userSub) this._userSub.unsubscribe();
  }

  //Função principal do Upload de arquivos
  protected async onFileSelected(event: any): Promise<void> {
    const file = event.target.files[0];
    if (!file) return;

    if (!this.isLoggedIn) {
      this._notify.show('Você precisa estar logado.', 'error');
      event.target.value = '';
      return;
    }

    if (this.credits <= 0) {
      this._notify.show(
        'Você não possui créditos (💎 0). Adquira mais para continuar.',
        'error',
      );
      event.target.value = '';
      return;
    }

    const allowedExtensions = ['mp3', 'mp4', 'txt'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      this._notify.show('Formato inválido!', 'error');
      event.target.value = '';
      return;
    }

    this.isLoading = true;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await this.geminiService.analyzeMeeting(file, arrayBuffer);

      const meetingData = {
        user_id: this._userId,
        title: file.name,
        category: result.category,
        summary: result.quickSummary,
        full_content: result.styledContent,
        created_at: new Date(),
      };

      const { data, error } = (await this._meeting.saveMeeting(
        meetingData,
      )) as any;

      if (!error && data && data.length > 0) {
        const consumiu = await this._authService.updateCredits(
          this._userId!,
          this.credits - 1,
        );

        if (consumiu) {
          this.meetings.unshift({
            ...meetingData,
            id: data[0].id,
          });

          this._notify.show(
            'Ata gerada e salva! 1 crédito consumido.',
            'success',
          );
        }
      } else {
        throw new Error(error?.message || 'Falha ao salvar no banco de dados');
      }
    } catch (error: any) {
      this._notify.show(
        error.message || 'Erro ao processar com Gemini.',
        'error',
      );
      console.error(error);
    } finally {
      this.isLoading = false;
      event.target.value = '';
    }
  }

  //Visualização da ATA
  protected viewMeeting(meeting: any): void {
    this.selectedMeeting = meeting;
    this.isEditing = false;
    this.showHtmlCode = false;
  }

  //Deleta a Ata
  protected deleteMeeting(id: any): void {
    // Abre o modal personalizado
    this._modalService.open({
      title: 'Excluir Ata',
      message: 'Tem certeza que deseja excluir esta ata permanentemente? Esta ação não pode ser desfeita.',
      buttons: [
        {
          label: 'Cancelar',
          cssClass: 'btn-secondary',
          action: () => this._modalService.close() // Apenas fecha
        },
        {
          label: 'Sim, Excluir',
          cssClass: 'btn-danger',
          action: () => {
            this._modalService.close(); // Fecha o modal
            this.executeDelete(id);     // Chama a rotina que vai no banco
          }
        }
      ]
    });
  }

  private async executeDelete(id: any): Promise<void> {
    this.isLoading = true;

    try {
      const { error } = await this._meeting.deleteMeeting(id);

      if (error) throw error;

      this.meetings = this.meetings.filter((m) => m.id !== id);

      if (this.selectedMeeting && this.selectedMeeting.id === id) {
        this.closeModal();
      }

      this._notify.show('Ata excluída permanentemente.', 'success');
    } catch (err) {
      console.error(err);
      this._notify.show('Erro ao excluir ata.', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  //Fecha a tela da ata
  protected closeModal(): void {
    this.selectedMeeting = null;
    this.isEditing = false;
    this.showHtmlCode = false;
  }

  //Visualiza apenas a Ata estilizada
  
  protected toggleEdit(): void {
    this.isEditing = !this.isEditing;

    if (this.isEditing) {
      setTimeout(() => {
        if (this.visualEditor) {
          this.visualEditor.nativeElement.innerHTML =
            this.selectedMeeting.full_content;
        }
      }, 0);
    }
  }

  //Visualiza Código fonte em HTML
  toggleSourceCode(): void {
    this.showHtmlCode = !this.showHtmlCode;

    if (!this.showHtmlCode && this.isEditing) {
      setTimeout(() => {
        if (this.visualEditor) {
          this.visualEditor.nativeElement.innerHTML =
            this.selectedMeeting.full_content;
        }
      }, 0);
    }
  }

  //Falta a mudança do código fonte para código normal
  onVisualContentChange(event: any): void {
    this.selectedMeeting.full_content = event.target.innerHTML;
  }

  //Salva alterçaõ da Ata 
  protected saveEdit(): void {
    if (!this.selectedMeeting) return;

    // Chama o Modal Global para confirmar a ação
    this._modalService.open({
      title: 'Confirmar Alterações',
      message: 'Tem a certeza que deseja guardar as alterações e sobrescrever a ata original? Esta ação não pode ser desfeita.',
      buttons: [
        {
          label: 'Cancelar',
          cssClass: 'btn-secondary',
          action: () => this._modalService.close() 
        },
        {
          label: 'Sim, Guardar',
          cssClass: 'btn-primary', 
          action: () => {
            this._modalService.close(); 
            this.executeSaveEdit();     
          }
        }
      ]
    });
  }

  private async executeSaveEdit(): Promise<void> {
    this.isLoading = true;

    try {
      if (this.visualEditor) {
        this.selectedMeeting.full_content =
          this.visualEditor.nativeElement.innerHTML;
      }

      const { data, error } = (await this._meeting.updateMeeting(
        this.selectedMeeting.id,
        this.selectedMeeting.full_content,
      )) as any;

      if (error) throw error;

      if (data && data.length > 0) {
        const index = this.meetings.findIndex(
          (m) => m.id === this.selectedMeeting.id,
        );

        if (index !== -1) {
          this.meetings[index].full_content = this.selectedMeeting.full_content;
        }

        this._notify.show('Alterações guardadas no banco com sucesso!', 'success');
        this.isEditing = false;
        this.showHtmlCode = false;
      } else {
        console.warn('Update enviado, mas sem retorno.');
        this._notify.show('Guardado, mas sem confirmação de retorno.');
      }
    } catch (err: any) {
      console.error(err);
      this._notify.show(
        'Erro ao guardar: ' + (err.message || 'Erro desconhecido'),
        'error',
      );
    } finally {
      this.isLoading = false;
    }
  }

  //Envio do Email
  protected sendEmail(): void {
    if (!this.selectedMeeting) return;
    this._modalService.open({
      title: 'Enviar por E-mail',
      message: `Deseja abrir o seu programa de e-mail padrão para enviar o resumo da ata "${this.selectedMeeting.category}"?`,
      buttons: [
        {
          label: 'Cancelar',
          cssClass: 'btn-secondary',
          action: () => this._modalService.close()
        },
        {
          label: 'Sim, Abrir E-mail',
          cssClass: 'btn-primary', 
          action: () => {
            this._modalService.close(); 
            this.executeSendEmail();    
          }
        }
      ]
    });
  }

  private executeSendEmail(): void {
    const subject = encodeURIComponent(`Ata: ${this.selectedMeeting.category}`);
    const body = encodeURIComponent(
      `Resumo: ${this.selectedMeeting.summary}\n\n(Ata completa disponível no sistema)`
    );
    
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }

  //Faz a copia da Ata
  protected copyContent(): void {
    const plainText = this.selectedMeeting.full_content.replace(
      /<[^>]*>?/gm,
      '',
    );

    navigator.clipboard.writeText(plainText).then(() => {
      this._notify.show('Texto copiado!', 'info');
    });
  }

  //Busca as Atas no banco
  protected async loadMeetings(): Promise<void> {
    try {
      const { data, error } = (await this._meeting.getUserMeetings(
        this._userId!,
      )) as any;

      if (!error && data) {
        this.meetings = data;
      }
    } catch (err) {
      console.error('Erro ao carregar atas:', err);
      this._notify.show('Não foi possível carregar seu histórico.', 'error');
    }
  }
}