import { Box, ChakraProvider } from "@chakra-ui/react";
import { useState } from "react";
import JoinScreen from "./components/JoinScreen";
import RoomList from "./components/RoomList";
import ChatBox from "./components/ChatBox";

// Three screens: "join" → "rooms" → "chat"
function App() {
  const [screen, setScreen] = useState("join");
  const [user, setUser] = useState(null);       // { userId, username }
  const [activeRoom, setActiveRoom] = useState(null);
  const [socket, setSocket] = useState(null);

  const handleJoin = (userData) => {
    setUser(userData);
    setScreen("rooms");
  };

  const handleJoinRoom = (room, socketInstance) => {
    setActiveRoom(room);
    setSocket(socketInstance);
    setScreen("chat");
  };

  const handleLeaveRoom = () => {
    setActiveRoom(null);
    setScreen("rooms");
  };

  return (
    <ChakraProvider>
      <Box w="100vw" minH="100vh">
        {screen === "join" && (
          <JoinScreen onJoin={handleJoin} />
        )}
        {screen === "rooms" && user && (
          <RoomList user={user} onJoinRoom={handleJoinRoom} />
        )}
        {screen === "chat" && user && activeRoom && socket && (
          <ChatBox
            user={user}
            room={activeRoom}
            socket={socket}
            onLeave={handleLeaveRoom}
          />
        )}
      </Box>
    </ChakraProvider>
  );
}

export default App;
