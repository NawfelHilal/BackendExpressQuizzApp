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
              reponses: {
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
              reponses: true,
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

v1Router.get("/api/categories", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        questions: {
          include: {
            reponses: true,
          },
        },
      },
    });
    res.json(categories);
  } catch (error) {
    console.error("Erreur lors de la récupération des catégories :", error);
    res.status(500).json({ erreur: "Erreur interne du serveur" });
  }
});

//Retourne seulement les catégories
v1Router.get("/api/just-categories", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        couleur: true,
      },
    });
    res.json(categories);
  } catch (error) {
    console.error("Erreur lors de la récupération des catégories :", error);
    res.status(500).json({ erreur: "Erreur interne du serveur" });
  }
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401); // Unauthorized

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Forbidden
    req.user = user;
    next();
  });
};

v1Router.post("/save-score", authenticateToken, async (req, res) => {
  try {
    const { categoryId, score } = req.body;
    const userId = req.user.userId; // Récupérer l'ID de l'utilisateur à partir du token JWT

    const quizResult = await prisma.quizResult.create({
      data: {
        userId: parseInt(userId),
        categoryId: parseInt(categoryId),
        score: parseInt(score),
      },
    });

    res.status(200).json({ message: "Score saved successfully", quizResult });
  } catch (error) {
    console.error("Error saving score:", error);
    res.status(500).json({ error: "Error saving score" });
  }
});

v1Router.get(
  "/quiz-results/:categoryId",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const categoryId = parseInt(req.params.categoryId);

      const quizResults = await prisma.quizResult.findMany({
        where: {
          userId: userId,
          categoryId: categoryId,
        },
      });

      res.status(200).json({ quizResults });
    } catch (error) {
      console.error("Error fetching quiz results:", error);
      res.status(500).json({ error: "Error fetching quiz results" });
    }
  }
);

v1Router.get("/current-user", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    res.json(user);
  } catch (error) {
    console.error("Error fetching current user:", error);
    res.status(500).json({ error: "Error fetching current user" });
  }
});

app.use("/v1", v1Router);

app.listen(8000, "0.0.0.0", () =>
  console.log("Server ready at: http://127.0.0.1:8000")
);
