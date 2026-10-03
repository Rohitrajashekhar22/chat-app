const users = {};

export default function initSocket(io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("register", (userId) => {
      users[userId] = socket.id;

      // send online users
      io.emit("online_users", Object.keys(users));
    });

    socket.on("send_message", (data) => {
      const receiverSocket = users[data.receiver];

      if (receiverSocket) {
        // send to receiver
        io.to(receiverSocket).emit("receive_message", data);

        // ✅ send delivery confirmation back to sender
        io.to(users[data.sender]).emit("message_delivered", {
          messageId: data._id,
        });
      }
    });

    socket.on("disconnect", () => {
      for (let userId in users) {
        if (users[userId] === socket.id) {
          delete users[userId];
        }
      }

      io.emit("online_users", Object.keys(users));
    });
  });
}