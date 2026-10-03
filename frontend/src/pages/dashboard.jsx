import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import API from "../api";
import socket from "../socket";
import EmojiPickerComponent from "../components/EmojiPicker";

function Dashboard() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [deliveredMessages, setDeliveredMessages] = useState([]);
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const user = JSON.parse(sessionStorage.getItem("user"));

  // fetch users but do not show all by default
  useEffect(() => {
    API.get("/users")
      .then((res) => {
        setUsers(res.data || []);
        setConversations([]);
      })
      .catch((err) => console.log("FETCH USERS ERROR:", err));
  }, []);

  // register socket
  useEffect(() => {
    if (user?._id) {
      socket.emit("register", user._id);
    }
  }, [user]);

  // online users
  useEffect(() => {
    const handleOnline = (data) => setOnlineUsers(data || []);
    socket.on("online_users", handleOnline);

    return () => socket.off("online_users", handleOnline);
  }, []);

  // receive messages
  useEffect(() => {
    const handleMessage = (msg) => {
      if (!msg) return;

      const belongsToCurrentChat =
        selectedUser &&
        ((msg.sender === selectedUser._id && msg.receiver === user._id) ||
          (msg.sender === user._id && msg.receiver === selectedUser._id));

      if (belongsToCurrentChat) {
        setMessages((prev) => {
          const alreadyExists = prev.some((m) => m._id === msg._id);
          if (alreadyExists) return prev;
          return [...prev, msg];
        });
      }

      const otherUserId = msg.sender === user._id ? msg.receiver : msg.sender;
      const otherUser = users.find((u) => u._id === otherUserId);

      if (otherUser) {
        setConversations((prev) => {
          const exists = prev.find((c) => c._id === otherUser._id);
          if (exists) {
            return [otherUser, ...prev.filter((c) => c._id !== otherUser._id)];
          }
          return [otherUser, ...prev];
        });
      }
    };

    socket.on("receive_message", handleMessage);

    return () => socket.off("receive_message", handleMessage);
  }, [selectedUser, user?._id, users]);

  // delivered
  useEffect(() => {
    const handleDelivered = ({ messageId }) => {
      setDeliveredMessages((prev) => {
        if (prev.includes(messageId)) return prev;
        return [...prev, messageId];
      });
    };

    socket.on("message_delivered", handleDelivered);
    return () => socket.off("message_delivered", handleDelivered);
  }, []);

  // typing
  useEffect(() => {
    const handleTyping = (data) => {
      if (data.sender === selectedUser?._id) setIsTyping(true);
    };

    const handleStopTyping = (data) => {
      if (data.sender === selectedUser?._id) setIsTyping(false);
    };

    socket.on("user_typing", handleTyping);
    socket.on("user_stop_typing", handleStopTyping);

    return () => {
      socket.off("user_typing", handleTyping);
      socket.off("user_stop_typing", handleStopTyping);
    };
  }, [selectedUser]);

  // fetch messages
  useEffect(() => {
    if (!selectedUser) return;

    API.get(`/messages/${selectedUser._id}`)
      .then((res) => setMessages(res.data || []))
      .catch((err) => console.log("FETCH MESSAGES ERROR:", err));
  }, [selectedUser]);

  // auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // close emoji picker on chat change
  useEffect(() => {
    setShowEmojiPicker(false);
  }, [selectedUser]);

  const handleTypingInput = (value) => {
    setNewMessage(value);

    if (!selectedUser) return;

    socket.emit("typing", {
      sender: user._id,
      receiver: selectedUser._id,
    });

    clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", {
        sender: user._id,
        receiver: selectedUser._id,
      });
    }, 1000);
  };

  const handleAddEmoji = (emoji) => {
    setNewMessage((prev) => prev + emoji);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    try {
      const { data } = await API.post("/messages", {
        receiverId: selectedUser._id,
        text: newMessage,
        messageType: "text",
      });

      socket.emit("send_message", data);

      socket.emit("stop_typing", {
        sender: user._id,
        receiver: selectedUser._id,
      });

      setMessages((prev) => {
        const alreadyExists = prev.some((m) => m._id === data._id);
        if (alreadyExists) return prev;
        return [...prev, data];
      });

      setConversations((prev) => {
        const exists = prev.find((c) => c._id === selectedUser._id);
        if (exists) {
          return [
            selectedUser,
            ...prev.filter((c) => c._id !== selectedUser._id),
          ];
        }
        return [selectedUser, ...prev];
      });

      setNewMessage("");
      setShowEmojiPicker(false);
    } catch (err) {
      console.log("SEND TEXT ERROR:", err);
    }
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingProfile(true);

      const formData = new FormData();
      formData.append("image", file);

      const uploadRes = await API.post("/users/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const imageUrl = uploadRes.data.secure_url;

      const { data } = await API.put("/users/profile", {
        name: user?.name,
        profilePicture: imageUrl,
      });

      const updatedStoredUser = {
        ...user,
        ...data,
      };

      sessionStorage.setItem("user", JSON.stringify(updatedStoredUser));
      window.location.reload();
    } catch (err) {
      console.log("PROFILE PIC ERROR:", err.response?.data || err.message);
    } finally {
      setUploadingProfile(false);
      e.target.value = "";
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedUser) return;

    try {
      setUploadingImage(true);

      const formData = new FormData();
      formData.append("image", file);

      const uploadRes = await API.post("/users/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const imageUrl = uploadRes.data.secure_url;

      const { data } = await API.post("/messages", {
        receiverId: selectedUser._id,
        text: imageUrl,
        messageType: "image",
      });

      socket.emit("send_message", data);

      setMessages((prev) => {
        const alreadyExists = prev.some((m) => m._id === data._id);
        if (alreadyExists) return prev;
        return [...prev, data];
      });

      setConversations((prev) => {
        const exists = prev.find((c) => c._id === selectedUser._id);
        if (exists) {
          return [
            selectedUser,
            ...prev.filter((c) => c._id !== selectedUser._id),
          ];
        }
        return [selectedUser, ...prev];
      });
    } catch (err) {
      console.log("IMAGE UPLOAD ERROR:", err.response?.data || err.message);
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    navigate("/");
  };

  const formatTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredUsers = users.filter((u) =>
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const displayedUsers =
    search.trim() !== "" ? filteredUsers : conversations;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* LEFT SIDEBAR */}
      <div className="w-1/4 border-r bg-white p-4 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <img
            src={
              user?.profilePicture && user.profilePicture.trim() !== ""
                ? user.profilePicture
                : "https://via.placeholder.com/50"
            }
            alt="profile"
            className="w-12 h-12 rounded-full object-cover border"
          />

          <div className="flex-1">
            <h3 className="text-lg font-semibold">Welcome {user?.name}</h3>
          </div>
        </div>

        <label className="bg-blue-500 text-white text-center py-2 rounded mb-3 cursor-pointer">
          {uploadingProfile ? "Uploading..." : "Upload Profile Pic"}
          <input
            type="file"
            accept="image/*"
            onChange={handleProfilePicUpload}
            className="hidden"
          />
        </label>

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white py-2 rounded mb-4"
        >
          Logout
        </button>

        <input
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3 px-3 py-2 border rounded w-full"
        />

        <div className="flex flex-col gap-2 overflow-y-auto">
          {displayedUsers.map((u) => (
            <div
              key={u._id}
              onClick={() => {
                setSelectedUser(u);

                if (search.trim() !== "") {
                  setConversations((prev) => {
                    const exists = prev.find((c) => c._id === u._id);
                    if (exists) {
                      return [u, ...prev.filter((c) => c._id !== u._id)];
                    }
                    return [u, ...prev];
                  });
                }

                setSearch("");
              }}
              className={`flex justify-between items-center p-3 rounded cursor-pointer border ${
                selectedUser?._id === u._id
                  ? "bg-blue-100 border-blue-300"
                  : "hover:bg-gray-100"
              }`}
            >
              <div>
                <div className="font-medium">{u.name}</div>
                <div className="text-xs text-gray-500">{u.email}</div>
              </div>

              {onlineUsers?.includes(u._id) && (
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="w-3/4 flex flex-col">
        {selectedUser ? (
          <>
            <div className="p-4 border-b bg-white flex justify-between items-center">
              <div className="font-semibold">{selectedUser.name}</div>
              <div className="text-sm text-gray-500">
                {onlineUsers?.includes(selectedUser._id) ? "Online" : "Offline"}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-gray-50">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`max-w-xs px-3 py-2 rounded-lg shadow ${
                    msg.sender === user._id
                      ? "bg-blue-500 text-white self-end"
                      : "bg-white border self-start"
                  }`}
                >
                  {msg.messageType === "image" ? (
                    <img
                      src={msg.text}
                      alt="shared"
                      className="max-w-full rounded-lg"
                    />
                  ) : (
                    <div>{msg.text}</div>
                  )}

                  <div className="text-xs flex justify-end gap-1 mt-1 opacity-70">
                    <span>{formatTime(msg.createdAt)}</span>
                    {msg.sender === user._id && (
                      <span>
                        {deliveredMessages.includes(msg._id) ? "✓✓" : "✓"}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="text-sm text-gray-500">
                  {selectedUser.name} is typing...
                </div>
              )}

              <div ref={bottomRef}></div>
            </div>

            {showEmojiPicker && (
              <div className="px-4 pt-2 bg-white border-t">
                <EmojiPickerComponent onEmojiClick={handleAddEmoji} />
              </div>
            )}

            <div className="p-4 border-t bg-white flex items-center gap-2">
              <label className="bg-gray-200 px-3 py-2 rounded cursor-pointer">
                📷
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                className="bg-yellow-400 px-3 py-2 rounded"
              >
                😊
              </button>

              <input
                value={newMessage}
                onChange={(e) => handleTypingInput(e.target.value)}
                onKeyDown={handleKeyPress}
                className="flex-1 border px-3 py-2 rounded"
                placeholder="Type message..."
              />

              <button
                onClick={sendMessage}
                className="bg-blue-500 text-white px-4 py-2 rounded"
                disabled={uploadingImage}
              >
                {uploadingImage ? "Uploading..." : "Send"}
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-lg">
            Search a user to start chatting
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;