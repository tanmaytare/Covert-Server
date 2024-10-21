import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DisplayComponent } from "./display/display.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, DisplayComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'covert';
}
