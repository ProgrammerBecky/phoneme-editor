import { G } from './G.js';

export const EditorUI = {

    morphRangeReport: [],
    gender: 'female',
    morphReport: 'report',

    buildAnimationSelector: () => {
        const animationSelect = document.getElementById('Animation');
        animationSelect.innerHTML = '';
        
        G.animations[ EditorUI.gender ].forEach( animation => {
            const animationOption = document.createElement('option');
            animationOption.setAttribute( 'value' , animation.name );
            animationOption.innerHTML = `${animation.name} ${animation.duration.toFixed(2)}s`;
            animationSelect.appendChild( animationOption );
        });
        animationSelect.addEventListener( 'change' , EditorUI.setAnimFromSelector );
        
        const moodSelect = document.getElementById('Mood');
        moodSelect.addEventListener( 'change' , EditorUI.setAnimFromSelector );
        
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
        console.log( EditorUI.morphRangeReport );
        EditorUI.setAnimFromSelector();
    },
    
    setAnimFromSelector: () => {
        const animationSelect = document.getElementById('Animation');
        G.character[0].setAnimation( animationSelect.value );
        const moodSelect = document.getElementById('Mood');
        G.character[0].setMood( moodSelect.value );
    }
    

}