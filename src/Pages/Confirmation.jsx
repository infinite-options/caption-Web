
import React, {useState, useContext} from 'react'
import ReactCodeInput from "react-code-input";
import {Link} from "react-router-dom";
import "../Styles/Confirmation.css";
import {LandingContext} from "../App";
import { Button } from '../Components/Button';
import {useHistory} from "react-router-dom";
import axios from "axios";
export default function Confirmation(){
    const [temp, setTemp]=useState("");
    const {host, email} = useContext(LandingContext);
    const [input, setInput]=useState("");
    const [destination, setDestination] = useState("/waiting");
    const [correct, setCorrect] = useState(true);
    const answer = String("333");
    const history = useHistory();
    function changeTemp(e) {
        setTemp(e);
    }
    const handleValueInput = (e) => {
        console.log(input);
        setInput(temp);
        console.log(input);
        const postURL =
                "https://bmarz6chil.execute-api.us-west-1.amazonaws.com/dev/api/v2/checkEmailValidationCode";
        const payload = {
                email: email,
                code: temp
        };
        
        axios.post(postURL, payload).then((res) => {
            console.log(res.data.message);
            console.log(res);
            console.log(temp + " " + email);
            if (res.data.message==="Email has been verified") {
                console.log("email is verified")
                    //exists = true;
                
                console.log("Inside confirming call" + correct)
                    //correct = true
                    //console.log("Inside confirming call" + correct)
                history.push('/waiting');
            }
            else {
                setCorrect(false);
            }
        })
        
        console.log("after confirming" + correct);
        console.log(correct);
        setCorrect(true);
        console.log(correct);
      };
    // function check() {
    //     //var exists = false;
    //     const postURL =
    //             "https://bmarz6chil.execute-api.us-west-1.amazonaws.com/dev/api/v2/checkEmailValidationCode";
    //     const payload = {
    //             email: email,
    //             code: temp
    //     };
    //     function confirming() {
    //         axios.post(postURL, payload).then((res) => {
    //             console.log(res.data.message);
    //             console.log(res);
    //             console.log(temp + " " + email);
    //             if (res.data.message==="Email has been verified") {
    //                 console.log("email is verified")
    //                 //exists = true;
    //                 setCorrect(true);
    //                 console.log("Inside confirming call" + correct)
    //                 //correct = true
    //                 //console.log("Inside confirming call" + correct)
    //             }
    //         })
    //     }
    //     confirming(); 
    //     console.log("after confirming" + correct);
    //     //return exists;
    // }

        return (
            <div class = "header">
                <h1>Confirmation Page</h1>
                <h5>Please enter the code you got in the Email</h5>
                
                
                <h3 class="try">{(!correct) ? "Try Again" : null}</h3>
                {(input!==answer)?<div>
                    <ReactCodeInput type='text' fields={3}  onChange={(e) => changeTemp(e)}/>
                </div>:null}
                <button
                    onClick = {e=>handleValueInput(temp)}
                >
                    Submit
                </button>
               
                

            </div>
        )
}