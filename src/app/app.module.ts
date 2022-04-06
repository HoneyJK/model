import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SceneComponent } from './scene/scene.component';


//Forms
import { FormsModule } from '@angular/forms';
//MatTree
import { MatTreeModule } from '@angular/material/tree';
//MatIcon
import { MatIconModule } from '@angular/material/icon';
//MatButton
import { MatButtonModule } from '@angular/material/button';
//MatCard
import { MatCardModule } from '@angular/material/card';
//MatMenu
import { MatMenuModule } from '@angular/material/menu';
//MatList
import { MatListModule } from '@angular/material/list';
//MatDivider
import { MatDividerModule } from '@angular/material/divider';
//MatButtonToggle
import { MatButtonToggleModule } from '@angular/material/button-toggle';
//MatFormField
import { MatFormFieldModule } from '@angular/material/form-field';
//MatInput
import { MatInputModule } from '@angular/material/input';


@NgModule({
  declarations: [
    AppComponent,
    SceneComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatTreeModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatMenuModule,
    MatListModule,
    MatDividerModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
