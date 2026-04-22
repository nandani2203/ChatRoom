import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { io } from "socket.io-client";

const socket = io("http://localhost:4000");

const RoomList = ({ user, onJoinRoom }) => {
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Fetch rooms — REST API GET /rooms
  const fetchRooms = async () => {
    try {
      const res = await fetch("http://localhost:4000/rooms");
      const data = await res.json();
      setRooms(data);
    } catch {
      setError("Could not load rooms");
    }
  };

  useEffect(() => {
    fetchRooms();

    // Listen for new rooms created by others in real time
    socket.on("roomCreated", (room) => {
      setRooms((prev) => [...prev, { ...room, memberCount: 0 }]);
    });

    return () => socket.off("roomCreated");
  }, []);

  // Create room — REST API POST /rooms
  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      setError("Room name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:4000/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoomName.trim(),
          userId: user.userId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create room");
        return;
      }

      setNewRoomName("");
      onClose();
      // Room list will update via socket event "roomCreated"
    } catch {
      setError("Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = (room) => {
    onJoinRoom(room, socket);
  };

  return (
    <Flex minH="100vh" bg="gray.900" direction="column">
      {/* Header */}
      <Flex
        px={8}
        py={4}
        bg="gray.800"
        align="center"
        justify="space-between"
        borderBottom="1px solid"
        borderColor="gray.700"
      >
        <Heading color="white" size="md">
          💬 ChatRoom
        </Heading>
        <HStack>
          <Text color="gray.400" fontSize="sm">
            Logged in as{" "}
            <Text as="span" color="blue.300" fontWeight="bold">
              {user.username}
            </Text>
          </Text>
          <Button size="sm" colorScheme="blue" borderRadius="lg" onClick={onOpen}>
            + New Room
          </Button>
        </HStack>
      </Flex>

      {/* Room list */}
      <Box flex={1} p={8} maxW="600px" mx="auto" w="100%">
        <Text color="gray.400" fontSize="sm" mb={4} textTransform="uppercase" letterSpacing="wider">
          Available Rooms
        </Text>

        <VStack spacing={3} align="stretch">
          {rooms.map((room) => (
            <Flex
              key={room.id}
              bg="gray.800"
              p={5}
              borderRadius="xl"
              align="center"
              justify="space-between"
              cursor="pointer"
              _hover={{ bg: "gray.700" }}
              transition="background 0.15s"
              onClick={() => handleJoinRoom(room)}
            >
              <VStack align="start" spacing={0}>
                <Text color="white" fontWeight="semibold">
                  # {room.name}
                </Text>
                <Text color="gray.500" fontSize="xs">
                  Created by {room.createdBy}
                </Text>
              </VStack>
              <HStack>
                <Badge colorScheme="green" borderRadius="full" px={2}>
                  {room.memberCount} online
                </Badge>
                <Button size="sm" colorScheme="blue" borderRadius="lg">
                  Join
                </Button>
              </HStack>
            </Flex>
          ))}

          {rooms.length === 0 && (
            <Text color="gray.600" textAlign="center" mt={10}>
              No rooms yet — create one!
            </Text>
          )}
        </VStack>
      </Box>

      {/* Create Room Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent bg="gray.800" borderRadius="2xl">
          <ModalHeader color="white">Create a Room</ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody>
            <Input
              placeholder="Room name"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCreateRoom()}
              bg="gray.700"
              border="none"
              color="white"
              _placeholder={{ color: "gray.500" }}
              borderRadius="xl"
              autoFocus
            />
            {error && (
              <Text color="red.400" fontSize="sm" mt={2}>
                {error}
              </Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" color="gray.400" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              borderRadius="lg"
              onClick={handleCreateRoom}
              isLoading={loading}
            >
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default RoomList;
