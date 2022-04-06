import { AfterViewInit, Component,ElementRef, Input,ViewChild,HostListener, ViewChildren, Output, EventEmitter} from '@angular/core';

/*Importing three js */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass'; 
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';

/*Angular Material NodeTree */
import {NestedTreeControl} from '@angular/cdk/tree';
import {MatTreeNestedDataSource} from '@angular/material/tree';



/*Angular-Material-NodeTree  Data Structure*/
interface TreeNode {
    name: string ;
    children?: TreeNode[];
  }



@Component({
  selector: 'app-scene',
  templateUrl: './scene.component.html',
  styleUrls: ['./scene.component.css']
})



export class SceneComponent implements AfterViewInit {
  @Input() modelUrl!:string;
  @Input() jsonRec!:any;
  @Output() historyRecord = new EventEmitter<any>();

  /**
   * Defines the address of the model. Path to the model file.
   */
  //public modelUrl = 'assets/model/ExcavatorFromBlender.glb'


  /**
   * Records in JSON format (highlighting, notes)
   *    Format: { highlight:[string,...] , note: [ {'id':'string'}, ... ] }
   */
  public jsonData = { highlight:[], note:[] };
  

  /**
   * The color setting for highlighting.
   *    Hexadecimal
   */
  public highightColor = 0xFF0000;

  
  /**
   *Define scenes, cameras, renderers, controllers, 
   *outlinePass,  renderPass, composer
   */
  private renderer!: THREE.WebGLRenderer;
  private camera!: THREE.PerspectiveCamera;
  public scene!: THREE.Scene;
  public controls!:OrbitControls;
  public outlinePass!: OutlinePass;
  public renderPass!: RenderPass;
  public composer!: EffectComposer;


  /**
   * Create raw data
   */
  public oraScene!:THREE.Scene;


  /**
   * Camera preset default parameters
   * Position of the camera
   */
  public cameraX: number =0.5;
  public cameraY: number =0;
  public cameraZ: number =1;


  /**
   * Camera preset default parameters
   *    1.Camera view
   *    2.Nearest Distance
   *    3.Farthest Distance
   */
  public cameraView: number = 45;
  public nearestDis: number = 0.01;
  public farthestDis: number = 10000;


  /**
   * Record the name obtained after selecting a node in the list
   */
  public checkedNodeName = ''; 



  /** 
   * Record selection of highlighted node names (meaningful only for the bottom node record)
   */
  public highlightHistory:any =[];


  /**
   * Record note information
   */
  public noteHistory:any = [];


  /**
   * Record the initial node corresponding number and unique name.
   */
  public oraNumber:any = [];
  public oraName:any = [];

  /**
   * The nodetree data obtained after processing
   *    Initial processing to obtain
   */
  public nodeTree:any = [];


  /**
   * Angular-Material-NodeTree
   *    Set the format of the tree
   */
  public TREE_DATA: TreeNode[] = [];


  /**
   *  Angular-Material-NodeTree  Controllers and Data Sources 
   */
  treeControl = new NestedTreeControl<TreeNode>(node => node.children);
  dataSource = new MatTreeNestedDataSource<TreeNode>();//Data Sources


  @ViewChild('canvas')
  private canvasRef!: ElementRef;


  constructor() {
      this.render = this.render.bind(this);
      this.onModelLoadingCompleted = this.onModelLoadingCompleted.bind(this);
  }


  /**Angular-Material-NodeTree */
  hasChild = (_: number, node: TreeNode) => !!node.children && node.children.length > 0;


  /**
   * Get the container for model rendering,
   *    canvas
   */
  private get canvas(): HTMLCanvasElement {
      return this.canvasRef.nativeElement;
  }


  /**
   * Create a scene.
   *    Setting the background color of the scene rendering.
   *    Select the appropriate loader.(GLTFLoader)
   *    Set the callback function of the loader.
   */
  private createScene() {
      //Create a scene.
      this.scene = new THREE.Scene();
      //Setting the background color of the scene rendering.
      this.scene.background = new THREE.Color(0xeeeeee);
      //GLTFLoader
      var loader = new GLTFLoader();
      loader.load(this.modelUrl,this.onModelLoadingCompleted);

      
      /**
       * If the transferred data is not a model file, but binary model data(json). Use the following loader.
       *    loader.parse(data : ArrayBuffer, path : String, onLoad : Function, onError : Function);
       * 
       *    data — glTF asset to parse, as an ArrayBuffer or JSON string.
       *    path — The base path from which to find subsequent glTF resources such as textures and .bin data files.
       *    onLoad — A function to be called when parse completes.
       *    onError — (optional) A function to be called if an error occurs during parsing. The function receives error as an argument.
       * 
       *    Parse a glTF-based ArrayBuffer or JSON String and fire onLoad callback when complete. The argument to onLoad will be an Object that contains loaded parts: .scene, .scenes, .cameras, .animations, and .asset.
       */
      
      //loader.parse(data: ArrayBuffer, path: String, this.onModelLoadingCompleted);
  }


  /** 
   * Functions after model loading is complete 
   *    If camera parameters exist in the model file, the settings for the camera position.
   *    Processing after parsing the model file.
   */
  private onModelLoadingCompleted(modelFile:any) {
      var modelScene = modelFile.scene;
     
      //If camera parameters exist in the model file
      if(modelFile.cameras[0]){
        this.cameraX= modelFile.cameras[0].position.x;
        this.cameraY=modelFile.cameras[0].position.y;
        this.cameraZ=modelFile.cameras[0].position.z;
        
        this.createCamera();
        this.render();
        this.addControls();
        };
      
      //Dereference data by conversion.
      var objStr = JSON.stringify(modelFile.scene);
      var objPar = JSON.parse(objStr);
      //console.log(objPar.object);

      //Data of nodeTree
      var mid = this.DataCre(objPar.object);
      this.nodeTree.push(mid);

      //Assignment of data sources for angular-materia nodetree
      this.dataSource.data = this.nodeTree;

      //Record the initial node corresponding number and unique name.
      var midOra = modelFile.parser.associations;
      for(let item of midOra.entries()){
          if(item?.[1]?.nodes || item?.[1]?.nodes === 0){
              this.oraName.push(item?.[0]?.name);
              this.oraNumber.push(item?.[1]?.nodes);
          }
      };

      //Processing of raw node information. (dereference)
      this.oraNumber = this.changeNumber(this.oraNumber);

      //Add the scene information of the file to the scene
      this.scene.add(modelScene);
      //Cloning of original scene information.
      this.oraScene = this.scene.clone(true);
      //Rendering
      this.render();

      //Operations for reading json
      this.readJson();
  }


  /**
   * Creating lights
   *    Light type
   *    Light color and intensity
   *    Position of the lights
   */
  private createLight() {
    //Direct light
    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(100, 350, 200);
    this.scene.add(directionalLight);
    var directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight2.position.set(-300, -100, -400);
    this.scene.add(directionalLight2);
    var directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight3.position.set(-10, -300, -30);
    this.scene.add(directionalLight3);
    //Point Light Source
    var point = new THREE.PointLight(0xffffff, 0.9);
    point.position.set(400, 150, 300);
    this.scene.add(point);
    var ambient = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambient);
  }


  /**
   * Create Camera
   *    Camera Type
   *    Camera position
   *    Camera parameters
   */
  private createCamera() {
    
       //Camera Type
       let aspectRatio = this.aspectRatio();

       //Camera parameters
       this.camera = new THREE.PerspectiveCamera(
           this.cameraView,
           aspectRatio,
           this.nearestDis,
           this.farthestDis
       );

       //Set position and look at
       this.camera.position.x = this.cameraX;
       this.camera.position.y = this.cameraY;
       this.camera.position.z = this.cameraZ;
       this.camera.lookAt(0,0,0);
   }


  /**Get the aspect ratio of the container */
  private aspectRatio(): number {
      let height = this.canvas.clientHeight;
      if (height === 0) {
          return 0;
      }
      return this.canvas.clientWidth / this.canvas.clientHeight;
  }


  /**
   * Renderer starts rendering
   *    Rendering parameter settings
   */
  private rendering() {
      this.renderer = new THREE.WebGLRenderer({
          antialias: true,
          canvas: this.canvas
      });
      this.renderer.setPixelRatio(devicePixelRatio);
      //Size of the rendering
      this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);

      //Rendering parameter settings
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.setClearColor(0xffffff, 1);
      this.renderer.autoClear = true;


      // Create a renderer channel with the scene and camera as parameters
      this.renderPass = new RenderPass(this.scene, this.camera);
      // Create an OutlinePass channel to display the outer outline border
      this.outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), this.scene, this.camera);
      // Post-processing is complete, set renderToScreen to true, and the post-processing result is displayed on the Canvas canvas
      this.outlinePass.renderToScreen = true;

      //OutlinePass-related property settings
      //this.outlinePass.visibleEdgeColor.set(0xff0000);//Model stroke color, default white
      this.outlinePass.edgeThickness = 0.05;//Contour stroke thickness
      this.outlinePass.edgeStrength = 50.0;//Luminous intensity
      this.outlinePass.hiddenEdgeColor.set(0x220101);//Stroke color control for obscured parts of the model
      // OutlinePass.edgeGlow = 0.0;//Edge glow, default 0.0


      // Create post-processing object EffectComposer with WebGL renderer as parameter
      this.composer = new EffectComposer(this.renderer);
      // Set the renderPass channel
      this.composer.addPass(this.renderPass);
      // Set the OutlinePass channel
      this.composer.addPass(this.outlinePass);


      let component: SceneComponent = this;

      (function render() {
          //requestAnimationFrame(render);
          component.render();
      }());
  }


  /**
   * Create Renderer
   *    (Adding scenes and cameras)
   */
  public render() {
      //this.renderer.render(this.scene, this.camera);
      this.composer.render();
  }


  /**
   * Create controller method
   *    Whether you can zoom 
   *    Zoom and magnification speed
   *    Speed of rotation
   *    Add Event
   */
  public addControls() {
      this.controls = new OrbitControls(this.camera, this.canvas);
      this.controls.enableZoom = true;
      this.controls.rotateSpeed = 1.0;
      this.controls.zoomSpeed = 1.2;
      this.controls.addEventListener('change', this.render);
  }




  /* EVENTS */


  /**
   * Highlighting operational events
   * @param value Select the highlighted node name.
   */
  public highLight(value:string){
      //Edge highlighting
      var selectedObject = this.scene.getObjectByName(value);
      if(selectedObject){
        this.outlinePass.selectedObjects = [];
        this.outlinePass.selectedObjects.push(selectedObject);
      }

        //Find the corresponding node number.
        var midNode = this.oraName.indexOf(value);
        var midNodeNumber = this.oraNumber[midNode];
      
      //Unhighlight selected nodes if they are in the highlighted history.
      if(this.highlightHistory.includes(midNodeNumber)){
        var checkName = value;
        //Gets information about the selected node.
        var mid = this.scene.getObjectByName(checkName);
        //Get the original information of the selected node.
        var oramid = this.oraScene.getObjectByName(checkName);
        //Gives the selected node its original information.
        (<any>mid).material = (<any>oramid).material;

        //Clear outlinePass
        this.outlinePass.selectedObjects = [];

        //Removes the selected node from the highlighted history array.
        var num = this.highlightHistory.indexOf(midNodeNumber);
        this.highlightHistory.splice(num, 1);

        //Update jsonData
        this.jsonData.highlight = this.highlightHistory;

        //Rendering
        this.render();

      }else{
        //Get the name of the node
        var checkName = value;
        //Gets information about the selected node.
        var chan = this.scene.getObjectByName(checkName);
        //Highlighted information
        var b = new THREE.MeshPhongMaterial({color:this.highightColor});
        (<any>chan).material = b;

        //Store highlighted nodes to an array
        this.highlightHistory.push(midNodeNumber);

        //Update jsonData
        this.jsonData.highlight = this.highlightHistory;

        //Rendering
        this.render();
      }
  }


  /**
   * Not used
   * Mouse click event((Additional functions, subsequent functions are available.Facilitate subsequent development)
   * @param event Mouse events
   */

  public onMouseDown(event: MouseEvent) {
      //console.log("onMouseDown");
      event.preventDefault();

      //mesh selection/pick:
      var raycaster = new THREE.Raycaster();
      var mouse = new THREE.Vector2();
      mouse.x = (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
      mouse.y = - (event.clientY / this.renderer.domElement.clientHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, this.camera);

      var obj: THREE.Object3D[] = [];
      this.findAllObjects(obj, this.scene);
      var intersects = raycaster.intersectObjects(obj);
      //console.log("Scene has " + obj.length + " objects");
      //console.log(intersects.length + " intersected objects found")
      intersects.forEach((i) => {
          //console.log(i.object); 
          //Operations can be performed on objects

      });

  }


  /**
   * Get all model nodes
   */
  private findAllObjects(pred: THREE.Object3D[], parent: THREE.Object3D) {
      // NOTE: Better to keep separate array of selected objects
      if (parent.children.length > 0) {
          parent.children.forEach((i) => {
              pred.push(i);
              this.findAllObjects(pred, i);                
          });
      }
  }


  /**
   * 
   * @param event Mouse events
   */
  public onMouseUp(event: MouseEvent) {
      //console.log("onMouseUp");
  }


  /**
   * When the render window changes, the renderer follows the change.
   */
  public onWindowResize(){
      this.camera.aspect = window.innerWidth / window.innerHeight;;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize( window.innerWidth, window.innerHeight );
  }


  /**
   * 
   * @param event Window size change event
   */
  @HostListener('window:resize', ['$event'])
  public onResize(event: Event) {
      //this.canvas.style.width = "100%";
      //this.canvas.style.height = "100%";
      //console.log("onResize: " + this.canvas.clientWidth + ", " + this.canvas.clientHeight);
      //this.camera.aspect = this.getAspectRatio();
      //this.camera.updateProjectionMatrix();
      //this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
      this.onWindowResize();
      this.render();
  }


  /**
   * Not used
   * 
   * @param event Keyboard input events
   */
  @HostListener('document:keypress', ['$event'])
  public onKeyPress(event: KeyboardEvent) {
      //console.log("onKeyPress: " + event.key);
  }


  /**
   * Not used
   * Get the id of the node
   * @param value Target information of the node
   * @returns the id of the node
   */
  public getId(value:any): any{
        var target = value.target || value.srcElement || value.currentTarget;
        var idAttr = target.attributes.id;
        var value = idAttr.nodeValue;
        return value;
   }



  /**Methods of data processing */


  /**
   * Processing of scene information.
   *    Remove values other than name and children
   * @param obj Scenes
   * @returns object
   */
  public filterObj(obj:any){
        var a = 'name';
        var b ='children';

        //Keys of the array
        var key = Object.keys(obj);

        //Keep keys other than name and children
        key.splice(key.indexOf(a),1);
        key.splice(key.indexOf(b),1);
        for(var i=0; i<key.length; i++){
            delete obj[key[i]];
            if(obj.material){
                delete obj.material;
            }
            if(obj.matrix){
                delete obj.matrix;
            }
 
        }
        return obj;
   }


  /**
   * Node without name attribute, set the default value.
   * @param ora The data after filteObj processing
   */
  public addName(ora:any){
       if('name' in ora){}else{
           ora.name = 'nodes';
       }
   }


   /**
    * Generate Angular-material nodetree compliant data
    * @param oldObj Scene Data
    * @returns Data in accordance with Angular-material nodetre
    */
  public DataCre(oldObj:any) {
       this.filterObj(oldObj);
       this.addName(oldObj);
       if(oldObj.children){
           for(var i=0;i<oldObj.children.length; i++){
               this.DataCre(oldObj.children[i]);
           }
       }
       return oldObj;
   }


   /**
    * The node information obtained after selecting the model node.
    */
   public check_name:string = '';
   public check_uuid:any;
   public check_position:any;
   public check_type:any;
   public check_parent:any;
   public check_scale:any;
   public check_visible:any;
   public check_matrix:any;
   public savedMessage:string = '';
   public nodeId:number = -1;


   /**
    * The method executed after selecting the model node.
    * @param name Name of the model node
    */
   public isNode:boolean = true; //highlight button is displayed or not
   public hasJsonNoteId = -1; //Get whether the selected node has note information.
   public checkName(name:string){
        this.check_name = name;
        var midData = this.scene.getObjectByName(name);
        this.check_uuid = midData?.uuid;
        this.check_position = midData?.position;
        this.check_type = midData?.type;
        this.check_parent = midData?.parent?.name;
        this.check_scale = midData?.scale;
        this.check_visible = midData?.visible;
        this.check_matrix = midData?.matrix.elements;


        //Find the corresponding node number.
        var midNode = this.oraName.indexOf(name);
        this.nodeId = this.oraNumber[midNode];

        //Nodes without matrials do not show the highlight button
        if((<any>midData).material){
            this.isNode = true;
        }else{
            this.isNode = false;
        }


        //Determine whether the transmitted json data contains the note information of the selected node
        var midNum = this.oraName.indexOf(name);
        var midId = this.oraNumber[midNum];
        //Get whether the selected node has note information. Get the serial number of its array
        this.hasJsonNoteId = this.hasNote(this.noteHistory, midId);
        if(this.hasJsonNoteId != -1){
            this.savedMessage = this.noteHistory[this.hasJsonNoteId]['text'];
        }

        //Edge highlighting canceled
        this.outlinePass.selectedObjects=[];
   }

   
   /**
    * Save the added note information.
    */
   input_text:string = '';
   public onSubmit(){
        //Submit a new note
        //Determine whether the note information of the selected node has been saved according to whether this.hasJsonNoteId is -1 or not.
        if(this.hasJsonNoteId === -1){
            var midObj = {node: this.nodeId, text: this.input_text};
            //Determine if the input is empty
            if(this.input_text === ''){}else{
                this.noteHistory.push(midObj);
            }
        }else{
            //Determine whether the input is empty or not, and do not operate if it is empty
            if(this.input_text === ''){}else{
                this.noteHistory[this.hasJsonNoteId]['text'] = this.input_text;
            }
        }

        //Recorded Information
        this.savedMessage = this.input_text;

        //Clear input box
        this.input_text = '';
   }


   /**
    * Delete note
    */
   public deleteNote(){
       this.noteHistory.splice(this.hasJsonNoteId,1);
       this.savedMessage = '';
   }


   /**
    * Click the parent node and the right detail card is hidden.
    */
   public hidRight(){
       var blanck = '';
       this.check_name = blanck;
   }



   /**
    * Method to get the node number of the original file
    */
   

   /**
    * 1.Get duplicate numbers (multiple identical numbers)
    * @param value Raw data of the incoming file
    * @returns Arrays without duplicate numbers
    */
   public reNumber(value:any){
    var repeat:any = [];
    for(var i=0; i<value.length; i++){
        if(value[i] === value[i-1]){
            repeat.push(value[i]);
        }
    }
    return this.noRepeat(repeat);
    }


   /**
    * 2.Removing duplicate values from an array
    * @param value Arrays containing duplicate numbers.
    * @returns Arrays with duplicate numbers removed (multiple duplicates are kept to one)
    */
   public noRepeat(value:any){
    var newArr:any = [];
    if(value.length ===0){
        return value;
    }

    newArr.push(value[0]);
    for(var i=1; i<value.length; i++){
        if(value[i] != value[i-1]){
            newArr.push(value[i]);
        };
    };
    return newArr;
   }


  /**
   * 3. Change the number of the array
   * @param oraData Raw data of the incoming file
   * @returns A new array without duplicate digits
   */
   public changeNumber(oraData:any){
    var repNum = this.reNumber(oraData);
    for(var i=0; i<repNum.length; i++){
     var startNum = oraData.indexOf(repNum[i]);
     var endNum = oraData.lastIndexOf(repNum[i]);
     var midNum = endNum - startNum;
     for(var j=0; j<midNum; j++){
         oraData[startNum + j] = oraData[startNum + j] - midNum + j;
     };
    }
    return oraData;
   }


   /**
    * Read the highlighted node of the incoming json data
    */
   public readJson(){
    //Read the incoming json data (highlight the operation if there is a highlight)
    var highId = this.jsonRec.highlight;
    if(highId){
        for(var i=0; i<highId.length; i++){
            var midId = this.oraNumber.indexOf(highId[i]);
            var midName = this.oraName[midId];
            this.highLight(midName);
        }
    }
    //Assign read highlighting and note information to records
    //this.jsonData.highlight = this.jsonTest.highlight;
    this.noteHistory = this.jsonRec.note;
   }


   /**
    * 
    * @param value Operation history data
    * @param nodeId Select node ID
    * @returns json data (note: []) returns the array ordinal number; return -1 means no note data.
    */
   public hasNote(value:any, nodeId:any){
       for(var i=0; i<value.length; i++){
           if(value[i].node === nodeId){
               return i;
           }
       }
       return -1;
   }


   //Save operation history
   public historySubmit(){
       this.jsonData.highlight = this.highlightHistory;
       this.jsonData.note = this.noteHistory;
       //console.log(this.jsonData);
       //Output
       this.historyRecord.emit(this.jsonData);
       alert('Save successfully')
   }



  /* LIFECYCLE */
  ngAfterViewInit() {
      this.createScene();
      this.createLight();
      this.createCamera();
      this.rendering();
      this.addControls();
  }
}