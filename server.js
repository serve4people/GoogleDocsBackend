require("dotenv").config();
const mongoose = require("mongoose");

const Document = require("./Document");
main().catch((err) => console.log(err));

async function main() {
  await mongoose
    .connect(
      "mongodb+srv://" +
        process.env.usernameMongoDB +
        ":" +
        process.env.passwordMongoDB +
        "@cluster0.1kpomt1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    )
    .then(() => console.log("MongoDB connected..."))
    .catch((err) => console.log(err));
}

const PORT = process.env.PORT || 3001;
const io = require("socket.io")(PORT, {
  cors: {
    origin: "https://google-docs-git-master-serve4peoples-projects.vercel.app/",
    methods: ["GET", "POST"],
  },
});
const defaultValue = "";

io.on("connection", (socket) => {
  console.log("connected");
  socket.on("get-document", async (documentId) => {
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);
    socket.emit("load-document", document.data);
    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });
    socket.on("save-document", async (data) => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });

  //console.log("connected");
});

async function findOrCreateDocument(id) {
  if (id == null) return;
  const document = await Document.findById(id);
  if (document) return document;
  return await Document.create({ _id: id, data: defaultValue });
}
