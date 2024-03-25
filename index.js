import { PrismaClient } from "@prisma/client";
import express from "express";
const { Application } = express;
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const app = express();
const port = 8000;
const prisma = new PrismaClient();
const JWT_SECRET =
  "b2eb6e36a03b300ccda64da95e75798068a45cd5943a3fa6c8ff2ad48c638cf9c6d71844adff4818402c9bcfca75a056eee2133e8c35d2b94cb345a1ae5ab5cc";

app.use(cors());

app.use(express.json());

const v1Router = express.Router();

/********************************************************************************
    Hateoas
 ********************************************************************************/

v1Router.get("/", async (req, res) => {
  res.json({
    Links: [
      {
        User: [
          {
            rel: "user Login",
            method: "POST",
            title: "User Login",
            href: "http://127.0.0.1:8000/v1/user/login",
          },
          {
            rel: "user Sign up",
            method: "POST",
            title: "User Sign Up",
            href: "http://127.0.0.1:8000/v1/user/signup",
          },
        ],
      },
      {
        Restaurant: [
          {
            rel: "GET All Restaurant",
            method: "GET",
            href: "http://127.0.0.1:8000/v1/restaurant",
          },
          {
            rel: "GET One Restaurant",
            method: "GET",
            href: "http://127.0.0.1:8000/v1/restaurant:id",
          },
          {
            rel: "create Restaurant",
            method: "POST",
            title: "Create Restaurant",
            href: "http://127.0.0.1:8000/v1/restaurant",
          },
          {
            rel: "delete Restaurant",
            method: "DELETE",
            title: "DELETE Restaurant",
            href: "http://127.0.0.1:8000/v1/restaurant",
          },
          {
            rel: "modifier Restaurant",
            method: "PUT",
            title: "Modifier Restaurant",
            href: "http://127.0.0.1:8000/v1/restaurant",
          },
        ],
      },
      {
        Activité: [
          {
            rel: "GET ALL Activité",
            method: "GET",
            href: "http://127.0.0.1:8000/v1/activite",
          },
          {
            rel: "GET One Activité",
            method: "GET",
            href: "http://127.0.0.1:8000/v1/activite:id",
          },
          {
            rel: "create Activite",
            method: "POST",
            title: "Create Activite",
            href: "http://127.0.0.1:8000/v1/activite",
          },
          {
            rel: "delete Activite",
            method: "DELETE",
            title: "DELETE Activite",
            href: "http://127.0.0.1:8000/v1/activite",
          },
          {
            rel: "modifier Activite",
            method: "PUT",
            title: "Modifier Activite",
            href: "http://127.0.0.1:8000/v1/activite",
          },
        ],
      },

      {
        Reservation: [
          {
            rel: "Put Reservation",
            method: "PUT",
            href: "http://127.0.0.1:8000/v1/reservation",
          },
          {
            rel: "GET Reservation",
            method: "GET",
            href: "http://127.0.0.1:8000/v1//user/:userId/reservations",
          },
          {
            rel: "MODIFIER Reservation",
            method: "PUT",
            title: "PUT Activite",
            href: "http://127.0.0.1:8000/v1/reservation/:reservationId",
          },
          {
            rel: "DELETE Reservation",
            method: "DELETE",
            title: "DELETE Activite",
            href: "http://127.0.0.1:8000/v1/reservation/:reservationId",
          },
        ],
      },
      {
        Search: [
          {
            rel: "Search",
            method: "GET",
            href: "http://127.0.0.1:8000/v1/search",
          },
          {
            rel: "Search Restaurant",
            method: "GET",
            href: "http://127.0.0.1:8000/v1/search/restaurant",
          },
          {
            rel: "Search Activité",
            method: "GET",
            href: "http://127.0.0.1:8000/v1/search/activite",
          },
        ],
      },
    ],
  });
});

/********************************************************************************
    User
 ********************************************************************************/

v1Router.post("/user/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({
    where: {
      username: username,
    },
  });

  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(200).json({ message: "Login successfull", token: token });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

v1Router.post("/user/signup", async (req, res) => {
  const { id, password, username, nom, prenom, dateNaissance, telephone } =
    req.body;
  const existingUser = await prisma.user.findUnique({
    where: {
      username: username,
    },
  });
  if (existingUser) {
    res.status(400).json({ message: "Email déjà existante" });
  } else {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = await prisma.user.create({
      data: {
        id: id,
        password: hashedPassword,
        username: username,
      },
    });
    res.status(201).json({ message: "User created", user: user });
  }
});

app.use("/v1", v1Router);

app.listen(8000, "0.0.0.0", () =>
  console.log("Server ready at: http://127.0.0.1:8000")
);
