import { useState, useEffect,useRef } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { useCookies } from 'react-cookie'
import { ably, getScoreBoard, getNextImage } from "../util/Api"
import "../styles/ScoreBoard.css"

export default function ScoreBoard(){
    const navigate = useNavigate(), location = useLocation()
    const [userData, setUserData] = useState(location.state)
    const [cookies, setCookie] = useCookies(["userData"])
    const channel = ably.channels.get(`BizBuz/${userData.gameCode}/${userData.roundNumber}`)
    const [scoreBoard, setScoreBoard] = useState([])
    const isGameEnded = useRef(false)
    const [isScoreBoard, setisScoreBoard] = useState(false)
    if(scoreBoard.length === 0 && cookies.userData.scoreBoard != undefined){
        setScoreBoard(cookies.userData.scoreBoard)
    }

    useEffect(() => {
        if(!isScoreBoard && userData.host && cookies.userData.scoreBoard === undefined){
            async function setScoreBoard() {
                const scoreBoard = await getScoreBoard(userData)
                scoreBoard.sort((a, b) => b.votes - a.votes)
                setisScoreBoard(true)
                channel.publish({
                    data: {
                        message: "Set ScoreBoard",
                        scoreBoard: scoreBoard
                }})
            }
            setScoreBoard()
        }
    }, [userData,isScoreBoard])

    function closeButton() {
        channel.publish({
            data: {
                message: "EndGame scoreboard"
            }
        })
    }
    async function nextRoundButton() {
        const nextRound = userData.roundNumber + 1
        const imageURL = await getNextImage(userData.gameCode, nextRound)
        channel.publish({data: {
                message: "Start Next Round",
                roundNumber: nextRound,
                imageURL: imageURL
        }})
    }

    function finalScoresButton(){
        channel.publish({data: {message: "Start EndGame"}})
    }

    useEffect(() => {
        channel.subscribe( async event => {
            if(event.data.message === "Set ScoreBoard"){
                const updatedUserData = {
                    ...userData,
                    scoreBoard: event.data.scoreBoard
                }
                const updatedEndUserData = {
                    ...userData,
                    scoreBoardEnd: event.data.scoreBoard
                }
                setUserData(updatedEndUserData)
                setCookie("userData", updatedUserData, {path: '/'})
                setScoreBoard(event.data.scoreBoard)
            }
            else if (event.data.message === "Start Next Round") {
                const updatedUserData = {
                    ...userData,
                    roundNumber: event.data.roundNumber,
                    imageURL: event.data.imageURL
                }
                setUserData(updatedUserData)
                setCookie("userData", updatedUserData, {path: '/'})
                navigate("/Caption", {state: updatedUserData})
            }
            else if(event.data.message === "Start EndGame"){
                navigate("/EndGame", {state: userData})
            }
        })
    })
    
    useEffect(() => {
        channel.subscribe(async event => {
            if (event.data.message === "EndGame scoreboard") {
                const updatedUserData = {
                    ...userData,
                    scoreBoard: scoreBoard
                }
                setCookie("userData", updatedUserData, {path: '/'})
                if (!userData.host && !isGameEnded.current)  {
                    console.log("sb")
                    isGameEnded.current = true
                    alert("Host has Ended the game")
                }
                navigate("/EndGame", { state: updatedUserData })
            }
        })
    }, [scoreBoard])

    return(
        <div className="scoreboard">
            {userData.host &&
                < Link onClick={() => { window.confirm( 'Are you sure you want to end this game?', ) && closeButton() }} className ="closeBtn">
                    <i className="fa" >&#xf00d;</i>
                </Link>
            }
            <div className="textScoreBoard">
                <br/>
                <h1>
                    {userData.deckTitle}
                </h1>
                <h2>
                    Scoreboard
                </h2>
                <h5>
                    Round: {userData.roundNumber}/{userData.numOfRounds}
                </h5>
            </div>
            <br/>
            <img className="imgScoreBoard" src={userData.imageURL}/>
            <br/>
            <div className="headerScoreBoard">
                <div>Alias</div>
                <div>Votes</div>
                <div>Points</div>
                <div>Total</div>
            </div>
            {scoreBoard.map((player, index) => {
                return(
                    <div key={index}>
                        <div className="valuesScoreBoard">
                            <div>{player.user_alias}</div>
                            <div>{player.votes}</div>
                            <div>{player.score}</div>
                            <div>{player.game_score}</div>
                        </div>
                        {player.caption !== "" &&
                            <div className="captionScoreBoard">{player.caption}</div>
                        }
                        {player.caption === "" &&
                            <div className="captionScoreBoard">&nbsp;</div>
                        }
                    </div>
                )})
            }
            <br/>
            {userData.host && userData.roundNumber !== userData.numOfRounds &&
                <button className="buttonScoreBoard" onClick={nextRoundButton}>
                    Next Round
                </button>
            }
            {userData.host && userData.roundNumber === userData.numOfRounds &&
                <button className="buttonScoreBoard" onClick={finalScoresButton}>
                    Show Final Scores
                </button>
            }
            <br/>
        </div>
    )
}