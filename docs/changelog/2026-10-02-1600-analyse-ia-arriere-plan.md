# 2026-10-02 — L'analyse IA des exercices ne bloque plus la suite

À l'enregistrement d'un exercice terminé, la requête attendait la fin de
l'appel au modèle (`QUEUE_DRIVER=sync`) derrière un écran plein. Le candidat
ou le conseiller ne pouvait pas poursuivre.

- **File.** Hors tests, le job d'analyse qualitative n'est plus attendu quand
  le driver est `sync` : la redirection part tout de suite, l'analyse continue
  dans le process. Le driver `database` se contente d'enfiler le job.
- **Écran.** L'indicateur d'enregistrement laisse passer les clics et précise
  que l'analyse se prépare en arrière-plan.
- **Tests.** Le choix d'attendre ou non le job est couvert ; les messages flash
  indiquent que l'analyse suit.
