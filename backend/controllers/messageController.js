import Message from "../models/messageModel.js";

export const sendMessage = async (req, res) => {
  const { receiverId, text, messageType } = req.body;
  const sender = req.userId;

  try {
    const newMessage = new Message({
      sender,
      receiver: receiverId,
      text,
      messageType: messageType || "text",
    });

    await newMessage.save();

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("SEND MESSAGE ERROR:", error);
    res.status(500).json({ message: "Error sending message" });
  }
};

export const getMessages = async (req, res) => {
  const senderId = req.userId;
  const receiverId = req.params.userId;

  try {
    const messages = await Message.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.log("GET MESSAGES ERROR:", error);
    res.status(500).json({ message: "Error fetching messages" });
  }
};























