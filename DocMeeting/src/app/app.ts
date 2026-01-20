import { Component } from '@angular/core';
import { UploadArquivo } from './components/upload-arquivo/upload-arquivo';

@Component({
  selector: 'app-root',
  imports: [UploadArquivo],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'DocMeeting';
}
