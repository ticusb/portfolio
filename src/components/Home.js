import React from 'react';
import "./styles/Home.css";

const Home = () => {
    return (
        <div className="Home">
            <div className='upper-home'>
                <div className="dictionary">
                    <div className="def-intro">
                        <h1 className="title-word">ticus</h1>
                        <div className="title-subword">noun</div>
                    </div>
                    <div className="line"></div>
                    <div className="def-body">
                        <div className="pronunciation">ti·cus | \&#39;tē-kuss\</div>
                        <ol className="definitions">
                            <li>the cooliest mf to ever face the stars.</li>
                            <li>A person characterized by their unreachable level of swag. One who talks the talk, walks the walk, and sucks the cock. Distinguishable by their eminating surrounding aura.</li>
                        </ol>
                    </div>
                </div>
                <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"> <g clip-path="url(#clip0_116_139)"> <path d="M100 0L105.94 94.0603L200 100L105.94 105.94L100 200L94.0603 105.94L0 100L94.0603 94.0603L100 0Z" fill="url(#paint0_linear_116_139)"/> </g> <defs> <linearGradient id="paint0_linear_116_139" x1="20.5" y1="16" x2="100" y2="200" gradientUnits="userSpaceOnUse"> <stop stop-color="#ACAAFF"/> <stop offset="1" stop-color="#C0E8FF"/> </linearGradient> <clipPath id="clip0_116_139"> <rect width="200" height="200" fill="white"/> </clipPath> </defs> </svg>
                <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"> <g clip-path="url(#clip0_104_26)"> <path fill-rule="evenodd" clip-rule="evenodd" d="M107.143 0H92.8571V82.7556L34.3401 24.2385L24.2386 34.3401L82.7556 92.8571H0V107.143H82.7555L24.2386 165.66L34.3401 175.761L92.8571 117.244V200H107.143V117.244L165.66 175.761L175.761 165.66L117.244 107.143H200V92.8571H117.244L175.761 34.34L165.66 24.2385L107.143 82.7555V0Z" fill="url(#paint0_linear_104_26)"/> </g> <defs> <linearGradient id="paint0_linear_104_26" x1="20.5" y1="16" x2="100" y2="200" gradientUnits="userSpaceOnUse"> <stop stop-color="#ACAAFF"/> <stop offset="1" stop-color="#C0E8FF"/> </linearGradient> <clipPath id="clip0_104_26"> <rect width="200" height="200" fill="white"/> </clipPath> </defs> </svg>
                <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"> <g clip-path="url(#clip0_118_192)"> <path d="M100 0L103.215 92.2394L170.711 29.2893L107.761 96.7855L200 100L107.761 103.215L170.711 170.711L103.215 107.761L100 200L96.7855 107.761L29.2893 170.711L92.2394 103.215L0 100L92.2394 96.7855L29.2893 29.2893L96.7855 92.2394L100 0Z" fill="url(#paint0_linear_118_192)" /> </g> <defs> <linearGradient id="paint0_linear_118_192" x1="177" y1="-9.23648e-06" x2="39.5" y2="152.5" gradientUnits="userSpaceOnUse"> <stop stop-color="#B0B9FF" /> <stop offset="1" stop-color="#E7E9FF" /> </linearGradient> <clipPath id="clip0_118_192"> <rect width="200" height="200" fill="white" /> </clipPath> </defs> </svg>
            </div>
            <a className="learn-more" href="#Origin">
                <p>learn more</p>
                <svg width="210" height="44" viewBox="0 0 210 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L97.2171 41.4364C101.123 43.078 105.521 43.1032 109.446 41.5063L209 1" stroke="#969696" stroke-width="2"/>
                </svg>
            </a>
        </div>
    );
}

export default Home;