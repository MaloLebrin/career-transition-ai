# Chat candidat ↔ expert

Branche `feat/chat-candidat-expert`. Un candidat (particulier payé ou non, ou candidat d'un
cabinet) écrit à l'équipe d'experts de la **plateforme** ; aucune condition de paiement.
Le conseiller d'un cabinet client n'est jamais l'interlocuteur du chat.

## Architecture

- **Données** : `chat_conversations` (une par candidat, `employee_id` unique, `ON DELETE
CASCADE`, `assigned_expert_user_id` en `SET NULL`, `last_message_at`,
  `candidate_last_read_at`, `expert_last_read_at`) et `chat_messages` (`author_role` en CHECK
  synchronisée avec `CHAT_AUTHOR_ROLES`, `body` ≤ `CHAT_MESSAGE_MAX`, jamais modifié).
  `author_user_id` est en `RESTRICT` : les comptes sont désactivés (`deleted_at`), jamais
  supprimés tant qu'ils ont écrit.
- **Service** : `#services/chat_service` (`conversationForCandidate`, `candidatePage`,
  `sendAsCandidate`, `listForExpert`, `expertPage`, `sendAsExpert`, `claim`, `markRead*`,
  `canSubscribe`). Erreurs dans `app/exceptions/chat_errors.ts`
  (`E_CHAT_CONVERSATION_NOT_FOUND` 404, `E_CHAT_FORBIDDEN` 403, `E_CHAT_MESSAGE_EMPTY` 422).
- **Routes** : `start/routes/dashboard/candidat/chat.ts` (`auth` → `candidate` →
  `checkOnboarding`) et `start/routes/dashboard/conseiller/chat.ts` (`auth` →
  `advisorOrAdmin`) ; le service refuse (403) tout membre qui n'est pas de l'organisation
  plateforme. Envoi limité par `throttleChatMessage` (30 messages / minute / compte).
- **Types et constantes** : `shared/constants/chat.ts`, `shared/types/chat/`.
- **Notifications** : `chat_message_received` (CHECK de `notifications.type` complétée), une
  seule non lue par destinataire et par conversation ; côté équipe, **id du candidat
  seulement**, jamais son nom. Non lus calculés depuis `*_last_read_at`.

## File et assignation

L'expert responsable d'une conversation est calculé en SQL (`EFFECTIVE_EXPERT_SQL`) :

1. l'expert de la fiche (`employees.advisor_id`) s'il fait partie de la plateforme (il prime) ;
2. sinon celui qui a pris la conversation (`assigned_expert_user_id`) ;
3. sinon la conversation est **dans la file** : tout expert la voit, un message du candidat
   notifie toute l'équipe.

Un expert voit ses conversations et celles de la file ; l'**admin** voit tout. Répondre à une
conversation de la file la prend ; `claim` est atomique (`UPDATE … WHERE assigned IS NULL`,
un seul expert l'emporte). Conversation d'un autre expert → **404**, jamais 403. Seules les
conversations ayant au moins un message sont listées.

## Temps réel (Transmit)

Canal `chat/conversations/:id` (`chatChannel`), autorisation dans `start/transmit.ts` via
`ChatService.canSubscribe` → `canSubscribeToChatConversation` (candidat propriétaire,
expert responsable ou file, admin). Les messages sont diffusés depuis le **process web**
(`transmit.broadcast` dans `persist`), jamais depuis le worker.

**Limite mono-instance** : `config/transmit.ts` n'a pas de transport (`transport: null`).
Un message n'atteint que les clients connectés au même process : avec **deux instances web**
(ou plus), candidat et expert peuvent être sur des instances différentes et ne rien recevoir
en direct. Le message reste enregistré et visible au rechargement. Passer à plusieurs
instances impose un transport Redis (cf. `docs/hosting.md`). Le `pingInterval` est de
`'30s'` ; Caddy (`deploy/Caddyfile`) pose `flush_interval -1` pour `/__transmit/events`.

## RGPD

Les messages sont des données personnelles du candidat : inclus dans l'export
(`chatMessages` de `donnees.json` : rôle de l'auteur, texte, date — jamais le nom de
l'expert), supprimés par `candidate:purge` (CASCADE depuis la fiche), conservés avec le
dossier (`RETENTION_PERIODS`). Aucun message n'est envoyé à un fournisseur IA. Voir
[RGPD.md](RGPD.md).

## Limites de la v1

Pas de pièces jointes, d'indicateur « en train d'écrire », de réponses IA, de modification
ni de suppression de message, de purge automatique des conversations, ni de multi-instances
(transport Redis requis).

## Tests

`tests/unit/services/chat_service.spec.ts`, contrôleurs, validators, autorisation Transmit,
`tests/functional/candidat/chat.spec.ts` et `tests/functional/conseiller/chat.spec.ts`,
export et purge dans `tests/unit/services/candidate_data_service.spec.ts`.
