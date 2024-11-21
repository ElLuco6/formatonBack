# Projet Express.js avec TypeScript 🚀

Un backend léger et rapide développé avec **Express.js** et **TypeScript**.

## Fonctionnalités

- **TypeScript** : Sécurité et typage statique pour un code robuste.
- **Express.js** : Framework rapide pour construire des APIs.
- **dotenv** : Gestion des variables d'environnement.
- **nodemon** : Rechargement automatique en développement.

## Installation

1. Clonez ce projet :

2. Installez les dépendances :

```bash

npm install

```

3. Créez un fichier `.env` à la racine du projet et ajoutez les variables d'environnement suivantes :

```bash
PORT=3000
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=user
DATABASE_PASSWORD=password
DATABASE_NAME=my_database
DATABASE_URL="postgresql://user:password@localhost:5432/my_database"
```

4. Lancer docker-compose pour la base de données :

````bash
docker-compose up -d

6. Migrez la base de données :

```bash
npx prisma migrate dev --name init
````

7. Lancez le serveur en mode développement :

```bash
npm run dev
```
