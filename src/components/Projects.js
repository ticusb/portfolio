import React from 'react';
import "./styles/Projects.css";

const Projects = () => {
    return (
        <div className="Projects" id="Projects">
            <h1>PROJECTS:</h1>
            <div class="gallery">
                <div class="card">
                    <img src="https://img.freepik.com/free-photo/view-brightly-colored-frog-nature_23-2150453188.jpg?t=st=1690923356~exp=1690926956~hmac=97ad5295389b8fb199eade72f8202da8718c82478a7dc908319337ecf087da32&w=740" alt=""/>
                    <div class="description">
                        <h1>Password Manager</h1>
                        <p> Lorem ipsum, dolor sit amet consectetur adipisicing elit. Ex hic corporis animi harum? Nisi quis ipsum laborum a animi perspiciatis assumenda quae deserunt porro, soluta voluptatum molestiae. Eveniet, aliquam! Mollitia? </p>
                    </div>
                </div>
                
                <div class="card">
                    <img src="https://img.freepik.com/free-photo/closeup-scarlet-macaw-from-side-view-scarlet-macaw-closeup-head_488145-3540.jpg?w=740&t=st=1690923465~exp=1690924065~hmac=a230363a80cbf41df269f31c16fcd8e71578abf67978c8bde86778418efc84b3" alt=""/>
                    <div class="description">
                        <h1>Tour Site</h1>
                        <p> Lorem ipsum, dolor sit amet consectetur adipisicing elit. Ex hic corporis animi harum? Nisi quis ipsum laborum a animi perspiciatis assumenda quae deserunt porro, soluta voluptatum molestiae. Eveniet, aliquam! Mollitia? </p>
                    </div>
                </div>
                
                <div class="card">
                    <img src="https://img.freepik.com/free-photo/cute-chameleon-plant_23-2148949385.jpg?w=740&t=st=1690923632~exp=1690924232~hmac=afd9249fb2cef3108f531e22ff61e1c343e4eca137ca3dd5a1100fdd1f825a5e" alt=""/>
                    <div class="description">
                        <h1>Movie Reviewer</h1>
                        <p> Lorem ipsum, dolor sit amet consectetur adipisicing elit. Ex hic corporis animi harum? Nisi quis ipsum laborum a animi perspiciatis assumenda quae deserunt porro, soluta voluptatum molestiae. Eveniet, aliquam! Mollitia? </p>
                    </div>
                </div>
  
            </div>

        </div>
    );
}

export default Projects;