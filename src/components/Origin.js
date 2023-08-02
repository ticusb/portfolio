import React from 'react';
import "./styles/Origin.css";

const Origin = () => {
    return (
        <div className="Origin" id="Origin">
            <h1 className='Origin-Header'>Country of<br/> Origin</h1>
            <p className='facts'>So basically, I'm from Alaska, I play Rocket League, and love the Minions.</p>
            <div className='img-group'>
                <img id="RL-img" src='img/RL_Octane.png' alt='Rocket League Car' />
                <img id="Minion-img" src='img/Minion_Kevin.png' alt='Kevin' />
            </div>
            <p className='career'>I also like to consider myself a developer. I'm not a phony I promise.</p>

        </div>
    );
}

export default Origin;