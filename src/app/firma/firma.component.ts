import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import {Undo,Redo} from 'interacto';
@Component({
  selector: 'app-firma',
  templateUrl: './firma.component.html',
  styleUrls: ['./firma.component.scss']
})

export class FirmaComponent implements AfterViewInit {
  
  @ViewChild('board') private board: ElementRef<HTMLDivElement>;
  @ViewChild('canvas') private canvas: ElementRef<HTMLCanvasElement>;
  @ViewChild('background') private background: ElementRef<HTMLCanvasElement>;
  @Input('backgroundImage') private backgroundImage = '';
  @ViewChild('undo') Undo: ElementRef; 
  
  @Input('filename') readonly filename;
  @Input('quality') readonly quality;
  @Input('softFactor') readonly softFactor = 4;
  @Input('width') readonly width = 300;
  @Input('height') readonly height = 300;
  @Input('showDownloadOption') readonly showDownloadOption = true;
  @Input('showCleanOption') readonly showCleanOption = true;
  @Input('backgroundStrech') readonly backgroundStrech = true;
 

  private dibujar = false;
  private trazados: { x, y }[][] = [];
  private puntos = [];
  private context: CanvasRenderingContext2D;
  constructor() { }

  ngAfterViewInit(): void {
    this.initComponenets();
  }

  toBlob(callback?: BlobCallback, type?: string, quality?) {
    this.mergeCanvas().toBlob(callback, type, quality);
  }

  download(filename?: string, quality?) {
    this.mergeCanvas().toBlob(blob => {
      var a = document.createElement('a') as HTMLAnchorElement;
      document.body.appendChild(a);
      a.classList.add('display-none');
      const url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = `${filename ?? 'canvas'}.png`;
      a.click();
      window.URL.revokeObjectURL(url);
    }, 'image/png', quality);
  }

  toBase64(type?: string, quality?): string {
    return this.mergeCanvas().toDataURL(type, quality);
  }

  setBackgroundImage(url: string, strech: boolean) {
    const context = this.background.nativeElement.getContext('2d');
    const img = new Image();

    img.crossOrigin = 'Anonymous';
    img.src = url;
    img.onload = () => {
      if (strech) context.drawImage(img, 0, 0, this.width, this.height); else context.drawImage(img, 0, 0);
    }
  }

  clean() {
    this.dibujar = false;
    this.context.clearRect(0, 0, this.width, this.height);
    this.trazados = [];
    this.puntos = [];
  }


 private undoDraw(){
    // delete everything
    this.context.clearRect(0,0,this.width,this.height);   
    // draw all the paths in the paths array
    this.trazados.forEach(path=>{
  this.context.beginPath();
  this.context.moveTo(path[0].x,path[0].y);  
    for(let i = 0; i < path.length; i++){
      this.context.lineTo(path[i].x,path[i].y); 
     this.alisarTrazado(this.trazados[i]);
    }
      this.context.stroke();
    })
  }  
  
undo(){
 this.trazados.splice(-1,1);
 this.undoDraw();
  }


  private redoDraw(){
    // delete everything
    this.context.drawImage(this.canvas.nativeElement,0,0);   
    // draw all the paths in the paths array
    this.trazados.forEach(path=>{
  this.context.beginPath();
  this.context.moveTo(path[0].x,path[0].y);  
    for(let i = 0; i > path.length; i++){
      this.context.lineTo(path[i].x,path[i].y); 
     this.alisarTrazado(this.trazados[i]);
    }
    })
  } 
  redo(){
  //  this.trazados.push();
//this.drawShape();
//this.redoDraw();
this.context.drawImage(this.canvas.nativeElement,0,0);   
  }
  



  private initCanvas() {
    this.board.nativeElement.style.width = `${this.width}px`
    this.board.nativeElement.style.height = `${this.height}px`

    this.context = this.canvas.nativeElement.getContext('2d');
    this.canvas.nativeElement.width = this.width;
    this.canvas.nativeElement.height = this.height;
    this.context.lineJoin = 'round';

    this.background.nativeElement.width = this.width;
    this.background.nativeElement.height = this.height;

    this.setBackgroundImage(this.backgroundImage, this.backgroundStrech);
  }

  private initComponenets() {
    this.initCanvas();

    this.addListeners(this.canvas.nativeElement, ['mousedown', 'touchstart'], (evt) => {
      this.dibujar = true;
      this.puntos.length = 0;
      this.context.beginPath();
    });

    this.addListeners(this.canvas.nativeElement, ['mouseup', 'touchend'], (evt) => {
      this.redibujartrazados();
    });

    this.addListeners(this.canvas.nativeElement, ['mousemove', 'touchmove'], (evt) => {
      if (this.dibujar) {
        var m = this.oMousePos(this.canvas, evt);
        this.puntos.push(m);
        this.context.lineTo(m.x, m.y);
        this.context.stroke();
      }
    });
  }

  private addListeners(element, events: String[], callback: (event) => void) {
    events.forEach(event => {
      element.addEventListener(event, callback)
    });
  }

  private reducirArray(n, elArray) {
    const nuevoArray: { x, y }[] = [];
    nuevoArray[0] = elArray[0];
    for (var i = 0; i < elArray.length; i++) {
      if (i % n == 0) {
        nuevoArray[nuevoArray.length] = elArray[i];
      }
    }
    nuevoArray[nuevoArray.length - 1] = elArray[elArray.length - 1];
    this.trazados.push(nuevoArray);
  }

  private calcularPuntoDeControl(ry, a, b) {
    const pc = { x: 0, y: 0 }
    pc.x = (ry[a].x + ry[b].x) / 2;
    pc.y = (ry[a].y + ry[b].y) / 2;
    return pc;
  }

  private alisarTrazado(ry) {
    if (ry.length > 1) {
      var ultimoPunto = ry.length - 1;
      this.context.beginPath();
      this.context.moveTo(ry[0].x, ry[0].y);
      for (let i = 1; i < ry.length - 2; i++) {
        var pc = this.calcularPuntoDeControl(ry, i, i + 1);
        this.context.quadraticCurveTo(ry[i].x, ry[i].y, pc.x, pc.y);
      }
      this.context.quadraticCurveTo(ry[ultimoPunto - 1].x, ry[ultimoPunto - 1].y, ry[ultimoPunto].x, ry[ultimoPunto].y);
      this.context.stroke();
    }
  }

  private redibujartrazados() {
    this.dibujar = false;
    this.context.clearRect(0, 0, this.width, this.height);
    this.reducirArray(this.softFactor, this.puntos);
    for (var i = 0; i < this.trazados.length; i++)
      this.alisarTrazado(this.trazados[i]);
      }

  private oMousePos(canvas, evt) {
    evt.preventDefault();
    if (evt instanceof TouchEvent) {
      const clientRect = canvas.nativeElement.getBoundingClientRect();
      return {
        x: Math.round(evt.touches[0].clientX - clientRect.left),
        y: Math.round(evt.touches[0].clientY - clientRect.top)
      }
    } else {
      const clientRect = canvas.nativeElement.getBoundingClientRect();
      return {
        x: Math.round(evt.clientX - clientRect.left),
        y: Math.round(evt.clientY - clientRect.top)
      }
    }
  }

  private mergeCanvas(): HTMLCanvasElement {
    const mergedCanvas: HTMLCanvasElement = document.createElement('canvas');
    const context = mergedCanvas.getContext('2d');

    mergedCanvas.width = this.width;
    mergedCanvas.height = this.height;
    context.drawImage(this.background.nativeElement, 0, 0, this.width, this.height);
    context.drawImage(this.canvas.nativeElement, 0, 0, this.width, this.height);
    
    return mergedCanvas;
  }
}
