import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useCookies } from 'react-cookie'
import {getSubmittedCaptions, getUpdatedScores, postVote} from "../util/Api"
import { CountdownCircleTimer } from "react-countdown-circle-timer"
import "../styles/Vote.css"

export default function Vote(){
    const navigate = useNavigate(), location = useLocation()
    const [userData, setUserData] = useState(location.state)
    const [cookies, setCookie] = useCookies(["userData"])
    const [submittedCaptions, setSubmittedCaptions] = useState([])
    const [toggleCaptions, setToggleCaptions] = useState([])
    const [isMyIndex, setIsMyIndex] = useState(-1)
    const [voteSubmitted, setVoteSubmitted] = useState(false)
    const backgroundColors = { default: "white", selected: "#f9dd25", myButton: "gray" }

    function getBackgroundColor(status){
        return backgroundColors[status]
    }

    useEffect( () => {
        async function getCaptions(){
            const submittedCaptions = await getSubmittedCaptions(userData)
            if(submittedCaptions.length <= 1)
                voteButton(true)
            setSubmittedCaptions(submittedCaptions)
            initializeToggleArray(submittedCaptions)
        }
        getCaptions()
    }, [userData])

    function initializeToggleArray(submittedCaptions){
        let tempArray = []
        for(let i = 0; i < submittedCaptions.length; i++){
            if(submittedCaptions[i].round_user_uid === userData.playerUID){
                setIsMyIndex(i)
            }
            tempArray.push(false)
        }
        setToggleCaptions(tempArray)
    }

    function updateToggleArray(index){
        if(isMyIndex === index)
            return
        let tempArray = []
        for(let i = 0; i < submittedCaptions.length; i++){
            if(i === index){
                tempArray.push(true)
            }
            else{
                tempArray.push(false)
            }
        }
        setToggleCaptions(tempArray)
    }

    function renderCaptions(){
        const captionElements = submittedCaptions.map((player, index) => {
            let status = ""
            if(player.round_user_uid === userData.playerUID){
                status = "myButton"
            }
            else if(toggleCaptions[index] === true){
                status = "selected"
            }
            else{
                status = "default"
            }
            return(
                <div key={index}>
                    <button
                        style={{backgroundColor: getBackgroundColor(status)}}
                        className="buttonVote"
                        onClick={event => updateToggleArray(index)}
                    >
                        {player.caption}
                    </button>
                    <br/>
                    <br/>
                </div>
            )
        })
        return captionElements
    }

    async function voteButton(timerComplete){
        let hasVoted = false
        for(let i = 0; i < toggleCaptions.length; i++){
            if(toggleCaptions[i] === true){
                hasVoted = true
                setVoteSubmitted(true)
                await postVote(submittedCaptions[i].caption, userData)
                await getUpdatedScores(userData)
            }
        }
        if(!hasVoted && !timerComplete){
            alert("Please vote for a caption.")
            return
        }
        navigate("/ScoreBoard", { state: userData })
    }

    return(
        <div className="vote">
            <h1 className="titleCaption">
                {userData.deckTitle}
            </h1>
            <h3 className="roundCaption">
                Round: {userData.roundNumber}/{userData.numOfRounds}
            </h3>
            <br/>
            <h4 className="favoriteVote">Vote your favorite caption</h4>
            <br/>
            <img className="imgVote" src={userData.imageURL}/>
            <br/>
            <div className="captionsContainerVote">
                {renderCaptions()}
            </div>
            <div className="timerContainerVote">
                <CountdownCircleTimer
                    size={60}
                    strokeWidth={5}
                    isPlaying
                    duration={userData.roundTime}
                    colors="#000000"
                    onComplete={() => {
                        //voteButton(true)
                    }}
                >
                    {({remainingTime}) => {
                        return (<div className="countdownVote">{remainingTime}</div>);
                    }}
                </CountdownCircleTimer>
            </div>
            {!voteSubmitted &&
                <button className="submitVote" onClick={event => voteButton(false)}>
                    Vote
                </button>
            }
            {voteSubmitted &&
                <div className="submittedVote">
                    <br/>
                    <b>Vote submitted.</b>
                    <br/>
                    Waiting for other players to submit votes...
                </div>
            }
            <br/>
        </div>
    )
}