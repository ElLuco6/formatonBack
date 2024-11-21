import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
const cors = require('cors');

// Charger les variables d'environnement
dotenv.config();

// Initialiser Prisma
const prisma = new PrismaClient();

// Créer l'application Express
const app = express();
const port = process.env.PORT || 3000;

// Middleware pour parser JSON
app.use(express.json());
app.use(cors());

// Route pour récupérer toutes les formations
app.get("/formations", async (req: Request, res: Response) => {
  try {
    const formations = await prisma.formation.findMany();
    return res.json(formations);
  } catch (err) {
    return res.status(500).json({
      error: "Erreur lors de la récupération des formations",
      details: err,
    });
  }
});

// Route pour créer une nouvelle formation
app.post("/formations", async (req: Request, res: Response) => {
  const { title, type, duration, description, price, registeredNames } =
    req.body;

  if (!title || !type || !price) {
    return res.status(400).json({
      error: "Les champs 'title', 'type' et 'price' sont requis.",
    });
  }

  try {
    const newFormation = await prisma.formation.create({
      data: {
        title,
        type,
        duration,
        description,
        price,
        registeredNames: registeredNames || [], // Défaut : tableau vide si non fourni
      },
    });
    return res.status(201).json(newFormation);
  } catch (err) {
    return res.status(500).json({
      error: "Erreur lors de la création de la formation",
      details: err,
    });
  }
});

// Route pour mettre à jour les noms enregistrés (registeredNames) d'une formation
app.patch(
  "/formations/:id/registeredNames",
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const { registeredNames } = req.body;

    if (!Array.isArray(registeredNames)) {
      return res
        .status(400)
        .json({ error: "'registeredNames' doit être un tableau." });
    }

    try {
      const updatedFormation = await prisma.formation.update({
        where: { id: Number(id) },
        data: { registeredNames },
      });
      return res.json(updatedFormation);
    } catch (err) {
      return res.status(500).json({
        error: "Erreur lors de la mise à jour des noms enregistrés",
        details: err,
      });
    }
  }
);

// Route pour récupérer toutes les classes
app.get("/classes", async (req: Request, res: Response) => {
  try {
    const classes = await prisma.class.findMany();
    return res.json(classes);
  } catch (err) {
    return res.status(500).json({
      error: "Erreur lors de la récupération des classes",
      details: err,
    });
  }
});

// Route pour récupérer une classe par son ID
app.get("/classes/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const classDetails = await prisma.class.findUnique({
      where: { id: Number(id) },
      include: { eleves: true }, // Inclure les élèves associés à la classe
    });

    if (!classDetails) {
      return res.status(404).json({ error: "Classe non trouvée" });
    }

    return res.json(classDetails);
  } catch (err) {
    return res.status(500).json({
      error: "Erreur lors de la récupération de la classe",
      details: err,
    });
  }
});

// Route pour créer une nouvelle classe
app.post("/classes", async (req: Request, res: Response) => {
  const { type, date, formationId, nbEleves } = req.body;

  if (!type || !date || !formationId || !nbEleves) {
    return res.status(400).json({
      error:
        "Les champs 'type', 'date', 'formationId' et 'nbEleves' sont requis.",
    });
  }

  try {
    const newClass = await prisma.class.create({
      data: {
        type,
        date,
        formationId,
        nbEleves,
      },
    });
    return res.status(201).json(newClass);
  } catch (err) {
    return res.status(500).json({
      error: "Erreur lors de la création de la classe",
      details: err,
    });
  }
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});
