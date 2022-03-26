import { Router } from "express";
import dbUsers from "../Schema/schemaUsers";
import { OAuth2Client } from 'google-auth-library';

const routes = Router();
const CLIENT_ID = process.env.ID_CLOUD;

routes.post("/EmitUser", async (req, res) => {
  const { token } = req.body;
  const client = new OAuth2Client(CLIENT_ID);

  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken: String(token),
      audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });

    const payload = ticket.getPayload();

    const jsonCreate = {
      userName: payload?.given_name,
      src: payload?.picture,
      email: payload?.email,
    }

    if (payload) {
      const verifyUser = await dbUsers.findOne({ email: jsonCreate.email });

      if (verifyUser) {
        return verifyUser;

      } else {

        const result = await dbUsers.create(jsonCreate);
        return result;

      }

    };

    // If request specified a G Suite domain:
    // const domain = payload['hd'];
  }

  try {
    const response = await verify();
    return res.json(response);

  } catch (err) {
    return res.status(400).send("Bad Request");
  }

});


export default routes;
