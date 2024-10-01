import { Box, ChakraProvider } from "@chakra-ui/react";
import ChatBox from "./components/ChatBox";

function App() {
  return (
    <ChakraProvider>
      <Box w="100vw" px={5}>
        <ChatBox />
      </Box>
    </ChakraProvider>
  );
}

export default App;