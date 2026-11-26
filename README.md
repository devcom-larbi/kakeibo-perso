# Kakeibo perso

Mon carnet de dépenses selon la méthode japonaise Kakeibo. App web installable sur le téléphone (PWA),
les données restent sur l'appareil.

## Ce que fait l'app

- **Budget** (début de mois) : revenus − cotisations URSSAF − charges fixes − épargne visée = disponible pour le mois.
  On peut reprendre le budget du mois précédent en un geste.
- **Abonnements** : « Choisir mes abonnements » ouvre un catalogue avec les logos des marques (IA, création, sport,
  streaming, cloud, transport, assurances…). On choisit la formule, on ajuste le prix (indicatif), ça part dans les
  charges fixes.
- **Activité pro** (micro-entreprise) : le bouton « Pro » sur un revenu retient le pourcentage URSSAF de son
  activité (BNC 25,6 %, BIC 21,2 %, vente 12,3 %, CIPAV 23,2 %, ou un taux perso ; versement libératoire en
  option). Le Budget montre ce que l'activité laisse une fois l'URSSAF et les charges pro payées.
- **Mois** : reste à dépenser, bandeau de couleur par pilier, budget semaine par semaine, dernières dépenses.
- **Dépenses** : liste par jour, filtre par pilier ; toucher une dépense pour la modifier ou la supprimer.
- **Bilan automatique** : rang du mois (S à D, titres de shōnen), constats et conseils calculés tout seuls, projection
  pour le mois en cours. Au premier lancement d'un nouveau mois, le bilan du mois écoulé se révèle (animation « 卍解 »).
- **Objectifs** : voyages, achats, coussin de sécurité, projets. Montant visé, date facultative, argent mis
  de côté ou retiré, combien épargner par mois pour y arriver. Le Budget propose de viser ce montant.
- **Réglages** (roue dentée) : télécharger / restaurer une sauvegarde JSON, tout effacer.

Les 4 piliers : Survie, Loisirs, Culture, Imprévus.

Style « noir et rouge » (inspiré d'une maquette ChatGPT) : fond brun-noir, encre crème, vermillon, titres en serif
(Iowan Old Style sur iPhone), tampons kanji pour les piliers (生 楽 文 備) et paysage peint sur canvas en tête du mois
(soleil strié, Fuji, brume). Navigation à la Kakeibo : 5 onglets en bas, carrousel des mois en haut (toucher ou glisser),
sous-onglets dans les pages (Budget : Prévu, Abonnements, Pro ; Bilan : Rang et conseils, Par pilier ; Objectifs : En
cours, Réalisés). Moments manga gardés : aura de Super Saiyan et « ドン！ » quand un objectif est atteint, scouter
« niveau de puissance », révélation « Bankai » du bilan, spirale d'énergie sur le bouton +. Les kanji des effets manga
viennent de `src/assets/fonts/dela-kanji.woff2` (8 Ko, licence OFL à côté) : pour en ajouter un, refaire le
sous-ensemble avec `pyftsubset`.

Logos : `npm run logos` régénère `src/lib/logos.generated.ts` à partir de Simple Icons (CC0), Arcticons
(CC BY-SA 4.0, par Donnnno et contributeurs), Logos (CC0) et Material Design Icons (Apache 2.0). Les marques
appartiennent à leurs propriétaires et servent seulement à reconnaître un abonnement.

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

- `src/lib/` : types, calculs du budget, des cotisations et des objectifs (testés), catalogue d'abonnements,
  dates, montants (en centimes)
- `src/store.tsx` : données + enregistrement dans le navigateur (localStorage)
- `src/screens/` : les 5 onglets et leurs sous-pages
- `src/components/` : formulaires (dépense, objectif, mise de côté), réglages, bandeau, etc.
- `src/styles.css` : couleurs (clair/sombre), typographie, mise en page
