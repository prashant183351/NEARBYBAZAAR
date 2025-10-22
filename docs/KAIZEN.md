# Kaizen Process & Features

This document explains how the Kaizen system works at NearbyBazaar, including idea submission, board usage, RICE scoring, and decision tracking.

## What is Kaizen?

Kaizen is a continuous improvement process. At NearbyBazaar, anyone can submit ideas for improvement, which are then tracked, prioritized, and implemented using the Kaizen board.

## Kaizen Board

- The board is a Kanban interface with columns: Backlog, In Progress, Completed.
- Ideas can be dragged between columns to reflect their status.
- Staff can add internal notes, attachments, and tags to each idea.

## Submitting Ideas

- Anyone (public or team) can submit a Kaizen idea via the submission page.
- Spam protection (rate-limit/captcha) is enforced for public submissions.
- Each idea can have tags and multiple owners (responsible team members).

## RICE Scoring

RICE stands for:

- **Reach**: How many users will be affected?
- **Impact**: How much will it improve their experience?
- **Confidence**: How sure are we about the impact?
- **Effort**: How much work is required?

**RICE Score Calculation:**

```
RICE Score = (Reach × Impact × Confidence) / Effort
```

- Higher scores indicate higher priority.
- Scores are updated automatically when any factor changes.

## Experiments & Decisions

- Experiments are tracked with statuses (Draft, Running, Completed, Aborted) and can be linked to ideas.
- Decisions are logged as immutable records, referencing ideas or experiments, and are shown in the public changelog.

## Attachments & Notes

- Files (images, PDFs, etc.) can be attached to ideas for context.
- Staff-only notes are kept private and not exposed in public APIs.

## Changelog & Digest

- Public changelog page lists major decisions and improvements.
- Weekly digest emails summarize new ideas, experiments, and decisions for the team.

---

For more details, see the Kaizen board UI in `apps/admin/pages/kaizen/board.tsx` and the RICE logic in `apps/api/src/models/Kaizen.ts`.
