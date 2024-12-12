import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
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

// Route pour récupérer une formation par son ID
app.get("/formations/:id", async (req: Request, res: Response) => {
  console.log(
    `[${new Date().toISOString()}] GET /formations/${
      req.params.id
    } - Début de la requête`
  );
  const { id } = req.params;

  try {
    const formation = await prisma.formation.findUnique({
      where: { id: Number(id) },
      include: { sessions: true }, // Inclure les sessions associées
    });

    if (!formation) {
      console.log(
        `[${new Date().toISOString()}] GET /formations/${id} - Formation non trouvée`
      );
      return res.status(404).json({ error: "Formation non trouvée" });
    }

    console.log(
      `[${new Date().toISOString()}] GET /formations/${id} - Formation trouvée`
    );
    return res.json(formation);
  } catch (err) {
    console.error(
      `[${new Date().toISOString()}] GET /formations/${id} - Erreur:`,
      err
    );
    return res.status(500).json({
      error: "Erreur lors de la récupération de la formation",
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
    const { registeredName } = req.body; // On attend maintenant un seul nom

    if (typeof registeredName !== "string") {
      console.log(
        `[${new Date().toISOString()}] PATCH /formations/${id}/registeredNames - Format invalide`
      );
      return res.status(400).json({
        error: "'registeredName' doit être une chaîne de caractères.",
      });
    }

    try {
      // Récupérer d'abord la formation existante
      const formation = await prisma.formation.findUnique({
        where: { id: Number(id) },
      });

      if (!formation) {
        return res.status(404).json({ error: "Formation non trouvée" });
      }

      // Ajouter le nouveau nom à la liste existante
      const updatedNames = [...formation.registeredNames, registeredName];

      // Mettre à jour la formation avec la nouvelle liste
      const updatedFormation = await prisma.formation.update({
        where: { id: Number(id) },
        data: { registeredNames: updatedNames },
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

// Route pour supprimer une formation et ses sessions associées
app.delete("/formations/:id", async (req: Request, res: Response) => {
  console.log(
    `[${new Date().toISOString()}] DELETE /formations/${
      req.params.id
    } - Début de la suppression`
  );
  const { id } = req.params;

  try {
    // Supprimer d'abord toutes les sessions associées
    await prisma.session.deleteMany({
      where: { formationId: Number(id) },
    });

    // Puis supprimer la formation
    const deletedFormation = await prisma.formation.delete({
      where: { id: Number(id) },
    });

    console.log(
      `[${new Date().toISOString()}] DELETE /formations/${id} - Formation et sessions supprimées avec succès`
    );
    return res.json({
      message: "Formation et sessions associées supprimées avec succès",
      deletedFormation,
    });
  } catch (err) {
    console.error(
      `[${new Date().toISOString()}] DELETE /formations/${id} - Erreur:`,
      err
    );
    return res.status(500).json({
      error: "Erreur lors de la suppression de la formation",
      details: err,
    });
  }
});

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
  const { type, date, formationId, nbEleves, eleves } = req.body;

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
        eleves: eleves || [], // Utilise le tableau d'élèves fourni ou un tableau vide par défaut
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

// Route pour supprimer une session
app.delete("/sessions/:id", async (req: Request, res: Response) => {
  console.log(
    `[${new Date().toISOString()}] DELETE /sessions/${
      req.params.id
    } - Début de la suppression`
  );
  const { id } = req.params;

  try {
    // Vérifier si la session existe
    const session = await prisma.session.findUnique({
      where: { id: Number(id) },
    });

    if (!session) {
      console.log(
        `[${new Date().toISOString()}] DELETE /sessions/${id} - Session non trouvée`
      );
      return res.status(404).json({ error: "Session non trouvée" });
    }

    // Supprimer la session
    const deletedSession = await prisma.session.delete({
      where: { id: Number(id) },
    });

    console.log(
      `[${new Date().toISOString()}] DELETE /sessions/${id} - Session supprimée avec succès`
    );
    return res.json({
      message: "Session supprimée avec succès",
      deletedSession,
    });
  } catch (err) {
    console.error(
      `[${new Date().toISOString()}] DELETE /sessions/${id} - Erreur:`,
      err
    );
    return res.status(500).json({
      error: "Erreur lors de la suppression de la session",
      details: err,
    });
  }
});

// Route pour ajouter un élève à une session
app.patch("/sessions/:id/eleves", async (req: Request, res: Response) => {
  console.log(
    `[${new Date().toISOString()}] PATCH /sessions/${
      req.params.id
    }/eleves - Début de la mise à jour`
  );
  const { id } = req.params;
  const { eleveName } = req.body;

  if (!eleveName || typeof eleveName !== "string") {
    return res.status(400).json({
      error:
        "Le nom de l'élève est requis et doit être une chaîne de caractères",
    });
  }

  try {
    // Récupérer d'abord la session existante
    const session = await prisma.session.findUnique({
      where: { id: Number(id) },
    });

    if (!session) {
      return res.status(404).json({ error: "Session non trouvée" });
    }

    // Vérifier si l'élève est déjà inscrit
    if (session.eleves.includes(eleveName)) {
      return res
        .status(400)
        .json({ error: "L'élève est déjà inscrit à cette session" });
    }

    // Ajouter le nouvel élève à la liste existante
    const updatedEleves = [...session.eleves, eleveName];

    // Mettre à jour la session avec la nouvelle liste et le nombre d'élèves
    const updatedSession = await prisma.session.update({
      where: { id: Number(id) },
      data: {
        eleves: updatedEleves,
        nbEleves: updatedEleves.length,
      },
    });

    console.log(
      `[${new Date().toISOString()}] PATCH /sessions/${id}/eleves - Mise à jour réussie`
    );
    return res.json(updatedSession);
  } catch (err) {
    console.error(
      `[${new Date().toISOString()}] PATCH /sessions/${id}/eleves - Erreur:`,
      err
    );
    return res.status(500).json({
      error: "Erreur lors de l'ajout de l'élève",
      details: err,
    });
  }
});

// Route pour l'inscription (register)
app.post("/register", async (req: Request, res: Response) => {
  console.log(
    `[${new Date().toISOString()}] POST /auth/register - Nouvelle inscription`
  );
  const { name, password, admin } = req.body;

  if (!name || !password) {
    return res
      .status(400)
      .json({ error: "Le nom et le mot de passe sont requis" });
  }

  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { name },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Cet utilisateur existe déjà" });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer le nouvel utilisateur avec le statut admin
    const user = await prisma.user.create({
      data: {
        name,
        password: hashedPassword,
        isAdmin: admin || false, // Utilise la valeur de admin ou false par défaut
      },
    });

    // Générer le token JWT avec le statut admin
    const token = jwt.sign(
      { userId: user.id, name: user.name, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "24h" }
    );

    return res.status(201).json({
      message: "Utilisateur créé avec succès",
      token,
      user: {
        id: user.id,
        name: user.name,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err) {
    console.error(
      `[${new Date().toISOString()}] POST /auth/register - Erreur:`,
      err
    );
    return res.status(500).json({
      error: "Erreur lors de la création de l'utilisateur",
      details: err,
    });
  }
});

// Route pour la connexion (login)
app.post("/login", async (req: Request, res: Response) => {
  console.log(
    `[${new Date().toISOString()}] POST /auth/login - Tentative de connexion`
  );
  const { name, password } = req.body;

  if (!name || !password) {
    return res
      .status(400)
      .json({ error: "Le nom et le mot de passe sont requis" });
  }

  try {
    // Rechercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { name },
    });

    if (!user) {
      return res.status(401).json({ error: "Identifiants invalides" });
    }

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Identifiants invalides" });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { userId: user.id, name: user.name, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "24h" }
    );

    return res.json({
      message: "Connexion réussie",
      token,
      user: {
        id: user.id,
        name: user.name,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err) {
    console.error(
      `[${new Date().toISOString()}] POST /auth/login - Erreur:`,
      err
    );
    return res.status(500).json({
      error: "Erreur lors de la connexion",
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
