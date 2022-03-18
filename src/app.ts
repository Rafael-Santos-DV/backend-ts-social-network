import express from "express";

const app = express();

app.get("/", (req, res) => {
  return res.json({ respone: res.statusCode });
});

app.listen(3000, () => console.log("ola amigos"));
