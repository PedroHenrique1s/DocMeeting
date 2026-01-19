import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; 
import { FormsModule } from '@angular/forms'; 
import { GeminiService } from '../../../services/gemini';

@Component({
  selector: 'app-upload-arquivo',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule], 
  templateUrl: './upload-arquivo.html',
  styleUrl: './upload-arquivo.scss',
})
export class UploadArquivo {
  isLoading = false;
  meetings: any[] = [];
  selectedMeeting: any = null;
  
  // Controles de Edição
  isEditing = false;
  showHtmlCode = false;

  @ViewChild('visualEditor') visualEditor!: ElementRef;

  constructor(private geminiService: GeminiService) {}

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

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
    } catch (error) {
      alert('Erro ao processar arquivo. Verifique o console.');
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
    } else {
      this.showHtmlCode = false;
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
    console.log('Conteúdo salvo:', this.selectedMeeting.fullContent);
    this.isEditing = false;
    this.showHtmlCode = false;
  }

  // --- UTILITÁRIOS ---

  copyContent() {
    const tempElement = document.createElement("textarea");
    tempElement.value = this.selectedMeeting.fullContent.replace(/<[^>]*>?/gm, ''); 
    document.body.appendChild(tempElement);
    tempElement.select();
    document.execCommand("copy");
    document.body.removeChild(tempElement);
    alert('Conteúdo copiado!');
  }

  sendEmail() {
    const subject = encodeURIComponent(`Ata: ${this.selectedMeeting.category}`);
    const body = encodeURIComponent(`Resumo: ${this.selectedMeeting.summary}\n\n(Ata completa em anexo)`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }
}