import React, {useContext, useEffect, useState} from "react";
import {useHistory} from 'react-router-dom';
import {Row, Col, Card} from "reactstrap";
import Form from "../Components/Form";
import {Button} from "../Components/Button";
import "../Styles/Page.css";
import background from "../Assets/temp.png";
import "bootstrap/dist/css/bootstrap.min.css";
import * as ReactBootStrap from 'react-bootstrap';
//Documentation for the CountdownCircleTimer component
//https://github.com/vydimitrov/react-countdown-circle-timer#props-for-both-reactreact-native
import {CountdownCircleTimer} from "react-countdown-circle-timer";
import axios from "axios";
import {LandingContext} from "../App";
import Bubbles from "../Components/Bubbles";
import { CookieHelper } from "../Components/CookieHelper"


export default function Page({ channel, channel_waiting, channel_joining}) {
    const { userData, cookies } = useContext(LandingContext);
    const { getCookies } = CookieHelper()
    const history = useHistory();

    // Hooks used in page
    const [caption, setCaption] = useState("");
    const [captionSubmitted, setCaptionSubmitted] = useState(false);
    const [roundHasStarted, setRoundHasStarted] = useState(false);
    const [timeUp, setTimeUp] = useState(false);
    const [timerDuration, setTimerDuration] = useState(-1);
    const [waitingPlayers, setWaitingPlayers] = useState([]);
    const [roundStartTime, setRoundStartTime] = useState();
    const [loading, setLoading] = useState(false);

    // Determine if we should display landing page (true) or loading icon (false)
    const [displayHtml, setDisplayHtml] = useState(false)

    // Endpoints used in Page
    const startPlayingURL = "https://bmarz6chil.execute-api.us-west-1.amazonaws.com/dev/api/v2/startPlaying/";
    const getTimerURL = "https://bmarz6chil.execute-api.us-west-1.amazonaws.com/dev/api/v2/gameTimer/";
    const getPlayersURL = "https://bmarz6chil.execute-api.us-west-1.amazonaws.com/dev/api/v2/getPlayersRemainingToSubmitCaption/";
    const getAllSubmittedCaptionsURL = "https://bmarz6chil.execute-api.us-west-1.amazonaws.com/dev/api/v2/getAllSubmittedCaptions/";

    
    // HOOK: useEffect()
    // DESCRIPTION: On first render, check if hooks are updated, load data from cookies if not
    useEffect(() => {
        console.log("Page cookies", cookies.userData)
         // Check if userData is empty (after refresh/new user)
         if(userData.host === "" || userData.roundNumber === "" || userData.playerUID === "" || userData.rounds === "" || userData.roundDuration === "" || userData.code === "" || userData.deckTitle === "" || userData.imageURL === "") {
            getCookies(["host", "roundNumber", "playerUID", "deckSelected", "rounds", "roundDuration", "code", "deckTitle", "imageURL", "isApi"], setDisplayHtml)
        } else
            setDisplayHtml(true)
        
    }, [])


    // HOOK: useEffect()
    // DESCRIPTION: On first render/start of round, host gets current round's start time. Also logs start time for round in database simultaneously
    useEffect(() => {
        async function pageAsyc(){
            if (userData.host) {
                // Host gets start of new round/time started from backend
                await axios.get(startPlayingURL + userData.code + "," + userData.roundNumber).then((res) => {
                    console.log("GET startPlaying", res);
                    setRoundStartTime(res.data.round_start_time);
                    setRoundHasStarted(true);
                })
            }
        }

        pageAsyc();
    }, []);



    // HOOK: useEffect()
    // DESCRIPTION: Processes how many players voted in subscribePlayersLeft(). Deals with new joining players while in round in subscribeNewPlayers()
    useEffect(() => {
        // FUNCTION: subscribePlayersLeft()
        // DESCRIPTION: Listens on ably channel for players who have voted. If new player voted, add to waitingPlayers array. If no players left to vote, transition to selection page.
        async function subscribePlayersLeft() 
        {
            await channel.subscribe(newVote => {
                console.log('Countdown on submit-caption screen: PlayersLeft = ', newVote.data.playersLeft);
                const newWaitingPlayers = [];
                for (let i = 0; i < waitingPlayers.length; i++)
                    if (waitingPlayers[i] !== newVote.data.userWhoVoted)
                        newWaitingPlayers.push(waitingPlayers[i]);

                if (newVote.data.playersLeft === 0) {
                    history.push('/selection');
                } else {
                    setWaitingPlayers(newWaitingPlayers);
                }
            });
        }
        
        subscribePlayersLeft();


        // FUNCTION: subscribeNewPlayers()
        // DESCRIPTION: Listens on ably channel for new joining players, adds them to current round.
        async function subscribeNewPlayers() 
        {
            await channel_waiting.subscribe(newPlayer => {
                async function getPlayers () {
                    console.log("Made it in getPlayers Func");

                    // Once newPlayer has joined, host publishes roundNumber and path so new player gets the correct round information. 
                    if (userData.host)
                        channel_joining.publish({data: {roundNumber: userData.roundNumber, path: window.location.pathname}});
                    
                    // Add newPlayer to waitingPlayers list
                    const temp = [newPlayer.data.newPlayerName];
                    for (const name of waitingPlayers) {
                        temp.push(name);
                    }
                    setWaitingPlayers(temp);
                }
        
                getPlayers();
            });
        }

        subscribeNewPlayers();
    

        return function cleanup() {
            channel.unsubscribe();
            channel_waiting.unsubscribe();
        };
    }, [waitingPlayers, userData.code]);


    
    // FUNCTION: postSubmitCaption()
    // DESCRIPTION: On clicking submit or time running out, submits user caption
    async function postSubmitCaption() {
        if(caption === "" && !timeUp){
            alert("Please enter a caption.")
            return
        }

        /**
         * Issue:
         * The user should not be able to select/vote for their own caption.
         * Should be easy --> match internal state with info in the endpoint result.
         */
        await axios.get(getAllSubmittedCaptionsURL + userData.code + "," + userData.roundNumber).then((res) => {
            console.log('page_get_res before post = ', res);
        });

        setCaptionSubmitted(true);
        setLoading(true)
        const postURL = "https://bmarz6chil.execute-api.us-west-1.amazonaws.com/dev/api/v2/submitCaption";
        const payload = {
            caption: caption,
            game_code: userData.code.toString(),
            round_number: userData.roundNumber.toString(),
            user_uid: userData.playerUID.toString()
        }

        await axios.post(postURL, payload).then((res) => {
            console.log('POST Submit Caption', res);
        });

        await axios.get(getAllSubmittedCaptionsURL + userData.code + "," + userData.roundNumber).then((res) => {
            console.log('page_get_res after = ', res);
        });

        console.log('payload = ', payload);

        await axios.get(getPlayersURL + userData.code + "," + userData.roundNumber).then((res) => {
            console.log('res.data.players = ', res.data.players);
            pub(res.data.players.length);
        })
    }


    function toggleTimeUp() {
        setTimeUp(true);
    }


    // Publish amount of players who haven't submitted, and who voted
    const pub = (playerCount) => {
        console.log('In pub function with playerCount == ', playerCount);
        channel.publish({data: {playersLeft: playerCount, userWhoVoted: userData.alias}});
    };

    

    return (
        displayHtml ? 
            // Caption page HTML
            <div
                style={{
                    maxWidth: "375px",
                    height: "100%",
                    backgroundImage: `url(${background})`,
            }}>
                <div style={{padding: "20px"}}>
                    <br></br>

                    <h1>
                        {userData.deckTitle}
                    </h1>
                    <br></br>
                    <h3>Round: {userData.roundNumber}/{userData.rounds}</h3>
                    {/* <p>URL: {userData.imageURL}</p>
                    <p>RoundDuration: {userData.roundDuration}</p> */}
                    <br></br>
                    
                    <img className="centerPic" src={userData.imageURL} alt="Loading Image...."/>

                    <br></br>
                    <br></br>

                    <div>
                        {captionSubmitted ?
                        <></> : 
                            <Form
                                className="input2"
                                field="Enter your caption here"
                                onHandleChange={newCaption => setCaption(newCaption)}
                                onHandleSubmit={(caption) => {
                                    console.log('setting caption and submitting');
                                    setCaption(caption);
                                    postSubmitCaption();
                                }}
                            />
                        }
                        <br/>

                        {/* <Row> */}
                    <div 
                        style = {{
                            display: 'flex', 
                            justifyContent: 'center', 
                            paddingBottom: '20px', 
                        }}
                    >
                            <div style={{
                                    background: "yellow",
                                    borderRadius: "30px",
                                    width: "60px",
                                }}
                            >
                                {/* TO DO: prevent users from refreshing to get new 30 sec*/}
                                {userData.roundDuration !== undefined ?
                                <CountdownCircleTimer
                                        background="blue"
                                        size={60}
                                        strokeWidth={5}
                                        isPlaying
                                        duration={userData.roundDuration}
                                        // duration={userData.roundDuration}
                                        colors="#000000"
                                        onComplete={() => {
                                            toggleTimeUp()
                                            pub(0)
                                        }}
                                    >
                                        {({remainingTime}) => {
                                                if (remainingTime === 0)
                                                    pub(0);
                                                return (<div className="countdownText">{remainingTime}</div>);
                                            }
                                        }
                                </CountdownCircleTimer> : <></>}

                                
                                
                                {/* {updateComplete !== "" ? <CountdownCircleTimer
                                        background="red"
                                        size={60}
                                        strokeWidth={5}
                                        isPlaying
                                        duration={userData.roundDuration}
                                        colors="#000000"
                                        onComplete={() => {
                                            toggleTimeUp()
                                            //postSubmitCaption()
                                        }}
                                    >
                                        {({remainingTime}) => {

                                                if (remainingTime === 0)
                                                    pub(0);
                                                return (<div className="countdownText">{remainingTime}</div>);
                                            }
                                        }
                                </CountdownCircleTimer> : <></>} */}
                            </div>
                    </div>
                            {/* <span style={{marginLeft: "60px"}}></span>
                            <br></br>{" "} */}

                            {captionSubmitted ? <Button
                                className="fat"
                                destination="/page"
                                // onClick={postSubmitCaption}
                                // onClick={toggleCaptionSubmitted}
                                children="Submitted"
                                conditionalLink={true}
                            /> : <Button
                                className="fat"
                                destination="/page"
                                onClick={postSubmitCaption}
                                children="Submit"
                                conditionalLink={true}
                            />
                            }

                        {/* </Row> */}
                    </div>
                    {/*)}*/}
                </div>

                <br/>

                {/*Issue:*/}
                {/* This Bubble component is not optimal for rendering the information in real time --> look at the code in Waiting.jsx for reference.*/}
                {captionSubmitted ?
                    <div> Waiting for everybody to submit their captions... <Bubbles items={waitingPlayers}/></div> : <></>}


                {/* {timeUp && host ?
                    <Button
                        className="landing"
                        children="continue"
                        destination="/selection"
                        conditionalLink={true}
                    />
                    : <></>} */}
            </div>:
            // Loading icon HTML
            <div>
                <h1>Loading game data...</h1>
                <ReactBootStrap.Spinner animation="border" role="status"/>
            </div>
    );
}