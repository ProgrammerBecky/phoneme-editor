import { G } from './G.js';
import { phoneme } from './phoneme.js';

export const EditorUI = {

    morphRangeReport: [],
    gender: 'female',
    morphReport: 'report',
    waveform: null,
    waveformMagnification: 1,
    waveformZoom: 7,
    visemeChain: [],

    showCurrentTimecode: ( timecode ) => {
        let timeline = document.getElementById( 'Timeline' );
        if( ! EditorUI.currentTimecode ) {
            EditorUI.currentTimecode = document.createElement('div');
            EditorUI.currentTimecode.classList.add( 'current_timecode' );
            timeline.appendChild( EditorUI.currentTimecode );
        }
        
        const left = (timecode * 50 * EditorUI.waveformZoom).toFixed(2);
        EditorUI.currentTimecode.style.left = `${left}px`;
    },

    visualiseVisemeChain: () => {

        const timeline = document.getElementById( 'Timeline' );
        
        const oldScriptDom = document.getElementsByClassName( 'script' );
        for( let i=0 ; i<oldScriptDom.length ; i++ ) {
            timeline.removeChild( oldScriptDom[i] );
        }
        
        const oldVisemeDom = document.getElementsByClassName( 'viseme' );
        for( let i=0 ; i<oldVisemeDom.length ; i++ ) {
            timeline.removeChild( oldVisemeDom[i] );
        }
        
        EditorUI.visemeChain.forEach( (viseme,index) => {
            
            const visemeDom = document.createElement( 'div' );
            visemeDom.classList.add( 'viseme' );
            visemeDom.innerHTML = viseme.viseme;
            visemeDom.style.top = '64px';
            visemeDom.style.left = `${viseme.timecode * 50 * EditorUI.waveformZoom}px`;
            
            const scriptDom = document.createElement( 'div' );
            scriptDom.classList.add( 'script' );
            scriptDom.innerHTML = viseme.script;
            scriptDom.style.bottom = '0';
            scriptDom.style.left = `${viseme.timecode * 50 * EditorUI.waveformZoom}px`;
            
            timeline.appendChild( visemeDom );
            timeline.appendChild( scriptDom );
        });
        
        console.log( EditorUI.visemeChain );
        G.character[0].setSpeech( EditorUI.visemeChain );
    },

    distributeVisemeChain: () => {
        if( ! EditorUI.waveform || EditorUI.visemeChain.length === 0 ) return;
        
        const duration = EditorUI.waveform.duration;
        const step = duration / EditorUI.visemeChain.length;
        
        EditorUI.visemeChain.forEach( (viseme,index) => {
            EditorUI.visemeChain[index].timecode = step*index;
        });
        
        EditorUI.visualiseVisemeChain();
    },

    phonemeToViseme: ( textContent ) => {
        textContent = textContent.toLowerCase();
        EditorUI.visemeChain = [];
        
        let foundLetters = '';
        let visemeClone = {};
        
        while( textContent.length > 0 ) {
            const viseme = phoneme.find( phone => {
                return phone.letters.find( letter => {
                    if( letter === textContent.substr(0,letter.length) ) {
                        foundLetters = letter;
                        return true;
                    }
                });
            });
            if( viseme ) {
                visemeClone = {
                    script: foundLetters,
                    viseme: `${viseme.viseme}`,
                    timecode: 0,
                }
                EditorUI.visemeChain.push( visemeClone );
                textContent = textContent.substr( foundLetters.length );
            }
            else {
                visemeClone.script += textContent.substr(0,1);
                textContent = textContent.substr(1);
            }
        }
        
        EditorUI.distributeVisemeChain();
        
    },

    showWaveform: (url) => {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        
        fetch( url )
            .then( response => response.arrayBuffer())
            .then( arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
            .then( audioBuffer => {
               EditorUI.waveform = audioBuffer;
               EditorUI.visualiseWaveform();
               EditorUI.distributeVisemeChain();
            });
    },
    
    visualiseWaveform: () => {
        const rawData = EditorUI.waveform.getChannelData(0);
        const samples = EditorUI.waveform.duration * 50;
        const blockSize = Math.floor( EditorUI.waveform.length / samples );
        const filteredData = [];
        for( let i=0 ; i<samples ; i++ ) {
            filteredData.push( rawData[i * blockSize] );
        }
        
        const timeline = document.getElementById('Timeline');
        timeline.innerHTML = '';
        EditorUI.currentTimecode = null;

        EditorUI.waveformMagnification = 99999999;
        filteredData.forEach( (data) => {
            EditorUI.waveformMagnification = Math.min(
                EditorUI.waveformMagnification,
                64 / Math.abs(data),
            );           
        });

        filteredData.map( (data,index) => {
            
            const cell = document.createElement( 'div' );
            cell.classList.add( 'cell' );
            cell.style.height = `${(Math.abs(data)*EditorUI.waveformMagnification).toFixed(2)}px`;
            cell.style.left = `${index*EditorUI.waveformZoom}px`;
            if( data<0 ) cell.classList.add( 'reverse' );
            timeline.appendChild( cell );
            
        });
    },

    buildAnimationSelector: () => {
        
        /* Timeline click to play handler */
        const timeline = document.getElementById('Timeline');
        timeline.addEventListener( 'click', e => {
            const px = e.target.scrollLeft + e.clientX;
            const set_timecode = px / ( 50 * EditorUI.waveformZoom );
            if( G.character[0].speechAudio ) {
                G.character[0].speechAudio.stop();
                G.character[0].speechAudio.offset = set_timecode;
                G.character[0].speechAudio.play();
            }
        });
        
        /* Transform Script to Viseme */
        const transformScript = document.getElementById('TransformScript');
        transformScript.addEventListener( 'click' , () => {
            const scriptElement = document.getElementById('Script');
            const script = scriptElement.value;
            EditorUI.phonemeToViseme( script );
        });
        
        /* Audio File */
        const audioUpload = document.getElementById('AudioUpload');
        audioUpload.addEventListener( 'click', () => {
            const audioFile = document.getElementById('AudioFile').files[0];
            if( ! audioFile ) return;
            
            const audioUrl = URL.createObjectURL(audioFile);
            G.audio.load( audioUrl , buffer => {
                G.character[0].setSpeechBuffer( buffer );
                EditorUI.showWaveform(audioUrl);
            });
        });
        
        /* Menu Tabs */
        const menuTabs = document.getElementsByClassName( 'nav_tab' );
        for( let i=0 ; i<menuTabs.length ; i++ ) {
            const tab = menuTabs[i];
            tab.addEventListener( 'click' , (e) => {
                const menuTabs = document.getElementsByClassName( 'nav_tab' );
                for( let i=0 ; i<menuTabs.length ; i++ ) {
                    const tab = menuTabs[i];
                    tab.classList.remove( 'active' );
                }
                
                const contentTabs = document.getElementsByClassName( 'tab' );
                for( let i=0 ; i<contentTabs.length ; i++ ) {
                    const tab = contentTabs[i];
                    tab.classList.remove( 'active' );
                }
                
                e.target.classList.add( 'active' );
                const activeTab = document.getElementById( tab.getAttribute('data-show-tabId') );
                activeTab.classList.add( 'active' );
            });
        }
        
        /* Animation Selector */
        const animationSelect = document.getElementById('Animation');
        animationSelect.innerHTML = '';
        
        G.animations[ EditorUI.gender ].forEach( animation => {
            const animationOption = document.createElement('option');
            animationOption.setAttribute( 'value' , animation.name );
            animationOption.innerHTML = `${animation.name} ${animation.duration.toFixed(2)}s`;
            animationSelect.appendChild( animationOption );
        });
        animationSelect.addEventListener( 'change' , EditorUI.setAnimFromSelector );
        
        /* Mood Selector */
        const moodSelect = document.getElementById('Mood');
        moodSelect.addEventListener( 'change' , EditorUI.setAnimFromSelector );
        
        /* Morph Report */
        EditorUI.morphRangeReport = [];
        const morphPanel = document.getElementById('Morph');
        morphPanel.innerHTML = '';

        const resetMorphs = document.createElement( 'button' );
        resetMorphs.innerHTML = 'Reset';
        resetMorphs.addEventListener( 'click' , (e) => {
            G.character[0].morphSet.forEach( morph => {
                morph.target = 0;
            });
        });
        morphPanel.appendChild( resetMorphs );  
        
        const morphMode = document.createElement( 'button' );
        morphMode.innerHTML = 'Edit';
        morphMode.addEventListener( 'click' , (e) => {
            EditorUI.morphReport = EditorUI.morphReport === 'report' ? 'edit' : 'report';
            e.target.innerHTML = EditorUI.morphReport === 'report' ? 'Edit' : 'Report';
        });
        morphPanel.appendChild( morphMode );
        
        for( let morph in G.character[0].morphs ) {
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
                G.character[0].setInfluence( morph , e.target.value , 2 );
            });
            EditorUI.morphRangeReport.push( range );
            row.appendChild( range );
            morphPanel.appendChild( row );
        }
        EditorUI.setAnimFromSelector();
    },
    
    setAnimFromSelector: () => {
        const animationSelect = document.getElementById('Animation');
        G.character[0].setAnimation( animationSelect.value );
        const moodSelect = document.getElementById('Mood');
        G.character[0].setMood( moodSelect.value );
    }
    

}