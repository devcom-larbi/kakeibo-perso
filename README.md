# Kakeibo perso

Mon carnet de dépenses selon la méthode japonaise Kakeibo. App web installable sur le téléphone (PWA),
les données restent sur l'appareil.

## Ce que fait l'app

- **Budget** (début de mois) : revenus − charges fixes − épargne visée = disponible pour le mois.
  On peut reprendre le budget du mois précédent en un geste.
- **Mois** : reste à dépenser, bandeau de couleur par pilier, budget semaine par semaine, dernières dépenses.
- **Dépenses** : liste par jour, filtre par pilier ; toucher une dépense pour la modifier ou la supprimer.
- **Bilan** (fin de mois) : les 4 questions du Kakeibo, comparaison avec le mois précédent, note libre.
- **Objectifs** : voyages, achats, coussin de sécurité, projets. Montant visé, date facultative, argent mis
  de côté ou retiré, combien épargner par mois pour y arriver. Le Budget propose de viser ce montant.
- **Réglages** (roue dentée) : télécharger / restaurer une sauvegarde JSON, tout effacer.

Les 4 piliers : Survie, Loisirs, Culture, Imprévus.

## En ligne

https://devcom-larbi.github.io/kakeibo-perso/ — chaque `git push` sur `main` remet l'app en ligne
(workflow `.github/workflows/deploy.yml`, environ une minute). Sur iPhone : ouvrir l'adresse dans Safari,
Partager, « Sur l'écran d'accueil ».

## Commandes

```bash
npm install      # une seule fois
npm run dev      # lance l'app sur http://localhost:5173 (et sur le réseau local)
npm test         # tests des calculs
npm run build    # version de production dans dist/
```

## Organisation du code

- `src/lib/` : types, calculs du budget et des objectifs (testés), dates, montants (en centimes)
- `src/store.tsx` : données + enregistrement dans le navigateur (localStorage)
- `src/screens/` : les 5 écrans
- `src/components/` : formulaires (dépense, objectif, mise de côté), réglages, bandeau, etc.
- `src/styles.css` : couleurs (clair/sombre), typographie, mise en page
