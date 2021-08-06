import React, {useContext, useEffect, useState} from "react";
import Pic from "../Assets/sd.jpg";
import Countdown from "react-countdown";
import {Row, Col, Card} from "reactstrap";
import Form from "../Components/Form";
import {Button} from "../Components/Button";
// import "../Styles/Scoreboard.css";
import "../Styles/Page.css";
import background from "../Assets/temp.png";

//Documentation for the CountdownCircleTimer component
//https://github.com/vydimitrov/react-countdown-circle-timer#props-for-both-reactreact-native
import {CountdownCircleTimer} from "react-countdown-circle-timer";
import axios from "axios";
import {LandingContext} from "../App";
import Bubbles from "../Components/Bubbles";

export default function Page() {

    const {code, roundNumber, host, playerUID} = useContext(LandingContext);

    const [caption, setCaption] = useState("");
    const [imageSrc, setImageSrc] = useState("");

    const [captionSubmitted, setCaptionSubmitted] = useState(false);
    const [roundHasStarted, setRoundHasStarted] = useState(false);
    const [timerDuration, setTimerDuration] = useState(-1);
    const [waitingPlayers, setWaitingPlayers] = useState([]);

    const [roundStartTime, setRoundStartTime] = useState();

    const startPlayingURL = "https://bmarz6chil.execute-api.us-west-1.amazonaws.com/dev/api/v2/startPlaying/";
    const getTimerURL = "https://bmarz6chil.execute-api.us-west-1.amazonaws.com/dev/api/v2/gameTimer/";
    const getImageURL = "https://bmarz6chil.execute-api.us-west-1.amazonaws.com/dev/api/v2/getImageInRound/";
    const getPlayersURL = "https://bmarz6chil.execute-api.us-west-1.amazonaws.com/dev/api/v2/getPlayersRemainingToSubmitCaption/";


    const handleCaptionChange = (newCaption) => {
        setCaption(newCaption);
    };

    function countdownComplete() {
        setCaptionSubmitted(true);
    }

    function transition() {
        window.location.href = "/selection";
        //this is not good because all internal state gets wiped whenever the page reloads
    }

    useEffect(() => {

        /**
         * Mayukh: I don't know why this works, but I am sure that the getTimer endpoint must be called after startPlaying.
         * By arranging the endpoint calls in this fashion, I am able to create a 'magical' delay that works in my favor.
         */

        if (host) {
            /**
             * Axios.Get() #1
             * Start the round
             */
            axios.get(startPlayingURL + code + "," + roundNumber).then((res) => {
                console.log(res);
                setRoundStartTime(res.data.round_start_time);
                setRoundHasStarted(true);
            })
        }


        /**
         * Axios.Get() #2
         * Receive the image url
         */
        /**
         * Issue: Sam is going to update this endpoint into a post call. Payload will demand both round number and game code.
         */
        axios.get(getImageURL + code).then((res) => {
            console.log(res);
            setImageSrc(res.data.image_url);
        })

        // /**
        //  * Axios.Get() #3
        //  * Recieve the waiting players
        //  */
        // axios.get(getPlayersURL + code + "," + roundNumber).then((res) => {
        //     console.log(res);
        //     for (var i = 0; i < res.data.players.length; i++) {
        //         waitingPlayers[i] = res.data.players[i].user_alias;
        //     }
        //     console.log("The waiting players array: " + waitingPlayers);
        // })


        /**
         * Mayukh: This is officially the worst way to synchronize any asynchronous axios code.
         */
        setTimeout(function () {
            /**
             * Axios.Get() #4
             * Determine the amount of time left on the countdown timer.
             *
             * s = the second at which the round has started
             * c = the second at which the clock is currently on
             * d = the seconds for the duration of the round
             */
            axios.get(getTimerURL + code).then((res) => {
                console.log(res);

                /**
                 * This c variable records the value of the seconds within the 'server clock'
                 * @type {number}
                 */
                let serverClock = parseInt(res.data.current_time.substring(res.data.current_time.length - 2));

                /**
                 * This c variable records the value of the seconds within the 'client clock'
                 * @type {number}
                 */
                let clientClock = new Date().getSeconds();

                var c = serverClock;
                console.log("current second = " + c);
                var s = parseInt(res.data.round_started_at.substring(res.data.round_started_at.length - 2));
                console.log("started second = " + s);
                var d = parseInt(res.data.round_duration.substring(res.data.round_duration.length - 2));
                console.log("round duration = " + d);
                setTimerDuration(d - determineLag(c, s));
                console.log(timerDuration);
            })
        }, 1000)

    }, []);

    useEffect(() => {


        setTimeout(function () {

            if (captionSubmitted) {
                /**
                 * Axios.Get() #3
                 * Recieve the waiting players
                 */
                axios.get(getPlayersURL + code + "," + roundNumber).then((res) => {
                    console.log(res);
                    for (var i = 0; i < res.data.players.length; i++) {
                        waitingPlayers[i] = res.data.players[i].user_alias;
                    }
                    console.log("The waiting players array: " + waitingPlayers);
                })
            }
        }, 2000);
    });

    function determineLag(current, start) {
        if (current - start >= 0) {
            return current - start;
        } else {
            return current + (60 - start);
        }
    }


    function postSubmitCaption() {
        const postURL = "https://bmarz6chil.execute-api.us-west-1.amazonaws.com/dev/api/v2/submitCaption";
        const payload = {
            caption: caption,
            game_code: code,
            round_number: roundNumber,
            /**
             * Issue: user_uid should be dynamic
             */
            // user_uid: "100-000014"
            user_uid:playerUID
        }

        console.log(code);

        axios.post(postURL, payload).then((res) => {
            console.log(res);
        })
    }

    function toggleTimeUp() {
        setCaptionSubmitted(!captionSubmitted);
    }

    return (
        <div
            style={{
                maxWidth: "375px",
                height: "100%",
                //As long as I import the image from my package strcuture, I can use them like so
                backgroundImage: `url(${background})`,
                // backgroundImage:
                //   "url('https://images.unsplash.com/photo-1557683325-3ba8f0df79de?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxleHBsb3JlLWZlZWR8MTZ8fHxlbnwwfHx8fA%3D%3D&w=1000&q=80')",
            }}
        >
            <div style={{padding: "20px"}}>
                <br></br>

                <h1
                    style={{
                        fontSize: "20px",
                    }}
                >
                    Name of Deck
                </h1>
                <br></br>

                <img className="centerPic" src={imageSrc} alt="Loading Image...."/>

                <br></br>
                <br></br>
                {/*{captionSubmitted ? (*/}
                {/*    <div>*/}
                {/*        <h1>You have captioned the above image as: "{caption}"</h1>*/}
                {/*        <br></br>*/}
                {/*        <Button*/}
                {/*            className="landing2"*/}
                {/*            destination="/selection"*/}
                {/*            children="Continue"*/}
                {/*        />*/}
                {/*    </div>*/}
                {/*) : (*/}
                <div>
                    {captionSubmitted ? <></> : <Form
                        className="input2"
                        field="Enter your caption here"
                        onHandleChange={handleCaptionChange}
                    />
                    }
                    <br/>

                    <Row>
                        <span style={{marginLeft: "50px"}}></span>
                        <div
                            style={{
                                background: "yellow",
                                borderRadius: "30px",
                                width: "60px",
                            }}
                        >
                            {timerDuration != -1 ? <CountdownCircleTimer
                                background="red"
                                size={60}
                                strokeWidth={5}
                                isPlaying
                                duration={timerDuration}
                                colors="#000000"
                                onComplete={transition}
                            >
                                {({remainingTime}) => (
                                    <div className="countdownText">{remainingTime}</div>
                                )}
                            </CountdownCircleTimer> : <></>}

                        </div>
                        <span style={{marginLeft: "60px"}}></span>
                        <br></br>{" "}

                        {captionSubmitted ? <Button
                            className="fat"
                            destination="/page"
                            // onClick={postSubmitCaption}
                            // onClick={toggleTimeUp}
                            children="Submitted"
                            conditionalLink={true}
                        /> : <Button
                            className="fat"
                            destination="/page"
                            onClick={postSubmitCaption}
                            onClick={toggleTimeUp}
                            children="Submit"
                            conditionalLink={true}
                        />
                        }

                    </Row>
                </div>
                {/*)}*/}
            </div>

            <br/>
            {captionSubmitted ?
                <div> Waiting for everybody to submit their captions... <Bubbles items={waitingPlayers}/></div> : <></>}
        </div>
    );
}
