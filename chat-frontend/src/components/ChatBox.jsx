import { ChevronRightIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Flex,
  Input,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:4000");

const ChatBox = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [userId, setUserId] = useState(null);
  const messagesEndRef = useRef(null);

  const bgColor = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  useEffect(() => {
    let storedUserId = sessionStorage.getItem("userId");
    if (!storedUserId) {
      storedUserId = Math.random().toString(36).substring(7);
      sessionStorage.setItem("userId", storedUserId);
    }
    setUserId(storedUserId);

    socket.on("receiveMessage", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (input.trim()) {
      const message = {
        userId,
        text: input,
        timestamp: new Date().toISOString(),
      };
      socket.emit("sendMessage", message);
      setInput("");
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Flex
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      width="100%"
      bg={bgColor}
      p={4}
    >
      <Box
        w="100%"
        minW="500px"
        h="90vh"
        borderWidth={1}
        borderRadius="lg"
        overflow="hidden"
        boxShadow="lg"
        bg={useColorModeValue("white", "gray.800")}
      >
        <VStack h="100%" spacing={0}>
          <Box
            w="100%"
            p={4}
            borderBottomWidth={1}
            borderColor={borderColor}
            bg={useColorModeValue("gray.100", "gray.700")}
          >
            <Text fontSize="xl" fontWeight="bold">
              Chat
            </Text>
          </Box>

          <VStack
            flex={1}
            w="100%"
            p={4}
            spacing={4}
            overflowY="auto"
            css={{
              "&::-webkit-scrollbar": {
                width: "4px",
              },
              "&::-webkit-scrollbar-track": {
                width: "6px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: useColorModeValue("gray.300", "gray.600"),
                borderRadius: "24px",
              },
            }}
          >
            {messages.map((msg, index) => (
              <Flex
                key={index}
                w="100%"
                justify={msg.userId === userId ? "flex-end" : "flex-start"}
              >
                <Flex
                  maxW="70%"
                  bg={msg.userId === userId ? "blue.500" : "gray.200"}
                  color={msg.userId === userId ? "white" : "black"}
                  borderRadius="lg"
                  p={3}
                  flexDirection="column"
                >
                  <Text>{msg.text}</Text>
                  <Text fontSize="xs" alignSelf="flex-end" mt={1} opacity={0.7}>
                    {formatTimestamp(msg.timestamp)}
                  </Text>
                </Flex>
              </Flex>
            ))}
            <div ref={messagesEndRef} />
          </VStack>

          <Flex
            w="100%"
            p={4}
            borderTopWidth={1}
            borderColor={borderColor}
            bg={useColorModeValue("gray.50", "gray.700")}
          >
            <Input
              flex={1}
              mr={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message"
              borderRadius="full"
            />
            <Button
              onClick={sendMessage}
              colorScheme="blue"
              borderRadius="full"
              px={6}
            >
              <ChevronRightIcon />
            </Button>
          </Flex>
        </VStack>
      </Box>
    </Flex>
  );
};

export default ChatBox;