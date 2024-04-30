import { PrismaClient } from "@prisma/client";
import express from "express";
const { Application } = express;
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import fs from "fs";
const app = express();
const port = 8000;
const prisma = new PrismaClient();
const JWT_SECRET =
  "b2eb6e36a03b300ccda64da95e75798068a45cd5943a3fa6c8ff2ad48c638cf9c6d71844adff4818402c9bcfca75a056eee2133e8c35d2b94cb345a1ae5ab5cc";

app.use(cors());

app.use(express.json());

const v1Router = express.Router();

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
  const { id, password, username } = req.body;
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

// Route pour importer les données depuis le json du front
v1Router.post("/import-data", async (req, res) => {
  try {
    const jsonData = JSON.parse(fs.readFileSync("data.json", "utf-8")); // Charger les données depuis le fichier JSON

    // Parcourir les données et les insérer dans la base de données
    for (const categoryData of jsonData) {
      const category = await prisma.category.create({
        data: {
          id: categoryData.id,
          name: categoryData.name,
          couleur: categoryData.couleur,
          questions: {
            create: categoryData.questions.map((question) => ({
              question: question.question,
              trueReponse: question.trueReponse,
              responses: {
                create: question.reponses.map((response) => ({
                  text: response,
                })),
              },
            })),
          },
        },
        include: {
          questions: {
            include: {
              responses: true,
            },
          },
        },
      });
      console.log(
        `Category "${category.name}" inserted with ${category.questions.length} questions`
      );
    }

    res.status(201).send("Data imported successfully");
  } catch (error) {
    console.error("Error importing data:", error);
    res.status(500).send("Error importing data");
  }
});

app.use("/v1", v1Router);

app.listen(8000, "0.0.0.0", () =>
  console.log("Server ready at: http://127.0.0.1:8000")
);
