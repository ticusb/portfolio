import React from 'react';
import Card from 'react-bootstrap/Card';

function Home(props) {
    return (
        <div className="container-xl grid gap-0 row-gap-3" style={{display: 'grid'}}>
                <div className='upper-home row'>
                    <div className='col-md-6'>
                        <Card
                            bg='primary'
                            key='primary'
                            text='white'
                            // style={{ width: '18rem' }}
                            className="mb-2"
                            >
                            <Card.Header>Definition</Card.Header>
                            <Card.Body>
                                <Card.Title>Ticus</Card.Title>
                                <Card.Subtitle>ti·cus | \&#39;tē-kuss\</Card.Subtitle>
                                <ol className="definitions">
                                    <li> <Card.Text>the cooliest mf to ever face the stars.</Card.Text></li>
                                    <li><Card.Text>A person characterized by their unreachable level of swag. One who talks the talk, walks the walk, and sucks the cock. Distinguishable by their eminating surrounding aura.</Card.Text></li>
                                </ol>
                            </Card.Body>
                        </Card>
                    </div>
                    <div className='col-md-6'>
                        <img src="/img/DSCN1807.JPG" className="img-fluid rounded " alt="..."/>
                    </div>
                </div>
                <div className='row justify-content-center'>
                    <div className='col-auto'>
                        <button type="button" className="btn btn-lg btn-outline-primary" href="/Origin">learn more</button>
                    </div>
                </div>
        </div>
    );
}

export default Home;