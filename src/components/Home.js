import React from 'react';
import Card from 'react-bootstrap/Card';

const Home = () => {
    return (
        <div class="container-xl">
            <button type="button" class="btn btn-primary">Primary</button>
            <div className='upper-home'>
                 <Card
                    bg='light'
                    key='light'
                    text='primary'
                    style={{ width: '18rem' }}
                    className="mb-2"
                    >
                    <Card.Header>Header</Card.Header>
                    <Card.Body>
                        <Card.Title>Ticus</Card.Title>
                        <Card.Subtitle>ti·cus | \&#39;tē-kuss\</Card.Subtitle>
                        <Card.Text>
                            <ol className="definitions">
                                <li>the cooliest mf to ever face the stars.</li>
                                <li>A person characterized by their unreachable level of swag. One who talks the talk, walks the walk, and sucks the cock. Distinguishable by their eminating surrounding aura.</li>
                            </ol>
                        </Card.Text>
                    </Card.Body>
                </Card>
            </div>
            <a className="learn-more" href="#Origin">
                <p class="bs-primary text-primary primary">learn more</p>
                <svg width="210" height="44" viewBox="0 0 210 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L97.2171 41.4364C101.123 43.078 105.521 43.1032 109.446 41.5063L209 1" stroke="#969696" stroke-width="2"/>
                </svg>
            </a>
        </div>
    );
}

export default Home;