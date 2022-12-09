import axios from "axios"
import Ably from "ably/callbacks";

const ably_api_key = "KdQRaQ.Xl1OGw:yvmvuVmPZkzLf3ZF"
const ably = new Ably.Realtime(ably_api_key)

const checkGameURL = "https://bmarz6chil.execute-api.us-west-1.amazonaws.com/dev/api/v2/checkGame"
const addUserURL = "https://bmarz6chil.execute-api.us-west-1.amazonaws.com/dev/api/v2/addUser"
const createGameURL = "https://bmarz6chil.execute-api.us-west-1.amazonaws.com/dev/api/v2/createGame"
const joinGameURL = "https://bmarz6chil.execute-api.us-west-1.amazonaws.com/dev/api/v2/joinGame"
const decksURL = "https://bmarz6chil.execute-api.us-west-1.amazonaws.com/dev/api/v2/decks"
const selectDeckURL = "https://bmarz6chil.execute-api.us-west-1.amazonaws.com/dev/api/v2/selectDeck"
const postAssignDeckURL = "https://bmarz6chil.execute-api.us-west-1.amazonaws.com/dev/api/v2/assignDeck"
const getPlayersURL = "https://bmarz6chil.execute-api.us-west-1.amazonaws.com/dev/api/v2/getPlayers/"
const getImageURL = "https://bmarz6chil.execute-api.us-west-1.amazonaws.com/dev/api/v2/getImageForPlayers/"
const getUniqueImageInRoundURL = "https://bmarz6chil.execute-api.us-west-1.amazonaws.com/dev/api/v2/getUniqueImageInRound/"
const submitCaptionURL = "https://bmarz6chil.execute-api.us-west-1.amazonaws.com/dev/api/v2/submitCaption"
const getAllSubmittedCaptionsURL = "https://bmarz6chil.execute-api.us-west-1.amazonaws.com/dev/api/v2/getAllSubmittedCaptions/"
const postVoteCaptionURL = "https://bmarz6chil.execute-api.us-west-1.amazonaws.com/dev/api/v2/voteCaption"
const getUpdateScoresURL = "https://bmarz6chil.execute-api.us-west-1.amazonaws.com/dev/api/v2/updateScores/"
const getScoreBoardURL = "https://bmarz6chil.execute-api.us-west-1.amazonaws.com/dev/api/v2/getScoreBoard/";

async function checkGameCode(gameCode){
    const codeStatus = await axios.get(checkGameURL + '/' + gameCode)
    if(codeStatus.data.warning === "Invalid game code") {
        alert("Please enter a valid game code.")
        return false
    }
    return true
}

async function getPlayerUID(userData) {
    const payload = {
        user_name: userData.name,
        user_email: userData.email,
        user_zip: userData.zipCode,
        user_alias: userData.alias
    }
    const playerUID = await axios.post(addUserURL, payload)
        .then(response => response.data.user_uid)
    return playerUID
}

async function createGame(userData, numOfRounds, roundTime){
    const payload = {
        user_uid: userData.playerUID,
        rounds: numOfRounds,
        round_time: "00:00:" + roundTime,
        scoring_scheme: "V"
    }
    const gameInfo = await axios.post(createGameURL, payload)
        .then(response => response.data)
    return gameInfo
}

async function joinGame(userData){
    const payload = {
        game_code: userData.gameCode,
        user_uid: userData.playerUID
    }
    await axios.post(joinGameURL, payload)
    return
}

async function getDecks(playerUID){
    const decksInfo = await axios.get(decksURL + "/" + playerUID + "," + "true")
        .then(response => response.data.decks_info)
    return decksInfo
}

async function getPlayers(gameCode){
    const players = await axios.get(getPlayersURL + gameCode)
        .then(response => response.data.players_list)
    return players
}

async function selectDeck(deckUID, gameCode, roundNumber){
    const payload = {
        game_code: gameCode.toString(),
        deck_uid: deckUID.toString(),
        round_number: roundNumber.toString()
    }
    await axios.post(selectDeckURL, payload)
    return
}

async function assignDeck(deckUID, gameCode){
    const payload = {
        deck_uid: deckUID,
        game_code: gameCode
    }
    await axios.post(postAssignDeckURL, payload)
    return
}

async function getDatabaseImage(gameCode, roundNumber){
    const imageURL = await axios.get(getUniqueImageInRoundURL + gameCode + "," + roundNumber)
        .then(response => response.data.image_url)
    return imageURL
}

async function getApiImage(deckUID, gameCode){

}

async function submitCaption(caption, userData){
    const payload = {
        caption: caption,
        user_uid: userData.playerUID,
        game_code: userData.gameCode,
        round_number: userData.roundNumber.toString()
    }
    await axios.post(submitCaptionURL, payload)
    return
}

async function getSubmittedCaptions(userData) {
    const submittedCaptions = await axios.get(getAllSubmittedCaptionsURL + userData.gameCode + "," + userData.roundNumber)
        .then(response => response.data.players)
    return submittedCaptions
}

async function postVote(caption, userData){
    const payload = {
        caption: caption,
        user_id: userData.playerUID,
        game_code: userData.gameCode,
        round_number: userData.roundNumber.toString()
    }
    console.log("postVote payload: ", payload)
    await axios.post(postVoteCaptionURL, payload)
    return
}

async function getUpdatedScores(userData){
    await axios.get(getUpdateScoresURL + userData.gameCode + "," + userData.roundNumber)
    return
}

async function getScoreBoard(userData){
    await axios.get(getScoreBoardURL + userData.gameCode + "," + userData.roundNumber)
        .then(response => response.data.scoreboard)
}

export { ably, checkGameCode, getPlayerUID, createGame, joinGame,
    getDecks, selectDeck, assignDeck, getDatabaseImage, getApiImage,
    getPlayers, submitCaption, getSubmittedCaptions, postVote, getUpdatedScores,
    getScoreBoard }
