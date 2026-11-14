import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalLoaderComponent } from '@org/ui';

@Component({
  imports: [RouterOutlet, GlobalLoaderComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'member';
}
