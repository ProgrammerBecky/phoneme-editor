import {
    Scene,
    WebGLRenderer,
    PerspectiveCamera,
    AmbientLight,
    DirectionalLight,
    TextureLoader,
    CubeTextureLoader,
    PCFSoftShadowMap,
    Vector2,
    Vector3,
    Clock,
    AudioListener,  
    AudioLoader,

    CubeRefractionMapping,
    LinearFilter,
    LinearMipMapLinearFilter,
    sRGBEncoding,
    
    Color,
    Fog,
    LoadingManager,
} from 'three';
import { G } from './G.js';
import { Character } from './Character.js';
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
                
import Stats from '/node_modules/three/examples/jsm/libs/stats.module.js'

G.manager = new LoadingManager();
G.manager.onProgress = (url, itemsLoaded, itemsTotal) => {
    let loader = document.getElementById( 'LoadingMessage' );
    if( loader ) {
        loader.innerHTML = `${Math.floor( itemsLoaded * 100 / itemsTotal)}% Loading`;
    }
};
G.manager.onLoad = () => {
    let loader = document.getElementById( 'LoadingMessage' );
    if( loader ) {
        loader.innerHTML = '';
    }    
};

const init3d = () => {
    G.animations = {
        female: {},
        male: {},
    };
    G.masterMeshes = {};

    G.texture = new TextureLoader( G.manager );
    G.gltf = new GLTFLoader( G.manager );
    
    G.scene = new Scene();
    G.stats = Stats();
    document.body.appendChild( G.stats.dom );

    const cubeTextureLoader = new CubeTextureLoader();
    cubeTextureLoader.setPath( '3d/high/skybox/' );
    G.environmentMap = cubeTextureLoader.load([
        'posx.jpg',
        'negx.jpg',
        'posy.jpg',
        'negy.jpg',
        'posz.jpg',
        'negz.jpg'
    ]);
    
    G.environmentMapIntensity = 0.3;
    G.environmentMap.mapping = CubeRefractionMapping;
    G.environmentMap.magFilter = LinearFilter;
    G.environmentMap.minFilter = LinearMipMapLinearFilter;
    //G.environmentMap.colorSpace = sRGBEncoding;

    G.renderer = new WebGLRenderer({
        logarithmicDepthBuffer: true,
    });
    //G.renderer.outputColorSpace = sRGBEncoding;
    G.renderer.shadowMap.enabled = true;
    G.renderer.shadowMap.type = PCFSoftShadowMap;    
    G.renderer.setPixelRatio( window.devicePixelRatio );
    G.renderer.setSize( window.innerWidth , window.innerHeight );
    document.body.appendChild( G.renderer.domElement );

    G.camera = new PerspectiveCamera( 60, window.innerWidth / window.innerHeight , .1 , 100 );
    G.scene.add( G.camera );

    G.listener = new AudioListener();
    G.listener.rotation.set( 0 , 0 , 0 );
    G.camera.add( G.listener );
    G.audio = new AudioLoader();
    
    G.scene.background = new Color( 0x081215 );
    
    G.controls = new OrbitControls( G.camera , G.renderer.domElement );
    G.controls.minDistance = 1;
    G.controls.maxDistance = 10;
    G.controls.zoomSpeed = 1;
    G.controls.panSpeed = 25;
    G.controls.rotateSpeed = 2;
    G.controls.maxPolarAngle = Math.PI / 2;
    
    G.ambient = new AmbientLight( 0x222222 );
    G.scene.add( G.ambient );

    G.sun = new DirectionalLight( 0xffffff , 2 );
    G.sun.castShadow = true;
    //G.sun.shadow.bias = 0.0002;
    G.sun.shadow.normalBias = 7;
    G.sun.shadow.mapSize.width = 4096;
    G.sun.shadow.mapSize.height = 4096;
    G.sun.shadow.camera.near = 1;
    G.sun.shadow.camera.far = 100;
    G.sun.shadow.camera.left = -100;
    G.sun.shadow.camera.right = 100;
    G.sun.shadow.camera.top = 100;
    G.sun.shadow.camera.bottom = -100;
    G.sun.position.set( 0 , 0.5 , -1 );
    
    G.scene.add( G.sun );
    G.scene.add( G.sun.target );

    window.addEventListener( 'resize' , () => {
        const width = window.innerWidth - 432;
        const height = window.innerHeight;
        
        G.camera.aspect = width / height;
        G.camera.updateProjectionMatrix();

        G.renderer.setSize( width , height );
    });
    window.dispatchEvent( new CustomEvent( 'resize' ) );
    
    G.clock = new Clock();
    G.camera.rotation._order = 'ZYX';
    
    G.character = new Character();
    
    animate();
}

const animate = () => {
 
    G.stats.begin();
    requestAnimationFrame( animate );
    const delta = G.clock.getDelta();

    if( G.controls ) {
        G.controls.update();   
    }
    
    if( G.character ) {
        G.character.update( delta );
    }
    
    G.renderer.render( G.scene , G.camera );
    G.stats.end();
    
}

init3d();

