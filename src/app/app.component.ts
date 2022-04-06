import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  //These data are designed for demonstration purposes only, and the operational data vary from model to model.
  title = 'model';
  modelUrl = 'assets/model/ExcavatorFromBlender.glb';
  jsonRec = {
    "highlight": [
        0,
        2
    ],
    "note": [
        {
          "node": 0,
          "text": "Here are the demo notes 1"
        },
        {
          "node": 2,
          "text": "Here are the demo notes 2"
        },
        // {
        //   "node": 80,
        //   "text": "Here are the demo notes 3"
        // }
    ]
  }
}
