import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MediaOptimization {
 
  async optimizeMedia(file: File): Promise<File> {
    if (file.type.startsWith('text/')) return file;

    console.log(`🎵 Otimizando: ${file.name}`);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Decodifica o áudio (Isso pode demorar alguns segundos, é normal)
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Reduz para 16kHz Mono (Ideal para voz e IA)
      const offlineContext = new OfflineAudioContext(1, audioBuffer.duration * 16000, 16000);
      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineContext.destination);
      source.start();

      const renderedBuffer = await offlineContext.startRendering();

      const wavBlob = await this.bufferToWav(renderedBuffer);
      
      return new File([wavBlob], file.name.replace(/\.[^/.]+$/, "") + ".wav", { 
        type: "audio/wav",
        lastModified: Date.now()
      });

    } catch (error) {
      console.warn('Erro na otimização, enviando original.', error);
      return file; 
    }
  }

  private async bufferToWav(abuffer: AudioBuffer): Promise<Blob> {
    const numOfChan = abuffer.numberOfChannels;
    const length = abuffer.length * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let i, sample;
    let offset = 0;
    let pos = 0;

    setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157); 
    setUint32(0x20746d66); setUint32(16); setUint16(1); setUint16(numOfChan);
    setUint32(abuffer.sampleRate); setUint32(abuffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2); setUint16(16); setUint32(0x61746164); setUint32(length - pos - 4);

    for (i = 0; i < abuffer.numberOfChannels; i++) channels.push(abuffer.getChannelData(i));

    while (pos < length) {
      if (offset % 4000 === 0) {
         await new Promise(resolve => setTimeout(resolve, 0));
      }

      for (i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset])); 
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; 
        view.setInt16(pos, sample, true); 
        pos += 2;
      }
      offset++; 
    }

    return new Blob([buffer], { type: "audio/wav" });

    function setUint16(data: any) { view.setUint16(pos, data, true); pos += 2; }
    function setUint32(data: any) { view.setUint32(pos, data, true); pos += 4; }
  }
}
