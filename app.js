import express from "express";
import { Server } from "socket.io"; // ✅ corrected
import http from "http";
import { Chess } from "chess.js";
import path from "path";

import { fileURLToPath } from "url";
import { dirname } from "path";
import { title } from "process";
import { Socket } from "dgram";
import { log } from "console";

// Required to simulate __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server); // ✅ corrected

const chess = new Chess();
let players = {};
let currentPlayer = "w";

// Setup views and static files
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index",{title:"CHESS GAME"});
});

io.on("connection",function(uniquesocket){
    console.log("connected");
  
    if(!players.white){
      players.white = uniquesocket.id;
      uniquesocket.emit("playerRole", "w")
    }
    else if(!players.black){
      players.black = uniquesocket.id;
      uniquesocket.emit("playerRole", "b")
    }
    else{
      uniquesocket.emit("spectatorRole")
    }

    uniquesocket.on("discconnect", function(){
      if (uniquesocket.id === players.white) {
        delete players.white
      }

      else if (uniquesocket.id === players.black) {
        delete players.black
      }
    })

  uniquesocket.on("move", (move)=>{
    try {
      if (chess.turn()=== "w" && uniquesocket.id != players.white) return;
      if (chess.turn()=== "b" && uniquesocket.id != players.black) return;
      const result = chess.move(move);
      if(result){
        currentPlayer = chess.turn()
        io.emit("move", move)
        io.emit("boardstate", chess.fen())
      }
      else{
        console.log("Invalid move", move);
        uniquesocket.emit("Invalid move",move)
      }
    } catch (error) {
      console.log(error);
      uniquesocket.emit("Invalid move",move)
    }
  } )

})

server.listen(3000, () => {
  console.log("Server is listening at http://localhost:3000");
});
