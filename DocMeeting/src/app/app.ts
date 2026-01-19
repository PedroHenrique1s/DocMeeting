import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UploadArquivo } from './components/upload-arquivo/upload-arquivo';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, UploadArquivo],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'DocMeeting';
}
