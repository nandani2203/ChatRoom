import { useState } from "react";
import BACKEND_URL from "../config";
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";

const JoinScreen = ({ onJoin }) => {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // REST API call — POST /users/join
      const res = await fetch(`${BACKEND_URL}/users/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to join");
        return;
      }

      // Store in sessionStorage
      sessionStorage.setItem("userId", data.userId);
      sessionStorage.setItem("username", data.username);

      onJoin({ userId: data.userId, username: data.username });
    } catch (err) {
      setError("Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex minH="100vh" align="center" justify="center" bg="gray.900">
      <Box
        bg="gray.800"
        p={10}
        borderRadius="2xl"
        boxShadow="2xl"
        w="100%"
        maxW="400px"
      >
        <VStack spacing={6} align="stretch">
          <Heading color="white" size="lg" textAlign="center">
            💬 ChatRoom
          </Heading>
          <Text color="gray.400" textAlign="center" fontSize="sm">
            Enter a username to get started
          </Text>

          <Input
            placeholder="Your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleJoin()}
            bg="gray.700"
            border="none"
            color="white"
            _placeholder={{ color: "gray.500" }}
            size="lg"
            borderRadius="xl"
            autoFocus
          />

          {error && (
            <Text color="red.400" fontSize="sm" textAlign="center">
              {error}
            </Text>
          )}

          <Button
            onClick={handleJoin}
            isLoading={loading}
            colorScheme="blue"
            size="lg"
            borderRadius="xl"
          >
            Join
          </Button>
        </VStack>
      </Box>
    </Flex>
  );
};

export default JoinScreen;
