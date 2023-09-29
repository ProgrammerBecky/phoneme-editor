import {
    AnimationMixer,
    AnimationClip,
    Audio,
} from 'three';
import { G } from './G.js';
import { EditorUI } from './EditorUI.js';

export class Character {
    
    constructor() {
        
        this.setInfluence = this.setInfluence.bind( this );

        this.actionSequence = [];
        this.actionSequenceTimer = 0;
        this.actionSequenceIndex = -1;
        this.gender = 'female';
        
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
            
            this.blinkTimer = 0;
            this.blinkRate = 10;
            this.blinkTarget = 2;
            this.blinkAction = 0;
            this.moodMouthStrength = 1;
        
            G.scene.add( this.ent );
        
            G.gltf.load( '/3d/FemaleAnimations.glb' , result => {
                G.animations.female = result.animations;
                EditorUI.buildAnimationSelector();
            });
        });
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
    
    setActiveViseme( viseme ) {
        if( ! viseme ) return;
        
        const speed = viseme.speed ? viseme.speed : 7;
        
        this.setInfluence( 'viseme_sil' , 0 , speed );
        this.setInfluence( 'viseme_PP' , 0 , speed );
        this.setInfluence( 'viseme_FF' , 0 , speed );
        this.setInfluence( 'viseme_TH' , 0 , speed );
        this.setInfluence( 'viseme_DD' , 0 , speed );
        this.setInfluence( 'viseme_kk' , 0 , speed );
        this.setInfluence( 'viseme_CH' , 0 , speed );
        this.setInfluence( 'viseme_SS' , 0 , speed );
        this.setInfluence( 'viseme_nn' , 0 , speed );
        this.setInfluence( 'viseme_RR' , 0 , speed );
        this.setInfluence( 'viseme_aa' , 0 , speed );
        this.setInfluence( 'viseme_E' , 0 , speed );
        this.setInfluence( 'viseme_I' , 0 , speed );
        this.setInfluence( 'viseme_O' , 0 , speed );
        this.setInfluence( 'viseme_U' , 0 , speed );
        
        this.setInfluence( `viseme_${viseme.viseme}` , 1 , speed );
    }
    
    setSpeech( actionSequence ) {
        this.actionSequence = actionSequence;
    }

    setSpeechBuffer( audioBuffer ) {
        if( this.speechAudio ) this.speechAudio.stop();
        if( ! this.speechAudio ) this.speechAudio = new Audio( G.listener );
        this.speechAudio.setBuffer( audioBuffer );
        this.speechAudio.setLoop( false );
        this.speechAudio.play();
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
                
                if( EditorUI.morphReport === 'report' ) {
                    if( EditorUI.morphRangeReport[ morphIndex ] ) {
                        EditorUI.morphRangeReport[ morphIndex ].value = morph.value;
                    }
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
        
        this.actionSequenceTimer += delta; //Typical behaviour
        if( this.speechAudio && this.speechAudio.isPlaying ) {
            const current_timecode_from_audio_playback = this.speechAudio.offset + this.speechAudio.context.currentTime - this.speechAudio._startedAt;
            EditorUI.showCurrentTimecode( current_timecode_from_audio_playback );
            this.actionSequenceTimer = current_timecode_from_audio_playback;
        }
        
        this.processActionSequence();
        
    }
    
    processActionSequence() {
        
        const nextActionSequenceIndex = this.actionSequence.findIndex( seq => 
            seq.timecode > this.actionSequenceTimer
        );
        const lastActionSequenceIndex = nextActionSequenceIndex - 1;
        
        if( lastActionSequenceIndex !== this.actionSequenceIndex ) {
            this.actionSequenceIndex = lastActionSequenceIndex;
            this.setActiveViseme( this.actionSequence[ this.actionSequenceIndex ] );
        }
        
    }
    
}