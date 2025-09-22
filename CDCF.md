## Fonctionnalités

1. Upload
    - Upload de fichier zip contenant l'ensemble des pistes
    - Vérification de l'intégrité du/des fichiers

2. Décompression
    - Extraction côté client via jszip.
    - Listing des fichiers trouvés (nom + taille).

3. Paramétrage
    - Réglage du volume du bruit blanc. (enregistré en localstorage)

4. Prévisualisation
    - L’utilisateur peut lancer une prévisualisation de 30 secondes (lecture directe via Web Audio API).
    - Ajustement du volume possible → relancer preview.

5. Traitement audio
    - Utilisation de ffmpeg.wasm.
    - Traitement itératif par fichier contenu dans le zip (mp3 par mp3)

6. Progression
    - Affichage temps réel :
        - Fichier en cours.
        - Nombre de fichiers traités / total.
        - Barre de progression globale.

7. Compression & export
    - Création d’un `.zip` contenant tous les fichiers avec le bruit blanc.
    - Téléchargement via `file-saver`.

## 🚧 Contraintes techniques

- Stack : React (Vite), `jszip`, `@ffmpeg/ffmpeg`, `file-saver`.
- Frontend : pas de backend, site statique pour déploiement simplifié.
- Mémoire : traitement séquentiel pour performance + UX.

## 🔄 Scénarios (séquence)

1. Basique : upload du zip → réglage volume → preview → traitement complet → téléchargement zip.
2. Personnalisé : réglage du volume → sauvegarde → réutilisation auto lors des prochaines sessions.
3. Erreur : zip invalide, pas de fichiers mp3 → message explicite.

## ✅ Workflow à réaliser

* Upload `.zip` de chapitres ✅
* Décompression locale ✅
* Intégration du bruit blanc ✅
* Réglage volume + sauvegarde ✅
* Prévisualisation ✅
* Traitement fichier par fichier ✅
* Progression globale + par fichier ✅
* Recompression `.zip` ✅
* Téléchargement final ✅