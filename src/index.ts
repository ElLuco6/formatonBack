import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

// Charger les variables d'environnement
dotenv.config();

// Initialiser Prisma
const prisma = new PrismaClient();

// Créer l'application Express
const app = express();
const port = process.env.PORT || 3000;

// Middleware pour parser JSON
app.use(express.json());

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

//Route pour mettre à jour les noms enregistrés (registeredNames) d'une formation
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

//Démarrer le serveur
app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});
