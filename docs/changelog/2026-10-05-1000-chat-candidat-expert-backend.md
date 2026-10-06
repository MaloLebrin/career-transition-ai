# 2026-10-05 — Chat candidat ↔ expert : socle backend

Un candidat (particulier payé ou non, ou candidat de cabinet) peut écrire à l'équipe d'experts de la plateforme ; l'expert de la fiche, ou celui qui prend la conversation, devient son interlocuteur. L'interface suit dans une PR dédiée.

- **Données.** Tables `chat_conversations` (une par candidat, `employee_id` unique, CASCADE) et `chat_messages` (CHECK `author_role`), CHECK `notifications.type` complétée de `chat_message_received`.
- **Service.** `ChatService` : file de l'expert (conversations sans expert ou les siennes, l'admin voit tout), prise en charge atomique, non lus, pagination par curseur `before`. Conversation d'un autre expert : 404 ; membre d'un cabinet client : 403.
- **Temps réel.** Diffusion Transmit sur `chat/conversations/:id` (`id`, `authorRole`, `body`, `createdAt`), autorisation dans `canSubscribeToChatConversation`.
- **Notifications.** Une seule notification non lue par destinataire et par conversation, id du candidat seulement côté équipe.
- **Limiteur.** `throttleChatMessage` : 30 messages par minute et par compte.
- **Tests.** Service, contrôleurs, validators, autorisation Transmit, factories, seeder, functional candidat et conseiller.
