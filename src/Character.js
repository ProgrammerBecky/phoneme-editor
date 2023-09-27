import {
    AnimationMixer,
    AnimationClip,
} from 'three';
import { G } from './G.js';

export class Character {
    
    constructor() {
        
        this.setAnimFromSelector = this.setAnimFromSelector.bind( this );
        this.setInfluence = this.setInfluence.bind( this );
        
        this.gender = 'female';
        this.morphRangeReport = [];
        this.morphReport = 'report';
        
        G.gltf.load( '/3d/high/fnpc (1).glb' , result => {
            this.ent = result.scene;
            this.ent.position.set(0,0,0.01);
            this.ent.rotation.set(0,Math.PI,0);
            G.controls.target.set( 0,1.5,0.01 );
            
            this.mixer = new AnimationMixer( this.ent );
            this.morphs = {};
            this.morphSet = [];            

            this.ent.traverse( child => {
                if( child.isMesh ) {
                    if( child.morphTargetInfluences && child.morphTargetInfluences.length > 0 ) {
                        for ( const [ key, value ] of Object.entries( child.morphTargetDictionary ) ) {
                            this.morphs[key] = value;
                        }
                    }
                    
                    child.material.envMap = G.environmentMap;
                    child.material.envMapIntensity = G.environmentMapIntensity;
                    child.material.depthTest = true;
                    child.material.depthWrite = true;
                    child.castShadow = true;
                    child.receiveShadow = true;
                }

            });            
            
            console.log( 'Available Morphs' , this.morphs );
            
            this.blinkTimer = 0;
            this.blinkRate = 10;
            this.blinkTarget = 2;
            this.blinkAction = 0;
            this.moodMouthStrength = 1;
        
            G.scene.add( this.ent );
        
            G.gltf.load( '/3d/FemaleAnimations.glb' , result => {
                G.animations.female = result.animations;
                this.buildAnimationSelector();
            });
        });
    }
    
    buildAnimationSelector() {
        const animationSelect = document.getElementById('Animation');
        animationSelect.innerHTML = '';
        G.animations[ this.gender ].forEach( animation => {
            const animationOption = document.createElement('option');
            animationOption.setAttribute( 'value' , animation.name );
            animationOption.innerHTML = `${animation.name} ${animation.duration.toFixed(2)}s`;
            animationSelect.appendChild( animationOption );
        });
        animationSelect.addEventListener( 'change' , G.character.setAnimFromSelector );
        
        const moodSelect = document.getElementById('Mood');
        moodSelect.addEventListener( 'change' , G.character.setAnimFromSelector );
        
        this.morphRangeReport = [];
        const morphPanel = document.getElementById('Morph');
        morphPanel.innerHTML = '';

        const resetMorphs = document.createElement( 'button' );
        resetMorphs.innerHTML = 'Reset';
        resetMorphs.addEventListener( 'click' , (e) => {
            this.morphSet.forEach( morph => {
                morph.target = 0;
            });
        });
        morphPanel.appendChild( resetMorphs );  
        
        const morphMode = document.createElement( 'button' );
        morphMode.innerHTML = 'Edit';
        morphMode.addEventListener( 'click' , (e) => {
            this.morphReport = this.morphReport === 'report' ? 'edit' : 'report';
            e.target.innerHTML = this.morphReport === 'report' ? 'Edit' : 'Report';
        });
        morphPanel.appendChild( morphMode );
        
        for( let morph in this.morphs ) {
            const row = document.createElement( 'div' );
            row.classList.add( 'row' );
            
            const label = document.createElement( 'label' );
            label.innerHTML = morph;
            row.appendChild( label );
            
            const range = document.createElement( 'input' );
            range.setAttribute( 'type' , 'range' );
            range.setAttribute( 'min' , 0 );
            range.setAttribute( 'max' , 1 );
            range.setAttribute( 'step' , 0.05 );
            range.setAttribute( 'value' , 0 );
            range.setAttribute( 'name' , morph );
            range.addEventListener( 'change' , (e) => {
                this.setInfluence( morph , e.target.value , 2 );
            });
            this.morphRangeReport.push( range );
            row.appendChild( range );
            morphPanel.appendChild( row );
        }
        
        this.setAnimFromSelector();
    }
    setAnimFromSelector() {
        const animationSelect = document.getElementById('Animation');
        this.setAnimation( animationSelect.value );
        const moodSelect = document.getElementById('Mood');
        this.setMood( moodSelect.value );
    }
    
    /* direction =     'in' | 'outin' | 'fast' | 'outfast' */
    setAnimation( newAnim, loop=true , direction='in' ) {

        if( ! this.ent ) return;
        if( this.currentAnim === newAnim ) return;
        
        this.currentAnim = newAnim;

        if( ! this.mixer ) {
            this.mixer = new AnimationMixer( this.ent );
        }

        this.mixer._actions.map( action => {
            if( action.name === newAnim ) {
                action.setLoop( loop );
                action.clampWhenFinished = ! loop;
                action.direction = direction;
                action.play();
                return;
            }
            else {
                action.direction = 'out' + direction;
            }
        });

        let clip = AnimationClip.findByName( G.animations[this.gender] , newAnim );

        if( clip ) {
            let action = this.mixer.clipAction( clip );
            action.direction = direction;
            action.name = newAnim;
            action.setLoop( loop );
            action.clampWhenFinished = ! loop;
            action.setEffectiveWeight( 0 );
            action.play();
        }
        else {
            console.error( `No ${this.gender} Animation Clip:` , newAnim );
        }
            
    }
    
    setBlink() {
        this.blinkTimer = 0;
        this.blinkTarget = this.blinkRate * 0.8 + this.blinkRate * 0.4 * Math.random();
        this.blinkAction = 1;
    }
    
    doBlink() {

        if( this.blinkAction < 1.120 ) {
            const blinkCurve = Math.sin( (this.blinkAction-1)*Math.PI/0.120 )
            this.setInfluence( 'eyeBlinkLeft' , blinkCurve , 10.0 );
            this.setInfluence( 'eyeBlinkRight' , blinkCurve , 10.0 );
        }
        else {
            this.blinkAction = 0;
            this.setInfluence( 'eyeBlinkLeft' , 0 );
            this.setInfluence( 'eyeBlinkRight' , 0 );
        }
        
    }    
    
    setInfluence( morph , strength , speed = 3.0 ) {

        if( ! this.morphs[ morph ] ) return;
        
        if( morph.indexOf( 'viseme' ) === -1 && ( morph.includes( 'mouth' ) > -1 || morph.includes( 'jaw' ) > -1 ) ) {
            strength *= this.moodMouthStrength;
        }
        
        const morphIndex = this.morphs[ morph ];

        if( this.morphSet[ morphIndex ] ) {
            this.morphSet[ morphIndex ].target = strength;
        }
        else {
            this.morphSet[ morphIndex ] = {
                target: strength,
                value: 0
            };
        }
        this.morphSet[ morphIndex ].speed = speed;
    }    
    
    setMood( mood ) {
        
        this.mood = mood;
        
        this.setInfluence( 'eyesClosed' , 0 );
        this.setInfluence( 'eyeWideLeft' , 0 );
        this.setInfluence( 'eyeWideRight' , 0 );
        this.setInfluence( 'eyesLookDown' , 0 );
        this.setInfluence( 'cheekSquintLeft' , 0 );
        this.setInfluence( 'cheekSquintRight' , 0 );
        this.setInfluence( 'cheekPuff' , 0 );
        this.setInfluence( 'browInnerUp' , 0 );
        this.setInfluence( 'browDownLeft' , 0 );
        this.setInfluence( 'browDownRight' , 0 );
        this.setInfluence( 'browOuterUpLeft' , 0 );
        this.setInfluence( 'browOuterUpRight' , 0 );
        this.setInfluence( 'mouthFunnel' , 0 );
        this.setInfluence( 'mouthDimpleLeft' , 0 );
        this.setInfluence( 'mouthDimpleRight' , 0 );
        this.setInfluence( 'mouthPressLeft' , 0 );            
        this.setInfluence( 'mouthSmile' , 0 );  
        this.setInfluence( 'mouthShrugLower' , 0 );
        this.setInfluence( 'mouthShrugUpper' , 0 );
        this.setInfluence( 'noseSneerLeft' , 0 );
        this.setInfluence( 'noseSneerRight' , 0 );            
        this.setInfluence( 'jawOpen' , 0 );         

        if( this.mood === 'relaxed' ) {
            this.blinkRate = 3;
            this.setInfluence( 'eyesClosed' , 0.2 );
        }
        else if( this.mood === 'happy' ) {
            this.blinkRate = 15;
            this.setInfluence( 'browInnerUp' , 0.3 );
            this.setInfluence( 'mouthDimpleLeft' , 1 );
            this.setInfluence( 'mouthDimpleRight' , 1 );
            this.setInfluence( 'mouthSmile' , 0.15 );     
        }
        else if( this.mood === 'happy-smile' ) {
            this.blinkRate = 15;
            this.setInfluence( 'browDownLeft' , 0.2 );
            this.setInfluence( 'browDownRight' , 0.2 );
            this.setInfluence( 'browInnerUp' , 0.3 );
            this.setInfluence( 'mouthDimpleLeft' , 1 );
            this.setInfluence( 'mouthDimpleRight' , 1 );    
            this.setInfluence( 'mouthSmile' , 1 );            
        }
        else if( this.mood === 'happy-laugh' ) {
            this.blinkRate = 15;
            this.setInfluence( 'eyeWideLeft' , 0.3 );
            this.setInfluence( 'eyeWideRight' , 0.3 );
            this.setInfluence( 'browInnerUp' , 0.5 );
            this.setInfluence( 'browOuterUpLeft' , 0.5 );
            this.setInfluence( 'browOuterUpRight' , 0.5 );
            this.setInfluence( 'mouthSmile' , 1 );            
            this.setInfluence( 'jawOpen' , 0.5 );
        }
        else if( this.mood === 'pain' ) {
            this.blinkRate = 5;
            this.setInfluence( 'mouthFunnel' , 1 );
            this.setInfluence( 'cheekSquintLeft' , 1 );
            this.setInfluence( 'cheekSquintRight' , 1 );
            this.setInfluence( 'noseSneerLeft' , 0.2 );
            this.setInfluence( 'noseSneerRight' , 0.2 );            
        }
        else if( this.mood === 'shock' ) {
            this.blinkRate = 8;
            this.setInfluence( 'eyeWideLeft' , 1 );
            this.setInfluence( 'eyeWideRight' , 1 );
            this.setInfluence( 'browInnerUp' , 1 );
            this.setInfluence( 'jawOpen' , 0.3 ); 
        }
        else if( this.mood === 'anger' ) {
            this.blinkRate = 10;
            this.setInfluence( 'eyeWideLeft' , 0.6 );
            this.setInfluence( 'eyeWideRight' , 0.6 );
            this.setInfluence( 'browDownLeft' , 1 );
            this.setInfluence( 'browDownRight' , 1 );
            this.setInfluence( 'noseSneerLeft' , 1 );
            this.setInfluence( 'noseSneerRight' , 1 );
            this.setInfluence( 'jawOpen' , 0.15 ); 
        }
        else if( this.mood === 'contempt' ) {
            this.blinkRate = 8;
            this.setInfluence( 'eyesClosed' , 0.3 );
            this.setInfluence( 'mouthPressLeft' , 0.5 );            
            this.setInfluence( 'noseSneerLeft' , 1 );
            this.setInfluence( 'noseSneerRight' , 1 );
        }
        else if( this.mood === 'contempt-pout' ) {
            this.blinkRate = 5;
            this.setInfluence( 'eyesClosed' , 0.4 );
            this.setInfluence( 'eyesLookDown' , 0.6 );
            this.setInfluence( 'browDownLeft' , 0.3 );
            this.setInfluence( 'browDownRight' , 0.3 );
            this.setInfluence( 'cheekPuff' , 1 );
            this.setInfluence( 'mouthShrugLower' , 1 );
            this.setInfluence( 'mouthShrugUpper' , 1 );
        }
        else if( this.mood === 'confused' ) {
            this.blinkRate = 3;
            this.setInfluence( 'eyesClosed' , 0.3 );
            this.setInfluence( 'eyeWideLeft' , 0.2 );
            this.setInfluence( 'browDownLeft' , 1 );
            this.setInfluence( 'browOuterUpRight' , 1 );
            this.setInfluence( 'mouthPressLeft' , 0.3 );            
            this.setInfluence( 'jawOpen' , 0.2 ); 
        }
        else if( this.mood === 'fear' ) {
            this.blinkRate = 20;
            this.setInfluence( 'eyeWideLeft' , 1 );
            this.setInfluence( 'eyeWideRight' , 1 );
            this.setInfluence( 'browInnerUp' , 1 );
            this.setInfluence( 'browOuterUpLeft' , 1 );
            this.setInfluence( 'browOuterUpRight' , 1 );
            this.setInfluence( 'noseSneerLeft' , 0.2 );
            this.setInfluence( 'noseSneerRight' , 0.2 );            
            this.setInfluence( 'jawOpen' , 0.4 );  
        }
        else if( this.mood === 'sad' ) {
            this.blinkRate = 5;
            this.setInfluence( 'eyesClosed' , 0.3 );
            this.setInfluence( 'eyesLookDown' , 0.6 );
            this.setInfluence( 'noseSnearLeft' , 0.6 );
            this.setInfluence( 'noseSnearRight' , 0.6 );
            this.setInfluence( 'mouthShrugLower' , 0.5 );
            this.setInfluence( 'mouthShrugUpper' , 0.5 );
        }
        
    }    
    
    update( delta ) {
        if( this.mixer ) {
            this.mixer._actions.map( (action,index) => {
                if( action.direction === 'fast' ) {
                    action.setEffectiveWeight( Math.min( 1 , action.weight + delta * 3 ) );
                }
                else if( action.direction === 'in' ) {
                    action.setEffectiveWeight( Math.min( 1 , action.weight + delta ) );
                }
                else {
                    const speed = action.direction === 'outfast' ? delta * 3 : delta;
                    action.setEffectiveWeight( Math.max( 0 , action.weight - speed ) );
                    if( action.weight === 0 ) {
                        action.stop();
                    }
                }
            });
            
            this.mixer.update( delta );
        }
        
        if( this.morphSet ) {
            this.morphSet.map( (morph,morphIndex) => {
                if( morph.value < morph.target ) {
                    morph.value = Math.min( morph.value + delta*morph.speed , morph.target );
                }
                else {
                    morph.value = Math.max( morph.value - delta*morph.speed , morph.target );
                }
                this.ent.traverse( child => {
                    if( child.morphTargetInfluences &&  child.morphTargetInfluences.length > morphIndex ) {
                        child.morphTargetInfluences[ morphIndex ] = morph.value;
                    }
                });
                
                if( this.morphReport === 'report' ) {
                    this.morphRangeReport[ morphIndex ].value = morph.value;
                }
            });
            
            this.blinkTimer += delta;
            if( this.blinkTimer > this.blinkRate*2 || this.blinkTimer > this.blinkTarget ) {
                this.setBlink();
            }
            else if( this.blinkAction > 0 ) {
                this.blinkAction += delta;            
                this.doBlink();
            }
            
        }
    }
    
}