import React, {useContext} from "react";
import axios from "axios";
import Form from "../Components/Form";
import {Button} from "../Components/Button.jsx";
import background from "../Assets/landing.png";
import "../Styles/Landing.css";
import {LandingContext} from "../App";

export default function Landing({setCode, setName, setAlias, setEmail, setZipCode, setGameUID, setHost, setPlayerUID, client}) {

    const {code, name, alias, email, zipCode, host} = useContext(LandingContext);

    const handleCodeChange = (codeInput) => {
        setCode(codeInput);
    };

    const handleNameChange = (nameInput) => {
        setName(nameInput);
    };

    const handleEmailChange = (emailInput) => {
        setEmail(emailInput);
    };

    const handleZipCodeChange = (zipCodeInput) => {
        setZipCode(zipCodeInput);
    };

    const handleAliasChange = (aliasInput) => {
        setAlias(aliasInput);
    };

    function validateInputToCreateGame() {
        return (name !== "" && email !== "" && zipCode !== "" && alias !== "");
    }

    function validateInputToJoinGame() {
        return (code !== "" && validateInputToCreateGame());
    }

    async function createGame() {
        if (validateInputToCreateGame()) {
            const postURL =
                "https://bmarz6chil.execute-api.us-west-1.amazonaws.com/dev/api/v2/createNewGame";
            const payload = {
                user_name: name,
                user_alias: alias,
                user_email: email,
                user_zip: zipCode,
            };

            await axios.post(postURL, payload).then((res) => {
                console.log(res);
                setCode(res.data.game_code);
                setPlayerUID(res.data.host_id);
                pub(res.data.game_code);
            });

            setHost(true);
        } else {
            window.alert("To create a game, fill out the necessary information");
        }
    }

    const pub = (game_code) => {
        const channel = client.channels.get(`Captions/Waiting/${game_code}`);
        channel.publish({data: {newPlayerName: alias}});
    };

    function joinGame() {
        if (validateInputToJoinGame()) {
            const postURL =
                "https://bmarz6chil.execute-api.us-west-1.amazonaws.com/dev/api/v2/joinGame";

            const payload = {
                user_name: name,
                user_alias: alias,
                user_email: email,
                user_zip: zipCode,
                game_code: code,
            };

            axios.post(postURL, payload).then((res) => {
                console.log(res);
                setGameUID(res.data.game_uid);
                setPlayerUID(res.data.user_uid);
                pub(code);


                try {
                    if (res.data.message === "Invalid game code") {
                        console.log("Looks like an invalid game code. Time to send you to the error screen");

                        window.location.href = "/error";
                    } else {
                        console.log("Else within try clause: No error message. Game on!");
                        setGameUID(res.data.game_uid);
                    }
                } catch {
                    console.log("Catch Clause: No error message. Game on!");
                }
            })

            setHost(false);

        } else {
            window.alert("To join a game, fill out the necessary information and the correct gamecode.");
        }
    }

    return (
        <div
            style={{
                maxWidth: "375px",
                height: "812px",
                backgroundImage: `url(${background})`,
            }}
        >
            <div className="spacer"/>

            <Form
                className="input1"
                field="Your Name"
                onHandleChange={handleNameChange}
            />
            <br></br>
            <Form
                className="input1"
                field="Email Address"
                onHandleChange={handleEmailChange}
            />
            <br></br>
            <Form
                className="input1"
                field="Zip Code"
                onHandleChange={handleZipCodeChange}
            />
            <br></br>
            <Form
                className="input1"
                field="Alias (screen name)"
                onHandleChange={handleAliasChange}
            />
            <br></br>
            <br></br>

            <Button
                isSelected={true}
                onClick={createGame}
                className="landing"
                destination="/waiting"
                children="Create New Game"
                conditionalLink={validateInputToCreateGame()}
            />
            <div className="middleText">OR</div>
            <Form
                className="input1"
                field="Enter Game Code"
                onHandleChange={handleCodeChange}
            />
            <br></br>
            <Button
                isSelected={true}
                onClick={joinGame}
                className="landing"
                destination="/waiting"
                children="Join Game"
                conditionalLink={validateInputToJoinGame()}
            />

        </div>
    );
}


