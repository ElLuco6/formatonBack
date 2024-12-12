import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
const cors = require("cors");

// Charger les variables d'environnement
dotenv.config();

// Initialiser Prisma
const prisma = new PrismaClient();

// Créer l'application Express
const app = express();
const port = parseInt(process.env.PORT as string, 10) || 3001;

// Middleware pour parser JSON
app.use(express.json());
app.use(cors());

// Route pour récupérer toutes les formations
app.get("/formations", async (req: Request, res: Response) => {
  console.log(
    `[${new Date().toISOString()}] GET /formations - Début de la requête`
  );
  try {
    const formations = await prisma.formation.findMany();
    console.log(
      `[${new Date().toISOString()}] GET /formations - ${
        formations.length
      } formations trouvées`
    );
    return res.json(formations);
  } catch (err) {
    console.error(
      `[${new Date().toISOString()}] GET /formations - Erreur:`,
      err
    );
    return res.status(500).json({
      error: "Erreur lors de la récupération des formations",
      details: err,
    });
  }
});

// Route pour créer une nouvelle formation
app.post("/formations", async (req: Request, res: Response) => {
  console.log(
    `[${new Date().toISOString()}] POST /formations - Nouvelle formation:`,
    req.body
  );
  const { title, type, duration, description, price, registeredNames } =
    req.body;

  if (!title || !type || !price) {
    console.log(
      `[${new Date().toISOString()}] POST /formations - Validation échouée`
    );
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
    console.log(
      `[${new Date().toISOString()}] POST /formations - Formation créée avec l'ID:`,
      newFormation.id
    );
    return res.status(201).json(newFormation);
  } catch (err) {
    console.error(
      `[${new Date().toISOString()}] POST /formations - Erreur:`,
      err
    );
    return res.status(500).json({
      error: "Erreur lors de la création de la formation",
      details: err,
    });
  }
});

// Route pour rechercher les formations par nom d'inscrit
app.get("/formations/search/:name", async (req: Request, res: Response) => {
  console.log(
    `[${new Date().toISOString()}] GET /formations/search/${
      req.params.name
    } - Début de la recherche`
  );
  const { name } = req.params;

  try {
    const formations = await prisma.formation.findMany({
      where: {
        registeredNames: {
          has: name,
        },
      },
    });

    console.log(
      `[${new Date().toISOString()}] GET /formations/search/${name} - ${
        formations.length
      } formations trouvées`
    );
    return res.json(formations);
  } catch (err) {
    console.error(
      `[${new Date().toISOString()}] GET /formations/search/${name} - Erreur:`,
      err
    );
    return res.status(500).json({
      error: "Erreur lors de la recherche des formations",
      details: err,
    });
  }
});

// Route pour mettre à jour les noms enregistrés (registeredNames) d'une formation
app.patch(
  "/formations/:id/registeredNames",
  async (req: Request, res: Response): Promise<Response> => {
    console.log(
      `[${new Date().toISOString()}] PATCH /formations/${
        req.params.id
      }/registeredNames - Début de la mise à jour`
    );
    const { id } = req.params;
    const { registeredNames } = req.body;

    if (!Array.isArray(registeredNames)) {
      console.log(
        `[${new Date().toISOString()}] PATCH /formations/${id}/registeredNames - Format invalide`
      );
      return res
        .status(400)
        .json({ error: "'registeredNames' doit être un tableau." });
    }

    try {
      const updatedFormation = await prisma.formation.update({
        where: { id: Number(id) },
        data: { registeredNames },
      });
      console.log(
        `[${new Date().toISOString()}] PATCH /formations/${id}/registeredNames - Mise à jour réussie`
      );
      return res.json(updatedFormation);
    } catch (err) {
      console.error(
        `[${new Date().toISOString()}] PATCH /formations/${id}/registeredNames - Erreur:`,
        err
      );
      return res.status(500).json({
        error: "Erreur lors de la mise à jour des noms enregistrés",
        details: err,
      });
    }
  }
);

// Route pour récupérer toutes les sessions
app.get("/sessions", async (req: Request, res: Response) => {
  console.log(
    `[${new Date().toISOString()}] GET /sessions - Début de la requête`
  );
  try {
    const sessions = await prisma.session.findMany();
    console.log(
      `[${new Date().toISOString()}] GET /sessions - ${
        sessions.length
      } sessions trouvées`
    );
    return res.json(sessions);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] GET /sessions - Erreur:`, err);
    return res.status(500).json({
      error: "Erreur lors de la récupération des sessions",
      details: err,
    });
  }
});

// Route pour récupérer une session par son ID
app.get("/sessions/:id", async (req: Request, res: Response) => {
  console.log(
    `[${new Date().toISOString()}] GET /sessions/${
      req.params.id
    } - Début de la requête`
  );
  const { id } = req.params;
  try {
    const sessionDetails = await prisma.session.findUnique({
      where: { id: Number(id) },
      include: { eleves: true }, // Inclure les élèves associés à la session
    });

    if (!sessionDetails) {
      console.log(
        `[${new Date().toISOString()}] GET /sessions/${id} - Session non trouvée`
      );
      return res.status(404).json({ error: "Session non trouvée" });
    }

    console.log(
      `[${new Date().toISOString()}] GET /sessions/${id} - Session trouvée`
    );
    return res.json(sessionDetails);
  } catch (err) {
    console.error(
      `[${new Date().toISOString()}] GET /sessions/${id} - Erreur:`,
      err
    );
    return res.status(500).json({
      error: "Erreur lors de la récupération de la session",
      details: err,
    });
  }
});

// Route pour créer une nouvelle session
app.post("/sessions", async (req: Request, res: Response) => {
  console.log(
    `[${new Date().toISOString()}] POST /sessions - Nouvelle session:`,
    req.body
  );
  const { type, date, formationId, nbEleves } = req.body;

  if (!type || !date || !formationId || !nbEleves) {
    console.log(
      `[${new Date().toISOString()}] POST /sessions - Validation échouée`
    );
    return res.status(400).json({
      error:
        "Les champs 'type', 'date', 'formationId' et 'nbEleves' sont requis.",
    });
  }

  try {
    const newSession = await prisma.session.create({
      data: {
        type,
        date,
        formationId,
        nbEleves,
      },
    });
    console.log(
      `[${new Date().toISOString()}] POST /sessions - Session créée avec l'ID:`,
      newSession.id
    );
    return res.status(201).json(newSession);
  } catch (err) {
    console.error(
      `[${new Date().toISOString()}] POST /sessions - Erreur:`,
      err
    );
    return res.status(500).json({
      error: "Erreur lors de la création de la session",
      details: err,
    });
  }
});

// Exporter l'app pour les tests
export { app };

// Démarrer le serveur seulement si ce n'est pas un test
if (process.env.NODE_ENV !== "test") {
  app.listen(port, "0.0.0.0", () => {
    console.log(`Serveur en cours d'exécution sur http://0.0.0.0:${port}`);
  });
}
