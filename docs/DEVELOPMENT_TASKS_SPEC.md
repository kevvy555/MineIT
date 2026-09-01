# MineIT Development Tasks

## Purpose

Provide a deliberately small bug and feature tracker inside MineIT so development work can be captured, reviewed and copied to an AI while using only a mobile device.

The tracker is development tooling, not gameplay state. Its authoritative data is a user-selected JSON file and it must remain separate from the MineIT game save.

## Access and mobile behaviour

- Open **Development Tasks** from the bottom-right burger menu.
- Use a full-screen, touch-friendly panel.
- Open new tasks, existing tasks and batch import in a full-body overlay so the task list is never visible behind the form.
- Pause the simulation while the task list or editor is open and restore the previous valid speed when it closes.
- Require a secure site (`https://` or localhost) and feature-detect the browser file pickers.
- Support Chrome 132 or newer on Android; browsers without writable local-file handles show an unsupported state rather than pretending to save.
- On first use, either create a new JSON task file or select an existing one.
- Remember the selected `FileSystemFileHandle` in IndexedDB.
- Reconnect or change the file when browser permission is unavailable, revoked, or the file has moved.
- Show the active filename and `Saving`, `Saved`, `Save failed`, or permission state.
- Never overwrite invalid or unsupported JSON.

## Task fields

Each task contains:

- a stable internal ID;
- type: `bug` or `feature`;
- status: `backlog`, `in-progress`, or `complete`;
- one multiline description;
- created and updated timestamps.

New tasks start in Backlog and are inserted at the top. Blank descriptions are rejected.

## List actions

- Toggle Backlog, In Progress, Complete, Bug and Feature filters independently.
- Default filters: Backlog on, In Progress on, Complete off, Bug on and Feature on.
- Select one or more visible tasks with checkboxes.
- Select all currently visible tasks or clear the selection.
- Copy one task or all selected tasks.
- Change an individual task directly to Backlog, In Progress or Complete with its compact status icons.
- Edit type, status and description, then save.
- Move a task to the top or bottom of the complete canonical list.
- Delete a task after confirmation.
- Every data-changing action writes the complete document back to the selected JSON file.
- Filter choices are local UI preferences and do not change the JSON document.

## Batch import contract

- Open **Import** beside **New Bug / Feature** and paste one task per line.
- Choose Bug or Feature as the default type for untagged lines.
- Prefix an individual line with `[BUG]` or `[FEATURE]` to override the selected default.
- Ignore blank lines and remove a leading numbered-list marker (`1.` or `1)`) or bullet (`-`, `*`, or `•`).
- Imported tasks start in Backlog and retain their pasted line order at the top of the canonical list.
- Validate the complete batch before changing the document, then auto-save the whole batch with one JSON-file write.

## Clipboard contract

Copied tasks follow canonical list order. Every task occupies exactly one line; internal whitespace and line breaks are collapsed. Numbering restarts at one for every copy operation.

```text
1. [BUG] First task description
2. [FEATURE] Second task description
```

Only after the clipboard write succeeds, every copied task is changed to In Progress and the JSON file is auto-saved. If the clipboard write fails, statuses remain unchanged.

## JSON format

```json
{
  "version": 1,
  "items": [
    {
      "id": "unique-id",
      "type": "bug",
      "status": "backlog",
      "text": "Describe the problem here",
      "createdAt": "2026-08-29T10:00:00.000Z",
      "updatedAt": "2026-08-29T10:00:00.000Z"
    }
  ]
}
```

Array order is display order. Moving an item changes its position in the array.

## Explicitly out of scope

- priorities, tags and due dates;
- screenshots and attachments;
- comments or task history;
- search;
- GitHub issue synchronisation;
- multi-user or simultaneous multi-tab editing.
