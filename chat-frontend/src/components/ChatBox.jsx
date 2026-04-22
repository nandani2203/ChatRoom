import { ChevronRightIcon } from "@chakra-ui/icons";
import {
  Badge,
  Box,
  Button,
  Flex,
  Input,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";

const ChatBox = ({ user, room, socket, onLeave }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [members, setMembers] = useState([]);
  const [systemMsg, setSystemMsg] = useState("");
  const messagesEndRef = useRef(null);

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    // Join room via Socket.io — server scopes messages to this room
    socket.emit("joinRoom", { roomId: room.id, userId: user.userId });

    socket.on("roomJoined", ({ members: m }) => {
      setMembers(m);
    });

    socket.on("receiveMessage", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("userJoined", ({ username }) => {
      setSystemMsg(`${username} joined the room`);
      setTimeout(() => setSystemMsg(""), 3000);
    });

    socket.on("userLeft", ({ username }) => {
      setSystemMsg(`${username} left the room`);
      setTimeout(() => setSystemMsg(""), 3000);
    });

    socket.on("error", ({ message }) => {
      console.error("Socket error:", message);
    });

    return () => {
      socket.off("roomJoined");
      socket.off("receiveMessage");
      socket.off("userJoined");
      socket.off("userLeft");
      socket.off("error");
    };
  }, [room.id, user.userId, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;

    socket.emit("sendMessage", {
      roomId: room.id,
      userId: user.userId,
      text: input.trim(),
    });

    setInput("");
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Flex minH="100vh" bg={bgColor} direction="column">
      {/* Header */}
      <Flex
        px={6}
        py={4}
        bg="gray.800"
        align="center"
        justify="space-between"
        borderBottom="1px solid"
        borderColor="gray.700"
      >
        <Flex align="center" gap={3}>
          <Button
            size="sm"
            variant="ghost"
            color="gray.400"
            onClick={onLeave}
            _hover={{ color: "white" }}
          >
            ← Back
          </Button>
          <Text color="white" fontWeight="bold" fontSize="lg">
            # {room.name}
          </Text>
          <Badge colorScheme="green" borderRadius="full" px={2}>
            {members.length} online
          </Badge>
        </Flex>
        <Text color="gray.400" fontSize="sm">
          You:{" "}
          <Text as="span" color="blue.300" fontWeight="bold">
            {user.username}
          </Text>
        </Text>
      </Flex>

      {/* System message banner */}
      {systemMsg && (
        <Flex justify="center" py={2} bg="gray.700">
          <Text color="gray.400" fontSize="xs">
            {systemMsg}
          </Text>
        </Flex>
      )}

      {/* Messages */}
      <VStack
        flex={1}
        w="100%"
        maxW="800px"
        mx="auto"
        p={6}
        spacing={4}
        overflowY="auto"
        align="stretch"
      >
        {messages.length === 0 && (
          <Text color="gray.600" textAlign="center" mt={10} fontSize="sm">
            No messages yet — say something!
          </Text>
        )}

        {messages.map((msg, index) => {
          const isMe = msg.userId === user.userId;
          return (
            <Flex key={index} justify={isMe ? "flex-end" : "flex-start"}>
              <Box maxW="70%">
                {!isMe && (
                  <Text color="gray.500" fontSize="xs" mb={1} ml={1}>
                    {msg.username}
                  </Text>
                )}
                <Flex
                  bg={isMe ? "blue.500" : "gray.700"}
                  color="white"
                  borderRadius="2xl"
                  borderBottomRightRadius={isMe ? "4px" : "2xl"}
                  borderBottomLeftRadius={isMe ? "2xl" : "4px"}
                  px={4}
                  py={3}
                  flexDirection="column"
                >
                  <Text fontSize="sm">{msg.text}</Text>
                  <Text fontSize="xs" alignSelf="flex-end" mt={1} opacity={0.6}>
                    {formatTimestamp(msg.timestamp)}
                  </Text>
                </Flex>
              </Box>
            </Flex>
          );
        })}
        <div ref={messagesEndRef} />
      </VStack>

      {/* Input */}
      <Flex
        px={6}
        py={4}
        bg="gray.800"
        borderTop="1px solid"
        borderColor="gray.700"
        maxW="800px"
        mx="auto"
        w="100%"
      >
        <Input
          flex={1}
          mr={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          placeholder={`Message #${room.name}`}
          bg="gray.700"
          border="none"
          color="white"
          _placeholder={{ color: "gray.500" }}
          borderRadius="xl"
          size="lg"
        />
        <Button
          onClick={sendMessage}
          colorScheme="blue"
          borderRadius="xl"
          size="lg"
          px={6}
        >
          <ChevronRightIcon />
        </Button>
      </Flex>
    </Flex>
  );
};

export default ChatBox;
