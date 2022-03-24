import { Router } from "express";
import dbUsers from "../Schema/schemaUsers";

const routes = Router();

routes.post("/cadastro", async (req, res) => {
  const { userName, src } = req.body;

  const result = await dbUsers.create({
    userName: userName,
    src: src,
  });

  return res.json(result);
});

export default routes;
