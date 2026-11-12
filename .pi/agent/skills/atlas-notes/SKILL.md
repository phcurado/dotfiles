---
name: atlas-notes
description: 'Use when the Neovim context says "Diff: Atlas pull request review" and the user asks to comment, note, flag, or suggest something on the PR. Writes private Atlas notes inline in the PR diff; never posts to GitHub or edits code. Plain questions are answered in chat, not as notes.'
---

# Atlas notes

In an Atlas review, "comment" means an Atlas note unless the user explicitly asks for a code change or a GitHub post. Do not ask which one they mean. The user decides what gets posted.

CLI (Neovim's data dir, same on macOS and Linux): `"${XDG_DATA_HOME:-$HOME/.local/share}/nvim/lazy/atlas.nvim/bin/atlas-notes"`

## Resolve the target

The Neovim context gives `Repo`, `Head` (full commit SHA), `File`, and `Range`. Resolve the PR URL from the head:

```sh
cd <Repo> && gh api "repos/{owner}/{repo}/commits/<Head>/pulls" --jq '.[0].html_url'
```

Read the change with `git -C <Repo> diff <Base> <Head>` (git, not jj: PR commits may not be imported into jj).

## Add a note

```sh
atlas-notes add --target <pr-url> --commit <Head> --file <File> \
  --start-line <n> [--end-line <m>] --type note|issue|suggestion|praise --body "<text>"
```

- Lines are 1-based lines of the file at `--commit`. When `Lines from` equals `Head`, use `Range` directly. Notes attach to the new side only; for removed code, anchor on the nearest surviving line.
- Use the full 40-character SHA.
- Write the body as the review comment itself, ready to post.
- The CLI cannot edit or delete notes. Check `atlas-notes list --target <pr-url>` before adding to avoid duplicates.

## After adding

Tell the user: press `r` in the Atlas diff to load notes, `]n` / `[n` to jump to them, then `K` on a note and `c` to turn it into a draft PR comment (posted with `<leader>gs`), `e` to edit, `dd` to delete.
